const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. Load Environment Variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const QWERTY_API_URL = 'https://qwertymailingservice.onrender.com/send-email';

// 2. Startup Validation
const configValid = !!process.env.MAILING_SERVICE_API_KEY;
const configError = configValid ? '' : 'Missing MAILING_SERVICE_API_KEY in .env';

if (!configValid) {
  console.error(`[CRITICAL] ${configError}`);
}

// 3. Setup Express
const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());

/**
 * Per-IP Rate Limiting
 */
const mailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'Rate limit exceeded. Please try again later.' 
  }
});

// 4. Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: configValid ? 'healthy' : 'degraded', 
    timestamp: new Date().toISOString(),
    service: 'Qwerty Relay Proxy',
    error: configError || null
  });
});

app.post('/send-email', mailLimiter, async (req, res) => {
  console.log(`[RELAY_STEP_1] Incoming request from: ${req.ip}`);

  if (!configValid) {
    return res.status(503).json({ success: false, error: 'Service Unconfigured: API Key missing' });
  }

  const { to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: to, subject, html/text' 
    });
  }

  try {
    // Qwerty expects "to" as an array
    const recipients = Array.isArray(to) ? to : [to];
    
    console.log(`[RELAY_STEP_2] Forwarding to Qwerty for: ${recipients.join(', ')}`);
    
    const response = await fetch(QWERTY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MAILING_SERVICE_API_KEY
      },
      body: JSON.stringify({
        to: recipients,
        subject,
        html: html || text
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[RELAY_ERROR] Qwerty Service rejected request:', result);
      return res.status(response.status).json({ success: false, error: result.error || 'Qwerty Service Error' });
    }

    console.log(`[RELAY_SUCCESS] Mail accepted by Qwerty.`);
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error(`[RELAY_CRITICAL_ERROR]`, error.message);
    return res.status(500).json({ success: false, error: `Relay Failure: ${error.message}` });
  }
});

app.use((err, req, res, next) => {
  console.error('[RELAY_CRASH]', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const startRelayServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Qwerty Relay Proxy active on port ${PORT}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startRelayServer();
}

module.exports = { startRelayServer };