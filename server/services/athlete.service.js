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
  sport_ids,
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
  if (sport_ids && Array.isArray(sport_ids) && sport_ids.length > 0) {
    where.push(`a.sport_id IN (${sport_ids.map(() => '?').join(',')})`);
    params.push(...sport_ids);
  } else if (sport_id) {
    where.push('a.sport_id = ?');
    params.push(sport_id);
  }
  if (category_id) { where.push('a.category_id = ?'); params.push(category_id); }
  if (gender) { where.push('a.gender = ?'); params.push(gender); }
  if (medical_status) { where.push('a.medical_status = ?'); params.push(medical_status); }
  if (coach_id !== undefined && coach_id !== null && coach_id !== '') { where.push('a.coach_id = ?'); params.push(coach_id); }

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

  // Parallel fetch of all sub-datasets
  const [
    [medical],
    [achievements],
    [history],
    [performance],
    [fitness],
    [attendanceStats],
    [remarks],
    [rankings],
    [injuries],
    [selections],
  ] = await Promise.all([
    pool.query('SELECT * FROM athlete_medical_history WHERE athlete_id = ? ORDER BY record_date DESC LIMIT 15', [id]),
    pool.query('SELECT ah.*, s.name AS sport_name FROM athlete_achievements ah LEFT JOIN sports s ON s.id = ah.sport_id WHERE ah.athlete_id = ? ORDER BY ah.achievement_date DESC LIMIT 20', [id]),
    pool.query('SELECT ah.*, CONCAT(u.first_name," ",u.last_name) AS changed_by_name FROM athlete_history ah LEFT JOIN users u ON u.id = ah.changed_by WHERE ah.athlete_id = ? ORDER BY ah.created_at DESC LIMIT 30', [id]),
    pool.query('SELECT pr.*, s.name AS sport_name FROM performance_records pr LEFT JOIN sports s ON pr.sport_id=s.id WHERE pr.athlete_id = ? ORDER BY pr.record_date DESC LIMIT 25', [id]),
    pool.query('SELECT fa.* FROM fitness_assessments fa WHERE fa.athlete_id = ? ORDER BY fa.assessment_date DESC LIMIT 25', [id]),
    pool.query(`
      SELECT COUNT(*) AS total_sessions,
             SUM(status = 'present') AS present_count,
             SUM(status = 'absent') AS absent_count,
             SUM(status = 'leave') AS leave_count,
             ROUND(SUM(status = 'present') / NULLIF(COUNT(*), 0) * 100, 1) AS attendance_rate
      FROM attendance WHERE athlete_id = ?`, [id]),
    pool.query(`
      SELECT cr.*, CONCAT(u.first_name, ' ', u.last_name) AS coach_name
      FROM coach_remarks cr
      LEFT JOIN coaches co ON cr.coach_id = co.id
      LEFT JOIN users u ON co.user_id = u.id
      WHERE cr.athlete_id = ?
      ORDER BY cr.remark_date DESC, cr.id DESC LIMIT 25`, [id]),
    pool.query('SELECT * FROM rankings WHERE athlete_id = ? ORDER BY rank_date DESC LIMIT 5', [id]),
    pool.query('SELECT * FROM injuries WHERE athlete_id = ? ORDER BY injury_date DESC LIMIT 15', [id]),
    pool.query('SELECT sel.* FROM selections sel WHERE sel.athlete_id = ? ORDER BY sel.selection_date DESC, sel.id DESC LIMIT 15', [id]),
  ]);

  const latestMedReason = medical.length > 0 ? (medical[0].notes || medical[0].condition_name) : null;
  const overallRank = rankings.find(r => r.rank_type === 'overall') || rankings[0] || null;

  return {
    ...athlete,
    medical_reason: latestMedReason,
    medical_history: medical,
    achievements,
    history,
    performance_records: performance,
    fitness_assessments: fitness,
    attendance_stats: attendanceStats[0] || { total_sessions: 0, present_count: 0, absent_count: 0, attendance_rate: 0 },
    coach_remarks: remarks,
    rankings,
    overall_rank: overallRank?.rank_position || null,
    overall_ranking_score: overallRank?.overall_ranking_score || null,
    injuries,
    selections,
  };
};

