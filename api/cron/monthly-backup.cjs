const { loadAppData } = require('./_db.cjs');
const { buildBackupWorkbook, todayISO } = require('./_backup-export.cjs');
const { sendBackupEmail } = require('./_email.cjs');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = req.headers.authorization;
  return header === `Bearer ${secret}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const to = process.env.BACKUP_EMAIL_TO?.trim();
  if (!to) {
    return json(res, 500, { error: 'BACKUP_EMAIL_TO is not configured on Vercel.' });
  }

  try {
    const { data, updatedAt } = await loadAppData();
    if (!data) {
      return json(res, 404, { error: 'No dashboard data found in the database.' });
    }

    const date = todayISO();
    const monthLabel = date.slice(0, 7);
    const xlsxFilename = `PSV-Dashboard-Backup_${monthLabel}.xlsx`;
    const jsonFilename = `PSV-Dashboard-Backup_${monthLabel}.json`;
    const generatedAt = new Date().toISOString();
    const xlsxBuffer = buildBackupWorkbook(data, generatedAt);
    const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    const psvCount = data.psvs?.length ?? 0;
    const equipmentCount = data.equipment?.length ?? 0;

    const emailResult = await sendBackupEmail({
      to,
      subject: `PSV Dashboard monthly backup — ${monthLabel}`,
      html: `
        <p>Your monthly PSV Tracking Dashboard backup is attached (<strong>2 files</strong>).</p>
        <ul>
          <li><strong>Excel (.xlsx)</strong> — readable reports with every PSV, history, notes, repairs, equipment, and locations</li>
          <li><strong>JSON (.json)</strong> — complete lossless copy you can re-import into the dashboard (Data → Import data)</li>
        </ul>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Equipment:</strong> ${equipmentCount}</li>
          <li><strong>PSVs:</strong> ${psvCount}</li>
          <li><strong>Last saved in cloud:</strong> ${updatedAt ?? 'unknown'}</li>
        </ul>
        <p>Store both files somewhere safe (OneDrive, shared drive, etc.).</p>
        <p style="color:#666;font-size:12px">Texas A&amp;M · Utilities &amp; Energy Services · PSV Compliance Dashboard</p>
      `,
      attachments: [
        { filename: xlsxFilename, buffer: xlsxBuffer },
        { filename: jsonFilename, buffer: jsonBuffer },
      ],
    });

    return json(res, 200, {
      ok: true,
      sentTo: to,
      files: [xlsxFilename, jsonFilename],
      psvCount,
      equipmentCount,
      emailId: emailResult?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backup failed';
    console.error('monthly-backup error:', message);
    return json(res, 500, { error: message });
  }
};
