# Qanoon Guide — Deployment Guide

## What you need
- A free GitHub account (github.com)
- A free Railway account (railway.app)
- An Anthropic API key (console.anthropic.com)

---

## Step 1 — Get your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`) — save it somewhere safe

---

## Step 2 — Upload code to GitHub

1. Go to https://github.com and sign in
2. Click the **+** button → **New repository**
3. Name it `qanoon-guide`, set to **Public**, click **Create**
4. On your computer, open the `qanoon-guide` folder
5. Upload all files: drag and drop into GitHub, or use GitHub Desktop app
6. Files to upload:
   - `server.js`
   - `package.json`
   - `public/index.html`
   - `.env.example`
   - `DEPLOY.md`
7. Click **Commit changes**

---

## Step 3 — Deploy on Railway (free hosting)

1. Go to https://railway.app and sign up with your GitHub account
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `qanoon-guide` repository
4. Railway will auto-detect it's a Node.js app
5. Click **Add Variables** and add:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-actual-key-here
   ```
6. Click **Deploy**
7. Wait ~2 minutes for deployment to complete
8. Click **Settings** → **Networking** → **Generate Domain**
9. Your app will be live at: `https://qanoon-guide-xxxx.up.railway.app`

---

## Step 4 — Custom domain (optional)

If you want `qanoonguide.pk` or similar:
1. Buy domain from PKNIC (pknic.net.pk) or Namecheap
2. In Railway → Settings → Custom Domain, add your domain
3. Follow Railway's DNS instructions

---

## Running locally (for testing)

```bash
# In the qanoon-guide folder:
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
node server.js
# Open http://localhost:3000
```

---

## Cost estimate

| Service | Cost |
|---|---|
| Railway hosting | Free tier (500 hrs/month) |
| Anthropic API | ~$0.001 per question (very cheap) |
| Domain (.pk) | ~PKR 2,000/year |

For 1,000 questions/day: approx **$1/day** in API costs.

---

## Support
Built by Qanoon Guide team. For issues, contact your developer.
