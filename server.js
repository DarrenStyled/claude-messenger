const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB (cloud-friendly)
  cors: { origin: '*', methods: ['GET','POST'] }
});

const PORT = process.env.PORT || 3000;

// ── Passcode ──
// Set the PASSCODE environment variable (Render dashboard → Environment) to
// lock the server. If it's not set, anyone can join (same as before).
const PASSCODE = (process.env.PASSCODE || '').trim();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Clean up uploaded files older than 24 hours (runs every hour)
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const fp = path.join(uploadsDir, file);
      fs.stat(fp, (err2, stat) => {
        if (!err2 && stat.mtimeMs < cutoff) fs.unlink(fp, () => {});
      });
    });
  });
}, 60 * 60 * 1000);

// Multer for file uploads (5MB cap for cloud)
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint (also keeps Render awake when pinged)
app.get('/ping', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`
  });
});

// ── Persistent store ──────────────────────────────────────────────────────
// Everything that should survive a restart lives in `store`:
//   history — group chat messages
//   priv    — private chats, keyed "alice|bob" (lowercase, sorted)
//   offline — queued private messages for users who are signed out
//   roster  — everyone who has ever signed in (so they show as offline contacts)
// Saved to data/history.json. If a DATABASE_URL env var is set (e.g. a free
// Neon/Supabase Postgres), it's used instead so history survives Render
// redeploys too — the JSON file on Render's free disk does not.
const MSG_LIMIT = 300;     // group history cap
const PRIV_LIMIT = 200;    // per private conversation
const ROSTER_LIMIT = 50;   // remembered contacts

const dataDir = path.join(__dirname, 'data');
const storeFile = path.join(dataDir, 'history.json');
let store = { history: [], priv: {}, offline: {}, roster: {} };

let pool = null;
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  } catch (e) {
    console.log('DATABASE_URL is set but the pg package failed to load:', e.message);
  }
}

async function initStore() {
  if (pool) {
    await pool.query('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value JSONB)');
    const r = await pool.query("SELECT value FROM kv WHERE key = 'store'");
    if (r.rows[0]) store = r.rows[0].value;
    console.log('📦 Store loaded from Postgres');
  } else {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    try { store = JSON.parse(fs.readFileSync(storeFile, 'utf8')); } catch (e) {}
    console.log('📦 Store loaded from data/history.json');
  }
  store.history = store.history || [];
  store.priv = store.priv || {};
  store.offline = store.offline || {};
  store.roster = store.roster || {};
}

let saveTimer = null;
function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 1500);
}
async function doSave() {
  try {
    if (pool) {
      await pool.query(
        "INSERT INTO kv (key, value) VALUES ('store', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [JSON.stringify(store)]
      );
    } else {
      fs.writeFile(storeFile, JSON.stringify(store), () => {});
    }
  } catch (e) { console.log('Save failed:', e.message); }
}
// Render sends SIGTERM on shutdown/redeploy — flush synchronously
process.on('SIGTERM', () => {
  try { if (!pool) fs.writeFileSync(storeFile, JSON.stringify(store)); } catch (e) {}
  process.exit(0);
});

function mkid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function privKey(a, b) {
  return [a.toLowerCase(), b.toLowerCase()].sort().join('|');
}
function pushPriv(a, b, payload) {
  const k = privKey(a, b);
  const arr = store.priv[k] = store.priv[k] || [];
  arr.push(payload);
  if (arr.length > PRIV_LIMIT) arr.shift();
  saveStore();
}
function pushGroup(payload) {
  store.history.push(payload);
  if (store.history.length > MSG_LIMIT) store.history.shift();
  saveStore();
}
function findStoredMsg(id) {
  const g = store.history.find(m => m.id === id);
  if (g) return g;
  for (const k in store.priv) {
    const m = store.priv[k].find(x => x.id === id);
    if (m) return m;
  }
  return null;
}

// Connected users: socketId -> { username, status, avatar, personalMessage }
const users = new Map();

function broadcastUserList() {
  const online = Array.from(users.entries()).map(([id, u]) => ({
    id, username: u.username, status: u.status,
    avatar: u.avatar, personalMessage: u.personalMessage
  }));
  const onlineNames = new Set(online.map(u => u.username.toLowerCase()));
  // Everyone in the roster who isn't connected shows as an offline contact —
  // you can still message them and it's delivered when they sign in.
  const offline = Object.entries(store.roster)
    .filter(([k]) => !onlineNames.has(k))
    .map(([k, r]) => ({
      id: 'offline:' + k, username: r.username, status: 'offline',
      avatar: r.avatar || null, personalMessage: r.personalMessage || ''
    }));
  io.emit('user-list', [...online, ...offline]);
}

// Deduplicate a username against currently connected users (excluding self)
function uniqueName(wanted, selfId) {
  const taken = new Set(
    Array.from(users.entries()).filter(([id]) => id !== selfId).map(([, u]) => u.username)
  );
  if (!taken.has(wanted)) return wanted;
  let n = 2;
  while (taken.has(`${wanted} (${n})`)) n++;
  return `${wanted} (${n})`;
}

function upsertRoster(name, avatar, personalMessage) {
  const k = name.toLowerCase();
  const prev = store.roster[k] || {};
  store.roster[k] = {
    username: name,
    avatar: avatar !== undefined ? avatar : prev.avatar,
    personalMessage: personalMessage !== undefined ? personalMessage : prev.personalMessage,
    lastSeen: Date.now()
  };
  const keys = Object.keys(store.roster);
  if (keys.length > ROSTER_LIMIT) {
    keys.sort((a, b) => store.roster[a].lastSeen - store.roster[b].lastSeen);
    delete store.roster[keys[0]];
  }
  saveStore();
}

// Resolve a "to" target into either a connected socket or an offline name key
function resolveTarget(to) {
  if (!to) return { group: true };
  if (typeof to === 'string' && to.startsWith('offline:')) {
    const nameKey = to.slice(8).toLowerCase();
    return { offline: true, nameKey, displayName: store.roster[nameKey]?.username || nameKey };
  }
  const rec = users.get(to);
  if (!rec) return null;
  return { socketId: to, displayName: rec.username };
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join', ({ username, avatar, personalMessage, passcode }) => {
    if (PASSCODE && String(passcode || '').trim() !== PASSCODE) {
      socket.emit('join-denied', { reason: 'passcode' });
      return;
    }
    const name = uniqueName(String(username || 'User').slice(0, 30) || 'User', socket.id);
    users.set(socket.id, {
      username: name,
      status: 'online',
      avatar: avatar || null,
      personalMessage: personalMessage || '',
    });
    console.log(`${name} joined`);
    upsertRoster(name, avatar || null, personalMessage || '');
    socket.emit('join-ok', { name });

    // Group history
    socket.emit('history', store.history.slice(-MSG_LIMIT));

    // Private history — every conversation this name is part of
    const nl = name.toLowerCase();
    const mine = {};
    for (const k in store.priv) {
      const [a, b] = k.split('|');
      if (a === nl || b === nl) mine[a === nl ? b : a] = store.priv[k];
    }
    socket.emit('private-history', mine);

    // Deliver anything queued while they were away (already in priv history;
    // this event just tells the client to notify the user)
    const q = store.offline[nl];
    if (q && q.length) {
      socket.emit('offline-messages', {
        count: q.length,
        senders: [...new Set(q.map(m => m.username))]
      });
      delete store.offline[nl];
      saveStore();
    }

    socket.broadcast.emit('user-joined', { id: socket.id, username: name });
    broadcastUserList();
  });

  socket.on('status-change', ({ status, personalMessage }) => {
    const user = users.get(socket.id);
    if (user) {
      user.status = status;
      if (personalMessage !== undefined) {
        user.personalMessage = personalMessage;
        upsertRoster(user.username, undefined, personalMessage);
      }
      broadcastUserList();
    }
  });

  socket.on('avatar-change', ({ avatar }) => {
    const user = users.get(socket.id);
    if (user) {
      user.avatar = avatar;
      upsertRoster(user.username, avatar, undefined);
      broadcastUserList();
    }
  });

  socket.on('message', ({ to, text, color, fontSize, bold, italic }) => {
    const sender = users.get(socket.id);
    if (!sender || typeof text !== 'string' || !text.trim()) return;
    const target = resolveTarget(to);
    if (!target) return;
    const payload = {
      id: mkid(), from: socket.id, username: sender.username,
      avatar: (sender.avatar && sender.avatar.length <= 30000) ? sender.avatar : null,
      text, color, fontSize, bold, italic, timestamp: Date.now()
    };
    if (target.group) {
      pushGroup(payload);
      io.emit('message', payload);
    } else if (target.offline) {
      // Recipient is signed out — store it and queue a notification
      payload.toName = target.displayName;
      payload.offline = true;
      pushPriv(sender.username, target.nameKey, payload);
      const q = store.offline[target.nameKey] = store.offline[target.nameKey] || [];
      q.push(payload);
      saveStore();
      socket.emit('message', { ...payload, self: true });
    } else {
      payload.toName = target.displayName;
      pushPriv(sender.username, target.displayName, payload);
      io.to(target.socketId).emit('message', payload);
      socket.emit('message', { ...payload, self: true });
    }
  });

  // Toggle an emoji reaction on a stored message
  socket.on('react', ({ msgId, emoji }) => {
    const sender = users.get(socket.id);
    if (!sender || !msgId || !emoji || String(emoji).length > 8) return;
    const msg = findStoredMsg(msgId);
    if (!msg) return;
    msg.reactions = msg.reactions || {};
    const arr = msg.reactions[emoji] = msg.reactions[emoji] || [];
    const i = arr.indexOf(sender.username);
    if (i >= 0) arr.splice(i, 1); else arr.push(sender.username);
    if (!arr.length) delete msg.reactions[emoji];
    io.emit('reaction', { msgId, reactions: msg.reactions });
    saveStore();
  });

  socket.on('nudge', ({ to }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    if (to && !String(to).startsWith('offline:')) io.to(to).emit('nudge', { from: socket.id, username: sender.username });
    else if (!to) socket.broadcast.emit('nudge', { from: socket.id, username: sender.username });
  });

  socket.on('typing', ({ to, isTyping }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    if (to && !String(to).startsWith('offline:')) io.to(to).emit('typing', { from: socket.id, username: sender.username, isTyping });
  });

  socket.on('file-share', ({ to, fileInfo }) => {
    const sender = users.get(socket.id);
    if (!sender || !fileInfo) return;
    const target = resolveTarget(to);
    if (!target) return;
    const payload = {
      id: mkid(), from: socket.id, username: sender.username,
      avatar: (sender.avatar && sender.avatar.length <= 30000) ? sender.avatar : null,
      fileInfo, timestamp: Date.now()
    };
    if (target.group) {
      pushGroup(payload);
      io.emit('file-share', payload);
    } else if (target.offline) {
      payload.toName = target.displayName;
      payload.offline = true;
      pushPriv(sender.username, target.nameKey, payload);
      const q = store.offline[target.nameKey] = store.offline[target.nameKey] || [];
      q.push(payload);
      saveStore();
      socket.emit('file-share', { ...payload, self: true });
    } else {
      payload.toName = target.displayName;
      pushPriv(sender.username, target.displayName, payload);
      io.to(target.socketId).emit('file-share', payload);
      socket.emit('file-share', { ...payload, self: true });
    }
  });

  // WebRTC signaling
  socket.on('call-offer', ({ to, offer, callType }) => {
    const sender = users.get(socket.id);
    io.to(to).emit('call-offer', { from: socket.id, username: sender?.username, offer, callType });
  });
  socket.on('call-answer', ({ to, answer }) => {
    io.to(to).emit('call-answer', { from: socket.id, answer });
  });
  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });
  socket.on('call-end', ({ to }) => { io.to(to).emit('call-end', { from: socket.id }); });
  socket.on('call-reject', ({ to }) => { io.to(to).emit('call-reject', { from: socket.id }); });

  // Screen share signaling (separate from call so both sides can signal independently)
  socket.on('screen-share-offer', ({ to, offer }) => {
    const sender = users.get(socket.id);
    io.to(to).emit('screen-share-offer', { from: socket.id, username: sender?.username, offer });
  });
  socket.on('screen-share-answer', ({ to, answer }) => {
    io.to(to).emit('screen-share-answer', { from: socket.id, answer });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      upsertRoster(user.username, user.avatar, user.personalMessage);
      io.emit('user-left', { id: socket.id, username: user.username });
      users.delete(socket.id);
      broadcastUserList();
      console.log(`${user.username} disconnected`);
    }
  });
});

initStore()
  .catch(e => console.log('Store init failed (starting with empty store):', e.message))
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Claude Messenger server running on port ${PORT}`);
      console.log(`   Passcode: ${PASSCODE ? 'ON' : 'off (set PASSCODE env var to lock the server)'}`);
      console.log(`   Storage: ${pool ? 'Postgres' : 'data/history.json'}`);
      console.log(`   Health check: http://localhost:${PORT}/ping\n`);
    });
  });
