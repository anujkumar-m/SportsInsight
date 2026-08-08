const { pool } = require('../config/database');
const { syncAthleteCentralData } = require('./centralSync.service');

// ─── AI Attendance Analysis Engine ─────────────────────────────
async function runAIAttendanceAnalysis(athleteId) {
  try {
    const [logs] = await pool.query(
      `SELECT status, attendance_date FROM attendance 
       WHERE athlete_id = ? 
       ORDER BY attendance_date DESC LIMIT 60`,
      [athleteId]
    );

    const totalDays = logs.length;
    if (totalDays === 0) {
      return {
        consistencyScore: 100,
        attendanceGrade: 'A+',
        confidenceScore: 70,
        improvementSuggestions: ['Maintain regular attendance.'],
        alerts: [],
        selectionImpact: 'Positive',
        trainingCommitmentScore: 100,
        attendanceRisk: 'Low'
      };
    }

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let halfDayCount = 0;
    let lateCount = 0;

    const recent14Days = logs.slice(0, 14);
    let recentAbsences = 0;
    let consecutiveLeaves = 0;
    let maxConsecutiveLeaves = 0;

    for (const log of logs) {
      if (log.status === 'present') presentCount++;
      else if (log.status === 'absent') absentCount++;
      else if (log.status === 'leave') {
        leaveCount++;
        consecutiveLeaves++;
        if (consecutiveLeaves > maxConsecutiveLeaves) maxConsecutiveLeaves = consecutiveLeaves;
      } else if (log.status === 'half_day') halfDayCount++;
      else if (log.status === 'late') lateCount++;

      if (log.status !== 'leave') consecutiveLeaves = 0;
    }

    for (const log of recent14Days) {
      if (log.status === 'absent') recentAbsences++;
    }

    const weightedPresent = presentCount + 0.5 * halfDayCount + 0.75 * lateCount;
    const attendancePct = Math.round((weightedPresent / totalDays) * 100 * 100) / 100;

    // Consistency score (deducts heavily for unexcused absences and irregular patterns)
    const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (absentCount * 8) - (lateCount * 3) - (halfDayCount * 4))));

    // Training Commitment Score
    const trainingCommitmentScore = Math.round((attendancePct * 0.7 + consistencyScore * 0.3) * 100) / 100;

    // Grade
    let attendanceGrade = 'A+';
    if (attendancePct >= 95) attendanceGrade = 'A+';
    else if (attendancePct >= 85) attendanceGrade = 'A';
    else if (attendancePct >= 75) attendanceGrade = 'B';
    else if (attendancePct >= 65) attendanceGrade = 'C';
    else attendanceGrade = 'D';

    // Alerts
    const alerts = [];
    if (attendancePct < 75) {
      alerts.push({ type: 'warning', title: 'Low Attendance Alert', message: `Overall attendance (${attendancePct}%) has fallen below 75% threshold.` });
    }
    if (recentAbsences >= 3) {
      alerts.push({ type: 'danger', title: 'Frequent Absences Alert', message: `Athlete accumulated ${recentAbsences} unexcused absences in the last 14 days.` });
    }
    if (maxConsecutiveLeaves >= 5) {
      alerts.push({ type: 'info', title: 'Long Leave Alert', message: `Athlete took ${maxConsecutiveLeaves} consecutive leave days.` });
    }

    // Selection Impact & Risk
    let selectionImpact = 'Positive';
    let attendanceRisk = 'Low';

    if (attendancePct < 70 || recentAbsences >= 3) {
      selectionImpact = 'Negative';
      attendanceRisk = 'High';
    } else if (attendancePct < 85 || recentAbsences >= 2) {
      selectionImpact = 'Neutral';
      attendanceRisk = 'Medium';
    }

    const improvementSuggestions = [];
    if (recentAbsences > 0) improvementSuggestions.push('Ensure prior notice is submitted for planned absences.');
    if (lateCount > 2) improvementSuggestions.push('Improve punctuality for morning drill sessions.');
    if (improvementSuggestions.length === 0) improvementSuggestions.push('Outstanding commitment! Keep up regular training attendance.');

    return {
      attendancePercentage: attendancePct,
      consistencyScore,
      attendanceGrade,
      confidenceScore: totalDays >= 10 ? 92 : 75,
      trainingCommitmentScore,
      selectionImpact,
      attendanceRisk,
      alerts,
      improvementSuggestions
    };
  } catch (err) {
    console.error('Error in runAIAttendanceAnalysis:', err);
    return {
      consistencyScore: 80,
      attendanceGrade: 'B',
      confidenceScore: 60,
      improvementSuggestions: ['Maintain regular participation.'],
      alerts: []
    };
  }
}

// ─── Service Functions ─────────────────────────────────────────

