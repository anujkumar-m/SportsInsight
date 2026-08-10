// ─── services/athlete.service.js ──────────────────────────
'use strict';

const { pool } = require('../config/database');
const { generateCode } = require('../utils/helpers');

// ─── Helpers ────────────────────────────────────────────────
const BASE_SELECT = `
  SELECT
    a.id, a.user_id, a.athlete_code, a.date_of_birth,
    TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
    a.gender, a.height_cm, a.weight_kg, a.blood_group,
    ROUND(a.weight_kg / ((a.height_cm/100) * (a.height_cm/100)), 2) AS bmi,
    a.address, a.city, a.state, a.district, a.pincode,
    a.academy_name, a.guardian_name, a.guardian_phone,
    a.registration_date, a.joining_date,
    a.medical_status, a.current_status, a.is_active,
    a.archived_at,
    u.first_name, u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.email, u.phone, u.profile_photo,
    s.id AS sport_id, s.name AS sport_name,
    c.id AS category_id, c.name AS category_name,
    CONCAT(cu.first_name, ' ', cu.last_name) AS coach_name,
    co.id AS coach_id
  FROM athletes a
  JOIN users u ON u.id = a.user_id
  LEFT JOIN sports s ON s.id = a.sport_id
  LEFT JOIN categories c ON c.id = a.category_id
  LEFT JOIN coaches co ON co.id = a.coach_id
  LEFT JOIN users cu ON cu.id = co.user_id
`;

// ─── List athletes ──────────────────────────────────────────
const listAthletes = async ({
  page = 1,
  limit = 20,
  search = '',
  sport_id,
  category_id,
  gender,
  medical_status,
  current_status = 'active',
  coach_id,
  sort_by = 'u.first_name',
  sort_dir = 'ASC',
}) => {
  const offset = (page - 1) * limit;
  const where = ['a.current_status = ?'];
  const params = [current_status];

  if (search) {
    where.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR a.athlete_code LIKE ? OR u.email LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (sport_id) { where.push('a.sport_id = ?'); params.push(sport_id); }
  if (category_id) { where.push('a.category_id = ?'); params.push(category_id); }
  if (gender) { where.push('a.gender = ?'); params.push(gender); }
  if (medical_status) { where.push('a.medical_status = ?'); params.push(medical_status); }
  if (coach_id) { where.push('a.coach_id = ?'); params.push(coach_id); }

  const allowed_sorts = ['u.first_name', 'a.athlete_code', 'a.date_of_birth', 'a.registration_date', 's.name'];
  const safe_sort = allowed_sorts.includes(sort_by) ? sort_by : 'u.first_name';
  const safe_dir = sort_dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM athletes a JOIN users u ON u.id = a.user_id LEFT JOIN sports s ON s.id = a.sport_id LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN coaches co ON co.id = a.coach_id LEFT JOIN users cu ON cu.id = co.user_id ${whereClause}`;
  const dataSql = `${BASE_SELECT} ${whereClause} ORDER BY ${safe_sort} ${safe_dir} LIMIT ? OFFSET ?`;

  const [[{ total }]] = await pool.query(countSql, params);
  const [rows] = await pool.query(dataSql, [...params, Number(limit), offset]);

  return { total, page: Number(page), limit: Number(limit), data: rows };
};

// ─── Get single athlete ─────────────────────────────────────
const getAthleteById = async (id) => {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE a.id = ?`, [id]);
  if (!rows.length) return null;

  const athlete = rows[0];

  // medical history
  const [medical] = await pool.query(
    'SELECT * FROM athlete_medical_history WHERE athlete_id = ? ORDER BY record_date DESC LIMIT 10', [id]
  );
  // achievements
  const [achievements] = await pool.query(
    'SELECT ah.*, s.name AS sport_name FROM athlete_achievements ah LEFT JOIN sports s ON s.id = ah.sport_id WHERE ah.athlete_id = ? ORDER BY ah.achievement_date DESC LIMIT 20', [id]
  );
  // history/timeline
  const [history] = await pool.query(
    'SELECT ah.*, CONCAT(u.first_name,\" \",u.last_name) AS changed_by_name FROM athlete_history ah LEFT JOIN users u ON u.id = ah.changed_by WHERE ah.athlete_id = ? ORDER BY ah.created_at DESC LIMIT 30', [id]
  );

  return { ...athlete, medical_history: medical, achievements, history };
};

