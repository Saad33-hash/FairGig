const path = require('path');
const fs = require('fs');
const Shift = require('../models/Shift');
const Screenshot = require('../models/Screenshot');

// POST /api/earnings/shifts/:shiftId/screenshot
const uploadScreenshot = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

    const shift = await Shift.findOne({ _id: req.params.shiftId, workerId: req.user.id });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (['pending', 'verified'].includes(shift.verificationStatus)) {
      return res.status(400).json({ message: 'Screenshot already submitted for this shift' });
    }

    // Delete old screenshot if re-uploading after a flagged/unverifiable review
    if (shift.screenshotId) {
      const old = await Screenshot.findById(shift.screenshotId);
      if (old) {
        const oldPath = path.join(__dirname, '..', 'uploads', old.filePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        await old.deleteOne();
      }
    }

    const filePath = path.join('screenshots', req.file.filename);

    const screenshot = await Screenshot.create({
      workerId: req.user.id,
      shiftId: shift._id,
      filePath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    shift.screenshotId = screenshot._id;
    shift.verificationStatus = 'pending';
    await shift.save();

    return res.status(201).json({ screenshot, shift });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/earnings/shifts/:shiftId/screenshot
const getShiftScreenshot = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.shiftId, workerId: req.user.id });
    if (!shift || !shift.screenshotId) {
      return res.status(404).json({ message: 'No screenshot found for this shift' });
    }

    const screenshot = await Screenshot.findById(shift.screenshotId);
    if (!screenshot) return res.status(404).json({ message: 'Screenshot not found' });

    return res.json({ screenshot });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/verifier/queue
const getVerifierQueue = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [screenshots, total] = await Promise.all([
      Screenshot.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('workerId', 'firstName lastName city category')
        .populate('shiftId', 'platform date hoursWorked grossEarned platformDeductions netReceived city category'),
      Screenshot.countDocuments({ status: 'pending' }),
    ]);

    return res.json({ screenshots, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/verifier/screenshots/:id/review
const reviewScreenshot = async (req, res) => {
  try {
    const { status, note } = req.body;
    const VALID = ['verified', 'flagged', 'unverifiable'];

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ message: 'Status must be verified, flagged, or unverifiable' });
    }

    const screenshot = await Screenshot.findById(req.params.id);
    if (!screenshot) return res.status(404).json({ message: 'Screenshot not found' });

    if (screenshot.status !== 'pending') {
      return res.status(400).json({ message: 'Screenshot has already been reviewed' });
    }

    screenshot.status = status;
    screenshot.verifierId = req.user.id;
    screenshot.verifierNote = note || '';
    screenshot.reviewedAt = new Date();
    await screenshot.save();

    await Shift.findByIdAndUpdate(screenshot.shiftId, { verificationStatus: status });

    return res.json({ screenshot });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { uploadScreenshot, getShiftScreenshot, getVerifierQueue, reviewScreenshot };
