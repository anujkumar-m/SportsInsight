const { pool } = require('../config/database');

/**
 * Triggered whenever Performance, Fitness, Attendance, or Injury records are created, updated, or deleted.
 * Synchronizes athlete rankings, selection scores, and academy intelligence tables.
 */
async function syncAthleteCentralData(athleteId) {
  if (!athleteId) return;

  try {
    // 1. Fetch athlete basics (sport_id, category_id)
    const [athletes] = await pool.query(
      `SELECT id, sport_id, category_id, coach_id FROM athletes WHERE id = ?`,
      [athleteId]
    );
    if (!athletes || athletes.length === 0) return;
    const athlete = athletes[0];

    // 2. Compute Performance Score (avg of last 10 records)
    const [perfRows] = await pool.query(
      `SELECT AVG(performance_score) as avg_perf, STDDEV(performance_score) as std_perf, COUNT(*) as cnt
       FROM (
         SELECT performance_score FROM performance_records
         WHERE athlete_id = ?
         ORDER BY record_date DESC LIMIT 10
       ) sub`,
      [athleteId]
    );
    const avgPerfScore = parseFloat(perfRows[0]?.avg_perf || 0);
    const stdPerf = parseFloat(perfRows[0]?.std_perf || 0);
    const perfCount = parseInt(perfRows[0]?.cnt || 0);

    // Consistency score (0-100, higher if stddev is lower)
    const consistencyScore = perfCount === 0 ? 50 : Math.max(0, Math.min(100, 100 - (stdPerf * 2.5)));

    // 3. Compute Fitness Score (latest overall_fitness_score)
    const [fitRows] = await pool.query(
      `SELECT overall_fitness_score FROM fitness_assessments
       WHERE athlete_id = ?
       ORDER BY assessment_date DESC LIMIT 1`,
      [athleteId]
    );
    const fitnessScore = parseFloat(fitRows[0]?.overall_fitness_score || 0);

    // 4. Compute Attendance Score (% present / total logs)
    const [attRows] = await pool.query(
      `SELECT 
         COUNT(*) as total_days,
         SUM(CASE 
           WHEN status = 'present' THEN 1.0 
           WHEN status = 'half_day' THEN 0.5 
           WHEN status = 'late' THEN 0.75 
           ELSE 0 
         END) as weighted_present
       FROM attendance
       WHERE athlete_id = ?`,
      [athleteId]
    );
    const totalDays = parseInt(attRows[0]?.total_days || 0);
    const weightedPresent = parseFloat(attRows[0]?.weighted_present || 0);
    const attendanceScore = totalDays === 0 ? 100 : Math.round((weightedPresent / totalDays) * 100 * 100) / 100;

    // 5. Compute Overall Ranking Score
    // Weightings: Performance 40%, Fitness 30%, Attendance 20%, Consistency 10%
    const overallRankingScore = Math.round(
      (avgPerfScore * 0.40 + fitnessScore * 0.30 + attendanceScore * 0.20 + consistencyScore * 0.10) * 100
    ) / 100;

    const todayStr = new Date().toISOString().split('T')[0];

    // 6. Update or Insert into `rankings` table
    const [existingRank] = await pool.query(
      `SELECT id FROM rankings WHERE athlete_id = ? AND rank_type = 'overall'`,
      [athleteId]
    );

    if (existingRank.length > 0) {
      await pool.query(
        `UPDATE rankings 
         SET performance_score = ?, fitness_score = ?, consistency_score = ?, 
             overall_ranking_score = ?, sport_id = ?, category_id = ?, rank_date = ?
         WHERE id = ?`,
        [avgPerfScore, fitnessScore, consistencyScore, overallRankingScore, athlete.sport_id, athlete.category_id, todayStr, existingRank[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date)
         VALUES (?, ?, ?, 999, ?, ?, ?, ?, 'overall', ?)`,
        [athleteId, athlete.sport_id, athlete.category_id, avgPerfScore, fitnessScore, consistencyScore, overallRankingScore, todayStr]
      );
    }

    // 7. Recalculate rank positions for all active athletes
    const [allRankings] = await pool.query(
      `SELECT id FROM rankings WHERE rank_type = 'overall' ORDER BY overall_ranking_score DESC`
    );
    for (let index = 0; index < allRankings.length; index++) {
      await pool.query(
        `UPDATE rankings SET rank_position = ? WHERE id = ?`,
        [index + 1, allRankings[index].id]
      );
    }

    // 8. Update selections table if active records exist
    await pool.query(
      `UPDATE selections 
       SET performance_score = ?, fitness_score = ?, attendance_score = ?,
           selection_score = ROUND((? * 0.45 + ? * 0.30 + ? * 0.25), 2)
       WHERE athlete_id = ? AND status IN ('pending', 'recommended')`,
      [avgPerfScore, fitnessScore, attendanceScore, avgPerfScore, fitnessScore, attendanceScore, athleteId]
    );

    // 9. Recalculate coach_performance metrics if coach is assigned
    if (athlete.coach_id) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [coachStats] = await pool.query(
        `SELECT 
           COUNT(DISTINCT a.id) as total_athletes,
           AVG(r.performance_score) as avg_perf,
           AVG(r.fitness_score) as avg_fit,
           AVG(r.consistency_score) as avg_att
         FROM athletes a
         LEFT JOIN rankings r ON r.athlete_id = a.id AND r.rank_type = 'overall'
         WHERE a.coach_id = ? AND a.is_active = TRUE`,
        [athlete.coach_id]
      );

      const overallCoachScore = Math.round(
        ((parseFloat(coachStats[0]?.avg_perf || 0) + parseFloat(coachStats[0]?.avg_fit || 0) + parseFloat(coachStats[0]?.avg_att || 0)) / 3) * 100
      ) / 100;

      await pool.query(
        `INSERT INTO coach_performance (coach_id, period_month, period_year, athletes_count, avg_athlete_performance, avg_athlete_fitness, avg_attendance_rate, overall_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           athletes_count = VALUES(athletes_count),
           avg_athlete_performance = VALUES(avg_athlete_performance),
           avg_athlete_fitness = VALUES(avg_athlete_fitness),
           avg_attendance_rate = VALUES(avg_attendance_rate),
           overall_score = VALUES(overall_score)`,
        [
          athlete.coach_id,
          month,
          year,
          parseInt(coachStats[0]?.total_athletes || 0),
          parseFloat(coachStats[0]?.avg_perf || 0),
          parseFloat(coachStats[0]?.avg_fit || 0),
          parseFloat(coachStats[0]?.avg_att || 0),
          overallCoachScore,
        ]
      );
    }
  } catch (error) {
    console.error('Error in syncAthleteCentralData:', error);
  }
}

module.exports = {
  syncAthleteCentralData,
};
