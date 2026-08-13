const { pool } = require('../config/database');

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
            u.phone, u.profile_photo, u.is_active, u.password_reset_token,
            u.password_reset_expires, u.google_id, u.auth_provider,
            r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?)) AND u.is_active = TRUE`,
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

const updateUserProfile = async (userId, { first_name, last_name, phone, profile_photo }) => {
  const fields = [];
  const params = [];
  if (first_name !== undefined) { fields.push('first_name = ?'); params.push(first_name); }
  if (last_name !== undefined) { fields.push('last_name = ?'); params.push(last_name); }
  if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
  if (profile_photo !== undefined) { fields.push('profile_photo = ?'); params.push(profile_photo); }

  if (fields.length === 0) return;
  params.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
};

const findUserByGoogleId = async (googleId) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name,
            u.phone, u.profile_photo, u.is_active, u.google_id, u.auth_provider,
            r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.google_id = ? AND u.is_active = TRUE`,
    [googleId]
  );
  return rows[0] || null;
};

const createGoogleUser = async (email, googleId, firstName, lastName, picture, roleId) => {
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '.') + '_g';
  const [result] = await pool.query(
    `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, profile_photo, google_id, auth_provider, is_active)
     VALUES (?, ?, ?, '', ?, ?, ?, ?, 'google', TRUE)`,
    [roleId, username, email, firstName, lastName, picture || null, googleId]
  );
  return result.insertId;
};

const getAllGoogleUsers = async () => {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.profile_photo,
            u.google_id, u.created_at, u.last_login,
            r.id AS role_id, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.auth_provider = 'google'
     ORDER BY u.created_at DESC`
  );
  return rows;
};

const updateUserRole = async (userId, roleId) => {
  await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);

  // Fetch the role name for the new roleId
  const [roleRows] = await pool.query('SELECT name FROM roles WHERE id = ? LIMIT 1', [roleId]);
  const roleName = roleRows[0]?.name;

  if (roleName === 'coach') {
    // Ensure a coaches table record exists for this user
    const [existing] = await pool.query('SELECT id FROM coaches WHERE user_id = ? LIMIT 1', [userId]);
    if (!existing.length) {
      const [userRows] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      if (userRows.length) {
        await pool.query(
          `INSERT INTO coaches (user_id, is_active, current_status, created_at, updated_at)
           VALUES (?, TRUE, 'active', NOW(), NOW())`,
          [userId]
        );
      }
    }
  }
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
  updateUserProfile,
  findUserByGoogleId,
  createGoogleUser,
  getAllGoogleUsers,
  updateUserRole,
};

