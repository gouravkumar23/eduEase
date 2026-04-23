const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. Load Environment Variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// 2. Startup Validation
const REQUIRED_VARS = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SENDER_EMAIL', 'SECRET_KEY'];
let configValid = true;
let configError = '';

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  configValid = false;
  configError = `Missing required environment variables: ${missing.join(', ')}`;
  console.error(`[CRITICAL] ${configError}`);
}

// 3. Setup Express
const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());

// 4. Setup Nodemailer Transport
let transporter = null;
if (configValid) {
  try {
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    // Port 465 is Implicit SSL, Port 587 is STARTTLS
    const isSecure = smtpPort === 465;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: smtpPort,
      secure: isSecure, 
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // Required for some relays like Brevo to prevent handshake errors
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
    console.log(`✅ Universal SMTP Transporter initialized (Host: ${process.env.SMTP_SERVER}, Port: ${smtpPort}, Secure: ${isSecure}).`);
  } catch (e) {
    configValid = false;
    configError = `Failed to initialize SMTP transporter: ${e.message}`;
    console.error(`[ERROR] ${configError}`);
  }
}

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

// 5. Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: configValid ? 'healthy' : 'degraded', 
    timestamp: new Date().toISOString(),
    error: configError || null
  });
});

app.post('/send-mail', mailLimiter, async (req, res) => {
  console.log(`[LOCAL_STEP_1] Incoming request from: ${req.ip}`);

  if (!configValid) {
    return res.status(503).json({ success: false, error: 'Service Unconfigured' });
  }

  // Security Check
  const serviceKey = req.headers['x-service-key'];
  if (!serviceKey || serviceKey !== process.env.SECRET_KEY) {
    console.warn('[LOCAL_AUTH_FAIL] Invalid or missing x-service-key');
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: to, subject, html' 
    });
  }

  try {
    console.log(`[LOCAL_STEP_2] Attempting SMTP send to: ${to}`);
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html,
    });

    console.log(`[LOCAL_SUCCESS] Mail sent! MessageId: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId
    });
  } catch (error) {
    console.error(`[LOCAL_SMTP_ERROR]`, error.message);
    return res.status(500).json({ success: false, error: `SMTP Error: ${error.message}` });
  }
});

app.use((err, req, res, next) => {
  console.error('[LOCAL_CRASH]', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const startSMTPServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Universal Mail Service active on port ${PORT}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startSMTPServer();
}

module.exports = { startSMTPServer };