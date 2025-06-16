require('dotenv').config({ path: './vars.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;

// Log the client ID, secret, and redirect URI for debugging
console.log('CLIENT_ID:', CLIENT_ID);
console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'set' : 'missing');
console.log('REDIRECT_URI:', REDIRECT_URI);

// Store user tokens securely (for demo, in-memory)
let oauth2Tokens = null;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose"
];

// Step 1: Redirect user to Google's OAuth consent screen
app.get('/api/auth/google', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(url);
});

// Step 2: Google redirects back with a code; exchange for tokens
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  console.log('OAuth code received:', code); // Log the code
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  try {
    // Replace this in your callback route for a test
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    oauth2Tokens = tokenRes.data;
    res.redirect('http://localhost:3000?authed=1');
  } catch (err) {
    // Log the full error response from Google
    console.error('Error exchanging code for tokens:', err.response?.data || err.message, err.response?.status || '');
    res.status(500).send('OAuth error: ' + (err.response?.data?.error || err.message));
  }
});

// Step 3: Use tokens to fetch emails
app.get('/api/gmail/unread', async (req, res) => {
  if (!oauth2Tokens) return res.status(401).json({ error: 'Not authenticated' });
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials(oauth2Tokens);

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const messagesRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox is:unread',
    maxResults: 10,
  });
  const messages = messagesRes.data.messages || [];
  const emails = [];
  for (const msg of messages) {
    const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
    const headers = msgData.data.payload.headers;
    const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
    const from = headers.find(h => h.name === "From")?.value || "(Unknown Sender)";
    const date = headers.find(h => h.name === "Date")?.value || "";

    // Extract plain text body
    let body = "";
    const parts = msgData.data.payload.parts || [];
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
    }

    emails.push({ id: msg.id, from, subject, date, body });
  }
  res.json(emails);
});

// Replace with your actual OpenAI API key (keep this secret!)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/llm/reply', async (req, res) => {
  const { email } = req.body;
  try {
    const prompt = `Reply to this email:\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body || ''}`;
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an email assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({
      subject: "Re: " + email.subject,
      body: response.data.choices[0].message.content.trim()
    });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message, err.response?.status || '');
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Example for Hugging Face
app.post('/api/llm/reply-hf', async (req, res) => {
  const { email } = req.body;
  try {
    const prompt = `Reply to this email:\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body || ''}`;
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/distilgpt2",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const generated = response.data[0]?.generated_text?.trim();
    if (!generated) {
      return res.status(502).json({ error: "LLM did not return a valid response." });
    }
    res.json({
      subject: "Re: " + email.subject,
      body: generated
    });
  } catch (err) {
    console.error("Hugging Face error:", err.response?.data || err.message, err.response?.status || '');
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
});

app.post('/api/llm', (req, res) => {
  const { prompt, llm, email } = req.body;
  // Simulate LLM response
  res.json({ response: `Draft reply for: "${prompt}" (LLM: ${llm})` });
});

app.post('/api/gmail/draft-and-mark-read', async (req, res) => {
  const { emailId, reply, subject } = req.body;
  if (!oauth2Tokens) return res.status(401).json({ error: 'Not authenticated' });

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials(oauth2Tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // Get the original message to reply to
    const msgData = await gmail.users.messages.get({ userId: 'me', id: emailId, format: 'full' });
    const threadId = msgData.data.threadId;
    const from = msgData.data.payload.headers.find(h => h.name === "From")?.value;

    // Create MIME message
    const rawMessage = Buffer.from(
      `From: me\r\nTo: ${from}\r\nSubject: ${subject}\r\nIn-Reply-To: ${emailId}\r\nReferences: ${emailId}\r\n\r\n${reply}`
    ).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Create draft
    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: rawMessage,
          threadId
        }
      }
    });

    // Mark as read
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: { removeLabelIds: ['UNREAD'] }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Draft/mark as read error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
});

app.post('/api/llm/custom', async (req, res) => {
  const { name, prompt, apiKey, endpoint, model } = req.body;

  console.log("Using custom LLM: ", { name, endpoint, model });

  try {
    const response = await axios.post(
      endpoint, // Use the endpoint provided by the user
      {
        model: model || "openchat/openchat-3.5-0106",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({
      response: response.data.choices?.[0]?.message?.content?.trim() || "(No response)"
    });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));