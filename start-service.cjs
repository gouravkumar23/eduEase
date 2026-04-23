const admin = require('firebase-admin');
require('dotenv').config();

// Import the SMTP server logic directly
const { startSMTPServer } = require('./local_smtp_server/index.cjs');

// 1. Initialize Firebase Admin
const serviceAccount = require('./scripts/smartquizhub-818ac-firebase-adminsdk-fbsvc-d8d493774e.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const SMTP_PORT = parseInt(process.env.LOCAL_SMTP_PORT || '5000');

async function startService() {
  console.log('🚀 Starting EduEase Local SMTP Service...');

  try {
    // 2. Start the local SMTP backend in the current process
    await startSMTPServer();
    
    console.log('✅ SMTP Server is active.');
    console.log(`ℹ️  Local Port: ${SMTP_PORT}`);
    console.log('--------------------------------------------------');
    console.log('👉 ACTION REQUIRED:');
    console.log(`   Run "ngrok http ${SMTP_PORT}" in a separate terminal.`);
    console.log('   Then, copy the ngrok URL to the Admin Settings in the app.');
    console.log('--------------------------------------------------');

    // 3. Update Firestore status (optional, just to show it's running)
    await db.collection('settings').doc('system').set({
      service_status: 'online',
      last_local_start: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Handle graceful shutdown
    const cleanup = async () => {
      console.log('\n👋 Shutting down SMTP service...');
      try {
        await db.collection('settings').doc('system').update({
          service_status: 'offline'
        });
      } catch (e) {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('❌ Service startup failed:', error.message);
    process.exit(1);
  }
}

startService();