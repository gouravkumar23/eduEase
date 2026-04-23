# EduEase - Technical Documentation

EduEase is a high-integrity, AI-powered examination proctoring platform. It uses a **Secure Relay Architecture** to combine the real-time capabilities of Firebase with the security of a dedicated Node.js relay for sensitive operations.

---

## 1. Detailed System Architecture

The system is built on a four-tier architecture designed for scalability and security:

### A. Client Tier (React 18 + Vite)
- **State Management**: React Context API (`AuthContext`) for global session and user state.
- **Routing**: React Router v6 with a **Session Guard** that monitors `activeSessionId` in real-time to prevent concurrent logins.
- **Proctoring Engine**: A custom hook-based system (`useProctoring`) that interfaces with browser APIs and `face-api.js`.

### B. Data & Auth Tier (Firebase)
- **Firestore**: NoSQL database handling real-time synchronization for exam attempts, room chats, and system settings.
- **Firebase Auth**: Primary identity provider.
- **Cloud Messaging (FCM)**: Handles push notifications via service workers.

### C. Relay Tier (Node.js / Express)
- **Quiz Backend**: Acts as a secure bridge. It holds the Firebase Admin SDK to send FCM messages and relays email requests to the transport layer.
- **Security**: Validates requests before communicating with external SMTP or FCM servers.

### D. Transport & AI Tier
- **Universal Mailer**: A local Node.js service (exposed via ngrok) that handles actual SMTP communication.
- **Google Gemini**: Integrated via the `@google/generative-ai` SDK for question generation and the AI Learning Coach.
- **Cloudinary**: Used for high-speed storage of proctoring evidence and study materials.

---

## 2. Module-Wise Explanation

### Authentication & Security Module
- **Session Locking**: Every login generates a unique `sessionId`. A Firestore listener on the client forces an immediate logout if the ID in the database changes (Single Device Enforcement).
- **OTP Verification**: Implements a custom 6-digit OTP system. Codes are hashed using SHA-256 before storage in Firestore.
- **Role Hierarchy**: Strictly enforced via `AuthContext`. Roles include `student`, `faculty` (requires admin approval), and `admin`.

### AI Proctoring Module
- **Visual Analysis**: `CameraProctor` uses `tinyFaceDetector` to monitor for `no_face` or `multiple_faces`.
- **Audio Analysis**: Uses the Web Audio API `AnalyserNode` to detect persistent noise levels above a configurable decibel threshold.
- **Behavioral Tracking**: Monitors `visibilitychange` (tab switching), `fullscreenchange`, and window dimension deltas (DevTools detection).
- **Evidence Capture**: Automatically captures snapshots during violations, uploads them to Cloudinary, and logs them to the `violations` collection.

### AI Learning Hub Module
- **Context-Aware Coaching**: The `AILearningHub` feeds the student's specific exam history (questions, their answers, and correct answers) into Gemini's system prompt.
- **Multi-Source Knowledge**: Students can attach PDFs or text files. The system extracts text using `pdfjs-dist` and adds it to the AI's active context.
- **Voice Integration**: Uses `SpeechSynthesis` for the coach's voice and `SpeechRecognition` for student queries.

### Exam Management Module
- **AI Generation**: Converts study materials into structured JSON MCQs using Gemini 2.0 Flash.
- **Dynamic Allocation**: Faculty defines a distribution (e.g., 5 Easy, 3 Medium, 2 Hard). The system randomly picks questions from the bank for each student attempt.
- **Live Monitoring**: A real-time dashboard for faculty showing student snapshots, noise levels, and suspicion scores.

---

## 3. Data Flow

### Exam Attempt Flow
1. **Initialization**: Student clicks "Start" -> `useExams` creates an `attempt` doc and multiple `allocation` docs (one per question).
2. **Active Session**: Student answers -> `ExamInterface` performs a debounced write to the specific `allocation` doc.
3. **Proctoring Event**: Violation detected -> `useProctoring` triggers a snapshot -> Uploads to Cloudinary -> Writes to `violations` collection -> Increments `suspicion_score` in the `attempt` doc.
4. **Submission**: Manual or Auto-submit -> `useExams` calculates the score based on `allocation` data and updates the `attempt` status.

### Notification Flow
1. **Event**: (e.g., Exam Approved) -> Frontend calls `notifyEvent`.
2. **Relay**: `notifyEvent` sends a POST request to the **Quiz Backend (Render)**.
3. **Dispatch**: 
   - Backend sends **FCM Push** directly to the student's device.
   - Backend relays **Email Request** to the **Universal Mailer (Local)**.
4. **Delivery**: Universal Mailer talks to the SMTP server to deliver the branded HTML email.

---

## 4. Functional Capabilities

- **Automated Integrity**: Reaching a violation threshold (default 3) triggers an irreversible `AUTO_SUBMITTED` state.
- **Watermarked Interface**: A dynamic, low-opacity overlay containing student details and remaining time to prevent screen photography/leaks.
- **Round-Robin AI**: Supports multiple Gemini API keys in Admin Settings to prevent rate-limiting during bulk quiz generation.
- **Real-time Classroom**: Private rooms with faculty-controlled chat (Lock/Unlock) and bulk member assignment by Year/Section.

---

## 5. System Limitations

- **Client-Side Grading**: MCQ grading logic currently resides in the `handleSubmitExam` function on the client. While efficient, it is theoretically susceptible to client-side manipulation before the final write.
- **Hardware Dependency**: Proctoring requires a functional camera and microphone; the system cannot currently fallback to a "non-proctored" mode if hardware fails mid-exam.
- **Local SMTP Relay**: The email system depends on a local server being active and exposed via ngrok. If the local service is offline, emails will fail (though in-app notifications will persist).
- **Identity Verification**: The AI detects the *presence* of a face but does not currently perform biometric 1:1 matching against a profile photo to verify the student's identity.

---
*Documentation updated based on Build v0.3 codebase.*