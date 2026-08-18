// ─── services/sport.service.js ────────────────────────────
'use strict';

const { pool } = require('../config/database');

// ─── Sports ─────────────────────────────────────────────────
const listSports = async ({ page = 1, limit = 20, search = '', is_active, sport_ids }) => {
  const offset = (page - 1) * limit;
  const where = ['1=1'];
  const params = [];

  if (search) { where.push('(s.name LIKE ? OR s.description LIKE ?)'); const sw = `%${search}%`; params.push(sw, sw); }
  if (is_active !== undefined) { where.push('s.is_active = ?'); params.push(is_active); }
  if (sport_ids && Array.isArray(sport_ids) && sport_ids.length > 0) {
    where.push(`s.id IN (${sport_ids.map(() => '?').join(',')})`);
    params.push(...sport_ids);
  }

  const wc = `WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM sports s ${wc}`, params);
  const [rows] = await pool.query(`
    SELECT s.*, COUNT(DISTINCT a.id) AS athlete_count,
           COUNT(DISTINCT sm.id) AS metrics_count
    FROM sports s
    LEFT JOIN athletes a ON a.sport_id = s.id AND a.current_status='active'
    LEFT JOIN sport_metrics sm ON sm.sport_id = s.id AND sm.is_active=1
    ${wc} GROUP BY s.id ORDER BY s.name LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  return { total, page: Number(page), limit: Number(limit), data: rows };
};

const getSportById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM sports WHERE id=?', [id]);
  if (!rows.length) return null;
  const sport = rows[0];
  const [metrics] = await pool.query('SELECT * FROM sport_metrics WHERE sport_id=? AND is_active=1 ORDER BY display_order', [id]);
  const [categories] = await pool.query('SELECT * FROM categories WHERE sport_id=? ORDER BY name', [id]);
  const [events] = await pool.query('SELECT * FROM events WHERE sport_id=? AND is_active=1 ORDER BY name', [id]);
  return { ...sport, metrics, categories, events };
};

const createSport = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO sports (name, description, icon, is_active) VALUES (?,?,?,1)',
    [data.name, data.description || null, data.icon || null]
  );
  // Insert default metrics if provided
  if (Array.isArray(data.metrics) && data.metrics.length) {
    await upsertMetrics(result.insertId, data.metrics);
  }
  return result.insertId;
};

const updateSport = async (id, data) => {
  const fields = []; const vals = [];
  for (const k of ['name','description','icon','is_active']) {
    if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); }
  }
  if (fields.length) { vals.push(id); await pool.query(`UPDATE sports SET ${fields.join(',')} WHERE id=?`, vals); }
  if (Array.isArray(data.metrics)) { await upsertMetrics(id, data.metrics); }
};

const deleteSport = async (id) => { await pool.query('DELETE FROM sports WHERE id=?', [id]); };

// ─── Sport Metrics ───────────────────────────────────────────
const upsertMetrics = async (sport_id, metrics) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return;
  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    const label = (m.metric_label || m.name || '').trim();
    if (!label) continue;

    let key = (m.metric_key || label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!key) key = `metric_${i + 1}`;

    const unit = (m.metric_unit || m.unit || '').trim() || null;
    const type = ['number', 'time', 'percentage', 'text'].includes(m.metric_type) ? m.metric_type : 'number';
    const isHigherBetter = m.is_higher_better === false || m.is_higher_better === 0 || m.is_higher_better === 'false' ? 0 : 1;
    const displayOrder = m.display_order ?? i;

    await pool.query(`
      INSERT INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better, display_order, is_active)
      VALUES (?,?,?,?,?,?,?,1)
      ON DUPLICATE KEY UPDATE metric_label=VALUES(metric_label), metric_unit=VALUES(metric_unit),
        metric_type=VALUES(metric_type), is_higher_better=VALUES(is_higher_better), display_order=VALUES(display_order), is_active=1
    `, [sport_id, key, label, unit, type, isHigherBetter, displayOrder]);
  }
};

const getMetrics = async (sport_id) => {
  const [rows] = await pool.query('SELECT * FROM sport_metrics WHERE sport_id=? AND is_active=1 ORDER BY display_order', [sport_id]);
  return rows;
};

const deleteMetric = async (id) => {
  await pool.query('UPDATE sport_metrics SET is_active=0 WHERE id=?', [id]);
};

// ─── Categories ──────────────────────────────────────────────
const listCategories = async ({ page = 1, limit = 50, search = '', sport_id }) => {
  const offset = (page - 1) * limit;
  const where = ['1=1']; const params = [];
  if (search) { where.push('c.name LIKE ?'); params.push(`%${search}%`); }
  if (sport_id) { where.push('c.sport_id=?'); params.push(sport_id); }
  const wc = `WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM categories c ${wc}`, params);
  const [rows] = await pool.query(`
    SELECT c.*, s.name AS sport_name, COUNT(DISTINCT a.id) AS athlete_count
    FROM categories c LEFT JOIN sports s ON s.id=c.sport_id LEFT JOIN athletes a ON a.category_id=c.id
    ${wc} GROUP BY c.id ORDER BY c.name LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);
  return { total, page: Number(page), limit: Number(limit), data: rows };
};

