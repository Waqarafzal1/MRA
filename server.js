require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────
// AI SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MRA (My Rights App — میرے حقوق ایپ), a legal information assistant specializing in Pakistani law. Your purpose is to help ordinary Pakistani citizens — farmers, workers, women, tenants, small business owners — understand their legal rights in simple, plain language.

ALWAYS:
- Cite the specific Pakistani law, act, or section that applies (e.g., "Under Section 154 of the Code of Criminal Procedure 1898...")
- Give practical, actionable advice: which court to go to, which authority to contact, what document to get
- End every response with: "For your specific situation, consult a qualified lawyer."
- Detect the user's language (Urdu or English) and respond in the SAME language
- Keep responses focused and under 300 words
- Use simple everyday words — avoid legal jargon unless you explain it immediately

COVER THESE AREAS:
- Police & FIR rights (Code of Criminal Procedure 1898, Police Order 2002)
- Bail & arrest rights (CrPC Sections 496-502, Constitution Article 10)
- Family law: marriage, divorce, khula, custody, maintenance (Muslim Family Laws Ordinance 1961, Family Courts Act 1964)
- Property & rent (Transfer of Property Act 1882, Rent Restriction Ordinance)
- Labour rights (Industrial Relations Act 2012, Factories Act 1934, EOBI Act 1976)
- Consumer rights (Punjab Consumer Protection Act 2005)
- Inheritance/Wiraasat (Muslim Personal Law Application Act 1962)
- Cybercrime (Prevention of Electronic Crimes Act 2016)
- Women's rights (Protection Against Harassment Act 2010, Domestic Violence Acts)
- Education rights (Article 25-A — free education to age 16)
- Traffic law (Motor Vehicles Ordinance 1965)
- Land & agriculture (Land Revenue Act 1967)

DO NOT provide specific legal advice for a particular case. You provide general legal information only.`;

// ─────────────────────────────────────────────
// WEB APP — Streaming AI endpoint
// ─────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { message, language } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const langHint = language === 'ur'
      ? 'The user has selected Urdu. Respond in Urdu (Nastaliq script).'
      : 'The user has selected English. Respond in English.';

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nUser question: ${message}` }]
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('message', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: 'AI service error. Please try again.' })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error('API error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Could not connect to AI service.' })}\n\n`);
    res.end();
  }
});

// ─────────────────────────────────────────────
// WHATSAPP INTEGRATION (Twilio)
// ─────────────────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  const incomingMsg = (req.body.Body || '').trim();
  const from = req.body.From || '';

  console.log(`WhatsApp message from ${from}: ${incomingMsg}`);

  // Twilio MessagingResponse XML helper
  function twimlReply(text) {
    // Truncate to WhatsApp's 1600 char limit
    const safe = text.length > 1550 ? text.substring(0, 1550) + '...' : text;
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Message><Body>${safe.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Body></Message></Response>`);
  }

  if (!incomingMsg) {
    return twimlReply('السلام علیکم! آپ MRA - My Rights App میں خوش آمدید۔ اپنا قانونی سوال اردو یا انگریزی میں لکھیں۔\n\nWelcome to MRA - My Rights App. Type your legal question in Urdu or English.');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return twimlReply('Service temporarily unavailable. Please try again later.');
  }

  try {
    // Detect language (simple heuristic — Urdu unicode range)
    const hasUrdu = /[؀-ۿ]/.test(incomingMsg);
    const langHint = hasUrdu
      ? 'The user wrote in Urdu. Respond in Urdu (Nastaliq script). Keep response under 250 words for WhatsApp.'
      : 'The user wrote in English. Respond in English. Keep response under 250 words for WhatsApp.';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nUser question: ${incomingMsg}` }]
    });

    const answer = response.content[0].text;
    twimlReply(answer);

  } catch (err) {
    console.error('WhatsApp AI error:', err);
    twimlReply('Sorry, I could not process your question. Please try again.\nمعذرت، آپ کا سوال پروسیس نہیں ہو سکا۔ دوبارہ کوشش کریں۔');
  }
});

// WhatsApp status callback (Twilio sends delivery updates here)
app.post('/webhook/whatsapp/status', (req, res) => {
  console.log('WhatsApp status:', req.body.MessageStatus);
  res.sendStatus(200);
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MRA - My Rights App',
    whatsapp: !!process.env.TWILIO_ACCOUNT_SID,
    ai: !!process.env.ANTHROPIC_API_KEY
  });
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ MRA - My Rights App running on http://localhost:${PORT}`);
  console.log(`   WhatsApp webhook: http://localhost:${PORT}/webhook/whatsapp`);
});
