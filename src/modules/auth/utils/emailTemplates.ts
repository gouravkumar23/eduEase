/**
 * EduEase Email Template Generator
 * Provides responsive, branded HTML templates for system notifications.
 */

const BRAND_COLOR = '#4f46e5'; // Indigo 600
const GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

const baseLayout = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: ${GRADIENT}; padding: 40px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    .content { padding: 40px 30px; }
    .footer { padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #f1f5f9; }
    .button { display: inline-block; padding: 16px 32px; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 700; margin-top: 25px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
    .otp-container { background: #000000; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
    .otp { font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #ffffff; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .alert { padding: 15px; border-radius: 12px; background-color: #fff1f2; border: 1px solid #fecdd3; color: #be123c; margin-bottom: 20px; }
    .fallback-link { font-size: 11px; color: #94a3b8; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 10px; display: block; text-decoration: none; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-right: 4px; margin-bottom: 4px; }
    .badge-warn { background-color: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EduEase</h1>
      <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">${title}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} EduEase Integrity Engine. All rights reserved.<br>
      This is an automated system message, please do not reply.
    </div>
  </div>
</body>
</html>
`;

export const templates = {
  otp: (code: string, link?: string) => baseLayout(`
    <h2 style="margin-top: 0; text-align: center; color: #1e293b; font-size: 22px;">Verify Your Account</h2>
    <p style="text-align: center; color: #64748b; font-size: 15px;">Please use the verification code below to complete your sign-in process. This code is valid for 15 minutes.</p>
    
    <div class="otp-container">
      <div class="otp">${code}</div>
    </div>
    <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: -15px; font-weight: 600; text-transform: uppercase;">Select and copy the code above</p>

    ${link ? `
      <div style="text-align: center; margin-top: 35px;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">Or verify instantly by clicking the button below:</p>
        <a href="${link}" class="button">Verify via Link</a>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">If button not working, use this link:</p>
          <a href="${link}" class="fallback-link">${link}</a>
        </div>
      </div>
    ` : ''}

    <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; text-align: center; line-height: 1.5;">
      If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
    </p>
  `, 'Security Verification'),

  examAssigned: (name: string, examTitle: string, examId: string) => baseLayout(`
    <h2 style="margin-top: 0;">New Assessment Assigned</h2>
    <p>Hello ${name},</p>
    <p>A new examination <strong>"${examTitle}"</strong> has been assigned to you. Please review the schedule and instructions before the start time.</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Assessment:</strong> ${examTitle}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Platform:</strong> EduEase AI Proctor</p>
    </div>
    <a href="${window.location.origin}/#/exam-details/${examId}" class="button">View Exam Details</a>
  `, 'Examination Notification'),

  roomAnnouncement: (roomName: string, message: string, roomId: string) => baseLayout(`
    <h2 style="margin-top: 0;">New Announcement</h2>
    <p>There is a new update in the <strong>${roomName}</strong> exam room:</p>
    <div style="border-left: 4px solid ${BRAND_COLOR}; padding-left: 20px; font-style: italic; color: #475569; margin: 25px 0;">
      "${message}"
    </div>
    <a href="${window.location.origin}/#/room/${roomId}" class="button">Open Exam Room</a>
  `, 'Classroom Update'),

  violationSummary: (name: string, examName: string, violationCount: number) => baseLayout(`
    <div class="alert">
      <strong>Integrity Report:</strong> Multiple violations detected.
    </div>
    <p>Hello ${name},</p>
    <p>Our AI Proctoring system recorded <strong>${violationCount} violations</strong> during your attempt for <strong>"${examName}"</strong>.</p>
    <p>Common violations include tab switching, face detection failure, or restricted keyboard actions. These logs have been shared with your faculty for review.</p>
    <a href="${window.location.origin}/#/student" class="button">View My Dashboard</a>
  `, 'Proctoring Integrity Summary'),

  taskAssigned: (name: string, taskTitle: string, deadline: string) => baseLayout(`
    <h2 style="margin-top: 0;">New Faculty Task</h2>
    <p>Hello Prof. ${name},</p>
    <p>The administrator has assigned you a new assessment task: <strong>"${taskTitle}"</strong>.</p>
    <p>Please prepare the question bank and distribution settings before the deadline.</p>
    <div style="background: #fefce8; border: 1px solid #fef08a; padding: 15px; border-radius: 12px; color: #854d0e; font-weight: 700; text-align: center;">
      Deadline: ${deadline}
    </div>
    <a href="${window.location.origin}/#/faculty" class="button">Prepare Questions</a>
  `, 'Administrative Assignment'),

  violationSummaryReport: (examTitle: string, tableHtml: string) => baseLayout(`
    <h2 style="margin-top: 0;">Integrity Summary Report</h2>
    <p>The examination <strong>"${examTitle}"</strong> has been marked as completed. Below is the summary of proctoring violations recorded during the session.</p>
    ${tableHtml}
    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">You can view detailed photographic evidence and logs in your faculty dashboard.</p>
    <a href="${window.location.origin}/#/faculty" class="button">Open Dashboard</a>
  `, 'Assessment Integrity Report'),

  profileChange: (name: string) => baseLayout(`
    <h2 style="margin-top: 0;">Profile Updated</h2>
    <p>Hello ${name},</p>
    <p>Your EduEase profile details were recently updated. If you did not perform this action, please secure your account immediately.</p>
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 12px; color: #0369a1; font-size: 14px;">
      <strong>Action:</strong> Profile Information Update<br>
      <strong>Status:</strong> Successfully Applied
    </div>
    <a href="${window.location.origin}/#/student" class="button">View My Profile</a>
  `, 'Account Security Notification')
};