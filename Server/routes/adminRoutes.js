const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { getPendingUsers, approveUser, rejectUser } = require('../controllers/adminController');

router.use(authMiddleware, requireRole('admin'));

router.get('/pending', getPendingUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);

module.exports = router;
