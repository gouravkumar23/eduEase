const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin with detailed logging
try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('✅ EduEase Admin: Initializing from Environment Variable');
  } else {
    // Attempt to load from file
    const path = '../scripts/eduease-service-account.json';
    console.log(`[INIT] Attempting to load service account from: ${path}`);
    serviceAccount = require(path);
    console.log('✅ EduEase Admin: Initializing from Local File');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('❌ FIREBASE ADMIN INIT FAILED:', error.message);
  console.error('This is likely why you are getting a 500 error on /api/notify.');
}

const db = admin.firestore();

/**
 * FCM Notification Endpoint
 */
app.post('/api/notify', async (req, res) => {
  const { token, title, body, data, userId } = req.body;
  
  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if Admin SDK initialized correctly
  if (!admin.apps.length) {
    console.error('[API_ERROR] Cannot send notification: Firebase Admin SDK not initialized.');
    return res.status(500).json({ 
      error: 'Firebase Admin SDK not initialized on server.',
      tip: 'Check Render logs for "FIREBASE ADMIN INIT FAILED"'
    });
  }

  const message = {
    notification: { title, body },
    token: token,
    data: data || {},
    android: {
      notification: { sound: 'default', priority: 'high' }
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('[FCM_SEND_ERROR]', error.code, error.message);
    
    if (userId && (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-argument')) {
      try {
        await db.collection('users').doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
      } catch (dbErr) {}
      return res.status(410).json({ error: 'Token expired' });
    }

    res.status(500).json({ error: error.message, code: error.code });
  }
});

/**
 * Relay endpoint for sending emails
 */
app.post('/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body;
  const mailBackendUrl = process.env.MAIL_BACKEND_URL;
  const apiKey = process.env.MAIL_SERVICE_API_KEY || process.env.SECRET_KEY;

  if (!mailBackendUrl || !apiKey) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  try {
    const response = await fetch(`${mailBackendUrl}/send-mail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': apiKey,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ project: "eduease", to, subject, html: html || text })
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Relay failed', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EduEase backend active on port ${PORT}`);
});