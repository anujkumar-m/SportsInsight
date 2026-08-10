// ─── services/coach.service.js ────────────────────────────
'use strict';

const { pool } = require('../config/database');
const { generateCode } = require('../utils/helpers');

const BASE_SELECT = `
  SELECT
    co.id, co.coach_code, co.qualification, co.experience_years, co.specialization,
    co.date_of_birth, co.gender, co.address, co.joining_date, co.is_active, co.current_status,
    u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS full_name,
    u.email, u.phone, u.profile_photo,
    s.id AS sport_id, s.name AS sport_name,
    COUNT(DISTINCT ca.athlete_id) AS athlete_count
  FROM coaches co
  JOIN users u ON u.id = co.user_id
  LEFT JOIN sports s ON s.id = co.sport_id
  LEFT JOIN coach_assignments ca ON ca.coach_id = co.id AND ca.is_active = 1
`;

const listCoaches = async ({ page = 1, limit = 20, search = '', sport_id, current_status, sort_by = 'u.first_name', sort_dir = 'ASC' }) => {
  const offset = (page - 1) * limit;
  const where = ['1=1'];
  const params = [];

  if (search) {
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR co.coach_code LIKE ? OR u.email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (sport_id) { where.push('co.sport_id = ?'); params.push(sport_id); }
  if (current_status) { where.push('co.current_status = ?'); params.push(current_status); }

  const safe_sort = ['u.first_name','co.coach_code','co.experience_years'].includes(sort_by) ? sort_by : 'u.first_name';
  const safe_dir = sort_dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const whereClause = `WHERE ${where.join(' AND ')}`;

  const countSql = `SELECT COUNT(DISTINCT co.id) AS total FROM coaches co JOIN users u ON u.id = co.user_id LEFT JOIN sports s ON s.id = co.sport_id LEFT JOIN coach_assignments ca ON ca.coach_id = co.id AND ca.is_active=1 ${whereClause}`;
  const dataSql = `${BASE_SELECT} ${whereClause} GROUP BY co.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo, s.id, s.name ORDER BY ${safe_sort} ${safe_dir} LIMIT ? OFFSET ?`;

  const [[{ total }]] = await pool.query(countSql, params);
  const [rows] = await pool.query(dataSql, [...params, Number(limit), offset]);
  return { total, page: Number(page), limit: Number(limit), data: rows };
};

const getCoachById = async (id) => {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE co.id = ? GROUP BY co.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo, s.id, s.name`, [id]);
  if (!rows.length) return null;
  const coach = rows[0];

  const [athletes] = await pool.query(`
    SELECT a.id, a.athlete_code,
      CONCAT(u.first_name,' ',u.last_name) AS full_name,
      u.email, u.phone, sp.name AS sport_name, cat.name AS category_name,
      ca.assigned_date, a.medical_status, a.current_status
    FROM coach_assignments ca
    JOIN athletes a ON a.id = ca.athlete_id
    JOIN users u ON u.id = a.user_id
    LEFT JOIN sports sp ON sp.id = a.sport_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE ca.coach_id = ? AND ca.is_active = 1
  `, [id]);

  const [certificates] = await pool.query('SELECT * FROM coach_certificates WHERE coach_id = ?', [id]);
  const [remarks] = await pool.query('SELECT cr.*, CONCAT(u.first_name," ",u.last_name) AS athlete_name FROM coach_remarks cr JOIN athletes a ON a.id=cr.athlete_id JOIN users u ON u.id=a.user_id WHERE cr.coach_id=? ORDER BY cr.remark_date DESC LIMIT 20', [id]);
  const [history] = await pool.query('SELECT ch.*, CONCAT(u.first_name," ",u.last_name) AS changed_by_name FROM coach_history ch LEFT JOIN users u ON u.id=ch.changed_by WHERE ch.coach_id=? ORDER BY ch.created_at DESC LIMIT 20', [id]);

  return { ...coach, athletes, certificates, remarks, history };
};

const createCoach = async (data, createdBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const coach_code = await generateCode('COA', conn);
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(`Sports@${new Date().getFullYear()}`, 12);

    const [userRes] = await conn.query(
      `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
       VALUES ((SELECT id FROM roles WHERE name='coach' LIMIT 1),?,?,?,?,?,?,1)`,
      [data.email, data.email, hash, data.first_name, data.last_name, data.phone || null]
    );

    const [coachRes] = await conn.query(
      `INSERT INTO coaches (user_id, coach_code, sport_id, qualification, experience_years, specialization,
         date_of_birth, gender, address, joining_date, is_active, current_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,1,'active')`,
      [userRes.insertId, coach_code, data.sport_id || null, data.qualification || null,
       data.experience_years || 0, data.specialization || null, data.date_of_birth || null,
       data.gender || 'male', data.address || null, data.joining_date || null]
    );

    await conn.query(
      `INSERT INTO coach_history (coach_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
      [coachRes.insertId, 'created', `Coach created with code ${coach_code}`, createdBy]
    );

    await conn.commit();
    return { id: coachRes.insertId, coach_code };
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
};

const updateCoach = async (id, data, updatedBy) => {
  const allowed = ['sport_id','qualification','experience_years','specialization','date_of_birth','gender','address','joining_date','current_status','is_active'];
  const fields = []; const vals = [];
  for (const k of allowed) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      let val = data[k];
      if (val === '' && ['sport_id','experience_years','date_of_birth','joining_date'].includes(k)) val = null;
      vals.push(val);
    }
  }
  if (!fields.length) return;
  vals.push(id);
  await pool.query(`UPDATE coaches SET ${fields.join(',')} WHERE id=?`, vals);

  const uFields = []; const uVals = [];
  for (const k of ['first_name','last_name','phone','profile_photo']) {
    if (data[k] !== undefined) { uFields.push(`${k}=?`); uVals.push(data[k]); }
  }
  if (uFields.length) {
    uVals.push(id);
    await pool.query(`UPDATE users SET ${uFields.join(',')} WHERE id=(SELECT user_id FROM coaches WHERE id=?)`, uVals);
  }
  await pool.query(`INSERT INTO coach_history (coach_id,action_type,description,changed_by) VALUES (?,?,?,?)`, [id,'updated','Coach profile updated',updatedBy]);
};

