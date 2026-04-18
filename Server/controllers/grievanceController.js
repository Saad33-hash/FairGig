const Grievance = require('../models/Grievance');

const VALID_PLATFORMS  = ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'];
const VALID_CATEGORIES = ['commission-change', 'deactivation', 'payment-delay', 'other'];
const VALID_STATUSES   = ['open', 'escalated', 'resolved'];

// POST /api/grievances
const createGrievance = async (req, res) => {
  try {
    const { platform, category, description } = req.body;

    if (!platform || !VALID_PLATFORMS.includes(platform))
      return res.status(400).json({ message: 'Invalid platform' });
    if (!category || !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ message: 'Invalid category' });
    if (!description || !description.trim())
      return res.status(400).json({ message: 'Description is required' });

    const grievance = await Grievance.create({
      workerId:    req.user?.id ?? null,
      platform,
      category,
      description: description.trim(),
    });

    return res.status(201).json({ grievance });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/grievances
const listGrievances = async (req, res) => {
  try {
    const { platform, category, status, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (platform && VALID_PLATFORMS.includes(platform))   filter.platform = platform;
    if (category && VALID_CATEGORIES.includes(category))  filter.category = category;
    if (status   && VALID_STATUSES.includes(status))      filter.status   = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [grievances, total] = await Promise.all([
      Grievance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('workerId', 'firstName lastName city category'),
      Grievance.countDocuments(filter),
    ]);

    return res.json({ grievances, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// PUT /api/grievances/:id/tag  (advocate only)
const tagGrievance = async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags must be an array' });

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { tags },
      { new: true }
    );
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    return res.json({ grievance });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// PUT /api/grievances/:id/cluster  (advocate only)
const clusterGrievance = async (req, res) => {
  try {
    const { clusterGroup } = req.body;
    if (!clusterGroup) return res.status(400).json({ message: 'clusterGroup is required' });

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { clusterGroup },
      { new: true }
    );
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    return res.json({ grievance });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// PUT /api/grievances/:id/status  (advocate only)
const updateStatus = async (req, res) => {
  try {
    const { status, advocateNote } = req.body;
    if (!status || !VALID_STATUSES.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { status, advocateId: req.user.id, advocateNote: advocateNote || '' },
      { new: true }
    );
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    return res.json({ grievance });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { createGrievance, listGrievances, tagGrievance, clusterGrievance, updateStatus };
