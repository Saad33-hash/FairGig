const Shift = require('../models/Shift');
const User  = require('../models/User');

function fmt(n) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
}

function renderHTML({ worker, shifts, from, to }) {
  const totalGross       = shifts.reduce((s, sh) => s + sh.grossEarned,        0);
  const totalDeductions  = shifts.reduce((s, sh) => s + sh.platformDeductions, 0);
  const totalNet         = shifts.reduce((s, sh) => s + sh.netReceived,         0);
  const generatedAt      = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  const workerName       = [worker.firstName, worker.lastName].filter(Boolean).join(' ');
  const category         = worker.category?.replace('-', ' ') ?? '—';

  const rows = shifts.map((s) => `
    <tr>
      <td>${fmtDate(s.date)}</td>
      <td>${s.platform}</td>
      <td>${s.city}</td>
      <td>${s.hoursWorked}h</td>
      <td class="num">PKR ${fmt(s.grossEarned)}</td>
      <td class="num ded">PKR ${fmt(s.platformDeductions)}</td>
      <td class="num net">PKR ${fmt(s.netReceived)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Income Certificate — ${workerName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      max-width: 800px;
      margin: 40px auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 48px 56px;
    }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; }
    .brand  { display: flex; align-items: center; gap: 10px; }
    .brand-logo { width: 28px; height: 28px; display: block; flex: 0 0 28px; }
    .brand-name { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -.3px; }
    .brand-sub  { font-size: 11px; color: #94a3b8; }
    .badge {
      padding: 6px 14px; border-radius: 999px;
      border: 1px solid #bfdbfe; background: #eff6ff;
      font-size: 11px; font-weight: 600; color: #1d4ed8;
      letter-spacing: .04em; text-transform: uppercase;
    }

    /* Title */
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 28px; }

    /* Info grid */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin-bottom: 28px;
      padding: 20px 24px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
    }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
    .info-value { font-size: 13px; font-weight: 600; color: #0f172a; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
    th {
      padding: 10px 14px; text-align: left;
      font-size: 10px; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: .06em;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .num { text-align: right; }
    .ded { color: #dc2626; }
    .net { color: #2563eb; font-weight: 700; }

    /* Totals */
    .totals {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin-bottom: 32px;
    }
    .total-card {
      padding: 14px 18px; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    .total-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
    .total-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .total-value.blue { color: #2563eb; }

    /* Footer */
    .divider { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px; }
    .footer { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .footer strong { color: #64748b; }
    .generated { font-size: 11px; color: #cbd5e1; margin-top: 10px; }

    @media print {
      body { background: #fff; }
      .page { margin: 0; border: none; border-radius: 0; padding: 32px 40px; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <div class="brand">
        <svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-label="FairGig logo" role="img">
          <defs>
            <linearGradient id="fg-bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#2563EB"/>
              <stop offset="1" stop-color="#0B1E3D"/>
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#fg-bg)"/>
          <circle cx="32" cy="32" r="19" fill="rgba(255,255,255,0.12)"/>
          <path d="M20 23.5h17.8c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8H25.5v5.2h9.4c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8h-9.4v8.7c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8V25.3c0-1 .8-1.8 1.8-1.8Z" fill="#FFFFFF"/>
          <path d="M39.5 22.5c1 0 1.8.8 1.8 1.8v15.4c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8V24.3c0-1 .8-1.8 1.8-1.8Z" fill="#DBEAFE"/>
        </svg>
        <div>
          <div class="brand-name">FairGig</div>
          <div class="brand-sub">Income &amp; Rights Platform</div>
        </div>
      </div>
      <span class="badge">Income Certificate</span>
    </div>

    <h1>Verified Income Summary</h1>
    <p class="subtitle">
      This certificate is based on worker-reported and verifier-confirmed earnings
      logged on the FairGig platform.
    </p>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Worker Name</span>
        <span class="info-value">${workerName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">City</span>
        <span class="info-value">${worker.city || '—'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Work Category</span>
        <span class="info-value" style="text-transform:capitalize">${category}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date Range</span>
        <span class="info-value">${fmtDate(from)} — ${fmtDate(to)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Verified Shifts</span>
        <span class="info-value">${shifts.length}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email</span>
        <span class="info-value">${worker.email}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Platform</th>
          <th>City</th>
          <th>Hours</th>
          <th class="num">Gross (PKR)</th>
          <th class="num">Deductions</th>
          <th class="num">Net (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:24px">No verified shifts in this date range.</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-card">
        <div class="total-label">Total Gross</div>
        <div class="total-value">PKR ${fmt(totalGross)}</div>
      </div>
      <div class="total-card">
        <div class="total-label">Total Deductions</div>
        <div class="total-value" style="color:#dc2626">PKR ${fmt(totalDeductions)}</div>
      </div>
      <div class="total-card">
        <div class="total-label">Total Net Received</div>
        <div class="total-value blue">PKR ${fmt(totalNet)}</div>
      </div>
    </div>

    <hr class="divider" />
    <p class="footer">
      <strong>Disclaimer:</strong> This income summary is based on worker-reported and
      verifier-confirmed earnings recorded on the FairGig platform. FairGig does not
      guarantee the accuracy of platform-reported figures and this document should be
      used as a supporting reference only.
    </p>
    <p class="generated">Generated on ${generatedAt} · FairGig Income &amp; Rights Platform</p>
  </div>
</body>
</html>`;
}

// GET /api/certificate?from=DATE&to=DATE
const generateCertificate = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from and to dates are required' });

    const fromDate = new Date(from);
    const toDate   = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    if (isNaN(fromDate) || isNaN(toDate)) return res.status(400).json({ message: 'Invalid date range' });
    if (fromDate > toDate) return res.status(400).json({ message: 'from must be before to' });

    const worker = await User.findById(req.user.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const shifts = await Shift.find({
      workerId:           req.user.id,
      verificationStatus: 'verified',
      date:               { $gte: fromDate, $lte: toDate },
    }).sort({ date: 1 });

    const html = renderHTML({ worker, shifts, from: fromDate, to: toDate });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { generateCertificate };
