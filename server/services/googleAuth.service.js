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
const ADMIN_EMAIL = (process.env.ADMIN_GOOGLE_EMAIL || '').trim().toLowerCase();

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
 * Synchronize role:
 * If the user has a record in the coaches table, ensure their role_id is set to 'coach'.
 * Returns the corrected { role, role_id } to use in the JWT.
 */
const syncRoleFromDomainTables = async (userId, currentRole, currentRoleId) => {
  // Check coaches table
  const [coachRows] = await pool.query(
    'SELECT co.id FROM coaches co WHERE co.user_id = ? AND co.is_active = TRUE LIMIT 1',
    [userId]
  );
  if (coachRows.length) {
    const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = 'coach' LIMIT 1");
    const coachRoleId = roleRows[0]?.id;
    if (coachRoleId && currentRole !== 'coach') {
      // [DEBUG] Role sync: user has a coaches record but role was wrong — correcting.
      console.log(`[DEBUG] googleAuth: syncing role for user ${userId} — was '${currentRole}', correcting to 'coach'`);
      await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [coachRoleId, userId]);
      return { role: 'coach', role_id: coachRoleId };
    }
  }
  return { role: currentRole, role_id: currentRoleId };
};

/**
 * Main Google login handler.
 * 1. Verify token.
 * 2. Normalize email.
 * 3. Find or create user in DB.
 * 4. Sync role from domain tables (coaches, etc.).
 * 5. Force admin role for designated admin email.
 * 6. Issue JWT tokens.
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
  const isAdminEmail = email === ADMIN_EMAIL;

  // [DEBUG] Trace incoming email and admin check
  console.log(`[DEBUG] googleAuth.googleLogin: email='${email}' isAdmin=${isAdminEmail} googleId='${googleId}'`);

  // 3. Find existing user by googleId first
  let user = await findUserByGoogleId(googleId);
  // [DEBUG] Log DB lookup by googleId
  console.log(`[DEBUG] googleAuth: findUserByGoogleId result:`, user ? `found id=${user.id} role=${user.role}` : 'NOT FOUND');

  if (!user) {
    // Check if a user with same email exists (case-insensitive) — link accounts
    user = await findUserByEmail(email);
    // [DEBUG] Log email lookup result
    console.log(`[DEBUG] googleAuth: findUserByEmail('${email}') result:`, user ? `found id=${user.id} role=${user.role}` : 'NOT FOUND');

    if (user) {
      // Link existing account to Google
      await pool.query(
        'UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?',
        [googleId, 'google', user.id]
      );
      // Re-fetch to get updated record with google_id
      user = await findUserByGoogleId(googleId);
      console.log(`[DEBUG] googleAuth: linked existing user id=${user?.id} to Google`);
    } else {
      // Brand new user — create with unassigned (or admin) role
      let roleId;
      if (isAdminEmail) {
        roleId = await getAdminRoleId();
      } else {
        roleId = await getUnassignedRoleId();
      }
      const newUserId = await createGoogleUser(email, googleId, firstName || email, lastName || '', picture, roleId);
      console.log(`[DEBUG] googleAuth: created new user id=${newUserId}`);

      const [rows] = await pool.query(
        `SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                u.profile_photo, u.is_active, u.google_id, u.auth_provider,
                r.id AS role_id, r.name AS role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [newUserId]
      );
      user = rows[0];
    }
  }

  if (!user) throw { status: 500, message: 'Failed to retrieve user after Google login.' };
  if (!user.is_active) throw { status: 401, message: 'Your account has been deactivated.' };

  // 4. Sync role from domain tables (e.g., if user is in coaches table, ensure role = coach)
  let { role: effectiveRole, role_id: effectiveRoleId } = await syncRoleFromDomainTables(
    user.id, user.role, user.role_id
  );
  console.log(`[DEBUG] googleAuth: after syncRole — userId=${user.id} role='${effectiveRole}'`);

  // 5. Force admin role for designated admin email — always takes precedence
  if (isAdminEmail && effectiveRole !== 'admin') {
    const adminRoleId = await getAdminRoleId();
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [adminRoleId, user.id]);
    effectiveRole = 'admin';
    effectiveRoleId = adminRoleId;
    console.log(`[DEBUG] googleAuth: forced admin role for admin email`);
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

  console.log(`[DEBUG] googleAuth: login complete — userId=${user.id} finalRole='${effectiveRole}'`);

  return { user: userResponse, accessToken, refreshToken: newRefreshToken };
};

module.exports = { googleLogin };

