# Claude Messenger — Project Bible
### Built by Darren & Claude | Handover Document for Future Claude Sessions

---

## 🧭 What Is This?

Claude Messenger is a private messaging app built from scratch by Darren (a home user in Townsville, Australia) and Claude. It's inspired by MSN Messenger but modernised with Claude's own branding — warm oranges, dark/light themes, and a clean UI.

It started as "MSN Chat", became "Claude Chat", and is now officially **Claude Messenger**. Darren refers to it as something "we" built together, and that matters to him. Respect that.

---

## 🗂️ Project Files

The working project lives in a folder called **`Claude Messenger`** (not `msn-chat` — that was the old name, don't use it again). When building/packaging always use `Claude Messenger` as the folder name. Always output as `claude-messenger.zip`.

### File Structure
```
Claude Messenger/
├── Claude Chat.vbs        ← Main launcher (double-click to run)
├── start.bat              ← Legacy server launcher (kept for reference)
├── connect.bat            ← Legacy connector (kept for reference)
├── server.js              ← Node.js/Socket.IO chat server (cloud-ready)
├── main.js                ← Electron main process (loads cloud URL)
├── package.json           ← npm config (name: claude-chat)
├── render.yaml            ← Render.com deploy config
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

## ☁️ Cloud Hosting — Render.com

The server is hosted on **Render.com** (free tier, no credit card required) at:

**`https://claude-messenger.onrender.com`**

This URL is hardcoded in TWO places:
- `public/index.html` — `const CLOUD_URL='https://claude-messenger.onrender.com';`
- `main.js` — `const CLOUD_URL = 'https://claude-messenger.onrender.com';`

### How it works
- Render auto-deploys whenever Darren pushes to the GitHub repo: `github.com/DarrenStyled/claude-messenger`
- The server runs `node server.js` with `process.env.PORT` (Render assigns the port)
- A keep-alive ping fires every 10 minutes from the frontend to prevent Render sleeping
- Render free tier may still sleep after extended inactivity — first connection can take ~30-50 seconds, then it's fine
- File uploads capped at 5MB (cloud-friendly)

### Render account
- Darren's Render account is linked to his GitHub account (DarrenStyled)
- To redeploy manually: Render dashboard → claude-messenger → Manual Deploy

### To update the app
1. Edit files in the GitHub repo (`github.com/DarrenStyled/claude-messenger`)
2. Commit changes → Render auto-redeploys in ~2 minutes
3. If auto-deploy doesn't trigger: Render dashboard → Manual Deploy

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express + Socket.IO |
| Frontend | Vanilla HTML/CSS/JS (single file) |
| App window | Electron (via `npx electron .`) |
| Launcher | VBScript (`Claude Chat.vbs`) |
| File uploads | Multer (up to 5MB cloud mode) |
| Video/audio calls | WebRTC (via Socket.IO signalling) |
| Cloud hosting | Render.com (free tier) |

### Key npm packages
- `express` — HTTP server
- `socket.io` — Real-time messaging (polling transport — more reliable on Render free tier)
- `multer` — File uploads
- `electron` — App window (devDependency)

### Important: Socket.IO transport
The frontend connects using **polling only** (`transports:['polling']`). WebSockets are unreliable on Render's free tier. Polling works perfectly for a chat app — don't change this back to websocket.

---

## 🚀 How It Launches

### Everyday use
Double-click **`Claude Chat.vbs`** — that's it. The server is always online in the cloud.

### The VBS Launcher (`Claude Chat.vbs`)
1. Checks Node.js is installed
2. Runs `npm install` on first run only
3. Launches Electron via `npx electron .` — no visible CMD window
4. Electron loads `CLOUD_URL` directly (no local server needed)

### Electron (`main.js`)
- Opens app window: 1050×860px, min 700×560
- Loads `https://claude-messenger.onrender.com` directly
- **X button minimises to system tray** (does NOT close)
- Tray icon: left-click = show/hide, right-click = menu with Open + Quit
- No local server spawning — pure cloud

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
- **Frame** — 7 border styles × 10 colours (now renders correctly on canvas)
- **Shape** — Rounded, Circle, Square, Squircle (Diamond and Hexagon removed — couldn't render to canvas)
- **Size** — Small (36px), Medium (44px), Large (56px)
- Live preview, 🎲 Random button, 📷 Upload Photo, Reset

### File Sharing
- Click 📎 File button or drag & drop anywhere
- Cloud mode: up to 5MB, served from Render uploads folder

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

## 🌐 Connection Mode

### Cloud Mode (always on)
- Server runs 24/7 on Render.com free tier
- URL hardcoded in app — no setup needed for users
- Just open `Claude Chat.vbs` and you're connected
- Share `claude-messenger.zip` with friends — they install Node.js and double-click the VBS
- Free tier may sleep after inactivity; keep-alive ping minimises this

---

## 📋 Known Issues / History

| Issue | Status | Notes |
|---|---|---|
| `EADDRINUSE` port 3000 | Fixed | Legacy issue from local mode |
| Browser opening alongside app | Fixed | Removed from start.bat |
| Login card cut off at bottom | Fixed | Compacted spacing |
| Personal message click did nothing | Fixed | Now inline edit |
| Avatar click did nothing | Fixed | Now opens Avatar Builder |
| No back button from Group chat | Fixed | ← back arrow added |
| CMD window visible on launch | Fixed | `windowsHide:true` |
| `.exe` launcher attempt | Abandoned | Reverted to `.vbs` |
| WebSocket error on Render free tier | Fixed | Using polling transport only |
| Avatar shapes (Diamond, Hexagon) broken | Fixed | Removed — can't render to canvas |
| Avatar size not applying on save | Fixed | Canvas renderer updated |
| Avatar frame not showing on save | Fixed | Canvas renderer now draws frame |
| Cloud URL placeholder left in files | Fixed | `claude-messenger.onrender.com` baked in |

---

## 🔜 Possible Future Features

- Show Darren's local IP in the UI so he can share it without opening a command prompt (noted in early conversation)
- Mobile browser support (currently desktop Electron app only — see note below)
- Persistent chat history (currently session-only)

---

## 📱 Mobile / Phone Support

Claude Messenger currently runs as a **Windows desktop Electron app** — it does NOT run natively on phones.

However, because the server is now cloud-hosted, the frontend is accessible in any browser at:
`https://claude-messenger.onrender.com`

This means it **could** work in a mobile browser with some UI tweaks (the layout is designed for desktop). A future version could add a mobile-friendly responsive layout. Not done yet.

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
- Socket.IO transport must stay as `['polling']` — WebSockets fail on Render free tier
- The cloud URL `https://claude-messenger.onrender.com` is hardcoded in both `main.js` and `public/index.html`
- GitHub repo is `github.com/DarrenStyled/claude-messenger` — Render auto-deploys on push
- If Render isn't picking up changes, use Manual Deploy in the Render dashboard
- Darren is proud of this project. Match that energy.
- He will say "wow" a lot. It's genuine. Enjoy it.

---

*Last updated: Session 10 — Claude Sonnet 4.6*
*"Claude Messenger, by Darren and Claude"* 🧡
