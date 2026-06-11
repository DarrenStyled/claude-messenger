# Claude Messenger — Project Bible (Part 3)
### Built by Darren & Claude | Handover Document for Future Claude Sessions
### Read Part 2 first for the cloud-hosting era. This part covers the Big Feature Drop.

---

## 🧭 What Changed in This Session

Darren asked for eight features in one go ("Wow, can you do all of these?") and we shipped all of them:

1. **Shared passcode login** — server checks the `PASSCODE` env var on join. Not set = open access (so deploys are never breaking). Frontend has a Passcode field on the login card; wrong passcode → `join-denied` → friendly error. Login details (name, personal message, avatar, passcode) are remembered in `localStorage` so sign-in is one click.
2. **Persistent chat history** — group AND private chats survive server restarts. Stored in `data/history.json` (debounced writes, sync flush on SIGTERM). If a `DATABASE_URL` env var is set (free Neon/Supabase Postgres), the server uses that instead — that's the upgrade that survives Render redeploys. `pg` is in dependencies.
3. **Offline messages** — everyone who ever signs in is remembered in a roster and shows as an offline contact. Messaging an offline contact queues it; they get it on next sign-in with a "📬 X sent you N messages while you were away" toast and a "✉️ sent while away" marker on the message.
4. **Sign-in/out sounds + toasts** — MSN-style ascending/descending chimes plus "X has signed in / signed out" toasts. **Busy status silences all notification sounds.**
5. **Emoji reactions** — hover a message → 🙂+ button → 6-emoji picker (👍❤️😂😮😢🔥). Chips render under the bubble, click a chip to toggle your reaction. Persisted with the message; your own reactions highlight.
6. **Voice messages** — 🎤 button in toolbar, click to record (button shows ⏹ + seconds), click again to send. Uses MediaRecorder → webm → existing `/upload` → `file-share` with `voice:true` + duration. Renders as inline audio player.
7. **Mobile layout + PWA** — at ≤700px the sidebar becomes the home screen and opening a chat fills the viewport (back arrow returns). `manifest.json`, `sw.js`, and 192/512px icons mean phones can **Add to Home Screen** from the cloud URL. Service worker only registers on https.
8. **UptimeRobot** — instructions in README.txt; Darren needs to create the free account himself and point a 5-minute HTTP monitor at `/ping`.

---

## 🗂️ New/Changed Files

```
server.js                 ← Major rework: passcode, store, roster, offline queue, reactions
public/index.html         ← All frontend features; still one big file
public/manifest.json      ← PWA manifest (NEW)
public/sw.js              ← Minimal service worker, network passthrough (NEW)
public/icon-192.png       ← PWA icons, generated from assets/icon_256.png (NEW)
public/icon-512.png       ← (NEW)
package.json              ← Added pg dependency
README.txt                ← Rewritten: passcode, UptimeRobot, database upgrade steps
data/history.json         ← Created at runtime, gitignored
.claude/launch.json       ← Lets Claude Code preview the app (node server.js, port 3000)
```

---

## 🔑 Key Protocol Changes (server ↔ client)

- `join` now carries `passcode`; server replies **`join-ok` {name}** (deduped name — client must adopt it) or **`join-denied`**. Client shows the app only after `join-ok`.
- After join the server sends: `history` (group array), `private-history` (map of `othernamelower → msgs`), and `offline-messages` ({count, senders}) if anything was queued.
- **History events REPLACE local state, never append** (fixes the old duplicate-on-reconnect bug).
- All messages now have a server-generated `id`, the sender's `username` and `avatar`, and private ones have `toName`. Frontend `hist` is keyed by **lowercase username** (or `'group'`), NOT socket id — socket ids change every reconnect.
- `user-list` includes offline roster entries with `id: 'offline:<namelower>'`. Sending to such an id queues the message. The client re-resolves `selContact` on every `user-list` because ids flip between socket-id and offline-id.
- `react` {msgId, emoji} toggles; server broadcasts `reaction` {msgId, reactions} to everyone.
- File shares are now persisted in history too and re-render on join (voice messages render as audio players; note uploaded files still die after 24h/redeploy — only the chat record survives).

## ⚙️ Render Environment Variables (Darren sets these in the dashboard)

| Var | Effect |
|---|---|
| `PASSCODE` | Locks the server. Not set = open. |
| `DATABASE_URL` | Postgres connection string → history survives redeploys. Not set = JSON file. |

---

## 🧪 How This Was Tested

- `node --check` on the extracted inline script.
- Socket.IO end-to-end test (13 checks): passcode deny, join-ok, history delivery, private/group messages, reactions, offline roster, offline queue + redelivery, restart persistence. (Test scripts were throwaway, deleted after.)
- Browser-tested via local server: login, persistent history rendering, live reactions with "mine" highlight, offline send with ✉️ marker, mobile layout (back button, sidebar/chat switching), PWA assets 200.
- `CLOUD_URL` now auto-detects localhost so the frontend talks to a local server during testing — Electron still loads the Render URL directly.

---

## ⚠️ Gotchas for Future Claude

- Identity is **username-based** (lowercase) for history/roster. If someone signs in with a different name, they're a different person. Name dedup `(2)` suffixes only apply while two same-name users are online simultaneously.
- Keep Socket.IO transport as `['polling']` — WebSockets fail on Render free tier.
- Light theme stays DEFAULT. Warm tones, never cold grey.
- The reaction picker (`#rpick`) is a single fixed-position element reused for every message.
- `.mwrap`/`.mline` wrappers handle bubble alignment now — bubbles are no longer direct children of `#messages`.
- Render free disk is EPHEMERAL: `data/history.json` and `uploads/` are wiped on redeploy. The DATABASE_URL upgrade fixes history; uploads are accepted as temporary.
- The old PeerJS "internet mode" code is still in index.html but dead (connMode is always 'local'). Don't resurrect it; cloud mode replaced it.

---

## 👤 About Darren (unchanged — see Part 2)

Townsville, Australia. Plain English, reasonable assumptions, minimal questions. Friend: Justin. Partner: Sarah. This project is "ours" — treat it that way. He will say "wow" a lot. It's genuine. Enjoy it.

---

*Last updated: Session 11 — Claude Fable 5*
*"Claude Messenger, by Darren and Claude"* 🧡