const deleteCoach = async (id) => {
  const [rows] = await pool.query('SELECT user_id FROM coaches WHERE id = ?', [id]);
  if (rows.length > 0) {
    await pool.query('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
  } else {
    await pool.query('DELETE FROM coaches WHERE id = ?', [id]);
  }
};

const assignAthlete = async (coach_id, athlete_id, assigned_by) => {
  await pool.query(
    `INSERT INTO coach_assignments (coach_id,athlete_id,assigned_by,assigned_date,is_active) VALUES (?,?,?,CURDATE(),1)
     ON DUPLICATE KEY UPDATE is_active=1, removed_date=NULL`,
    [coach_id, athlete_id, assigned_by]
  );
  await pool.query('UPDATE athletes SET coach_id=? WHERE id=?', [coach_id, athlete_id]);
};

const removeAthlete = async (coach_id, athlete_id) => {
  await pool.query('UPDATE coach_assignments SET is_active=0, removed_date=CURDATE() WHERE coach_id=? AND athlete_id=? AND is_active=1', [coach_id, athlete_id]);
  await pool.query('UPDATE athletes SET coach_id=NULL WHERE id=? AND coach_id=?', [athlete_id, coach_id]);
};

const getAnalytics = async (coach_id) => {
  const [[perf]] = await pool.query(`
    SELECT
      COUNT(DISTINCT ca.athlete_id) AS total_athletes,
      ROUND(AVG(pr.performance_score),2) AS avg_performance,
      ROUND(AVG(fa.overall_fitness_score),2) AS avg_fitness,
      ROUND(100.0*SUM(CASE WHEN att.status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(att.id),0),1) AS avg_attendance,
      COUNT(DISTINCT sel.id) AS total_selections
    FROM coaches co
    LEFT JOIN coach_assignments ca ON ca.coach_id=co.id AND ca.is_active=1
    LEFT JOIN performance_records pr ON pr.coach_id=co.id AND pr.record_date>=DATE_SUB(CURDATE(),INTERVAL 90 DAY)
    LEFT JOIN fitness_assessments fa ON fa.coach_id=co.id AND fa.assessment_date>=DATE_SUB(CURDATE(),INTERVAL 90 DAY)
    LEFT JOIN attendance att ON att.coach_id=co.id AND att.attendance_date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY)
    LEFT JOIN selections sel ON sel.athlete_id=ca.athlete_id AND sel.status='selected'
    WHERE co.id=?
  `, [coach_id]);
  return perf;
};

const generateCoachAiList = async (coach_id, list_type, limit = 20) => {
  const athleteService = require('./athlete.service');
  return athleteService.generateAiList({ list_type, coach_id, limit });
};

const getCoachRemarks = async ({ athlete_id, coach_id, limit = 50, remark_type }) => {
  const where = ['1=1'];
  const params = [];
  if (athlete_id) { where.push('cr.athlete_id = ?'); params.push(athlete_id); }
  if (coach_id) { where.push('cr.coach_id = ?'); params.push(coach_id); }
  if (remark_type && remark_type !== 'all') { where.push('cr.remark_type = ?'); params.push(remark_type); }

  const sql = `
    SELECT cr.*,
           CONCAT(u_ath.first_name, ' ', u_ath.last_name) AS athlete_name,
           a.athlete_code,
           CONCAT(u_coa.first_name, ' ', u_coa.last_name) AS coach_name
    FROM coach_remarks cr
    JOIN athletes a ON a.id = cr.athlete_id
    JOIN users u_ath ON u_ath.id = a.user_id
    JOIN coaches co ON co.id = cr.coach_id
    JOIN users u_coa ON u_coa.id = co.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY cr.remark_date DESC, cr.id DESC
    LIMIT ?
  `;
  params.push(Number(limit));
  const [rows] = await pool.query(sql, params);
  return rows;
};

const createCoachRemark = async (data) => {
  const { athlete_id, coach_id, remark_type = 'general', rating = 8.0, remarks, remark_date } = data;
  const dateStr = remark_date || new Date().toISOString().split('T')[0];
  const [res] = await pool.query(
    `INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [athlete_id, coach_id, dateStr, remark_type, rating, remarks]
  );
  return { id: res.insertId, ...data, remark_date: dateStr };
};

const deleteCoachRemark = async (id) => {
  await pool.query('DELETE FROM coach_remarks WHERE id = ?', [id]);
};

module.exports = {
  listCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach,
  assignAthlete,
  removeAthlete,
  getAnalytics,
  generateCoachAiList,
  getCoachRemarks,
  createCoachRemark,
  deleteCoachRemark,
};