// ─── Create athlete ─────────────────────────────────────────
const createAthlete = async (data, createdBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const athlete_code = data.athlete_code || await generateCode('ATH', conn);

    // 1. Create user account
    const bcrypt = require('bcryptjs');
    const defaultPassword = `Sports@${new Date().getFullYear()}`;
    const hash = await bcrypt.hash(defaultPassword, 12);

    const [userResult] = await conn.query(
      `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
       VALUES ((SELECT id FROM roles WHERE name='athlete' LIMIT 1), ?, ?, ?, ?, ?, ?, 1)`,
      [data.email, data.email, hash, data.first_name, data.last_name, data.phone || null]
    );
    const userId = userResult.insertId;

    // 2. Create athlete record
    const [athResult] = await conn.query(
      `INSERT INTO athletes (user_id, coach_id, sport_id, category_id, athlete_code,
        date_of_birth, gender, height_cm, weight_kg, blood_group, address, city, state,
        district, pincode, academy_name, guardian_name, guardian_phone,
        registration_date, joining_date, medical_status, current_status, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?,?,?,1)`,
      [
        userId, data.coach_id || null, data.sport_id || null, data.category_id || null, athlete_code,
        data.date_of_birth || null, data.gender || 'male',
        data.height_cm || null, data.weight_kg || null, data.blood_group || null,
        data.address || null, data.city || null, data.state || null,
        data.district || null, data.pincode || null, data.academy_name || null,
        data.guardian_name || null, data.guardian_phone || null,
        data.joining_date || null, data.medical_status || 'fit',
        data.current_status || 'active',
      ]
    );
    const athleteId = athResult.insertId;

    // 3. History
    await conn.query(
      `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
      [athleteId, 'created', `Athlete profile created with code ${athlete_code}`, createdBy]
    );

    await conn.commit();
    return { id: athleteId, athlete_code, defaultPassword };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Update athlete ─────────────────────────────────────────
const updateAthlete = async (id, data, updatedBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const fields = [];
    const vals = [];
    const allowed = [
      'coach_id','sport_id','category_id','date_of_birth','gender',
      'height_cm','weight_kg','blood_group','address','city','state',
      'district','pincode','academy_name','guardian_name','guardian_phone',
      'joining_date','medical_status','current_status',
    ];
    for (const k of allowed) {
      if (data[k] !== undefined) {
        fields.push(`${k} = ?`);
        let val = data[k];
        if (val === '' && ['coach_id','sport_id','category_id','height_cm','weight_kg','date_of_birth','joining_date'].includes(k)) {
          val = null;
        }
        vals.push(val);
      }
    }
    if (!fields.length) return false;

    vals.push(id);
    await conn.query(`UPDATE athletes SET ${fields.join(', ')} WHERE id = ?`, vals);

    // user fields
    const uFields = [];
    const uVals = [];
    const uAllowed = ['first_name','last_name','phone','profile_photo'];
    for (const k of uAllowed) {
      if (data[k] !== undefined) { uFields.push(`${k} = ?`); uVals.push(data[k]); }
    }
    if (uFields.length) {
      uVals.push(id);
      await conn.query(
        `UPDATE users SET ${uFields.join(', ')} WHERE id = (SELECT user_id FROM athletes WHERE id = ?)`, uVals
      );
    }

    await conn.query(
      `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
      [id, 'updated', 'Athlete profile updated', updatedBy]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Archive / Restore ──────────────────────────────────────
const archiveAthlete = async (id, archivedBy) => {
  await pool.query(
    `UPDATE athletes SET current_status='archived', archived_at=NOW(), archived_by=? WHERE id=?`,
    [archivedBy, id]
  );
  await pool.query(
    `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
    [id, 'archived', 'Athlete archived', archivedBy]
  );
};

const restoreAthlete = async (id, restoredBy) => {
  await pool.query(
    `UPDATE athletes SET current_status='active', archived_at=NULL, archived_by=NULL WHERE id=?`, [id]
  );
  await pool.query(
    `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
    [id, 'restored', 'Athlete restored from archive', restoredBy]
  );
};

// ─── Delete athlete ─────────────────────────────────────────
const deleteAthlete = async (id) => {
  await pool.query(`DELETE FROM athletes WHERE id = ?`, [id]);
};

// ─── Bulk operations ────────────────────────────────────────
const bulkDelete = async (ids) => {
  if (!ids.length) return;
  await pool.query(`DELETE FROM athletes WHERE id IN (?)`, [ids]);
};

const bulkUpdate = async (ids, data, updatedBy) => {
  if (!ids.length) return;
  const allowed = ['sport_id','category_id','coach_id','medical_status','current_status'];
  const fields = [];
  const vals = [];
  for (const k of allowed) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); vals.push(data[k]); }
  }
  if (!fields.length) return;
  await pool.query(`UPDATE athletes SET ${fields.join(', ')} WHERE id IN (?)`, [...vals, ids]);
};

