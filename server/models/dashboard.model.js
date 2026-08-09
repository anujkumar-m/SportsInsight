const { pool } = require('../config/database');

// ─── Admin Dashboard Data ──────────────────────────────────
const getAdminStats = async () => {
  const [athletes] = await pool.query('SELECT COUNT(*) as count FROM athletes WHERE is_active = TRUE');
  const [coaches] = await pool.query('SELECT COUNT(*) as count FROM coaches WHERE is_active = TRUE');
  const [selectors] = await pool.query('SELECT COUNT(*) as count FROM selectors WHERE is_active = TRUE');
  const [sports] = await pool.query('SELECT COUNT(*) as count FROM sports WHERE is_active = TRUE');
  const [categories] = await pool.query('SELECT COUNT(*) as count FROM categories WHERE is_active = TRUE');
  const [todayAttendance] = await pool.query(
    "SELECT COUNT(*) as count FROM attendance WHERE attendance_date = CURDATE() AND status = 'present'"
  );
  const [activeInjuries] = await pool.query(
    "SELECT COUNT(*) as count FROM injuries WHERE recovery_status IN ('recovering', 'chronic')"
  );

  return {
    totalAthletes: athletes[0].count,
    totalCoaches: coaches[0].count,
    totalSelectors: selectors[0].count,
    totalSports: sports[0].count,
    totalCategories: categories[0].count,
    todayAttendance: todayAttendance[0].count,
    activeInjuries: activeInjuries[0].count,
  };
};

const getTopRankedAthletes = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT r.rank_position, r.overall_ranking_score, r.rank_type,
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name AS sport_name, c.name AS category_name
     FROM rankings r
     JOIN athletes a ON r.athlete_id = a.id
     JOIN users u ON a.user_id = u.id
     LEFT JOIN sports s ON r.sport_id = s.id
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.rank_type = 'overall'
     ORDER BY r.overall_ranking_score DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const getPerformanceTrend = async (months = 6) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(record_date, '%Y-%m') AS month,
            AVG(performance_score) AS avg_score,
            COUNT(*) AS record_count
     FROM performance_records
     WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY DATE_FORMAT(record_date, '%Y-%m')
     ORDER BY month ASC`,
    [months]
  );
  return rows;
};

// Keep raw daily trend for any other consumers
const getAttendanceTrend = async (days = 30) => {
  const [rows] = await pool.query(
    `SELECT attendance_date AS date,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) AS on_leave,
            COUNT(*) AS total
     FROM attendance
     WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY attendance_date
     ORDER BY attendance_date ASC`,
    [days]
  );
  return rows;
};

// Monthly attendance percentage — aligned with performanceTrend and fitnessTrend
const getAttendanceMonthlyTrend = async (months = 6) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(attendance_date, '%Y-%m') AS month,
            ROUND(
              100.0 * SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*),
            1) AS avg_attendance
     FROM attendance
     WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
     ORDER BY month ASC`,
    [months]
  );
  return rows;
};

