const authService = require('../services/auth.service');
const googleAuthService = require('../services/googleAuth.service');
const { getAllGoogleUsers, updateUserRole, findUserById } = require('../models/user.model');
const { pool } = require('../config/database');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

// ─── Validation Rules ─────────────────────────────────────
const loginValidation = [
  body('identifier').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

// ─── Controllers ──────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const data = await authService.login(identifier, password, ip, userAgent);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const tokens = await authService.refreshTokens(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email, process.env.APP_URL);
    // Always respond with success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully. Please sign in again.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── Google OAuth Controllers ─────────────────────────────
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await googleAuthService.googleLogin(credential, ip, userAgent);
    res.status(200).json({ success: true, message: 'Google login successful', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getGoogleUsers = async (req, res, next) => {
  try {
    const users = await getAllGoogleUsers();
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required.' });
    }

    // Protect: cannot change the designated admin Google email's role
    const ADMIN_EMAIL = process.env.ADMIN_GOOGLE_EMAIL;
    const [targetRows] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (!targetRows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (targetRows[0].email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Cannot change the role of the designated admin account.' });
    }

    // Validate roleId exists (and is not admin role = 1, since admin is reserved for designated email)
    const [roleRows] = await pool.query("SELECT id, name FROM roles WHERE id = ?", [roleId]);
    if (!roleRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    if (roleRows[0].name === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot assign admin role to other users.' });
    }

    await updateUserRole(userId, roleId);
    res.status(200).json({ success: true, message: 'Role assigned successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  googleLogin,
  getGoogleUsers,
  assignRole,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
};

