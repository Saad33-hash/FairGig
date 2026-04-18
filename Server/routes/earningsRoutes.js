const path = require('path');
const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { createShift, getShifts, updateShift, deleteShift, csvImport } = require('../controllers/earningsController');
const { uploadScreenshot, getShiftScreenshot } = require('../controllers/screenshotController');

const router = express.Router();

// CSV — memory storage, parse directly
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Screenshot — disk storage under uploads/screenshots/
const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'screenshots'));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authMiddleware);
router.use(requireRole('worker'));

router.post('/shifts/csv-import', csvUpload.single('file'), csvImport);
router.post('/shifts', createShift);
router.get('/shifts', getShifts);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

router.post('/shifts/:shiftId/screenshot', screenshotUpload.single('screenshot'), uploadScreenshot);
router.get('/shifts/:shiftId/screenshot', getShiftScreenshot);

module.exports = router;
