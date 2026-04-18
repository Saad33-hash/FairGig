const express = require('express');
const passport = require('passport');
const authMiddleware = require('../middleware/authMiddleware');
const {
  signup,
  verifyEmail,
  login,
  oauthSuccess,
  getCurrentUser,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/me', authMiddleware, getCurrentUser);

router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth-failure' }),
  oauthSuccess
);

router.get('/oauth-failure', (_req, res) => {
  return res.redirect(`${process.env.CLIENT_URL}/login?oauth=failed`);
});

module.exports = router;