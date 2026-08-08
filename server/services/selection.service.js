const { pool } = require('../config/database');

// ─── Selection Formula: 40% Perf + 30% Fitness + 20% Attendance + 10% Coach ──
function calcSelectionScore({ perf = 0, fitness = 0, attendance = 0, coachRating = 0 }) {
  return Math.round((perf * 0.4 + fitness * 0.3 + attendance * 0.2 + coachRating * 0.1) * 100) / 100;
}

// ─── Generate Recommendations ─────────────────────────────────────────────────
async function generateRecommendations(filters = {}) {
  const { sportId, categoryId, gender, limit = 20 } = filters;
  const params = [];
  let where = 'WHERE a.is_active = 1';
  if (sportId)    { where += ' AND a.sport_id = ?';    params.push(sportId); }
  if (categoryId) { where += ' AND a.category_id = ?'; params.push(categoryId); }
  if (gender)     { where += ' AND a.gender = ?';      params.push(gender); }

  const [athletes] = await pool.query(`
    SELECT a.id AS athlete_id, a.athlete_code, a.gender, a.medical_status,
           u.first_name, u.last_name, u.profile_photo,
           s.name AS sport, cat.name AS category,
           ROUND(AVG(pr.performance_score), 2) AS avg_performance,
           ROUND(AVG(fa.overall_fitness_score), 2) AS avg_fitness,
           ROUND(SUM(att.status='present') / NULLIF(COUNT(DISTINCT att.id),0) * 100, 2) AS attendance_pct,
           ROUND(AVG(cr.rating) * 10, 2) AS coach_rating_norm,
           ROUND(AVG(pr.improvement_rate), 2) AS improvement_rate,
           MAX(inj.availability_status) AS availability_status,
           r.rank_position, r.overall_ranking_score AS ranking_score
    FROM athletes a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    LEFT JOIN categories cat ON a.category_id = cat.id
    LEFT JOIN performance_records pr ON pr.athlete_id = a.id
    LEFT JOIN fitness_assessments fa ON fa.athlete_id = a.id
    LEFT JOIN attendance att ON att.athlete_id = a.id
    LEFT JOIN coach_remarks cr ON cr.athlete_id = a.id
    LEFT JOIN injuries inj ON inj.athlete_id = a.id
    LEFT JOIN rankings r ON r.athlete_id = a.id AND r.rank_type = 'overall'
    ${where} GROUP BY a.id`, params);

  const scored = athletes.map(ath => {
    const selectionScore = calcSelectionScore({
      perf: ath.avg_performance || 0,
      fitness: ath.avg_fitness || 0,
      attendance: ath.attendance_pct || 0,
      coachRating: ath.coach_rating_norm || 50,
    });
    const confidenceScore = Math.min(100, Math.round(selectionScore * 0.95 + Math.random() * 5));
    const isAvailable = ath.availability_status !== 'unfit' && ath.medical_status !== 'injured';

    let recommendation = 'not_recommended';
    if (selectionScore >= 80) recommendation = 'selected';
    else if (selectionScore >= 65) recommendation = 'recommended';
    else if (selectionScore >= 50) recommendation = 'shortlisted';

    const strengths = [];
    const weaknesses = [];
    if ((ath.avg_performance || 0) >= 80) strengths.push('High Performance');
    else weaknesses.push('Needs Performance Improvement');
    if ((ath.avg_fitness || 0) >= 80) strengths.push('Excellent Fitness');
    else weaknesses.push('Fitness Below Standard');
    if ((ath.attendance_pct || 0) >= 85) strengths.push('Consistent Attendance');
    else weaknesses.push('Low Attendance');

    return {
      ...ath,
      selectionScore,
      confidenceScore,
      recommendation,
      isAvailable,
      strengths,
      weaknesses,
      suggestedImprovements: weaknesses.map(w => `Focus on: ${w}`),
    };
  });

  return scored
    .filter(a => a.isAvailable)
    .sort((a, b) => b.selectionScore - a.selectionScore)
    .slice(0, parseInt(limit));
}

// ─── Get All Selections ───────────────────────────────────────────────────────
async function getSelections(query = {}) {
  const { status, sportId, limit = 50, page = 1 } = query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let where = 'WHERE 1=1';
  if (status)  { where += ' AND sel.status = ?';      params.push(status); }
  if (sportId) { where += ' AND a.sport_id = ?';       params.push(sportId); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM selections sel JOIN athletes a ON sel.athlete_id = a.id ${where}`, params);

  const [selections] = await pool.query(`
    SELECT sel.id, sel.selection_type, sel.selection_date, sel.status,
           sel.performance_score, sel.fitness_score, sel.attendance_score,
           sel.coach_rating, sel.selection_score, sel.confidence_score, sel.remarks,
           u.first_name, u.last_name, u.profile_photo,
           a.athlete_code, a.medical_status,
           s.name AS sport, cat.name AS category,
           sel2.first_name AS selector_first, sel2.last_name AS selector_last
    FROM selections sel
    JOIN athletes a ON sel.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    LEFT JOIN categories cat ON a.category_id = cat.id
    LEFT JOIN selectors selector ON sel.selector_id = selector.id
    LEFT JOIN users sel2 ON selector.user_id = sel2.id
    ${where} ORDER BY sel.selection_score DESC, sel.created_at DESC
    LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

  return { selections, total, page: parseInt(page), limit: parseInt(limit) };
}

// ─── Save Generated Selections ────────────────────────────────────────────────
async function saveSelections(recommendations, selectorId, selectionType, filters) {
  const selectionDate = new Date().toISOString().split('T')[0];
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const inserted = [];
    for (const rec of recommendations) {
      const [result] = await conn.query(`
        INSERT INTO selections
          (athlete_id, selector_id, selection_type, selection_date,
           performance_score, fitness_score, attendance_score, coach_rating,
           selection_score, confidence_score, status, remarks)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [rec.athlete_id, selectorId, selectionType, selectionDate,
         rec.avg_performance || 0, rec.avg_fitness || 0, rec.attendance_pct || 0,
         rec.coach_rating_norm || 50, rec.selectionScore, rec.confidenceScore,
         rec.recommendation,
         `AI Generated: ${rec.strengths.join(', ')}`]);
      inserted.push(result.insertId);
    }
    await conn.commit();
    return { saved: inserted.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Selection History ────────────────────────────────────────────────────────
async function getSelectionHistory(query = {}) {
  const { athleteId, limit = 20 } = query;
  const params = [];
  let where = 'WHERE 1=1';
  if (athleteId) { where += ' AND sel.athlete_id = ?'; params.push(athleteId); }

  const [history] = await pool.query(`
    SELECT sel.selection_date, sel.status, sel.selection_score, sel.confidence_score,
           sel.selection_type, sel.remarks,
           u.first_name, u.last_name, a.athlete_code, s.name AS sport
    FROM selections sel
    JOIN athletes a ON sel.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    ${where} ORDER BY sel.created_at DESC LIMIT ?`, [...params, parseInt(limit)]);

  return history;
}

module.exports = {
  generateRecommendations,
  getSelections,
  saveSelections,
  getSelectionHistory,
  calcSelectionScore,
};
