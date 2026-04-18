const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { getVerifierQueue, reviewScreenshot } = require('../controllers/screenshotController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('verifier'));

router.get('/queue', getVerifierQueue);
router.post('/screenshots/:id/review', reviewScreenshot);

module.exports = router;