// ─── Export data ─────────────────────────────────────────────
const exportAthletes = async (filters = {}) => {
  const { data } = await listAthletes({ ...filters, page: 1, limit: 10000 });
  return data;
};

// ─── AI Generate List ────────────────────────────────────────
const generateAiList = async ({ list_type, sport_id, category_id, coach_id, limit = 20 }) => {
  // Pull raw athlete data with metrics for AI scoring
  let where = `WHERE a.current_status = 'active'`;
  const params = [];

  if (sport_id) { where += ' AND a.sport_id = ?'; params.push(sport_id); }
  if (category_id) { where += ' AND a.category_id = ?'; params.push(category_id); }
  if (coach_id) { where += ' AND a.coach_id = ?'; params.push(coach_id); }

  const [athletes] = await pool.query(`
    SELECT
      a.id, a.athlete_code,
      CONCAT(u.first_name,' ',u.last_name) AS full_name,
      a.gender, a.medical_status,
      TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
      s.name AS sport_name,
      c.name AS category_name,
      COALESCE(AVG(pr.performance_score),0) AS avg_performance,
      COALESCE(AVG(fa.overall_fitness_score),0) AS avg_fitness,
      COALESCE(
        100.0 * SUM(CASE WHEN att.status='present' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(att.id),0), 0
      ) AS attendance_rate,
      COALESCE(AVG(cr.rating),0) AS avg_coach_rating,
      COUNT(DISTINCT sel.id) AS selection_count,
      COUNT(DISTINCT inj.id) AS injury_count,
      COALESCE(r.overall_ranking_score,0) AS ranking_score
    FROM athletes a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN sports s ON s.id = a.sport_id
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN performance_records pr ON pr.athlete_id = a.id AND pr.record_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    LEFT JOIN fitness_assessments fa ON fa.athlete_id = a.id AND fa.assessment_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    LEFT JOIN attendance att ON att.athlete_id = a.id AND att.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    LEFT JOIN coach_remarks cr ON cr.athlete_id = a.id AND cr.remark_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    LEFT JOIN selections sel ON sel.athlete_id = a.id
    LEFT JOIN injuries inj ON inj.athlete_id = a.id AND inj.recovery_status != 'recovered'
    LEFT JOIN rankings r ON r.athlete_id = a.id AND r.rank_type='overall'
    ${where}
    GROUP BY a.id, u.first_name, u.last_name, a.gender, a.medical_status,
             a.date_of_birth, s.name, c.name, r.overall_ranking_score
  `, params);

  return scoreAndRank(athletes, list_type, limit);
};

