# EduEase - Full Stack Operational Guide

This guide covers the complete setup, deployment, and integration of the EduEase platform using the **Secure Relay Architecture** powered by **Qwerty Mailing Service**.

---

## 🏗️ Architecture Overview
1. **Frontend**: React app that triggers events.
2. **Quiz Backend (Relay - Render)**: Validates requests and holds the secret Qwerty API Key.
3. **Qwerty Mailing Service (Transport - Cloud)**: External service that handles high-deliverability email dispatch.

---

## 📧 Step 1: Mailing Service Configuration
Ensure your `.env` file (on Render or local relay) has this:
- `MAILING_SERVICE_API_KEY`: Your unique key provided by the Qwerty Mailing Service.
- `PORT`: 3001 (for the relay).

---

## 🚀 Step 2: Quiz Backend Setup (Render)
Go to your Render Dashboard for the Quiz Backend and set these **Environment Variables**:
1. `MAILING_SERVICE_API_KEY`: Your Qwerty API Key.
2. `FIREBASE_SERVICE_ACCOUNT`: The JSON string of your Firebase service account.
3. `PORT`: 3001.

---

## ⚙️ Step 3: App Configuration
1. Log in to EduEase as an **Admin**.
2. Go to **Settings**.
3. Set the **Quiz Backend URL** to your **Render URL** (e.g., `https://eduease-api.onrender.com`).
4. Click **Save**.
5. Use the **Test Relay** button to verify the entire chain works.

---

## 💻 Summary of Variables
| Variable | Location | Purpose |
| :--- | :--- | :--- |
| `MAILING_SERVICE_API_KEY` | Render / Local | The password used to authenticate with Qwerty. |
| `FIREBASE_SERVICE_ACCOUNT` | Render | Allows the relay to send FCM push notifications. |
| `VITE_API_URL` | Frontend | Points the frontend to your Render relay. |

---
*Note: Local SMTP setup is no longer required as the system now uses a cloud-based transport.*