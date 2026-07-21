async function sendBackupEmail({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured on Vercel.');

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

  return parsed;
}

module.exports = { sendBackupEmail };