const createCategory = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO categories (sport_id, name, age_min, age_max, gender, description, is_active) VALUES (?,?,?,?,?,?,1)',
    [data.sport_id || null, data.name, data.age_min || null, data.age_max || null, data.gender || 'mixed', data.description || null]
  );
  return result.insertId;
};

const updateCategory = async (id, data) => {
  const allowed = ['sport_id','name','age_min','age_max','gender','description','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) { if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); } }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(',')} WHERE id=?`, vals);
};

const deleteCategory = async (id) => { await pool.query('DELETE FROM categories WHERE id=?', [id]); };

// ─── Age Groups ──────────────────────────────────────────────
const listAgeGroups = async () => {
  const [rows] = await pool.query('SELECT * FROM age_groups WHERE is_active=1 ORDER BY age_min');
  return rows;
};

const createAgeGroup = async (data) => {
  const [r] = await pool.query('INSERT INTO age_groups (name,age_min,age_max,description) VALUES (?,?,?,?)', [data.name, data.age_min, data.age_max, data.description || null]);
  return r.insertId;
};

const updateAgeGroup = async (id, data) => {
  const allowed = ['name','age_min','age_max','description','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) { if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); } }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE age_groups SET ${fields.join(',')} WHERE id=?`, vals);
};

const deleteAgeGroup = async (id) => { await pool.query('DELETE FROM age_groups WHERE id=?', [id]); };

// ─── Gender Categories ───────────────────────────────────────
const listGenderCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM gender_categories WHERE is_active=1 ORDER BY name');
  return rows;
};

const createGenderCategory = async (data) => {
  const [r] = await pool.query('INSERT INTO gender_categories (name,code,description) VALUES (?,?,?)', [data.name, data.code, data.description || null]);
  return r.insertId;
};

const updateGenderCategory = async (id, data) => {
  const allowed = ['name','code','description','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) { if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); } }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE gender_categories SET ${fields.join(',')} WHERE id=?`, vals);
};

const deleteGenderCategory = async (id) => { await pool.query('DELETE FROM gender_categories WHERE id=?', [id]); };

// ─── Events ─────────────────────────────────────────────────
const listEvents = async ({ sport_id } = {}) => {
  const where = sport_id ? 'WHERE e.sport_id=? AND e.is_active=1' : 'WHERE e.is_active=1';
  const params = sport_id ? [sport_id] : [];
  const [rows] = await pool.query(`
    SELECT e.*, s.name AS sport_name FROM events e LEFT JOIN sports s ON s.id=e.sport_id ${where} ORDER BY e.name
  `, params);
  return rows;
};

const createEvent = async (data) => {
  const [r] = await pool.query('INSERT INTO events (sport_id,name,event_type,description) VALUES (?,?,?,?)', [data.sport_id || null, data.name, data.event_type || 'individual', data.description || null]);
  return r.insertId;
};

const updateEvent = async (id, data) => {
  const allowed = ['sport_id','name','event_type','description','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) { if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); } }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE events SET ${fields.join(',')} WHERE id=?`, vals);
};

const deleteEvent = async (id) => { await pool.query('UPDATE events SET is_active=0 WHERE id=?', [id]); };

module.exports = {
  listSports, getSportById, createSport, updateSport, deleteSport,
  upsertMetrics, getMetrics, deleteMetric,
  listCategories, createCategory, updateCategory, deleteCategory,
  listAgeGroups, createAgeGroup, updateAgeGroup, deleteAgeGroup,
  listGenderCategories, createGenderCategory, updateGenderCategory, deleteGenderCategory,
  listEvents, createEvent, updateEvent, deleteEvent,
};
