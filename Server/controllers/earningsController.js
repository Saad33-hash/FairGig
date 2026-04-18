const { parse } = require('csv-parse');
const http = require('http');
const Shift = require('../models/Shift');

const ANOMALY_URL = process.env.ANOMALY_SERVICE_URL || 'http://localhost:8000';

async function fetchAnomalies(workerId, shifts) {
  const payload = JSON.stringify({
    worker_id: workerId,
    shifts: shifts.map((s) => ({
      date:                 s.date.toISOString().split('T')[0],
      platform:             s.platform,
      gross_earned:         s.grossEarned,
      platform_deductions:  s.platformDeductions,
      net_received:         s.netReceived,
      hours_worked:         s.hoursWorked,
    })),
  });

  return new Promise((resolve) => {
    const req = http.request(`${ANOMALY_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

const VALID_PLATFORMS = ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'];
const VALID_CATEGORIES = ['ride-hailing', 'food-delivery', 'freelance', 'domestic'];

const validateShiftFields = ({ platform, date, hoursWorked, grossEarned, platformDeductions, city, category }) => {
  if (!platform || !VALID_PLATFORMS.includes(platform)) return 'Invalid platform';
  if (!date || isNaN(new Date(date))) return 'Invalid date';
  if (hoursWorked == null || isNaN(hoursWorked) || Number(hoursWorked) < 0) return 'Invalid hours worked';
  if (grossEarned == null || isNaN(grossEarned) || Number(grossEarned) < 0) return 'Invalid gross earned';
  if (platformDeductions == null || isNaN(platformDeductions) || Number(platformDeductions) < 0) return 'Invalid platform deductions';
  if (!city || !city.trim()) return 'City is required';
  if (!category || !VALID_CATEGORIES.includes(category)) return 'Invalid category';
  return null;
};

const buildShiftDoc = (fields, workerId) => ({
  workerId,
  platform: fields.platform,
  date: new Date(fields.date),
  hoursWorked: Number(fields.hoursWorked),
  grossEarned: Number(fields.grossEarned),
  platformDeductions: Number(fields.platformDeductions),
  netReceived: Number(fields.grossEarned) - Number(fields.platformDeductions),
  city: fields.city.trim(),
  category: fields.category,
});

// POST /api/earnings/shifts
const createShift = async (req, res) => {
  try {
    const error = validateShiftFields(req.body);
    if (error) return res.status(400).json({ message: error });

    const shift = await Shift.create(buildShiftDoc(req.body, req.user.id));
    return res.status(201).json({ shift });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/earnings/shifts
const getShifts = async (req, res) => {
  try {
    const { from, to, platform, page = 1, limit = 20 } = req.query;

    const filter = { workerId: req.user.id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    if (platform && VALID_PLATFORMS.includes(platform)) {
      filter.platform = platform;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [shifts, total] = await Promise.all([
      Shift.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Shift.countDocuments(filter),
    ]);

    // Call anomaly service with all shifts for this worker (non-blocking — fails silently)
    const allShifts = await Shift.find({ workerId: req.user.id });
    const anomalyResult = await fetchAnomalies(req.user.id, allShifts);

    return res.json({
      shifts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      anomalies: anomalyResult?.anomalies ?? [],
      anomalySummary: anomalyResult?.summary ?? null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// PUT /api/earnings/shifts/:id
const updateShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, workerId: req.user.id });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (shift.verificationStatus !== 'unsubmitted') {
      return res.status(400).json({ message: 'Cannot edit a shift that has been submitted for verification' });
    }

    const error = validateShiftFields({ ...shift.toObject(), ...req.body });
    if (error) return res.status(400).json({ message: error });

    const updates = buildShiftDoc({ ...shift.toObject(), ...req.body }, req.user.id);
    Object.assign(shift, updates);
    await shift.save();

    return res.json({ shift });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// DELETE /api/earnings/shifts/:id
const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, workerId: req.user.id });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (shift.verificationStatus === 'verified') {
      return res.status(400).json({ message: 'Cannot delete a verified shift' });
    }

    await shift.deleteOne();
    return res.json({ message: 'Shift deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/earnings/shifts/csv-import
const csvImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

    const rows = [];
    const parseError = await new Promise((resolve) => {
      parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
        .on('data', (row) => rows.push(row))
        .on('error', resolve)
        .on('end', () => resolve(null));
    });

    if (parseError) return res.status(400).json({ message: 'Could not parse CSV: ' + parseError.message });
    if (rows.length === 0) return res.status(400).json({ message: 'CSV file is empty' });

    // Normalize column names: snake_case / Title Case → camelCase
    const normalizeRow = (row) => {
      const map = {
        hours_worked: 'hoursWorked', hoursworked: 'hoursWorked',
        'hours worked': 'hoursWorked',
        gross_earned: 'grossEarned', grossearned: 'grossEarned',
        'gross earned': 'grossEarned',
        platform_deductions: 'platformDeductions', platformdeductions: 'platformDeductions',
        'platform deductions': 'platformDeductions',
      };
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        const norm = map[k.trim().toLowerCase()] || k.trim();
        out[norm] = v;
      }
      return out;
    };

    const inserted = [];
    const failed = [];

    for (let i = 0; i < rows.length; i++) {
      const row = normalizeRow(rows[i]);
      const error = validateShiftFields(row);
      if (error) {
        failed.push({ row: i + 2, reason: error });
        continue;
      }
      try {
        const shift = await Shift.create(buildShiftDoc(row, req.user.id));
        inserted.push(shift._id);
      } catch (e) {
        failed.push({ row: i + 2, reason: e.message });
      }
    }

    return res.status(201).json({
      message: `Imported ${inserted.length} shift(s). ${failed.length} row(s) failed.`,
      inserted: inserted.length,
      failed,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { createShift, getShifts, updateShift, deleteShift, csvImport };
