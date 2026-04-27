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

  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized.' });
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
 * Relay endpoint for sending emails via Qwerty Mailing Service
 */
app.post('/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body;
  const apiKey = process.env.MAILING_SERVICE_API_KEY;

  if (!apiKey) {
    console.error('[CONFIG_ERROR] MAILING_SERVICE_API_KEY is missing in .env');
    return res.status(500).json({ error: 'Mailing service not configured on server' });
  }

  try {
    // Qwerty Mailing Service expects "to" as an array of strings
    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch('https://qwertymailingservice.onrender.com/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ 
        to: recipients, 
        subject, 
        html: html || text 
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[MAILING_SERVICE_ERROR]', result);
      return res.status(response.status).json({ success: false, error: result.error || 'External service error' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[RELAY_CRITICAL_FAILURE]', error.message);
    res.status(500).json({ error: 'Relay failed', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EduEase backend active on port ${PORT}`);
});