// ─── Create athlete ─────────────────────────────────────────
const createAthlete = async (data, createdBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const athlete_code = data.athlete_code || await generateCode('ATH', conn);

    // Resolve sport_id from sport_name if needed
    let sport_id = data.sport_id ? Number(data.sport_id) : null;
    if (!sport_id && (data.sport_name || data.sport)) {
      const sportSearch = (data.sport_name || data.sport).trim();
      const [sports] = await conn.query(`SELECT id FROM sports WHERE LOWER(name) = LOWER(?) LIMIT 1`, [sportSearch]);
      if (sports.length > 0) sport_id = sports[0].id;
    }

    // Resolve category_id from category_name if needed
    let category_id = data.category_id ? Number(data.category_id) : null;
    if (!category_id && (data.category_name || data.category)) {
      const catSearch = (data.category_name || data.category).trim();
      const [cats] = await conn.query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`, [catSearch]);
      if (cats.length > 0) category_id = cats[0].id;
    }

    // Resolve coach_id from coach_name / coach_email if needed
    let coach_id = data.coach_id ? Number(data.coach_id) : null;
    if (!coach_id && (data.coach_name || data.coach_email)) {
      const [coaches] = await conn.query(
        `SELECT c.id FROM coaches c
         JOIN users u ON c.user_id = u.id
         WHERE LOWER(CONCAT(u.first_name, ' ', u.last_name)) = LOWER(?) OR LOWER(u.email) = LOWER(?) LIMIT 1`,
        [data.coach_name || '', data.coach_email || '']
      );
      if (coaches.length > 0) coach_id = coaches[0].id;
    }

    // 1. Prepare and validate email
    let email = data.email?.trim();
    if (!email || !email.includes('@')) {
      const cleanFirst = (data.first_name || 'athlete').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = (data.last_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      email = `${cleanFirst}.${cleanLast}.${randomSuffix}@sportsinsight.academy`;
    }

    // Check if email already exists; if so, generate unique alias to avoid import failure
    const [existingUser] = await conn.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existingUser.length > 0) {
      const [namePart, domain] = email.split('@');
      email = `${namePart}.${Math.floor(100 + Math.random() * 900)}@${domain || 'sportsinsight.academy'}`;
    }

    const firstName = (data.first_name || 'Athlete').trim();
    const lastName = (data.last_name || '').trim();
    const phone = data.phone ? String(data.phone).trim() : null;

    const bcrypt = require('bcryptjs');
    const defaultPassword = `Sports@${new Date().getFullYear()}`;
    const hash = await bcrypt.hash(defaultPassword, 12);

    const [userResult] = await conn.query(
      `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
       VALUES ((SELECT id FROM roles WHERE name='athlete' LIMIT 1), ?, ?, ?, ?, ?, ?, 1)`,
      [email, email, hash, firstName, lastName, phone]
    );
    const userId = userResult.insertId;

    // Normalize gender
    const validGenders = ['male', 'female', 'other'];
    const gender = validGenders.includes((data.gender || '').toLowerCase()) ? data.gender.toLowerCase() : 'male';

    // Normalize medical status
    const validMed = ['fit', 'unfit', 'injured', 'under_observation'];
    const medStatus = validMed.includes((data.medical_status || '').toLowerCase().replace(/ /g, '_'))
      ? data.medical_status.toLowerCase().replace(/ /g, '_')
      : 'fit';

    // Normalize dates
    const parseDbDate = (d) => {
      if (!d) return null;
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0, 10);
      try {
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
      } catch (_) {}
      return null;
    };

    const dob = parseDbDate(data.date_of_birth || data.dob);
    const joiningDate = parseDbDate(data.joining_date) || new Date().toISOString().split('T')[0];
    const heightCm = data.height_cm ? parseFloat(data.height_cm) || null : null;
    const weightKg = data.weight_kg ? parseFloat(data.weight_kg) || null : null;

    // 2. Create athlete record
    const [athResult] = await conn.query(
      `INSERT INTO athletes (user_id, coach_id, sport_id, category_id, athlete_code,
        date_of_birth, gender, height_cm, weight_kg, blood_group, address, city, state,
        district, pincode, academy_name, guardian_name, guardian_phone,
        registration_date, joining_date, medical_status, current_status, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?,?,?,1)`,
      [
        userId, coach_id, sport_id, category_id, athlete_code,
        dob, gender, heightCm, weightKg, data.blood_group || null,
        data.address || null, data.city || null, data.state || null,
        data.district || null, data.pincode || null, data.academy_name || 'State Sports Academy',
        data.guardian_name || null, data.guardian_phone || null,
        joiningDate, medStatus,
        data.current_status || 'active',
      ]
    );
    const athleteId = athResult.insertId;

    if (medStatus !== 'fit' && data.medical_reason) {
      await conn.query(
        `INSERT INTO athlete_medical_history (athlete_id, record_date, condition_type, condition_name, notes, cleared_to_play)
         VALUES (?, CURDATE(), ?, ?, ?, ?)`,
        [
          athleteId,
          medStatus === 'injured' ? 'injury' : 'illness',
          data.medical_reason.slice(0, 255),
          data.medical_reason,
          medStatus === 'fit' ? 1 : 0,
        ]
      );
    }

    // 3. History
    await conn.query(
      `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
      [athleteId, 'created', `Athlete profile created with code ${athlete_code}`, createdBy || null]
    );

    await conn.commit();

    // Trigger Notifications
    try {
      const notificationService = require('./notification.service');
      await notificationService.notifyUser(
        userId,
        'Welcome to SportsInsight!',
        `Your athlete profile has been registered with ID ${athlete_code}. You are ready to log attendance, performance, and view your ranking.`,
        'success',
        '/dashboard'
      );

      if (coach_id) {
        await notificationService.notifyCoach(
          coach_id,
          'New Athlete Assigned',
          `Athlete ${firstName} ${lastName} (${athlete_code}) has been assigned to your coaching roster.`,
          'info',
          `/athletes/${athleteId}`
        );
      }

      if (medStatus !== 'fit') {
        await notificationService.notifyRole(
          'admin',
          '⚠️ Athlete Medical Advisory',
          `Athlete ${firstName} ${lastName} was registered with status: ${medStatus.toUpperCase()} (${data.medical_reason || 'No diagnosis'}).`,
          'warning',
          `/athletes/${athleteId}`
        );
      }
    } catch (notifErr) {
      console.error('[Notification Trigger Warning] Athlete created notification:', notifErr.message);
    }

    return { id: athleteId, athlete_code, email, defaultPassword };
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

    if (data.medical_status !== undefined && data.medical_status !== 'fit' && data.medical_reason) {
      await conn.query(
        `INSERT INTO athlete_medical_history (athlete_id, record_date, condition_type, condition_name, notes, cleared_to_play)
         VALUES (?, CURDATE(), ?, ?, ?, ?)`,
        [
          id,
          data.medical_status === 'injured' ? 'injury' : 'illness',
          data.medical_reason.slice(0, 255),
          data.medical_reason,
          data.medical_status === 'fit' ? 1 : 0,
        ]
      );
    }

    const historyDesc = data.medical_status && data.medical_status !== 'fit' && data.medical_reason
      ? `Athlete profile updated. Medical: ${data.medical_status} (${data.medical_reason})`
      : 'Athlete profile updated';

    await conn.query(
      `INSERT INTO athlete_history (athlete_id, action_type, description, changed_by) VALUES (?,?,?,?)`,
      [id, 'updated', historyDesc, updatedBy]
    );

    await conn.commit();

    // Trigger update notifications
    try {
      const notificationService = require('./notification.service');
      await notificationService.notifyAthlete(
        id,
        'Profile Updated',
        'Your athlete profile information has been updated.',
        'info',
        '/profile'
      );

      if (data.medical_status !== undefined && data.medical_status !== 'fit') {
        const [athRows] = await pool.query('SELECT coach_id, first_name, last_name FROM athletes a JOIN users u ON a.user_id=u.id WHERE a.id = ?', [id]);
        const athName = athRows.length > 0 ? `${athRows[0].first_name} ${athRows[0].last_name}` : `Athlete ID ${id}`;
        
        if (athRows.length > 0 && athRows[0].coach_id) {
          await notificationService.notifyCoach(
            athRows[0].coach_id,
            '🚨 Medical Status Update',
            `Athlete ${athName} medical status was set to ${data.medical_status.toUpperCase()}: ${data.medical_reason || ''}`,
            'warning',
            `/athletes/${id}`
          );
        }
        await notificationService.notifyRole(
          'admin',
          '🚨 Medical Status Update',
          `Athlete ${athName} medical status was set to ${data.medical_status.toUpperCase()}: ${data.medical_reason || ''}`,
          'warning',
          `/athletes/${id}`
        );
      }
    } catch (notifErr) {
      console.error('[Notification Trigger Warning] Athlete updated notification:', notifErr.message);
    }

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

  try {
    const notificationService = require('./notification.service');
    await notificationService.notifyAthlete(
      id,
      'Account Archived',
      'Your athlete profile has been archived by the academy administration.',
      'warning',
      '/dashboard'
    );
  } catch (_) {}
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
  const [rows] = await pool.query('SELECT user_id FROM athletes WHERE id = ?', [id]);
  if (rows.length > 0) {
    await pool.query('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
  } else {
    await pool.query(`DELETE FROM athletes WHERE id = ?`, [id]);
  }
};

// ─── Bulk operations ────────────────────────────────────────
const bulkDelete = async (ids) => {
  if (!ids || !ids.length) return;
  const [rows] = await pool.query('SELECT user_id FROM athletes WHERE id IN (?)', [ids]);
  if (rows.length > 0) {
    const userIds = rows.map((r) => r.user_id);
    await pool.query('DELETE FROM users WHERE id IN (?)', [userIds]);
  }
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
