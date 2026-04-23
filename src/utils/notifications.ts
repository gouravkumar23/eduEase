import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { templates } from './emailTemplates';

interface NotifyParams {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userIds: string[];
  emailPayload?: {
    subject?: string;
    html?: string;
  };
  link?: string;
}

export const getSystemSettings = async () => {
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
    return settingsSnap.exists() ? settingsSnap.data() : null;
  } catch (error) {
    return null;
  }
};

export const notifyEvent = async ({ 
  type, 
  title, 
  message, 
  userIds, 
  emailPayload, 
  link 
}: NotifyParams) => {
  const settings = await getSystemSettings();
  const quizBackendUrl = settings?.email_service_url;

  // Filter out any empty or invalid IDs to prevent Firebase errors
  const validUserIds = userIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

  for (const uid of validUserIds) {
    try {
      // 1. Save In-App Notification
      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        title,
        message,
        type,
        link: link || '',
        read: false,
        timestamp: serverTimestamp()
      });

      // 2. Fetch User Data
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) continue;
      
      const userData = userSnap.data();
      const fcmToken = userData.fcmToken;
      const email = userData.email;

      // 3. Send FCM Push
      if (fcmToken && quizBackendUrl) {
        fetch(`${quizBackendUrl}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: fcmToken,
            userId: uid,
            title,
            body: message,
            data: { link: link || '' }
          })
        }).catch(err => console.error('[FCM_FAIL]', err));
      }

      // 4. Send Email Relay
      if (email && emailPayload && quizBackendUrl) {
        fetch(`${quizBackendUrl}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: emailPayload.subject || title,
            html: emailPayload.html || message,
            text: message
          })
        }).catch(err => console.error('[EMAIL_RELAY_FAIL]', err));
      }

    } catch (error) {
      console.error(`Failed to notify user ${uid}:`, error);
    }
  }
};

export const generateAndSendViolationReport = async (examId: string) => {
  const settings = await getSystemSettings();
  const quizBackendUrl = settings?.email_service_url;
  if (!quizBackendUrl) return;

  try {
    const examSnap = await getDoc(doc(db, 'exams', examId));
    if (!examSnap.exists()) return;
    const examData = examSnap.data();

    const vQuery = query(collection(db, 'violations'), where('examId', '==', examId));
    const vSnap = await getDocs(vQuery);
    
    if (vSnap.empty) return;

    const studentMap: Record<string, { name: string, count: number, types: Set<string>, times: string[] }> = {};
    
    vSnap.docs.forEach(d => {
      const v = d.data();
      const sid = v.studentId;
      if (!studentMap[sid]) {
        studentMap[sid] = { name: v.studentName, count: 0, types: new Set(), times: [] };
      }
      studentMap[sid].count++;
      studentMap[sid].types.add(v.type.replace('_', ' '));
      studentMap[sid].times.push(v.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    });

    let tableRows = '';
    Object.values(studentMap).forEach(s => {
      const typeBadges = Array.from(s.types).map(t => `<span class="badge badge-warn">${t}</span>`).join('');
      const timeList = s.times.slice(0, 3).join(', ') + (s.times.length > 3 ? '...' : '');
      
      tableRows += `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td style="text-align: center;">${s.count}</td>
          <td>${typeBadges}</td>
          <td style="color: #64748b; font-size: 11px;">${timeList}</td>
        </tr>
      `;
    });

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th style="text-align: center;">Count</th>
            <th>Violation Types</th>
            <th>Timestamps</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    const recipients = new Set<string>();
    const facultySnap = await getDoc(doc(db, 'users', examData.faculty_id));
    if (facultySnap.exists()) recipients.add(facultySnap.data().email);

    const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQuery);
    adminSnap.docs.forEach(d => recipients.add(d.data().email));

    // Safety check: Don't send if no recipients found
    if (recipients.size === 0) {
      console.warn('[REPORT_SKIP] No recipients found for violation report.');
      return;
    }

    const emailHtml = templates.violationSummaryReport(examData.title, tableHtml);
    
    for (const email of recipients) {
      if (!email) continue;
      fetch(`${quizBackendUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `[REPORT] Violation Summary: ${examData.title}`,
          html: emailHtml,
          text: `Violation summary report for ${examData.title} is ready.`
        })
      }).catch(err => console.error('[REPORT_RELAY_FAIL]', err));
    }
  } catch (error) {
    console.error('Failed to generate violation report:', error);
  }
};