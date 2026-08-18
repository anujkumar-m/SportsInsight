const { pool } = require('../config/database');
const centralSync = require('./centralSync.service');

// ─── Ranking Formula: 50% Perf + 30% Fitness + 20% Consistency ───────────────
function calcConsistencyScore({ attendancePct, stabilityScore, improvementRate, coachRating }) {
  const att   = Math.min(attendancePct || 0, 100);
  const stab  = Math.min(stabilityScore || 50, 100);
  const impr  = Math.min((improvementRate || 0) * 5, 100); // normalise %
  const coach = Math.min((coachRating || 5) * 10, 100);
  return Math.round((att * 0.35 + stab * 0.25 + impr * 0.25 + coach * 0.15) * 100) / 100;
}

// ─── Calculate Rankings for All Athletes ─────────────────────────────────────
async function calculateRankings() {
  // Fetch raw athlete data
  const [athletes] = await pool.query(`
    SELECT a.id AS athlete_id, a.sport_id, a.category_id, a.gender,
           TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
           ROUND(AVG(pr.performance_score), 2) AS avg_performance,
           ROUND(AVG(fa.overall_fitness_score), 2) AS avg_fitness,
           ROUND(SUM(att.status='present')/NULLIF(COUNT(DISTINCT att.id),0)*100, 2) AS attendance_pct,
           ROUND(AVG(pr.improvement_rate), 2) AS avg_improvement,
           ROUND(AVG(cr.rating), 2) AS coach_rating
    FROM athletes a
    LEFT JOIN performance_records pr ON pr.athlete_id = a.id
    LEFT JOIN fitness_assessments fa ON fa.athlete_id = a.id
    LEFT JOIN attendance att ON att.athlete_id = a.id
    LEFT JOIN coach_remarks cr ON cr.athlete_id = a.id
    WHERE a.is_active = 1
    GROUP BY a.id`);

  const rankDate = new Date().toISOString().split('T')[0];
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // Delete today's existing rankings to recalculate
    await conn.query(`DELETE FROM rankings WHERE rank_date = ?`, [rankDate]);

    const scored = athletes.map(ath => {
      const perf    = ath.avg_performance || 0;
      const fitness = ath.avg_fitness || 0;
      const consistency = calcConsistencyScore({
        attendancePct: ath.attendance_pct,
        stabilityScore: 60,          // default stability
        improvementRate: ath.avg_improvement,
        coachRating: ath.coach_rating,
      });
      const overall = Math.round((perf * 0.5 + fitness * 0.3 + consistency * 0.2) * 100) / 100;
      return { ...ath, perf, fitness, consistency, overall };
    });

    // Helper function to assign ranks with ties (same score gets same rank, next rank skipped e.g. 1, 1, 3, 4)
    const assignRanksWithTies = (list) => {
      let currentRank = 1;
      return list.map((item, idx) => {
        if (idx > 0 && item.overall < list[idx - 1].overall) {
          currentRank = idx + 1;
        }
        return { ...item, rank_position: currentRank };
      });
    };

    // Sort by overall desc → assign overall rank
    const overallSorted = assignRanksWithTies([...scored].sort((a, b) => b.overall - a.overall));
    for (let i = 0; i < overallSorted.length; i++) {
      const ath = overallSorted[i];
      await conn.query(`
        INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position,
          performance_score, fitness_score, consistency_score, overall_ranking_score,
          rank_type, rank_date)
        VALUES (?,?,?,?,?,?,?,?,'overall',?)`,
        [ath.athlete_id, ath.sport_id, ath.category_id, ath.rank_position,
         ath.perf, ath.fitness, ath.consistency, ath.overall, rankDate]);
    }

    // Sport rankings
    const sportGroups = {};
    scored.forEach(a => {
      if (a.sport_id) {
        if (!sportGroups[a.sport_id]) sportGroups[a.sport_id] = [];
        sportGroups[a.sport_id].push(a);
      }
    });
    for (const [sportId, group] of Object.entries(sportGroups)) {
      const sorted = assignRanksWithTies(group.sort((a, b) => b.overall - a.overall));
      for (let i = 0; i < sorted.length; i++) {
        const ath = sorted[i];
        await conn.query(`
          INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position,
            performance_score, fitness_score, consistency_score, overall_ranking_score,
            rank_type, rank_date)
          VALUES (?,?,?,?,?,?,?,?,'sport',?)`,
          [ath.athlete_id, ath.sport_id, ath.category_id, ath.rank_position,
           ath.perf, ath.fitness, ath.consistency, ath.overall, rankDate]);
      }
    }

    // Category rankings
    const categoryGroups = {};
    scored.forEach(a => {
      if (a.category_id) {
        if (!categoryGroups[a.category_id]) categoryGroups[a.category_id] = [];
        categoryGroups[a.category_id].push(a);
      }
    });
    for (const [catId, group] of Object.entries(categoryGroups)) {
      const sorted = assignRanksWithTies(group.sort((a, b) => b.overall - a.overall));
      for (let i = 0; i < sorted.length; i++) {
        const ath = sorted[i];
        await conn.query(`
          INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position,
            performance_score, fitness_score, consistency_score, overall_ranking_score,
            rank_type, rank_date)
          VALUES (?,?,?,?,?,?,?,?,'category',?)`,
          [ath.athlete_id, ath.sport_id, ath.category_id, ath.rank_position,
           ath.perf, ath.fitness, ath.consistency, ath.overall, rankDate]);
      }
    }

    await conn.commit();
    return { success: true, calculated: athletes.length, date: rankDate };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Get Rankings List ────────────────────────────────────────────────────────
async function getRankings(query = {}) {
  const { rankType = 'overall', sportId, sportIds, categoryId, categoryIds, limit = 100, page = 1 } = query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [rankType, rankType];
  let where = 'WHERE r.rank_type = ?';
  if (sportIds && Array.isArray(sportIds) && sportIds.length > 0) {
    where += ` AND r.sport_id IN (${sportIds.map(() => '?').join(',')})`;
    params.push(...sportIds);
  } else if (sportId) {
    where += ' AND r.sport_id = ?';
    params.push(sportId);
  }
  
  const parsedCatIds = categoryIds
    ? (Array.isArray(categoryIds) ? categoryIds : String(categoryIds).split(',')).map(Number).filter(Boolean)
    : (categoryId ? [Number(categoryId)] : []);

  if (parsedCatIds.length > 0) {
    where += ` AND r.category_id IN (${parsedCatIds.map(() => '?').join(',')})`;
    params.push(...parsedCatIds);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT r.athlete_id) AS total
     FROM rankings r
     INNER JOIN (
       SELECT athlete_id, MAX(id) AS max_id
       FROM rankings
       WHERE rank_type = ?
       GROUP BY athlete_id
     ) latest ON r.id = latest.max_id
     ${where}`, params);

  const [rawRankings] = await pool.query(`
    SELECT r.id, r.athlete_id, r.rank_position, r.overall_ranking_score AS ranking_score,
           r.performance_score, r.fitness_score, r.consistency_score,
           r.rank_type, r.rank_date,
           u.first_name, u.last_name, u.profile_photo,
           a.athlete_code, a.gender, a.medical_status,
           TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
           s.name AS sport, cat.name AS category
    FROM rankings r
    INNER JOIN (
       SELECT athlete_id, MAX(id) AS max_id
       FROM rankings
       WHERE rank_type = ?
       GROUP BY athlete_id
    ) latest ON r.id = latest.max_id
    JOIN athletes a ON r.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON r.sport_id = s.id
    LEFT JOIN categories cat ON r.category_id = cat.id
    ${where}
    ORDER BY r.overall_ranking_score DESC, r.rank_position ASC
    LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

  // Compute dynamic ranking with tie-handling (same score gets same rank, next rank skips)
  let currentRank = offset + 1;
  const rankings = rawRankings.map((r, idx) => {
    const score = Number(r.ranking_score || 0);
    if (idx > 0) {
      const prevScore = Number(rawRankings[idx - 1].ranking_score || 0);
      if (score < prevScore) {
        currentRank = offset + idx + 1;
      }
    }
    return { ...r, rank_position: currentRank };
  });

  return { rankings, total, page: parseInt(page), limit: parseInt(limit) };
}

// ─── Get Ranking History for an Athlete ──────────────────────────────────────
async function getAthleteRankingHistory(athleteId) {
  const [history] = await pool.query(`
    SELECT rank_date, rank_position, overall_ranking_score AS ranking_score,
           performance_score, fitness_score, consistency_score, rank_type
    FROM rankings WHERE athlete_id = ? AND rank_type = 'overall'
    ORDER BY rank_date ASC LIMIT 30`, [athleteId]);
  return history;
}

// ─── Get Ranking Comparison ───────────────────────────────────────────────────
async function getRankingComparison(athleteIds) {
  if (!Array.isArray(athleteIds) || athleteIds.length < 2) {
    throw new Error('Provide at least 2 athlete IDs for comparison.');
  }
  const placeholders = athleteIds.map(() => '?').join(',');
  const [rows] = await pool.query(`
    SELECT r.athlete_id, r.rank_position, r.overall_ranking_score,
           r.performance_score, r.fitness_score, r.consistency_score,
           u.first_name, u.last_name, a.athlete_code, s.name AS sport
    FROM rankings r
    JOIN athletes a ON r.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON r.sport_id = s.id
    WHERE r.athlete_id IN (${placeholders}) AND r.rank_type = 'overall'
    ORDER BY r.rank_position ASC`, athleteIds);
  return rows;
}

module.exports = {
  calculateRankings,
  getRankings,
  getAthleteRankingHistory,
  getRankingComparison,
};
