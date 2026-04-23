# EduEase - Full Stack Operational Guide

This guide covers the complete setup, deployment, and integration of the EduEase platform using the **Secure Relay Architecture**.

---

## 🏗️ Architecture Overview
1. **Frontend**: React app that triggers events.
2. **Quiz Backend (Relay - Render)**: Validates requests and holds the secret API Key.
3. **Universal Mailer (Transport - Local)**: Standalone service that actually talks to SMTP servers.

---

## 📧 Step 1: Local SMTP Server Setup
Ensure your local `.env` file (inside `local_smtp_server/` or root) has these:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Your email provider credentials.
- `SECRET_KEY`: A strong secret (e.g., `my-super-secret-123`).
- `PORT`: 5000.

**Run it:** `node local_smtp_server/index.cjs`
**Expose it:** `ngrok http 5000` (Copy the `https://...` URL provided by ngrok).

---

## 🚀 Step 2: Quiz Backend Setup (Render)
Go to your Render Dashboard for the Quiz Backend and set these **Environment Variables**:
1. `MAIL_BACKEND_URL`: Your **ngrok URL** from Step 1.
2. `MAIL_SERVICE_API_KEY`: Must match the `SECRET_KEY` from Step 1.
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
| `MAIL_BACKEND_URL` | Render | Tells Render where your local ngrok server is. |
| `MAIL_SERVICE_API_KEY` | Render | The password Render uses to talk to your local server. |
| `SECRET_KEY` | Local | The password your local server expects from Render. |
| `SMTP_...` | Local | Your actual email account details. |