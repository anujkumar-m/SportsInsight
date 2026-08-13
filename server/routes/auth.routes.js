const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/auth.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Google OAuth — public (token verified server-side)
router.post('/google', googleLogin);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin-only: Google user management
router.get('/google-users', authenticate, authorizeRoles('admin'), getGoogleUsers);
router.put('/assign-role', authenticate, authorizeRoles('admin'), assignRole);

module.exports = router;


