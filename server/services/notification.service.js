// ─── services/notification.service.js ───────────────────────
'use strict';

const { pool } = require('../config/database');

/**
 * Inserts a single notification into the database.
 */
const createNotification = async ({
  userId,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'warning' | 'danger'
  link = null,
}) => {
  if (!userId || !title || !message) return null;
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
       VALUES (?, ?, ?, ?, 0, ?, NOW())`,
      [userId, title, message, type, link]
    );
    return result.insertId;
  } catch (err) {
    console.error(`[NotificationService] Error creating notification for user ${userId}:`, err.message);
    return null;
  }
};

/**
 * Notifies a specific user ID.
 */
const notifyUser = async (userId, title, message, type = 'info', link = null) => {
  return createNotification({ userId, title, message, type, link });
};

/**
 * Notifies the user account linked to an athlete ID.
 */
const notifyAthlete = async (athleteId, title, message, type = 'info', link = null) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM athletes WHERE id = ?', [athleteId]);
    if (rows.length > 0 && rows[0].user_id) {
      return createNotification({ userId: rows[0].user_id, title, message, type, link: link || '/dashboard' });
    }
  } catch (err) {
    console.error(`[NotificationService] Error notifying athlete ${athleteId}:`, err.message);
  }
  return null;
};

/**
 * Notifies the user account linked to a coach ID.
 */
const notifyCoach = async (coachId, title, message, type = 'info', link = null) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM coaches WHERE id = ?', [coachId]);
    if (rows.length > 0 && rows[0].user_id) {
      return createNotification({ userId: rows[0].user_id, title, message, type, link: link || '/coach-dashboard' });
    }
  } catch (err) {
    console.error(`[NotificationService] Error notifying coach ${coachId}:`, err.message);
  }
  return null;
};

/**
 * Notifies all active users with a given role (e.g. 'admin', 'head_coach').
 */
const notifyRole = async (roleName, title, message, type = 'info', link = null) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(r.name) = LOWER(?) AND u.is_active = 1`,
      [roleName]
    );
    for (const u of users) {
      await createNotification({ userId: u.id, title, message, type, link });
    }
  } catch (err) {
    console.error(`[NotificationService] Error notifying role ${roleName}:`, err.message);
  }
};

/**
 * Notifies all coaches assigned to a specific sport.
 */
const notifySportCoaches = async (sportId, title, message, type = 'info', link = null) => {
  try {
    const [users] = await pool.query(
      `SELECT DISTINCT u.id FROM coaches co
       JOIN users u ON co.user_id = u.id
       WHERE co.sport_id = ? AND co.is_active = 1 AND u.is_active = 1`,
      [sportId]
    );
    for (const u of users) {
      await createNotification({ userId: u.id, title, message, type, link });
    }
  } catch (err) {
    console.error(`[NotificationService] Error notifying sport coaches ${sportId}:`, err.message);
  }
};

/**
 * Notifies all selectors assigned to a specific sport.
 */
const notifySportSelectors = async (sportId, title, message, type = 'info', link = null) => {
  try {
    const [users] = await pool.query(
      `SELECT DISTINCT u.id FROM selectors sel
       JOIN users u ON sel.user_id = u.id
       LEFT JOIN selector_sports ss ON ss.selector_id = sel.id AND ss.is_active = 1
       WHERE (ss.sport_id = ? OR sel.sport_expertise LIKE (SELECT CONCAT('%', name, '%') FROM sports WHERE id = ?))
         AND sel.is_active = 1 AND u.is_active = 1`,
      [sportId, sportId]
    );
    for (const u of users) {
      await createNotification({ userId: u.id, title, message, type, link });
    }
  } catch (err) {
    console.error(`[NotificationService] Error notifying sport selectors ${sportId}:`, err.message);
  }
};

/**
 * Fetches notifications for a user with read/unread details.
 */
const getNotificationsForUser = async (userId, limit = 30) => {
  const [rows] = await pool.query(
    `SELECT id, user_id, title, message, type, is_read, link, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, Number(limit)]
  );
  return rows;
};

/**
 * Marks a notification as read.
 */
const markAsRead = async (notificationId, userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
};

/**
 * Marks all notifications as read for a user.
 */
const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
    [userId]
  );
};

/**
 * Deletes a notification for a user.
 */
const deleteNotification = async (notificationId, userId) => {
  await pool.query(
    `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
};

module.exports = {
  createNotification,
  notifyUser,
  notifyAthlete,
  notifyCoach,
  notifyRole,
  notifySportCoaches,
  notifySportSelectors,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
