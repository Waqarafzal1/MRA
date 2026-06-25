# MRA — My Rights App | Deployment Guide

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Anthropic Claude** (claude-haiku) for AI legal Q&A
- **Nodemailer + Gmail** for OTP and notification emails
- **Data storage**: JSON file (`registrations.json`) on disk

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY at minimum

# 3. Start the dev server
npm run dev
# App runs at http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

---

## What you need

| Variable            | Required | Purpose                                      |
|---------------------|----------|----------------------------------------------|
| `ANTHROPIC_API_KEY` | ✅ Yes   | Powers the AI legal Q&A chat                 |
| `EMAIL_USER`        | Optional | Gmail address for sending emails             |
| `EMAIL_APP_PASSWORD`| Optional | Gmail App Password (not your account password)|
| `ADMIN_PASSWORD`    | Optional | Protects `/admin` (default: `mra-admin-2024`)|
| `ADMIN_EMAIL`       | Optional | Where new registration alerts are emailed    |
| `APP_URL`           | Optional | Your live domain (used in email links)       |
| `TWILIO_ACCOUNT_SID`| Optional | Present only if using the WhatsApp webhook   |

---

## Step 1 — Get your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in → **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)

---

## Step 2 — Deploy on Railway

1. Push this repo to GitHub
2. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
3. Select your repository — Railway auto-detects Node.js
4. Click **Add Variables** and set:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-key-here
   ```
5. Add any optional variables (EMAIL_USER, etc.) as needed
6. Click **Deploy** — wait ~2 minutes
7. Go to **Settings → Networking → Generate Domain**
8. Set `APP_URL` to your Railway domain and redeploy

Railway runs `npm start` → `next start` on port `$PORT` automatically.

---

## Step 3 — Custom domain (optional)

1. Buy a domain from Namecheap or PKNIC (pknic.net.pk)
2. In Railway → Settings → Custom Domain, add your domain
3. Follow Railway's DNS instructions

---

## Build commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production (type-checks included)
npm run start    # Serve production build
npm run lint     # Run ESLint
```

---

## Admin panel

Visit `/admin` in your browser. Enter the `ADMIN_PASSWORD` to:
- Review pending lawyer registrations
- Approve or reject registrations (triggers email to the lawyer)

Default password (if `ADMIN_PASSWORD` is not set): `mra-admin-2024`

---

## WhatsApp webhook

Point Twilio's WhatsApp sandbox webhook to:
```
POST https://your-domain.com/webhook/whatsapp
```

The bot auto-detects Urdu vs English from the message and replies with AI-generated legal information.

---

## Cost estimate

| Service            | Cost                               |
|--------------------|------------------------------------|
| Railway hosting    | Free tier (500 hrs/month)          |
| Anthropic Claude   | ~$0.001 per question               |
| Domain (.pk)       | ~PKR 2,000/year                    |

For 1,000 questions/day: approx **$1/day** in API costs.

---

Built by the MRA team.
