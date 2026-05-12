╔══════════════════════════════════════════════════════════════╗
║              Claude Messenger — Cloud Edition               ║
║                  Built by Darren & Claude 🧡                ║
╚══════════════════════════════════════════════════════════════╝

The server runs on Render (free cloud hosting) so nobody needs
to run start.bat. Just open the app and you're connected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FIRST-TIME SETUP — Deploy to Render (one time only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create a free account at https://render.com
   (No credit card required)

2. Push these files to a GitHub repo
   (Just drag the whole Claude Messenger folder into a new repo)

3. In Render → New → Web Service → connect your GitHub repo
   - Build Command:  npm install
   - Start Command:  node server.js
   - Instance Type:  Free

4. Click Deploy. Render gives you a URL like:
   https://claude-messenger-xxxx.onrender.com

5. Update the URL in TWO places:
   a) public/index.html  — find:  const CLOUD_URL='https://YOUR-APP-NAME.onrender.com';
   b) main.js            — find:  const CLOUD_URL = 'https://YOUR-APP-NAME.onrender.com';
   Replace YOUR-APP-NAME.onrender.com with your actual Render URL.

6. Commit and push to GitHub — Render auto-redeploys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EVERYDAY USE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Double-click "Claude Chat.vbs" to open the app.
That's it. The server is always online.

Note: Render's free tier goes to sleep after 15 minutes of no
activity. The app pings it every 10 minutes to keep it awake
while you're using it. If nobody's used it in a while, the
first connection might take ~30 seconds. Totally normal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SHARING WITH A FRIEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Just zip up the Claude Messenger folder and send it to them.
They need Node.js installed (https://nodejs.org — LTS version).
They double-click Claude Chat.vbs and they're on the same server
as you. No IP addresses, no router settings, no Room Codes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Node.js (https://nodejs.org) — LTS version
- Windows 10 or 11
- Internet connection