const getFitnessTrend = async (months = 6) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(assessment_date, '%Y-%m') AS month,
            AVG(overall_fitness_score) AS avg_fitness,
            AVG(strength_score) AS avg_strength,
            AVG(endurance_score) AS avg_endurance,
            AVG(agility_score) AS avg_agility
     FROM fitness_assessments
     WHERE assessment_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY DATE_FORMAT(assessment_date, '%Y-%m')
     ORDER BY month ASC`,
    [months]
  );
  return rows;
};

const getSportWisePerformance = async () => {
  const [rows] = await pool.query(
    `SELECT s.name AS sport_name, 
            COUNT(DISTINCT a.id) AS athlete_count,
            AVG(pr.performance_score) AS avg_performance
     FROM sports s
     LEFT JOIN athletes a ON a.sport_id = s.id AND a.is_active = TRUE
     LEFT JOIN performance_records pr ON pr.sport_id = s.id
     WHERE s.is_active = TRUE
     GROUP BY s.id, s.name
     ORDER BY avg_performance DESC`
  );
  return rows;
};

const getRankingDistribution = async () => {
  const [rows] = await pool.query(
    `SELECT 
       SUM(CASE WHEN overall_ranking_score >= 85 THEN 1 ELSE 0 END) AS elite,
       SUM(CASE WHEN overall_ranking_score >= 70 AND overall_ranking_score < 85 THEN 1 ELSE 0 END) AS advanced,
       SUM(CASE WHEN overall_ranking_score >= 55 AND overall_ranking_score < 70 THEN 1 ELSE 0 END) AS intermediate,
       SUM(CASE WHEN overall_ranking_score < 55 THEN 1 ELSE 0 END) AS beginner
     FROM rankings
     WHERE rank_type = 'overall'`
  );
  return rows[0];
};

const getRecentActivities = async (limit = 15) => {
  const activities = [];

  // Recent performance records
  const [perf] = await pool.query(
    `SELECT 'performance' AS type, 
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            pr.metric_name AS detail, pr.performance_score AS score,
            pr.created_at AS timestamp
     FROM performance_records pr
     JOIN athletes a ON pr.athlete_id = a.id
     JOIN users u ON a.user_id = u.id
     ORDER BY pr.created_at DESC LIMIT 5`
  );

  // Recent fitness assessments
  const [fit] = await pool.query(
    `SELECT 'fitness' AS type,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            'Fitness Assessment' AS detail, fa.overall_fitness_score AS score,
            fa.created_at AS timestamp
     FROM fitness_assessments fa
     JOIN athletes a ON fa.athlete_id = a.id
     JOIN users u ON a.user_id = u.id
     ORDER BY fa.created_at DESC LIMIT 5`
  );

  // Recent user registrations
  const [users] = await pool.query(
    `SELECT 'registration' AS type,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            r.name AS detail, NULL AS score, u.created_at AS timestamp
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC LIMIT 5`
  );

  activities.push(...perf, ...fit, ...users);
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, limit);
};

// ─── Coach Dashboard Data ──────────────────────────────────
const getCoachStats = async (coachId) => {
  const [athletes] = await pool.query(
    'SELECT COUNT(*) as count FROM athletes WHERE coach_id = ? AND is_active = TRUE',
    [coachId]
  );
  const [todayAttendance] = await pool.query(
    `SELECT COUNT(*) as count FROM attendance att
     JOIN athletes a ON att.athlete_id = a.id
     WHERE a.coach_id = ? AND att.attendance_date = CURDATE() AND att.status = 'present'`,
    [coachId]
  );
  const [pendingAssessments] = await pool.query(
    `SELECT COUNT(DISTINCT a.id) as count FROM athletes a
     LEFT JOIN fitness_assessments fa ON fa.athlete_id = a.id AND fa.assessment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     WHERE a.coach_id = ? AND a.is_active = TRUE AND fa.id IS NULL`,
    [coachId]
  );

  return {
    assignedAthletes: athletes[0].count,
    todayAttendance: todayAttendance[0].count,
    pendingAssessments: pendingAssessments[0].count,
  };
};

const getCoachAthletes = async (coachId, limit = 10) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.athlete_code, u.first_name, u.last_name, u.profile_photo,
            s.name AS sport_name, c.name AS category_name,
            (SELECT AVG(performance_score) FROM performance_records pr WHERE pr.athlete_id = a.id) AS avg_performance,
            (SELECT MAX(overall_fitness_score) FROM fitness_assessments fa WHERE fa.athlete_id = a.id) AS latest_fitness
     FROM athletes a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN sports s ON a.sport_id = s.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.coach_id = ? AND a.is_active = TRUE
     LIMIT ?`,
    [coachId, limit]
  );
  return rows;
};

// ─── Selector Dashboard Data ───────────────────────────────
const getSelectorStats = async () => {
  const [topAthletes] = await pool.query(
    `SELECT COUNT(*) as count FROM rankings WHERE rank_position <= 10 AND rank_type = 'overall'`
  );
  const [selections] = await pool.query(
    "SELECT COUNT(*) as count FROM selections WHERE status IN ('recommended', 'selected')"
  );
  const [sports] = await pool.query('SELECT COUNT(*) as count FROM sports WHERE is_active = TRUE');

  return {
    topRankedCount: topAthletes[0].count,
    totalSelections: selections[0].count,
    activeSports: sports[0].count,
  };
};

