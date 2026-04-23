const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function to send FCM Push Notifications
 * Inputs: fcmToken, title, body, link
 */
exports.sendPushNotification = onRequest({ cors: true }, async (req, res) => {
  const { fcmToken, title, body, link } = req.body;

  if (!fcmToken || !title || !body) {
    res.status(400).send({ error: "Missing required fields: fcmToken, title, body" });
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: fcmToken,
    data: {
      link: link || "",
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).send({ error: error.message });
  }
});