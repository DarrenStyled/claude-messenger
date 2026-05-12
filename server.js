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
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

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

// Connected users: socketId -> { username, status, avatar, personalMessage }
const users = new Map();

function broadcastUserList() {
  const userList = Array.from(users.entries()).map(([id, u]) => ({
    id, username: u.username, status: u.status,
    avatar: u.avatar, personalMessage: u.personalMessage
  }));
  io.emit('user-list', userList);
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join', ({ username, avatar, personalMessage }) => {
    users.set(socket.id, {
      username: username || 'User',
      status: 'online',
      avatar: avatar || null,
      personalMessage: personalMessage || '',
    });
    console.log(`${username} joined`);
    socket.broadcast.emit('user-joined', { id: socket.id, username });
    broadcastUserList();
  });

  socket.on('status-change', ({ status, personalMessage }) => {
    const user = users.get(socket.id);
    if (user) {
      user.status = status;
      if (personalMessage !== undefined) user.personalMessage = personalMessage;
      broadcastUserList();
    }
  });

  socket.on('avatar-change', ({ avatar }) => {
    const user = users.get(socket.id);
    if (user) { user.avatar = avatar; broadcastUserList(); }
  });

  socket.on('message', ({ to, text, color, fontSize, bold, italic }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    const payload = { from: socket.id, username: sender.username, text, color, fontSize, bold, italic, timestamp: Date.now() };
    if (to) {
      io.to(to).emit('message', payload);
      socket.emit('message', { ...payload, self: true });
    } else {
      io.emit('message', payload);
    }
  });

  socket.on('nudge', ({ to }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    if (to) io.to(to).emit('nudge', { from: socket.id, username: sender.username });
    else socket.broadcast.emit('nudge', { from: socket.id, username: sender.username });
  });

  socket.on('typing', ({ to, isTyping }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    if (to) io.to(to).emit('typing', { from: socket.id, username: sender.username, isTyping });
  });

  socket.on('file-share', ({ to, fileInfo }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    const payload = { from: socket.id, username: sender.username, fileInfo, timestamp: Date.now() };
    if (to) {
      io.to(to).emit('file-share', payload);
      socket.emit('file-share', { ...payload, self: true });
    } else {
      io.emit('file-share', payload);
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
  socket.on('screen-share-offer', ({ to, offer }) => {
    io.to(to).emit('screen-share-offer', { from: socket.id, offer });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('user-left', { id: socket.id, username: user.username });
      users.delete(socket.id);
      broadcastUserList();
      console.log(`${user.username} disconnected`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Claude Messenger server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/ping\n`);
});
