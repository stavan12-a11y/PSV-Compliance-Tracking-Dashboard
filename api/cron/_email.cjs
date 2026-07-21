async function sendViaResend({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.BACKUP_EMAIL_FROM || 'PSV Dashboard <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments: attachments.map(({ filename, buffer }) => ({
        filename,
        content: buffer.toString('base64'),
      })),
    }),
  });

  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { raw: body };
  }

  if (!res.ok) {
    const message =
      parsed?.message || parsed?.error || body || `Resend HTTP ${res.status}`;
    throw new Error(`Email failed: ${message}`);
  }

  return { provider: 'resend', ...parsed };
}

async function sendViaSmtp({ to, subject, html, attachments }) {
  const nodemailer = require('nodemailer');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS are required for SMTP email.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const from =
    process.env.SMTP_FROM ||
    process.env.BACKUP_EMAIL_FROM ||
    `PSV Dashboard <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments: attachments.map(({ filename, buffer }) => ({
      filename,
      content: buffer,
    })),
  });

  return { provider: 'smtp', messageId: info.messageId };
}

async function sendBackupEmail({ to, subject, html, attachments }) {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, attachments });
  }
  if (process.env.SMTP_HOST) {
    return sendViaSmtp({ to, subject, html, attachments });
  }
  throw new Error(
    'No email sender configured. Set SMTP_HOST + SMTP_USER + SMTP_PASS (Gmail/Outlook) or RESEND_API_KEY.',
  );
}

module.exports = { sendBackupEmail };