const scoreAndRank = (athletes, list_type, limit) => {
  const scored = athletes.map((a) => {
    const perf = Number(a.avg_performance) || 0;
    const fitness = Number(a.avg_fitness) || 0;
    const att = Number(a.attendance_rate) || 0;
    const coaching = Number(a.avg_coach_rating) * 20 || 0;
    const ranking = Number(a.ranking_score) || 0;
    const injuries = Number(a.injury_count) || 0;

    let confidence_score = 0;
    let reason = '';
    let suggestion = '';

    switch (list_type) {
      case 'top_performing':
        confidence_score = (perf * 0.5 + fitness * 0.2 + att * 0.15 + coaching * 0.15);
        reason = `Avg performance score: ${perf.toFixed(1)}, Fitness: ${fitness.toFixed(1)}`;
        suggestion = perf < 70 ? 'Focus on sport-specific drills' : 'Maintain current training regime';
        break;
      case 'most_improved':
        confidence_score = (perf * 0.4 + coaching * 0.3 + att * 0.3);
        reason = `Coach rating: ${(Number(a.avg_coach_rating)||0).toFixed(1)}/5, Attendance: ${att.toFixed(0)}%`;
        suggestion = 'Continue progressive overload training';
        break;
      case 'best_fitness':
        confidence_score = (fitness * 0.7 + att * 0.2 + coaching * 0.1);
        reason = `Fitness score: ${fitness.toFixed(1)}`;
        suggestion = fitness < 60 ? 'Increase conditioning sessions' : 'Maintain peak fitness';
        break;
      case 'highest_attendance':
        confidence_score = att;
        reason = `Attendance rate: ${att.toFixed(0)}% over last 30 days`;
        suggestion = att < 80 ? 'Improve session consistency' : 'Excellent commitment';
        break;
      case 'high_potential':
        confidence_score = (perf * 0.3 + fitness * 0.3 + coaching * 0.25 + att * 0.15) * (injuries === 0 ? 1 : 0.8);
        reason = `Well-rounded profile, coach rating ${(Number(a.avg_coach_rating)||0).toFixed(1)}/5`;
        suggestion = 'Enroll in elite development program';
        break;
      case 'selection_ready':
        confidence_score = (perf * 0.35 + fitness * 0.25 + att * 0.2 + ranking * 0.2) * (a.medical_status === 'fit' ? 1 : 0.5);
        reason = `Medical: ${a.medical_status}, Past selections: ${a.selection_count}`;
        suggestion = a.medical_status !== 'fit' ? 'Clear medical status first' : 'Ready for selection trial';
        break;
      case 'recovery_ready':
        confidence_score = injuries === 0 ? (fitness * 0.6 + perf * 0.4) : (fitness * 0.3);
        reason = `Active injuries: ${injuries}, Fitness: ${fitness.toFixed(1)}`;
        suggestion = injuries > 0 ? 'Complete recovery protocol' : 'Cleared for competition';
        break;
      case 'underperforming':
        confidence_score = 100 - (perf * 0.5 + fitness * 0.3 + att * 0.2);
        reason = `Low performance: ${perf.toFixed(1)}, Fitness: ${fitness.toFixed(1)}, Attendance: ${att.toFixed(0)}%`;
        suggestion = 'Schedule one-on-one coaching sessions and review training plan';
        break;
      case 'future_medal':
        confidence_score = (perf * 0.4 + fitness * 0.3 + coaching * 0.2 + ranking * 0.1) * (a.age < 20 ? 1.2 : 1);
        reason = `Age: ${a.age}, Performance trajectory looks promising`;
        suggestion = 'Enter in state/national competitions to gain exposure';
        break;
      case 'future_national':
        confidence_score = (perf * 0.35 + fitness * 0.25 + coaching * 0.2 + ranking * 0.1 + att * 0.1) * (a.age < 22 ? 1.15 : 1);
        reason = `Consistent performance, coach rating, ranking score`;
        suggestion = 'Nominate for national camp trials';
        break;
      default:
        confidence_score = perf;
        reason = 'General scoring';
        suggestion = 'Review individually';
    }

    return {
      ...a,
      confidence_score: Math.min(100, Math.max(0, Number(confidence_score.toFixed(2)))),
      reason,
      improvement_suggestions: suggestion,
    };
  });

  // For underperforming list sort ascending, otherwise descending
  const isAsc = list_type === 'underperforming';
  scored.sort((a, b) => isAsc
    ? a.confidence_score - b.confidence_score
    : b.confidence_score - a.confidence_score
  );

  return scored.slice(0, Number(limit));
};

module.exports = {
  listAthletes, getAthleteById, createAthlete, updateAthlete,
  archiveAthlete, restoreAthlete, deleteAthlete, bulkDelete, bulkUpdate,
  exportAthletes, generateAiList,
};