async function getAttendanceRecords(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  if (filters.athleteId) {
    whereClauses.push('att.athlete_id = ?');
    params.push(filters.athleteId);
  }
  if (filters.date) {
    whereClauses.push('att.attendance_date = ?');
    params.push(filters.date);
  }
  if (filters.dateFrom) {
    whereClauses.push('att.attendance_date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    whereClauses.push('att.attendance_date <= ?');
    params.push(filters.dateTo);
  }
  if (filters.status) {
    whereClauses.push('att.status = ?');
    params.push(filters.status);
  }
  if (filters.search) {
    whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR a.athlete_code LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM attendance att
     JOIN athletes a ON a.id = att.athlete_id
     JOIN users u ON u.id = a.user_id
     WHERE ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await pool.query(
    `SELECT att.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name as sport_name
     FROM attendance att
     JOIN athletes a ON a.id = att.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     WHERE ${whereSql}
     ORDER BY att.attendance_date DESC, u.first_name ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    records: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function markAttendance(data, userId) {
  // Support both single record and bulk array
  const records = Array.isArray(data) ? data : [data];
  if (records.length === 0) throw new Error('No attendance data provided.');

  const todayStr = new Date().toISOString().split('T')[0];

  const processed = [];
  for (const item of records) {
    const { athlete_id, attendance_date, status, remarks } = item;
    if (!athlete_id || !attendance_date || !status) {
      continue;
    }

    // Validation: Future dates are not allowed
    if (attendance_date > todayStr) {
      throw new Error(`Future date ${attendance_date} is not allowed for attendance logging.`);
    }

    // Fetch coach_id
    const [ath] = await pool.query(`SELECT coach_id FROM athletes WHERE id = ?`, [athlete_id]);
    const coach_id = ath[0]?.coach_id || null;

    // Insert or update (upsert)
    await pool.query(
      `INSERT INTO attendance (athlete_id, coach_id, attendance_date, status, remarks)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), coach_id = VALUES(coach_id)`,
      [athlete_id, coach_id, attendance_date, status, remarks || '']
    );

    // Audit log
    await pool.query(
      `INSERT INTO attendance_history (attendance_id, athlete_id, action_type, description, changed_by, new_values)
       VALUES (0, ?, 'updated', ?, ?, ?)`,
      [athlete_id, `Marked attendance as ${status} on ${attendance_date}`, userId || null, JSON.stringify(item)]
    );

    // Sync central intelligence (non-blocking fault tolerant)
    try {
      await syncAthleteCentralData(athlete_id);
    } catch (syncErr) {
      console.error('Central sync non-fatal warning:', syncErr);
    }

    processed.push(athlete_id);
  }

  return { success: true, count: processed.length, message: `Successfully marked attendance for ${processed.length} athlete(s).` };
}

async function updateAttendance(id, data, userId) {
  const [rows] = await pool.query(`SELECT * FROM attendance WHERE id = ?`, [id]);
  if (rows.length === 0) throw new Error('Attendance record not found.');
  const oldRecord = rows[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const { status, remarks, attendance_date } = data;
  const finalDate = attendance_date || oldRecord.attendance_date;

  if (finalDate > todayStr) {
    throw new Error('Future dates are not allowed for attendance.');
  }

  await pool.query(
    `UPDATE attendance SET status = ?, remarks = ?, attendance_date = ? WHERE id = ?`,
    [status || oldRecord.status, remarks !== undefined ? remarks : oldRecord.remarks, finalDate, id]
  );

  await pool.query(
    `INSERT INTO attendance_history (attendance_id, athlete_id, action_type, description, changed_by, old_values, new_values)
     VALUES (?, ?, 'updated', ?, ?, ?, ?)`,
    [id, oldRecord.athlete_id, `Updated attendance record #${id}`, userId || null, JSON.stringify(oldRecord), JSON.stringify(data)]
  );

  try {
    await syncAthleteCentralData(oldRecord.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  const [updated] = await pool.query(`SELECT * FROM attendance WHERE id = ?`, [id]);
  return updated[0];
}

async function deleteAttendance(id, userId) {
  const [rows] = await pool.query(`SELECT * FROM attendance WHERE id = ?`, [id]);
  if (rows.length === 0) throw new Error('Attendance record not found.');
  const record = rows[0];

  await pool.query(`DELETE FROM attendance WHERE id = ?`, [id]);

  await pool.query(
    `INSERT INTO attendance_history (attendance_id, athlete_id, action_type, description, changed_by, old_values)
     VALUES (?, ?, 'deleted', ?, ?, ?)`,
    [id, record.athlete_id, `Deleted attendance record #${id}`, userId || null, JSON.stringify(record)]
  );

  try {
    await syncAthleteCentralData(record.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }
  return { success: true, message: 'Attendance record deleted.' };
}

async function getAttendanceReport(filters = {}) {
  const { athleteId, sportId, dateFrom, dateTo } = filters;

  let whereClauses = ['1=1'];
  const params = [];

  if (athleteId) {
    whereClauses.push('att.athlete_id = ?');
    params.push(athleteId);
  }
  if (sportId) {
    whereClauses.push('a.sport_id = ?');
    params.push(sportId);
  }
  if (dateFrom) {
    whereClauses.push('att.attendance_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClauses.push('att.attendance_date <= ?');
    params.push(dateTo);
  }

  const whereSql = whereClauses.join(' AND ');

  const [summary] = await pool.query(
    `SELECT 
       a.id as athlete_id, u.first_name, u.last_name, a.athlete_code, s.name as sport_name,
       COUNT(att.id) as total_days,
       SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) as present_days,
       SUM(CASE WHEN att.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
       SUM(CASE WHEN att.status = 'leave' THEN 1 ELSE 0 END) as leave_days,
       SUM(CASE WHEN att.status = 'half_day' THEN 1 ELSE 0 END) as half_days,
       SUM(CASE WHEN att.status = 'late' THEN 1 ELSE 0 END) as late_days
     FROM athletes a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     LEFT JOIN attendance att ON att.athlete_id = a.id AND ${whereSql}
     WHERE a.is_active = TRUE
     GROUP BY a.id, u.first_name, u.last_name, a.athlete_code, s.name`,
    params
  );

  const reportData = [];
  for (const row of summary) {
    const aiAnalysis = await runAIAttendanceAnalysis(row.athlete_id);
    reportData.push({
      ...row,
      aiAnalysis
    });
  }

  return reportData;
}

module.exports = {
  getAttendanceRecords,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  runAIAttendanceAnalysis
};
