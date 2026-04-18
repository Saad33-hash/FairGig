const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { workerSummary, cityMedian } = require('../controllers/analyticsController');

router.use(authMiddleware);

router.get('/worker/summary',     requireRole('worker'), workerSummary);
router.get('/worker/city-median', requireRole('worker'), cityMedian);

module.exports = router;
