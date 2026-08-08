const { pool } = require('../config/database');

async function safeQuery(sql, params = [], fallback = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error(`Analytics query error (${sql.slice(0, 40)}...):`, err.message);
    return fallback;
  }
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────
async function getDashboardAnalytics() {
  const [athletesRows] = await safeQuery(`
    SELECT
      COUNT(*) AS total,
      SUM(is_active = 1 AND current_status = 'active') AS active,
      SUM(current_status = 'archived') AS archived,
      SUM(medical_status = 'injured') AS injured
    FROM athletes`);

  const [perfRows] = await safeQuery(`
    SELECT
      ROUND(AVG(performance_score), 2) AS avg_score,
      COUNT(*) AS total_records,
      ROUND(AVG(improvement_rate), 2) AS avg_improvement
    FROM performance_records`);

  const [fitRows] = await safeQuery(`
    SELECT
      ROUND(AVG(overall_fitness_score), 2) AS avg_score,
      ROUND(AVG(bmi), 2) AS avg_bmi,
      COUNT(*) AS total_assessments
    FROM fitness_assessments`);

  const [attRows] = await safeQuery(`
    SELECT
      COUNT(*) AS total_records,
      ROUND(SUM(status = 'present') / COUNT(*) * 100, 2) AS attendance_pct,
      ROUND(SUM(status = 'absent') / COUNT(*) * 100, 2) AS absent_pct
    FROM attendance`);

  const [injRows] = await safeQuery(`
    SELECT
      COUNT(*) AS total,
      SUM(recovery_status = 'recovering') AS active_injuries,
      SUM(availability_status = 'fit') AS fit_athletes,
      SUM(availability_status = 'unfit') AS unfit_athletes
    FROM injuries`);

  const [selRows] = await safeQuery(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'selected') AS selected,
      SUM(status = 'recommended') AS recommended,
      ROUND(AVG(selection_score), 2) AS avg_score
    FROM selections`);

  const sportBreakdown = await safeQuery(`
    SELECT s.name AS sport, COUNT(a.id) AS athlete_count
    FROM athletes a
    JOIN sports s ON a.sport_id = s.id
    WHERE a.is_active = 1
    GROUP BY s.id, s.name ORDER BY athlete_count DESC`);

  const recentActivity = await safeQuery(`
    SELECT 'performance' AS type, record_date AS date, athlete_id
    FROM performance_records ORDER BY created_at DESC LIMIT 5`);

  return {
    athletes: athletesRows[0] || { total: 0, active: 0, archived: 0, injured: 0 },
    performance: perfRows[0] || { avg_score: 0, total_records: 0, avg_improvement: 0 },
    fitness: fitRows[0] || { avg_score: 0, avg_bmi: 0, total_assessments: 0 },
    attendance: attRows[0] || { total_records: 0, attendance_pct: 0, absent_pct: 0 },
    injuries: injRows[0] || { total: 0, active_injuries: 0, fit_athletes: 0, unfit_athletes: 0 },
    selections: selRows[0] || { total: 0, selected: 0, recommended: 0, avg_score: 0 },
    sportBreakdown,
    recentActivity,
  };
}

// ─── Performance Analytics ────────────────────────────────────────────────────
async function getPerformanceAnalytics(query = {}) {
  const { sportId, coachId, dateFrom, dateTo, limit = 100 } = query;
  const params = [];
  let where = 'WHERE 1=1';
  if (sportId)   { where += ' AND pr.sport_id = ?'; params.push(sportId); }
  if (coachId)   { where += ' AND pr.coach_id = ?'; params.push(coachId); }
  if (dateFrom)  { where += ' AND pr.record_date >= ?'; params.push(dateFrom); }
  if (dateTo)    { where += ' AND pr.record_date <= ?'; params.push(dateTo); }

  const records = await safeQuery(`
    SELECT pr.record_date, pr.metric_name, pr.metric_value, pr.performance_score,
           pr.improvement_rate,
           a.athlete_code, u.first_name, u.last_name,
           s.name AS sport
    FROM performance_records pr
    JOIN athletes a ON pr.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN sports s ON pr.sport_id = s.id
    ${where} ORDER BY pr.record_date DESC LIMIT ?`, [...params, parseInt(limit)]);

  const trendData = await safeQuery(`
    SELECT DATE_FORMAT(record_date,'%Y-%m') AS month,
           ROUND(AVG(performance_score),2) AS avg_score,
           COUNT(*) AS record_count
    FROM performance_records
    GROUP BY month ORDER BY month ASC LIMIT 12`);

  const topAthletes = await safeQuery(`
    SELECT u.first_name, u.last_name, a.athlete_code,
           ROUND(AVG(pr.performance_score),2) AS avg_score,
           s.name AS sport
    FROM performance_records pr
    JOIN athletes a ON pr.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN sports s ON pr.sport_id = s.id
    GROUP BY a.id ORDER BY avg_score DESC LIMIT 10`);

  const byMetric = await safeQuery(`
    SELECT metric_name, ROUND(AVG(metric_value),4) AS avg_value,
           ROUND(AVG(performance_score),2) AS avg_score, COUNT(*) AS total
    FROM performance_records GROUP BY metric_name ORDER BY total DESC LIMIT 20`);

  return { records, trendData, topAthletes, byMetric };
}

// ─── Fitness Analytics ────────────────────────────────────────────────────────
async function getFitnessAnalytics(query = {}) {
  const { sportId, dateFrom, dateTo } = query;
  const params = [];
  let where = 'WHERE 1=1';
  if (sportId)  { where += ' AND a.sport_id = ?'; params.push(sportId); }
  if (dateFrom) { where += ' AND fa.assessment_date >= ?'; params.push(dateFrom); }
  if (dateTo)   { where += ' AND fa.assessment_date <= ?'; params.push(dateTo); }

  const trendData = await safeQuery(`
    SELECT DATE_FORMAT(assessment_date,'%Y-%m') AS month,
           ROUND(AVG(overall_fitness_score),2) AS avg_fitness,
           ROUND(AVG(strength_score),2) AS avg_strength,
           ROUND(AVG(endurance_score),2) AS avg_endurance,
           ROUND(AVG(agility_score),2) AS avg_agility,
           ROUND(AVG(speed_score),2) AS avg_speed
    FROM fitness_assessments fa
    JOIN athletes a ON fa.athlete_id = a.id
    ${where} GROUP BY month ORDER BY month ASC LIMIT 12`, params);

  const radarDataRows = await safeQuery(`
    SELECT ROUND(AVG(strength_score),2) AS strength,
           ROUND(AVG(endurance_score),2) AS endurance,
           ROUND(AVG(stamina_score),2) AS stamina,
           ROUND(AVG(flexibility_score),2) AS flexibility,
           ROUND(AVG(agility_score),2) AS agility,
           ROUND(AVG(speed_score),2) AS speed,
           ROUND(AVG(balance_score),2) AS balance
    FROM fitness_assessments fa
    JOIN athletes a ON fa.athlete_id = a.id
    ${where}`, params);

  const topFit = await safeQuery(`
    SELECT u.first_name, u.last_name, a.athlete_code,
           ROUND(AVG(fa.overall_fitness_score),2) AS avg_fitness,
           s.name AS sport
    FROM fitness_assessments fa
    JOIN athletes a ON fa.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN sports s ON a.sport_id = s.id
    GROUP BY a.id ORDER BY avg_fitness DESC LIMIT 10`);

  const bmiDistribution = await safeQuery(`
    SELECT CASE
      WHEN bmi < 18.5 THEN 'Underweight'
      WHEN bmi BETWEEN 18.5 AND 24.9 THEN 'Normal'
      WHEN bmi BETWEEN 25 AND 29.9 THEN 'Overweight'
      ELSE 'Obese' END AS bmi_category,
      COUNT(*) AS count
    FROM fitness_assessments WHERE bmi IS NOT NULL GROUP BY bmi_category`);

  return { trendData, radarData: radarDataRows[0] || {}, topFit, bmiDistribution };
}

// ─── Attendance Analytics ─────────────────────────────────────────────────────
async function getAttendanceAnalytics(query = {}) {
  const { sportId, coachId, dateFrom, dateTo } = query;
  const params = [];
  let where = 'WHERE 1=1';
  if (sportId)  { where += ' AND a.sport_id = ?'; params.push(sportId); }
  if (coachId)  { where += ' AND att.coach_id = ?'; params.push(coachId); }
  if (dateFrom) { where += ' AND att.attendance_date >= ?'; params.push(dateFrom); }
  if (dateTo)   { where += ' AND att.attendance_date <= ?'; params.push(dateTo); }

  const trendData = await safeQuery(`
    SELECT DATE_FORMAT(attendance_date,'%Y-%m') AS month,
           COUNT(*) AS total,
           SUM(status='present') AS present,
           SUM(status='absent') AS absent,
           SUM(status='leave') AS leave,
           SUM(status='half_day') AS half_day,
           SUM(status='late') AS late,
           ROUND(SUM(status='present')/COUNT(*)*100,2) AS pct
    FROM attendance att
    JOIN athletes a ON att.athlete_id = a.id
    ${where} GROUP BY month ORDER BY month ASC LIMIT 12`, params);

  const byStatus = await safeQuery(`
    SELECT status, COUNT(*) AS count FROM attendance att
    JOIN athletes a ON att.athlete_id = a.id
    ${where} GROUP BY status`, params);

  const topAttendees = await safeQuery(`
    SELECT u.first_name, u.last_name, a.athlete_code,
           ROUND(SUM(att.status='present')/COUNT(*)*100,2) AS pct,
           s.name AS sport
    FROM attendance att
    JOIN athletes a ON att.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN sports s ON a.sport_id = s.id
    GROUP BY a.id ORDER BY pct DESC LIMIT 10`);

  return { trendData, byStatus, topAttendees };
}

// ─── Injury Analytics ────────────────────────────────────────────────────────
async function getInjuryAnalytics(query = {}) {
  const bySeverity = await safeQuery(`
    SELECT severity, COUNT(*) AS count FROM injuries GROUP BY severity`);

  const byBodyPart = await safeQuery(`
    SELECT body_part, COUNT(*) AS count FROM injuries
    WHERE body_part IS NOT NULL GROUP BY body_part ORDER BY count DESC LIMIT 10`);

  const byStatus = await safeQuery(`
    SELECT recovery_status, COUNT(*) AS count FROM injuries GROUP BY recovery_status`);

  const monthlyTrend = await safeQuery(`
    SELECT DATE_FORMAT(injury_date,'%Y-%m') AS month, COUNT(*) AS total,
           SUM(recovery_status='recovered') AS recovered
    FROM injuries GROUP BY month ORDER BY month ASC LIMIT 12`);

  const availabilityStatus = await safeQuery(`
    SELECT availability_status, COUNT(*) AS count FROM injuries GROUP BY availability_status`);

  return { bySeverity, byBodyPart, byStatus, monthlyTrend, availabilityStatus };
}

// ─── Rankings Analytics ───────────────────────────────────────────────────────
async function getRankingAnalytics(query = {}) {
  const topRanked = await safeQuery(`
    SELECT r.rank_position, r.overall_ranking_score, r.performance_score,
           r.fitness_score, r.consistency_score, r.rank_type,
           u.first_name, u.last_name, a.athlete_code, s.name AS sport
    FROM rankings r
    JOIN athletes a ON r.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON r.sport_id = s.id
    WHERE r.rank_type = 'overall'
    ORDER BY r.rank_position ASC LIMIT 20`);

  const bySport = await safeQuery(`
    SELECT s.name AS sport, ROUND(AVG(r.overall_ranking_score),2) AS avg_score,
           COUNT(DISTINCT r.athlete_id) AS athletes
    FROM rankings r
    JOIN sports s ON r.sport_id = s.id
    GROUP BY s.id ORDER BY avg_score DESC`);

  return { topRanked, bySport };
}

// ─── Selection Analytics ──────────────────────────────────────────────────────
async function getSelectionAnalytics(query = {}) {
  const byStatus = await safeQuery(`
    SELECT status, COUNT(*) AS count, ROUND(AVG(selection_score),2) AS avg_score
    FROM selections GROUP BY status`);

  const trend = await safeQuery(`
    SELECT DATE_FORMAT(selection_date,'%Y-%m') AS month,
           COUNT(*) AS total, SUM(status='selected') AS selected
    FROM selections GROUP BY month ORDER BY month ASC LIMIT 12`);

  const topSelected = await safeQuery(`
    SELECT u.first_name, u.last_name, a.athlete_code,
           s2.name AS sport, sel.selection_score, sel.confidence_score, sel.status
    FROM selections sel
    JOIN athletes a ON sel.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s2 ON a.sport_id = s2.id
    WHERE sel.status IN ('selected','recommended')
    ORDER BY sel.selection_score DESC LIMIT 10`);

  return { byStatus, trend, topSelected };
}

// ─── Sport Analytics ──────────────────────────────────────────────────────────
async function getSportAnalytics(query = {}) {
  const sportSummary = await safeQuery(`
    SELECT s.id, s.name AS sport,
           COUNT(DISTINCT a.id) AS athlete_count,
           ROUND(AVG(pr.performance_score),2) AS avg_performance,
           ROUND(AVG(fa.overall_fitness_score),2) AS avg_fitness
    FROM sports s
    LEFT JOIN athletes a ON a.sport_id = s.id AND a.is_active = 1
    LEFT JOIN performance_records pr ON pr.sport_id = s.id
    LEFT JOIN fitness_assessments fa ON fa.athlete_id = a.id
    GROUP BY s.id, s.name ORDER BY athlete_count DESC`);

  return { sportSummary };
}

// ─── Coach Analytics ──────────────────────────────────────────────────────────
async function getCoachAnalytics(query = {}) {
  const coachStats = await safeQuery(`
    SELECT c.id, u.first_name, u.last_name,
           s.name AS sport,
           COUNT(DISTINCT a.id) AS athlete_count,
           ROUND(AVG(pr.performance_score),2) AS avg_performance,
           ROUND(AVG(fa.overall_fitness_score),2) AS avg_fitness,
           ROUND(SUM(att.status='present')/NULLIF(COUNT(att.id),0)*100,2) AS attendance_pct
    FROM coaches c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN sports s ON c.sport_id = s.id
    LEFT JOIN athletes a ON a.coach_id = c.id AND a.is_active = 1
    LEFT JOIN performance_records pr ON pr.coach_id = c.id
    LEFT JOIN fitness_assessments fa ON fa.coach_id = c.id
    LEFT JOIN attendance att ON att.coach_id = c.id
    GROUP BY c.id ORDER BY avg_performance DESC`);

  return { coachStats };
}

// ─── Athlete Analytics (individual) ──────────────────────────────────────────
async function getAthleteAnalytics(athleteId) {
  const athleteRows = await safeQuery(`
    SELECT a.*, u.first_name, u.last_name, u.email,
           s.name AS sport, c.name AS category
    FROM athletes a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?`, [athleteId]);

  if (athleteRows.length === 0) throw new Error('Athlete not found.');

  const performanceTrend = await safeQuery(`
    SELECT record_date, metric_name, metric_value, performance_score, improvement_rate
    FROM performance_records WHERE athlete_id = ?
    ORDER BY record_date ASC LIMIT 20`, [athleteId]);

  const fitnessTrend = await safeQuery(`
    SELECT assessment_date, overall_fitness_score, strength_score,
           endurance_score, agility_score, speed_score
    FROM fitness_assessments WHERE athlete_id = ?
    ORDER BY assessment_date ASC LIMIT 12`, [athleteId]);

  const attSummaryRows = await safeQuery(`
    SELECT COUNT(*) AS total,
           SUM(status='present') AS present,
           ROUND(SUM(status='present')/COUNT(*)*100,2) AS pct
    FROM attendance WHERE athlete_id = ?`, [athleteId]);

  const injuries = await safeQuery(`
    SELECT injury_type, body_part, severity, recovery_status, injury_date
    FROM injuries WHERE athlete_id = ? ORDER BY injury_date DESC LIMIT 5`, [athleteId]);

  const rankingRows = await safeQuery(`
    SELECT rank_position, overall_ranking_score, performance_score, fitness_score
    FROM rankings WHERE athlete_id = ? AND rank_type = 'overall'
    ORDER BY rank_date DESC LIMIT 1`, [athleteId]);

  return {
    athlete: athleteRows[0],
    performanceTrend,
    fitnessTrend,
    attendanceSummary: attSummaryRows[0] || { total: 0, present: 0, pct: 0 },
    injuries,
    ranking: rankingRows[0] || null,
  };
}

module.exports = {
  getDashboardAnalytics,
  getPerformanceAnalytics,
  getFitnessAnalytics,
  getAttendanceAnalytics,
  getInjuryAnalytics,
  getRankingAnalytics,
  getSelectionAnalytics,
  getSportAnalytics,
  getCoachAnalytics,
  getAthleteAnalytics,
};
