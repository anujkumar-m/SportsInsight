const { pool } = require('../config/database');

// Helper to safely execute a query with fallback on error
async function safeQuery(sql, params, fallback = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error(`Comparison query error (${sql.slice(0, 40)}...):`, err.message);
    return fallback;
  }
}

// ─── Compare Multiple Athletes ────────────────────────────────────────────────
async function compareAthletes(athleteIds) {
  if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length < 2) {
    throw new Error('At least 2 athlete IDs required for comparison.');
  }
  const placeholders = athleteIds.map(() => '?').join(',');

  // Core profiles (required input)
  const profiles = await safeQuery(`
    SELECT a.id, a.athlete_code, a.gender, a.height_cm, a.weight_kg,
           a.blood_group, a.medical_status,
           TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
           u.first_name, u.last_name, u.profile_photo,
           s.name AS sport, cat.name AS category
    FROM athletes a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    LEFT JOIN categories cat ON a.category_id = cat.id
    WHERE a.id IN (${placeholders})`, athleteIds, []);

  if (profiles.length === 0) {
    throw new Error('No valid athlete profiles found for the provided IDs.');
  }

  // Performance stats per athlete (isolated failure tolerance)
  const perfStats = await safeQuery(`
    SELECT athlete_id,
           ROUND(AVG(performance_score),2) AS avg_perf,
           ROUND(MAX(performance_score),2) AS max_perf,
           ROUND(AVG(improvement_rate),2) AS avg_improvement,
           COUNT(*) AS total_records
    FROM performance_records WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Fitness stats (isolated failure tolerance)
  const fitnessStats = await safeQuery(`
    SELECT athlete_id,
           ROUND(AVG(overall_fitness_score),2) AS avg_fitness,
           ROUND(AVG(strength_score),2) AS avg_strength,
           ROUND(AVG(endurance_score),2) AS avg_endurance,
           ROUND(AVG(agility_score),2) AS avg_agility,
           ROUND(AVG(speed_score),2) AS avg_speed,
           ROUND(AVG(flexibility_score),2) AS avg_flexibility,
           ROUND(AVG(bmi),2) AS avg_bmi
    FROM fitness_assessments WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Attendance stats (isolated failure tolerance)
  const attendanceStats = await safeQuery(`
    SELECT athlete_id,
           COUNT(*) AS total_days,
           SUM(status='present') AS present_days,
           ROUND(SUM(status='present')/COUNT(*)*100,2) AS attendance_pct
    FROM attendance WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Injury stats (isolated failure tolerance)
  const injuryStats = await safeQuery(`
    SELECT athlete_id, COUNT(*) AS total_injuries,
           SUM(recovery_status='recovering') AS active,
           MAX(availability_status) AS current_availability
    FROM injuries WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Rankings (isolated failure tolerance)
  const rankingStats = await safeQuery(`
    SELECT athlete_id, rank_position, overall_ranking_score AS ranking_score,
           performance_score AS rank_perf, fitness_score AS rank_fitness,
           consistency_score
    FROM rankings WHERE athlete_id IN (${placeholders}) AND rank_type = 'overall'`, athleteIds, []);

  // Selections (isolated failure tolerance)
  const selectionStats = await safeQuery(`
    SELECT athlete_id,
           COUNT(*) AS total_selections,
           SUM(status='selected') AS times_selected,
           ROUND(AVG(selection_score),2) AS avg_selection_score
    FROM selections WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Coach ratings (isolated failure tolerance)
  const coachRatings = await safeQuery(`
    SELECT athlete_id, ROUND(AVG(rating),2) AS avg_rating, COUNT(*) AS remarks_count
    FROM coach_remarks WHERE athlete_id IN (${placeholders})
    GROUP BY athlete_id`, athleteIds, []);

  // Merge all available module data into athlete comparison object
  const combined = profiles.map(profile => {
    const perf      = perfStats.find(p => p.athlete_id === profile.id) || {};
    const fitness   = fitnessStats.find(f => f.athlete_id === profile.id) || {};
    const att       = attendanceStats.find(a => a.athlete_id === profile.id) || {};
    const inj       = injuryStats.find(i => i.athlete_id === profile.id) || {};
    const ranking   = rankingStats.find(r => r.athlete_id === profile.id) || {};
    const selection = selectionStats.find(s => s.athlete_id === profile.id) || {};
    const coach     = coachRatings.find(c => c.athlete_id === profile.id) || {};

    // AI potential score calculation using available inputs
    const potentialScore = Math.round(
      ((perf.avg_perf || 50) * 0.35 +
       (fitness.avg_fitness || 50) * 0.25 +
       (att.attendance_pct || 75) * 0.2 +
       (perf.avg_improvement || 0) * 5 * 0.1 +
       ((coach.avg_rating || 5) * 10) * 0.1) * 100) / 100;

    return {
      profile,
      performance: perf,
      fitness,
      attendance: att,
      injuries: inj,
      ranking,
      selection,
      coachRating: coach,
      potentialScore,
    };
  });

  // AI comparison highlights
  const sorted = [...combined].sort((a, b) => b.potentialScore - a.potentialScore);
  const best = sorted[0] || combined[0];
  const radarLabels = ['Performance', 'Fitness', 'Attendance', 'Consistency', 'Coach Rating'];

  return {
    athletes: combined,
    aiInsights: {
      highestPotential: best ? {
        athleteId: best.profile.id,
        name: `${best.profile.first_name} ${best.profile.last_name}`,
        reason: `Leads in overall potential score of ${best.potentialScore}`,
      } : null,
      radarLabels,
    },
  };
}

module.exports = { compareAthletes };
