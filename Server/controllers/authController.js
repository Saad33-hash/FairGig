const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const VALID_ROLES = ['worker', 'verifier', 'advocate'];
const VALID_CATEGORIES = ['ride-hailing', 'food-delivery', 'freelance', 'domestic'];

const buildAvatarUrl = (firstName, lastName = '') => {
  const seed = encodeURIComponent(`${firstName || 'User'} ${lastName || ''}`.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&radius=50&backgroundColor=111827,0f766e&textColor=ffffff`;
};

const createJwt = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const getServerBaseUrl = () =>
  process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

const sendVerificationEmail = async ({ email, firstName, token }) => {
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.EMAIL_FROM
  ) {
    console.warn('Email credentials are incomplete. Verification email not sent.');
    return;
  }

  const verifyLink = `${getServerBaseUrl()}/api/auth/verify-email?token=${token}`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your FairGig account',
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.5; color:#1f2937;">
        <h2 style="margin-bottom:8px;">Verify your email</h2>
        <p>Hi ${firstName},</p>
        <p>Click the button below to verify your FairGig account and log in.</p>
        <a href="${verifyLink}" style="display:inline-block; margin-top:12px; background:#111827; color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:8px;">Verify Email</a>
        <p style="margin-top:16px; font-size:12px; color:#6b7280;">This link expires in 24 hours.</p>
      </div>
    `,
  });
};

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  city: user.city,
  category: user.category,
});

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, city, category } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    if (role === 'worker') {
      if (!city || !city.trim()) {
        return res.status(400).json({ message: 'City is required for workers' });
      }
      if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Please select your work category' });
      }
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: buildAvatarUrl(firstName.trim(), lastName.trim()),
      provider: 'local',
      role,
      status: role === 'worker' ? 'approved' : 'pending',
      city: city ? city.trim() : '',
      category: role === 'worker' ? category : '',
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    let emailSent = true;
    try {
      await sendVerificationEmail({ email: user.email, firstName: user.firstName, token: rawToken });
    } catch (emailError) {
      emailSent = false;
      console.error('Verification email failed:', emailError.message);
    }

    return res.status(201).json({
      message: emailSent
        ? 'Signup successful. Please verify your email before login.'
        : 'Signup successful, but verification email could not be sent.',
      emailSent,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect(`${process.env.CLIENT_URL}/login?verified=invalid`);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?verified=invalid`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    return res.redirect(`${process.env.CLIENT_URL}/login?verified=success`);
  } catch (_error) {
    return res.redirect(`${process.env.CLIENT_URL}/login?verified=invalid`);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account was not approved. Please contact support.', status: 'rejected' });
    }

    const token        = createJwt(user);
    const refreshToken = createRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const oauthSuccess = async (req, res) => {
  try {
    const profile = req.user;
    if (!profile || !profile.email) {
      return res.redirect(`${process.env.CLIENT_URL}/login?oauth=failed`);
    }

    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email.toLowerCase(),
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: profile.avatar || buildAvatarUrl(profile.firstName, profile.lastName),
        role: 'worker',
        isVerified: true,
      });
    } else {
      user.provider = profile.provider;
      user.providerId = profile.providerId;
      user.avatar = profile.avatar || user.avatar || buildAvatarUrl(user.firstName, user.lastName);
      user.isVerified = true;
      await user.save();
    }

    const token        = createJwt(user);
    const refreshToken = createRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    return res.redirect(
      `${process.env.CLIENT_URL}/oauth/callback?token=${encodeURIComponent(token)}`
    );
  } catch (_error) {
    return res.redirect(`${process.env.CLIENT_URL}/login?oauth=failed`);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verificationToken -verificationTokenExpiresAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
      );
    } catch {
      return res.status(401).json({ message: 'Refresh token expired or invalid' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccessToken  = createJwt(user);
    const newRefreshToken = createRefreshToken(user);
    setRefreshCookie(res, newRefreshToken);

    return res.json({ token: newAccessToken });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

const logoutUser = (_req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
  return res.json({ message: 'Logged out' });
};

module.exports = {
  signup,
  verifyEmail,
  login,
  oauthSuccess,
  getCurrentUser,
  refresh,
  logoutUser,
};
