const { OAuth2Client } = require('google-auth-library');
const {
  findUserByGoogleId,
  findUserByEmail,
  createGoogleUser,
  storeRefreshToken,
  logLogin,
} = require('../models/user.model');
const { pool } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.util');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_EMAILS = (process.env.ADMIN_GOOGLE_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Verify a Google credential token and return the payload.
 */
const verifyGoogleToken = async (credential) => {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

/**
 * Get role_id for the 'unassigned' role from DB.
 */
const getUnassignedRoleId = async () => {
  const [rows] = await pool.query("SELECT id FROM roles WHERE name = 'unassigned' LIMIT 1");
  if (!rows.length) throw new Error("Role 'unassigned' not found in DB. Please run the updated SQL.");
  return rows[0].id;
};

/**
 * Get role_id for the 'admin' role from DB.
 */
const getAdminRoleId = async () => {
  const [rows] = await pool.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
  if (!rows.length) throw new Error("Role 'admin' not found in DB.");
  return rows[0].id;
};

/**
 * Main Google login handler.
 * 1. Verify token.
 * 2. Normalize email.
 * 3. Find or create user in DB.
 * 4. Use assigned role from DB (or force admin for designated admin email).
 * 5. Issue JWT tokens.
 */
const googleLogin = async (credential, ip, userAgent) => {
  // 1. Verify Google token
  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch {
    throw { status: 401, message: 'Invalid Google token. Please try again.' };
  }

  const { sub: googleId, email: rawEmail, given_name: firstName, family_name: lastName, picture } = payload;

  if (!rawEmail) throw { status: 400, message: 'Google account has no email.' };

  // 2. Normalize email — trim whitespace and lowercase for all comparisons
  const email = rawEmail.trim().toLowerCase();
  const isAdminEmail = ADMIN_EMAILS.includes(email);

  // 3. Find existing user by googleId first
  let user = await findUserByGoogleId(googleId);

  if (!user) {
    // Check if a user with same email exists (case-insensitive) — link accounts
    user = await findUserByEmail(email);

    if (user) {
      // Link existing account to Google
      await pool.query(
        'UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?',
        [googleId, 'google', user.id]
      );
      // Re-fetch to get updated record with google_id and accurate role
      user = await findUserByGoogleId(googleId);
    } else {
      // Brand new user — create with unassigned (or admin) role
      let roleId;
      if (isAdminEmail) {
        roleId = await getAdminRoleId();
      } else {
        roleId = await getUnassignedRoleId();
      }
      const newUserId = await createGoogleUser(email, googleId, firstName || email, lastName || '', picture, roleId);

      const [rows] = await pool.query(
        `SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                u.profile_photo, u.is_active, u.google_id, u.auth_provider,
                COALESCE(r.id, 5) AS role_id, COALESCE(r.name, 'unassigned') AS role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [newUserId]
      );
      user = rows[0];
    }
  }

  if (!user) throw { status: 500, message: 'Failed to retrieve user after Google login.' };
  if (!user.is_active) throw { status: 401, message: 'Your account has been deactivated.' };

  // 4. Use assigned role from DB
  let effectiveRole = user.role || 'unassigned';
  let effectiveRoleId = user.role_id || 5;

  // 5. Force admin role for designated admin email — always takes precedence
  if (isAdminEmail && effectiveRole !== 'admin') {
    const adminRoleId = await getAdminRoleId();
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [adminRoleId, user.id]);
    effectiveRole = 'admin';
    effectiveRoleId = adminRoleId;
  }

  // 6. Log login & issue tokens
  await logLogin(user.id, ip, userAgent, 'success');

  const tokenPayload = { id: user.id, role: effectiveRole, role_id: effectiveRoleId };
  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storeRefreshToken(user.id, newRefreshToken, refreshExpiry);

  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    profilePhoto: user.profile_photo || picture,
    role: effectiveRole,
    role_id: effectiveRoleId,
    authProvider: 'google',
  };

  return { user: userResponse, accessToken, refreshToken: newRefreshToken };
};

module.exports = { googleLogin };

