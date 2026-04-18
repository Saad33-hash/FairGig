const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
  createGrievance, listGrievances,
  tagGrievance, clusterGrievance, updateStatus,
} = require('../controllers/grievanceController');

// All routes require login
router.use(authMiddleware);

router.post('/',   createGrievance);   // worker posts complaint
router.get('/',    listGrievances);    // all roles can view

// Advocate-only moderation
router.put('/:id/tag',     requireRole('advocate'), tagGrievance);
router.put('/:id/cluster', requireRole('advocate'), clusterGrievance);
router.put('/:id/status',  requireRole('advocate'), updateStatus);

module.exports = router;