const getSelectionRecommendations = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT sel.selection_score, sel.confidence_score, sel.status, sel.selection_type,
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name AS sport_name, c.name AS category_name
     FROM selections sel
     JOIN athletes a ON sel.athlete_id = a.id
     JOIN users u ON a.user_id = u.id
     LEFT JOIN sports s ON a.sport_id = s.id
     LEFT JOIN categories c ON a.category_id = c.id
     ORDER BY sel.selection_score DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

// ─── Athlete Dashboard Data ────────────────────────────────
const getAthleteStats = async (userId) => {
  const [athleteRow] = await pool.query(
    `SELECT a.id, a.athlete_code, a.height_cm, a.weight_kg, a.date_of_birth,
            s.name AS sport_name, c.name AS category_name,
            co_u.first_name AS coach_first, co_u.last_name AS coach_last
     FROM athletes a
     LEFT JOIN sports s ON a.sport_id = s.id
     LEFT JOIN categories c ON a.category_id = c.id
     LEFT JOIN coaches co ON a.coach_id = co.id
     LEFT JOIN users co_u ON co.user_id = co_u.id
     WHERE a.user_id = ?`,
    [userId]
  );

  if (athleteRow.length === 0) return null;
  const athlete = athleteRow[0];

  const [attendance] = await pool.query(
    `SELECT 
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
     FROM attendance WHERE athlete_id = ?`,
    [athlete.id]
  );

  const [ranking] = await pool.query(
    `SELECT rank_position, overall_ranking_score, rank_type
     FROM rankings WHERE athlete_id = ? AND rank_type = 'overall' ORDER BY rank_date DESC LIMIT 1`,
    [athlete.id]
  );

  const [latestFitness] = await pool.query(
    `SELECT overall_fitness_score, assessment_date FROM fitness_assessments
     WHERE athlete_id = ? ORDER BY assessment_date DESC LIMIT 1`,
    [athlete.id]
  );

  const [latestPerformance] = await pool.query(
    `SELECT AVG(performance_score) AS avg_score FROM performance_records WHERE athlete_id = ?`,
    [athlete.id]
  );

  const attendancePct =
    attendance[0].total > 0
      ? Math.round((attendance[0].present / attendance[0].total) * 100)
      : 0;

  return {
    athlete,
    attendancePercentage: attendancePct,
    ranking: ranking[0] || null,
    latestFitness: latestFitness[0] || null,
    avgPerformance: latestPerformance[0]?.avg_score || 0,
  };
};

const getAthletePerformanceHistory = async (athleteId, months = 6) => {
  const [rows] = await pool.query(
    `SELECT metric_name, metric_value, metric_unit, performance_score, record_date
     FROM performance_records
     WHERE athlete_id = ? AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     ORDER BY record_date ASC`,
    [athleteId, months]
  );
  return rows;
};

const getAthleteCoachRemarks = async (athleteId, limit = 5) => {
  const [rows] = await pool.query(
    `SELECT cr.remark_type, cr.rating, cr.remarks, cr.remark_date,
            u.first_name AS coach_first, u.last_name AS coach_last
     FROM coach_remarks cr
     JOIN coaches co ON cr.coach_id = co.id
     JOIN users u ON co.user_id = u.id
     WHERE cr.athlete_id = ?
     ORDER BY cr.remark_date DESC
     LIMIT ?`,
    [athleteId, limit]
  );
  return rows;
};

module.exports = {
  getAdminStats,
  getTopRankedAthletes,
  getPerformanceTrend,
  getAttendanceTrend,
  getAttendanceMonthlyTrend,
  getFitnessTrend,
  getSportWisePerformance,
  getRankingDistribution,
  getRecentActivities,
  getCoachStats,
  getCoachAthletes,
  getSelectorStats,
  getSelectionRecommendations,
  getAthleteStats,
  getAthletePerformanceHistory,
  getAthleteCoachRemarks,
};
