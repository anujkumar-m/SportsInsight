const { pool } = require('../config/database');

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
            u.phone, u.profile_photo, u.is_active, u.password_reset_token,
            u.password_reset_expires, r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ? AND u.is_active = TRUE`,
    [email]
  );
  return rows[0] || null;
};

const findUserByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
            u.phone, u.profile_photo, u.is_active, r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.username = ? AND u.is_active = TRUE`,
    [username]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name,
            u.phone, u.profile_photo, u.is_active, u.created_at,
            r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const storeRefreshToken = async (userId, token, expiresAt) => {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

const findRefreshToken = async (token) => {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = FALSE AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (token) => {
  await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?', [token]);
};

const revokeAllUserTokens = async (userId) => {
  await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?', [userId]);
};

const logLogin = async (userId, ip, userAgent, status = 'success') => {
  await pool.query(
    'INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)',
    [userId, ip, userAgent, status]
  );
  if (status === 'success') {
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
  }
};

const setPasswordResetToken = async (userId, token, expiresAt) => {
  await pool.query(
    'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
    [token, expiresAt, userId]
  );
};

const findUserByResetToken = async (token) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.password_reset_token = ? AND u.password_reset_expires > NOW()`,
    [token]
  );
  return rows[0] || null;
};

const updatePassword = async (userId, passwordHash) => {
  await pool.query(
    'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
    [passwordHash, userId]
  );
};

module.exports = {
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
};
