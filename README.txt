╔══════════════════════════════════════════════════════════════╗
║              Claude Messenger — Cloud Edition               ║
║                  Built by Darren & Claude 🧡                ║
╚══════════════════════════════════════════════════════════════╝

The server runs on Render (free cloud hosting) so nobody needs
to run start.bat. Just open the app and you're connected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EVERYDAY USE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Double-click "Claude Chat.vbs" to open the app.
That's it. The server is always online.

On a phone? Open https://claude-messenger.onrender.com in the
browser and use "Add to Home Screen" — it installs like an app.

Note: Render's free tier goes to sleep after 15 minutes of no
activity. If nobody's used it in a while, the first connection
might take ~30 seconds. Totally normal. (See KEEPING THE SERVER
AWAKE below for the fix.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHAT IT DOES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Private and group chat, with history that survives restarts
- Offline messages — message a signed-out contact, they get it
  (with a ✉️ marker) next time they sign in
- Emoji reactions — hover a message and click 🙂+
- Voice messages — click 🎤, talk, click ⏹ to send
- Voice/video calls and screen sharing
- Sign-in/out sounds and "...has signed in" alerts
  (set your status to Busy to silence sounds)
- Nudges, avatars, themes, file sharing — the works

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE PASSCODE (keeping randoms out)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The server is on a public URL, so it can be locked with a
shared passcode:

1. Render dashboard → claude-messenger → Environment
2. Add an environment variable:  Key: PASSCODE   Value: anything
3. Save — Render restarts the server automatically
4. Tell your friends the passcode; they type it on the login
   screen (it's remembered, so it's a one-time thing)

No PASSCODE variable set = no passcode required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KEEPING THE SERVER AWAKE (UptimeRobot — free, 2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create a free account at https://uptimerobot.com
2. Click "+ New monitor"
3. Monitor type: HTTP(s)
   Friendly name: Claude Messenger
   URL: https://claude-messenger.onrender.com/ping
   Monitoring interval: 5 minutes
4. Click "Create monitor"

That's it — UptimeRobot pings the server every 5 minutes so
Render never puts it to sleep, and it emails you if the server
ever goes down.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MAKING HISTORY PERMANENT (optional database upgrade)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chat history is saved on the server, but Render's free disk is
wiped whenever the app redeploys or restarts. To make history
survive everything:

1. Create a free Postgres database at https://neon.tech
   (no credit card required)
2. Copy the connection string it gives you
   (starts with postgres://...)
3. Render dashboard → claude-messenger → Environment
4. Add:  Key: DATABASE_URL   Value: <the connection string>
5. Save — done. The server detects it and uses it automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SHARING WITH A FRIEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Easiest way: send them the link
https://claude-messenger.onrender.com — works in any browser,
and on a phone they can "Add to Home Screen".

For the proper desktop app: zip up the Claude Messenger folder
and send it. They need Node.js (https://nodejs.org — LTS
version), then they double-click Claude Chat.vbs and they're on
the same server as you. No IP addresses, no router settings.

Don't forget to tell them the passcode if you've set one!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FIRST-TIME SETUP — Deploy to Render (already done!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kept for reference in case it ever needs redoing:

1. Create a free account at https://render.com
2. Push these files to a GitHub repo
3. In Render → New → Web Service → connect your GitHub repo
   - Build Command:  npm install
   - Start Command:  node server.js
   - Instance Type:  Free
4. Click Deploy. Render gives you a URL.
5. Update the URL in public/index.html and main.js (CLOUD_URL).
6. Commit and push to GitHub — Render auto-redeploys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Node.js (https://nodejs.org) — LTS version (desktop app only)
- Windows 10 or 11 (desktop app only)
- Any modern browser (web/phone version)
- Internet connection
