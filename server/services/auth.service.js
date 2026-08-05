const {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  logLogin,
  setPasswordResetToken,
  findUserByResetToken,
  updatePassword,
} = require('../models/user.model');
const { comparePassword, generateResetToken, hashPassword } = require('../utils/password.util');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');
const { sendPasswordResetEmail } = require('../utils/email.util');

const login = async (identifier, password, ip, userAgent) => {
  // Find by email or username
  let user = await findUserByEmail(identifier);
  if (!user) user = await findUserByUsername(identifier);

  if (!user) {
    throw { status: 401, message: 'Invalid credentials.' };
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    await logLogin(user.id, ip, userAgent, 'failed');
    throw { status: 401, message: 'Invalid credentials.' };
  }

  await logLogin(user.id, ip, userAgent, 'success');

  const payload = { id: user.id, role: user.role, role_id: user.role_id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token (expires in 7 days)
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storeRefreshToken(user.id, refreshToken, refreshExpiry);

  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    profilePhoto: user.profile_photo,
    role: user.role,
    role_id: user.role_id,
  };

  return { user: userResponse, accessToken, refreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
};

const refreshTokens = async (token) => {
  const stored = await findRefreshToken(token);
  if (!stored) throw { status: 401, message: 'Invalid or expired refresh token.' };

  const decoded = verifyRefreshToken(token);
  const user = await findUserById(decoded.id);
  if (!user || !user.is_active) throw { status: 401, message: 'User not found or deactivated.' };

  // Rotate refresh token
  await revokeRefreshToken(token);

  const payload = { id: user.id, role: user.role, role_id: user.role_id };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storeRefreshToken(user.id, newRefreshToken, refreshExpiry);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const forgotPassword = async (email, appUrl) => {
  const user = await findUserByEmail(email);
  if (!user) {
    // Return silently to prevent user enumeration
    return;
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES) || 3600000);

  await setPasswordResetToken(user.id, resetToken, expiresAt);

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, user.first_name, resetToken, resetUrl);
};

const resetPassword = async (token, newPassword) => {
  const user = await findUserByResetToken(token);
  if (!user) throw { status: 400, message: 'Invalid or expired reset token.' };

  const hashed = await hashPassword(newPassword);
  await updatePassword(user.id, hashed);
  await revokeAllUserTokens(user.id);
};

const getProfile = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw { status: 404, message: 'User not found.' };
  return user;
};

module.exports = { login, logout, refreshTokens, forgotPassword, resetPassword, getProfile };
