// ─── services/selector.service.js ────────────────────────
'use strict';

const { pool } = require('../config/database');
const { generateCode } = require('../utils/helpers');

const listSelectors = async ({ page = 1, limit = 20, search = '', sort_dir = 'ASC' }) => {
  const offset = (page - 1) * limit;
  const where = ['1=1'];
  const params = [];

  if (search) {
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR se.selector_code LIKE ? OR u.email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM selectors se JOIN users u ON u.id=se.user_id ${whereClause}`, params
  );
  const [rows] = await pool.query(`
    SELECT se.id, se.selector_code, se.designation, se.organization, se.sport_expertise,
           se.years_experience, se.is_active,
           u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS full_name,
           u.email, u.phone, u.profile_photo,
           COUNT(DISTINCT sel.id) AS total_selections
    FROM selectors se
    JOIN users u ON u.id = se.user_id
    LEFT JOIN selections sel ON sel.selector_id = se.id
    ${whereClause}
    GROUP BY se.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo
    ORDER BY u.first_name ${sort_dir === 'DESC' ? 'DESC' : 'ASC'}
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  return { total, page: Number(page), limit: Number(limit), data: rows };
};

const getSelectorById = async (id) => {
  const [rows] = await pool.query(`
    SELECT se.*, u.first_name, u.last_name, u.email, u.phone, u.profile_photo
    FROM selectors se JOIN users u ON u.id=se.user_id WHERE se.id=?
  `, [id]);
  if (!rows.length) return null;
  const sel = rows[0];

  const [sports] = await pool.query(`
    SELECT ss.id, s.id AS sport_id, s.name AS sport_name, ss.assigned_date
    FROM selector_sports ss JOIN sports s ON s.id=ss.sport_id
    WHERE ss.selector_id=? AND ss.is_active=1
  `, [id]);

  const [history] = await pool.query(`
    SELECT sh.*, CONCAT(u.first_name,' ',u.last_name) AS athlete_name
    FROM selection_history sh
    JOIN athletes a ON a.id=sh.athlete_id
    JOIN users u ON u.id=a.user_id
    WHERE sh.selector_id=?
    ORDER BY sh.created_at DESC LIMIT 20
  `, [id]);

  return { ...sel, sports, history };
};

const createSelector = async (data, createdBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const selector_code = await generateCode('SEL', conn);
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(`Sports@${new Date().getFullYear()}`, 12);

    const [userRes] = await conn.query(
      `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
       VALUES ((SELECT id FROM roles WHERE name='selector' LIMIT 1),?,?,?,?,?,?,1)`,
      [data.email, data.email, hash, data.first_name, data.last_name, data.phone || null]
    );

    const [selRes] = await conn.query(
      `INSERT INTO selectors (user_id, selector_code, designation, organization, sport_expertise, years_experience, is_active)
       VALUES (?,?,?,?,?,?,1)`,
      [userRes.insertId, selector_code, data.designation || null, data.organization || null,
       data.sport_expertise || null, data.years_experience || 0]
    );

    await conn.commit();
    return { id: selRes.insertId, selector_code };
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
};

const updateSelector = async (id, data) => {
  const allowed = ['designation','organization','sport_expertise','years_experience','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) {
    if (data[k] !== undefined) {
      let val = data[k];
      if (val === '') val = null;
      fields.push(`${k}=?`);
      vals.push(val);
    }
  }
  if (fields.length) { vals.push(id); await pool.query(`UPDATE selectors SET ${fields.join(',')} WHERE id=?`, vals); }

  const uFields = []; const uVals = [];
  for (const k of ['first_name','last_name','phone']) {
    if (data[k] !== undefined) { uFields.push(`${k}=?`); uVals.push(data[k]); }
  }
  if (uFields.length) {
    uVals.push(id);
    await pool.query(`UPDATE users SET ${uFields.join(',')} WHERE id=(SELECT user_id FROM selectors WHERE id=?)`, uVals);
  }
};

const deleteSelector = async (id) => { await pool.query('DELETE FROM selectors WHERE id=?', [id]); };

const assignSport = async (selector_id, sport_id) => {
  await pool.query(`INSERT IGNORE INTO selector_sports (selector_id,sport_id) VALUES (?,?)`, [selector_id, sport_id]);
};

const removeSport = async (selector_id, sport_id) => {
  await pool.query(`UPDATE selector_sports SET is_active=0 WHERE selector_id=? AND sport_id=?`, [selector_id, sport_id]);
};

const getSelectionHistory = async (selector_id, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(`
    SELECT sel.*, CONCAT(u.first_name,' ',u.last_name) AS athlete_name, sp.name AS sport_name
    FROM selections sel
    JOIN athletes a ON a.id=sel.athlete_id
    JOIN users u ON u.id=a.user_id
    LEFT JOIN sports sp ON sp.id=a.sport_id
    WHERE sel.selector_id=?
    ORDER BY sel.selection_date DESC LIMIT ? OFFSET ?
  `, [selector_id, Number(limit), offset]);
  return rows;
};

const getRecommendationDashboard = async (selector_id) => {
  const [pendingRecs] = await pool.query(`
    SELECT sel.*, CONCAT(u.first_name,' ',u.last_name) AS athlete_name, sp.name AS sport_name
    FROM selections sel
    JOIN athletes a ON a.id=sel.athlete_id
    JOIN users u ON u.id=a.user_id
    LEFT JOIN sports sp ON sp.id=a.sport_id
    WHERE sel.selector_id=? AND sel.status='recommended'
    ORDER BY sel.confidence_score DESC LIMIT 20
  `, [selector_id]);
  return { pending_recommendations: pendingRecs };
};

module.exports = { listSelectors, getSelectorById, createSelector, updateSelector, deleteSelector, assignSport, removeSport, getSelectionHistory, getRecommendationDashboard };
