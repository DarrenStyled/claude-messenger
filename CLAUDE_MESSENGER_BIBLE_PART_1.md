# Claude Messenger — Project Bible
### Built by Darren & Claude | Handover Document for Future Claude Sessions

---

## 🧭 What Is This?

Claude Messenger is a private messaging app built from scratch by Darren (a home user in Townsville, Australia) and Claude. It's inspired by MSN Messenger but modernised with Claude's own branding — warm oranges, dark/light themes, and a clean UI.

It started as "MSN Chat", became "Claude Chat", and is now officially **Claude Messenger**. Darren refers to it as something "we" built together, and that matters to him. Respect that.

---

## 🗂️ Project Files

The working project lives in a folder called **`Claude Messenger`** (not `msn-chat` — that was the old name, don't use it again). When building/packaging always use `Claude Messenger` as the folder name.

### File Structure
```
Claude Messenger/
├── Claude Chat.vbs        ← Main launcher (double-click to run)
├── start.bat              ← Server-only launcher (backup/reference)
├── connect.bat            ← For friend connecting without running server
├── server.js              ← Node.js/Socket.IO chat server
├── main.js                ← Electron main process (app window + tray)
├── package.json           ← npm config (name: claude-chat)
├── public/
│   └── index.html         ← Entire frontend (HTML/CSS/JS, ~80KB)
├── assets/
│   ├── icon.png           ← Main icon (256px, Claude orange chat bubble)
│   ├── icon_16.png
│   ├── icon_32.png
│   └── icon_256.png
└── README.txt             ← User-facing setup instructions
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express + Socket.IO |
| Frontend | Vanilla HTML/CSS/JS (single file) |
| App window | Electron (via `npx electron .`) |
| Launcher | VBScript (`Claude Chat.vbs`) |
| File uploads | Multer (up to 100MB local, 5MB internet mode) |
| Video/audio calls | WebRTC (via Socket.IO signalling) |
| Internet mode | PeerJS (0.peerjs.com free cloud relay) |

### Key npm packages
- `express` — HTTP server
- `socket.io` — Real-time messaging
- `multer` — File uploads
- `electron` — App window (devDependency)
- `peer` — PeerJS server (installed but internet mode uses cloud PeerJS)

---

## 🚀 How It Launches

### The VBS Launcher (`Claude Chat.vbs`)
This is the ONLY file either user needs to double-click. It:
1. Checks Node.js is installed (shows friendly error if not)
2. Runs `npm install` on first run only
3. Checks if port 3000 is already in use
4. If NOT running → kills any zombie on port 3000 → starts `server.js` silently in background → waits up to 10 seconds for it to be ready
5. If already running → skips straight to app
6. Launches Electron via `npx electron .` with no visible CMD window

### Electron (`main.js`)
- Opens app window: 1050×860px, min 700×560
- Loads `http://localhost:3000`
- **X button minimises to system tray** (does NOT close)
- Tray icon: left-click = show/hide, right-click = menu with Open + Quit
- Quit from tray kills the server process too
- `windowsHide: true` on server spawn — no CMD window
- Server runs as a child process with `ELECTRON_RUN_AS_NODE: 1`

### `start.bat` (server only, for Darren when not using VBS)
- Kills anything on port 3000 first
- Shows local IP addresses
- Starts `node server.js` — NO browser launch (browser was removed intentionally)
- Tells user to open `Claude Chat.vbs` for the app window

---

## 🎨 Design & Branding

### Claude Brand Colours
```css
--claude-orange:      #D97757
--claude-orange-warm: #E8895A
--claude-orange-deep: #B85C35
--claude-orange-glow: rgba(217,119,87,0.18)
--claude-orange-soft: rgba(217,119,87,0.10)
```

### Themes
- **Light (default):** Warm creamy whites and beiges (`#FAF7F4` bg)
- **Dark:** Deep warm charcoals (`#1C1917` bg)
- Toggle via 🌗 Theme button in sidebar footer
- NOT cold grey — always warm tones

### Typography
- **Fraunces** (Google Fonts) — headings, titles, display text
- **DM Sans** (Google Fonts) — body, UI elements

### CSS Variables (Light Theme defaults)
```css
--bg:#FAF7F4; --s0:#F0EBE5; --s1:#E8E1D9; --s2:#DDD5CA; --s3:#CFC6BA;
--tp:#2A1F16; --ts:#6B5040; --tm:#A08070;
--bd:rgba(0,0,0,0.08); --bdw:rgba(217,119,87,0.25);
```

### Icon
Generated programmatically in Python — orange gradient circle with a white chat bubble and orange dots. Stored in `assets/`. Sizes: 16, 32, 64, 256px.

---

## 💬 Features

### Messaging
- Real-time text chat via Socket.IO
- Private (one-to-one) and Group chat modes
- Message colour picker (7 colours)
- Font size selector (11/13/15/18/22px)
- Bold and italic formatting
- Emoji picker (100+ emoji, searchable)
- Clickable links in messages
- "Is typing..." indicator
- Timestamps on every message
- Chat history within session

### Presence
- Online / Away / Busy / Appear Offline status
- Status dot in sidebar (click to change)
- Personal message (inline edit — click it, type, press Enter)
- Custom avatar (emoji-based)

### Avatar Builder
Full avatar creator modal with 5 tabs:
- **Emoji** — 100+ emoji with search
- **Background** — 15 solid colours, 12 gradients, 6 patterns, custom colour picker
- **Frame** — 7 border styles × 10 colours
- **Shape** — Rounded, Circle, Square, Squircle, Diamond, Hexagon
- **Size** — 5 sizes + 5 shadow styles
- Live preview, 🎲 Random button, 📷 Upload Photo, Reset

### File Sharing
- Click 📎 File button or drag & drop anywhere
- Local mode: up to 100MB, served from `uploads/` folder
- Internet mode: up to 5MB, sent as base64 data URL directly over peer connection
- File type icons (pdf, doc, image, video, audio, etc.)

### Calls
- 📞 Voice call (WebRTC)
- 📹 Video call (WebRTC)
- 🖥️ Screen sharing (getDisplayMedia)
- Mute / camera toggle during calls
- Call timer
- Incoming call notification with Answer/Decline
- Audio-only view with animated waveform when no video

### Other
- 👋 Nudge button — shakes the entire app window
- Notification sounds (Web Audio API, no files needed)
- Unread message badges on contacts
- System tray minimise
- Dark/light theme toggle
- Group chat (👥 Group button) with ← back arrow to return
- Drag & drop file sending

---

## 🌐 Connection Modes

### Local Mode (🏠)
- Requires `start.bat` / `Claude Chat.vbs` running on host PC
- Friend enters host's local IP + `:3000` in Server Address field
- Unlimited users, up to 100MB files
- Best for same network or with port forwarding

### Internet Mode (🌐)
- Zero router config required
- Uses PeerJS cloud (0.peerjs.com) for peer discovery
- Both users enter same Room Code (e.g. `happy-fox-42`)
- 🎲 Random button generates memorable codes
- Pure WebRTC peer-to-peer once connected
- Files limited to 5MB (base64 over data channel)
- Works through most firewalls via STUN/TURN:
  - stun.l.google.com:19302
  - stun.cloudflare.com:3478
  - openrelay.metered.ca (TURN fallback)

---

## 📋 Known Issues / History

| Issue | Status | Notes |
|---|---|---|
| `EADDRINUSE` port 3000 | Fixed | `start.bat` and `.vbs` now kill existing process first |
| Browser opening alongside app | Fixed | Removed `start http://localhost:3000` from start.bat |
| Login card cut off at bottom | Fixed | Compacted spacing, window height 860px |
| Scroll not working on login | Fixed | `flex:1;min-height:0;overflow-y:auto` on `.lbody` |
| Personal message click did nothing | Fixed | Now inline edit — click, type, Enter to save |
| Avatar click did nothing | Fixed | Now opens full Avatar Builder modal |
| No back button from Group chat | Fixed | ← back arrow added, shows only in group mode |
| CMD window visible on launch | Fixed | `windowsHide:true`, VBS uses `0` (hidden) window style |
| `.exe` launcher attempt | Abandoned | Cross-compiled with mingw but didn't work on Windows; reverted to `.vbs` |

---

## 🔜 Next Planned Feature

**Cloud hosting** — Deploy the server to a free cloud host (Railway or Render) so:
- Server is always online, no one needs to run `start.bat`
- Hardcode the cloud URL into the app
- Anyone Darren gives the app to just opens it and connects automatically
- No server address box, no room codes — just works
- Darren's words: "If I ever make another friend I'd like to be able to chat with them on an app that **we** made"

Also planned (noted in conversation):
- Show Darren's actual local IP address in the "No contacts yet" area so he can easily tell Justin without opening a command prompt

---

## 👤 About Darren

- Home user in Townsville, Australia (though Claude may show Melbourne due to VPN/location)
- Serious hobbyist, not a professional developer
- Has: RTX 3060 12GB, dual Xeon workstation, 128GB RAM, Creality CR-10 3D printer
- Prefers: plain English, proceed with reasonable assumptions, minimal clarifying questions
- Partner: Sarah (co-hosts podcast "On My Bullshit" with friend Alyssa)
- Friend being tested with: Justin
- Communicates casually, appreciates humour
- Called this project "ours" — treat it that way

---

## 💡 Tips for Future Claude

- Always name the folder **`Claude Messenger`** not `msn-chat`
- Always output as `claude-messenger.zip`
- The frontend is one big `index.html` — CSS variables make theming easy
- When making changes, use Python string replacement scripts rather than `str_replace` on the huge file — more reliable
- The light theme is DEFAULT — don't switch it back to dark
- Darren is proud of this project. Match that energy.
- He will say "wow" a lot. It's genuine. Enjoy it.

---

*Last updated: This conversation — Claude Sonnet 4.6*
*"Claude Messenger, by Darren and Claude"* 🧡
