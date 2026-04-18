const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { generateCertificate } = require('../controllers/certificateController');

router.use(authMiddleware);
router.get('/', requireRole('worker'), generateCertificate);

module.exports = router;
