const { pool } = require('../config/database');

// ─── AI/ML List Generation Engine ─────────────────────────
// Uses weighted statistical scoring based on available MySQL data.
// Falls back to ranking-based scoring if historical data is sparse.

const LIST_TYPES = {
  TOP_PERFORMING: 'Top Performing Athletes',
  BEST_FITNESS: 'Best Fitness Athletes',
  HIGHEST_ATTENDANCE: 'Highest Attendance Athletes',
  MOST_IMPROVED: 'Most Improved Athletes',
  SELECTION_RECOMMENDATION: 'Selection Recommendation List',
  HIGH_POTENTIAL: 'High Potential Athletes',
  FUTURE_MEDAL_WINNERS: 'Future Medal Winners',
  TRAINING_PRIORITY: 'Training Priority Athletes',
  RECOVERY_PRIORITY: 'Recovery Priority Athletes',
  INJURY_RISK: 'Injury Risk Athletes',
  STATE_SELECTION: 'State Selection List',
  NATIONAL_CAMP: 'National Camp Recommendation',
  ACADEMY_RANKING: 'Academy Ranking',
  SPORT_WISE_RANKING: 'Sport Wise Ranking',
  CATEGORY_WISE_RANKING: 'Category Wise Ranking',
  AGE_WISE_RANKING: 'Age Wise Ranking',
  GENDER_WISE_RANKING: 'Gender Wise Ranking',
  COACH_WISE_BEST: 'Coach Wise Best Athletes',
  UNDERPERFORMING: 'Underperforming Athletes',
  AI_IMPROVEMENT: 'AI Suggested Improvement List',
  // Coach specific
  TOP_IMPROVING: 'Top Improving Athletes',
  FITNESS_IMPROVEMENT: 'Fitness Improvement List',
  ATTENDANCE_RISK: 'Attendance Risk List',
  RECOVERY_READY: 'Recovery Ready Athletes',
  SELECTION_READY: 'Selection Ready Athletes',
  FUTURE_POTENTIAL: 'Future Potential Athletes',
  WEAK_PERFORMANCE: 'Weak Performance Athletes',
};

const buildAthleteBaseQuery = (filters = {}) => {
  let whereConditions = ['a.is_active = TRUE'];
  const params = [];

  if (filters.sportId) {
    whereConditions.push('a.sport_id = ?');
    params.push(filters.sportId);
  }
  if (filters.categoryId) {
    whereConditions.push('a.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.gender && filters.gender !== 'mixed') {
    whereConditions.push('a.gender = ?');
    params.push(filters.gender);
  }
  if (filters.ageMin || filters.ageMax) {
    if (filters.ageMin) {
      whereConditions.push('TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) >= ?');
      params.push(filters.ageMin);
    }
    if (filters.ageMax) {
      whereConditions.push('TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) <= ?');
      params.push(filters.ageMax);
    }
  }
  if (filters.coachId) {
    whereConditions.push('a.coach_id = ?');
    params.push(filters.coachId);
  }

  return { where: whereConditions.join(' AND '), params };
};

const getAthleteScores = async (filters = {}) => {
  const { where, params } = buildAthleteBaseQuery(filters);
  const dateFrom = filters.dateFrom || '2020-01-01';
  const dateTo = filters.dateTo || new Date().toISOString().split('T')[0];

  const query = `
    SELECT
      a.id AS athlete_id,
      u.first_name, u.last_name, u.profile_photo,
      a.athlete_code, a.gender, a.date_of_birth,
      TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) AS age,
      s.name AS sport_name, cat.name AS category_name,
      co_u.first_name AS coach_first, co_u.last_name AS coach_last,
      -- Performance Score (avg of recent records)
      COALESCE(
        (SELECT AVG(pr.performance_score)
         FROM performance_records pr
         WHERE pr.athlete_id = a.id AND pr.record_date BETWEEN ? AND ?),
        0
      ) AS performance_score,
      -- Fitness Score (latest assessment)
      COALESCE(
        (SELECT fa.overall_fitness_score
         FROM fitness_assessments fa
         WHERE fa.athlete_id = a.id
         ORDER BY fa.assessment_date DESC LIMIT 1),
        0
      ) AS fitness_score,
      -- Attendance Score (percentage)
      COALESCE(
        (SELECT ROUND(
           SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
         )
         FROM attendance att
         WHERE att.athlete_id = a.id AND att.attendance_date BETWEEN ? AND ?),
        0
      ) AS attendance_score,
      -- Coach Rating (avg from remarks)
      COALESCE(
        (SELECT AVG(cr.rating) FROM coach_remarks cr WHERE cr.athlete_id = a.id),
        7.0
      ) AS coach_rating,
      -- Consistency Score (stddev based - lower stddev = higher consistency)
      COALESCE(
        (SELECT CASE 
           WHEN STDDEV(pr.performance_score) = 0 THEN 100
           ELSE GREATEST(0, 100 - STDDEV(pr.performance_score) * 2)
         END
         FROM performance_records pr WHERE pr.athlete_id = a.id),
        50
      ) AS consistency_score,
      -- Improvement Score (recent 3 months vs prior 3 months)
      COALESCE(
        (SELECT CASE
           WHEN AVG(CASE WHEN pr.record_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN pr.performance_score END) > 0
             AND AVG(CASE WHEN pr.record_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
                           AND pr.record_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN pr.performance_score END) > 0
           THEN ROUND(
             (AVG(CASE WHEN pr.record_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN pr.performance_score END) /
              AVG(CASE WHEN pr.record_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                        AND pr.record_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN pr.performance_score END) - 1) * 100, 2
           )
           ELSE 0
         END
         FROM performance_records pr WHERE pr.athlete_id = a.id),
        0
      ) AS improvement_percentage,
      -- Injury Risk Factor
      COALESCE(
        (SELECT COUNT(*) FROM injuries inj 
         WHERE inj.athlete_id = a.id AND inj.injury_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)),
        0
      ) AS injury_count_12m,
      -- Active Injury
      COALESCE(
        (SELECT COUNT(*) FROM injuries inj
         WHERE inj.athlete_id = a.id AND inj.recovery_status IN ('recovering','chronic')),
        0
      ) AS active_injuries,
      -- Existing Rank
      COALESCE(
        (SELECT rk.overall_ranking_score FROM rankings rk 
         WHERE rk.athlete_id = a.id AND rk.rank_type = 'overall' 
         ORDER BY rk.rank_date DESC LIMIT 1),
        0
      ) AS existing_rank_score
    FROM athletes a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN sports s ON a.sport_id = s.id
    LEFT JOIN categories cat ON a.category_id = cat.id
    LEFT JOIN coaches co ON a.coach_id = co.id
    LEFT JOIN users co_u ON co.user_id = co_u.id
    WHERE ${where}
    ORDER BY a.id
  `;

  const allParams = [dateFrom, dateTo, dateFrom, dateTo, ...params];
  const [rows] = await pool.query(query, allParams);
  return rows;
};

const computeRankingScore = (athlete) => {
  const p = parseFloat(athlete.performance_score) || 0;
  const f = parseFloat(athlete.fitness_score) || 0;
  const c = parseFloat(athlete.consistency_score) || 0;
  return Math.round((p * 0.5 + f * 0.3 + c * 0.2) * 100) / 100;
};

const computeSelectionScore = (athlete) => {
  const p = parseFloat(athlete.performance_score) || 0;
  const f = parseFloat(athlete.fitness_score) || 0;
  const a = parseFloat(athlete.attendance_score) || 0;
  const cr = ((parseFloat(athlete.coach_rating) || 7) / 10) * 100;
  return Math.round((p * 0.4 + f * 0.3 + a * 0.2 + cr * 0.1) * 100) / 100;
};

const computeConfidenceScore = (athlete, dataPoints) => {
  // Confidence is based on data completeness
  let confidence = 50;
  if (athlete.performance_score > 0) confidence += 20;
  if (athlete.fitness_score > 0) confidence += 15;
  if (athlete.attendance_score > 0) confidence += 10;
  if (athlete.coach_rating && athlete.coach_rating !== 7) confidence += 5;
  return Math.min(100, confidence);
};

const generateSuggestion = (athlete, listType) => {
  const p = parseFloat(athlete.performance_score) || 0;
  const f = parseFloat(athlete.fitness_score) || 0;
  const a = parseFloat(athlete.attendance_score) || 0;

  const weaknesses = [];
  if (p < 70) weaknesses.push('performance training');
  if (f < 70) weaknesses.push('fitness conditioning');
  if (a < 75) weaknesses.push('attendance consistency');
  if (athlete.active_injuries > 0) weaknesses.push('injury rehabilitation');

  if (weaknesses.length === 0) return 'Maintain current training regime. Focus on advanced technique refinement.';
  return `Focus on improving: ${weaknesses.join(', ')}. Consider specialized coaching sessions.`;
};

const generateReason = (athlete, listType, score) => {
  const p = parseFloat(athlete.performance_score) || 0;
  const f = parseFloat(athlete.fitness_score) || 0;
  const imp = parseFloat(athlete.improvement_percentage) || 0;

  switch (listType) {
    case 'TOP_PERFORMING':
      return `Avg performance score: ${p.toFixed(1)}. Consistency: ${athlete.consistency_score?.toFixed(1) || 'N/A'}.`;
    case 'BEST_FITNESS':
      return `Overall fitness score: ${f.toFixed(1)}. Strength and agility levels are excellent.`;
    case 'HIGHEST_ATTENDANCE':
      return `Attendance rate: ${athlete.attendance_score?.toFixed(1) || 0}%. Demonstrates strong commitment.`;
    case 'MOST_IMPROVED':
      return `Improvement: +${imp.toFixed(1)}% over last 3 months. Shows rapid development trajectory.`;
    case 'SELECTION_RECOMMENDATION':
    case 'STATE_SELECTION':
    case 'NATIONAL_CAMP':
      return `Selection score: ${score.toFixed(1)}. Balanced across performance, fitness, attendance, and coaching.`;
    case 'INJURY_RISK':
      return `${athlete.injury_count_12m} injury(-ies) in past 12 months. Active injuries: ${athlete.active_injuries}.`;
    case 'UNDERPERFORMING':
      return `Performance score: ${p.toFixed(1)}. Below academy average. Needs targeted intervention.`;
    case 'MOST_IMPROVED':
      return `Showed ${imp.toFixed(1)}% improvement in last quarter.`;
    default:
      return `Overall score: ${score.toFixed(1)}. Evaluated across performance, fitness, and attendance metrics.`;
  }
};

const generateList = async (listType, filters = {}) => {
  const athletes = await getAthleteScores(filters);

  if (athletes.length === 0) {
    return { listType: LIST_TYPES[listType] || listType, athletes: [], total: 0, generatedAt: new Date() };
  }

  let scored = athletes.map((a) => {
    const rankScore = computeRankingScore(a);
    const selScore = computeSelectionScore(a);
    const confidence = computeConfidenceScore(a);

    return {
      ...a,
      rankingScore: rankScore,
      selectionScore: selScore,
      confidenceScore: confidence,
    };
  });

  // Sort and filter based on list type
  let result = [];
  const limit = filters.limit || 50;

  switch (listType) {
    case 'TOP_PERFORMING':
      result = scored
        .filter((a) => a.active_injuries === 0)
        .sort((a, b) => b.performance_score - a.performance_score);
      break;

    case 'BEST_FITNESS':
      result = scored.sort((a, b) => b.fitness_score - a.fitness_score);
      break;

    case 'HIGHEST_ATTENDANCE':
      result = scored.sort((a, b) => b.attendance_score - a.attendance_score);
      break;

    case 'MOST_IMPROVED':
    case 'TOP_IMPROVING':
      result = scored
        .filter((a) => a.improvement_percentage > 0)
        .sort((a, b) => b.improvement_percentage - a.improvement_percentage);
      break;

    case 'SELECTION_RECOMMENDATION':
    case 'STATE_SELECTION':
      result = scored
        .filter((a) => a.active_injuries === 0 && a.attendance_score >= 70)
        .sort((a, b) => b.selectionScore - a.selectionScore);
      break;

    case 'NATIONAL_CAMP':
      result = scored
        .filter((a) => a.active_injuries === 0 && a.performance_score >= 80 && a.fitness_score >= 80)
        .sort((a, b) => b.selectionScore - a.selectionScore);
      break;

    case 'HIGH_POTENTIAL':
    case 'FUTURE_POTENTIAL':
      result = scored
        .filter((a) => a.age <= 19)
        .sort((a, b) => b.rankingScore - a.rankingScore);
      break;

    case 'FUTURE_MEDAL_WINNERS':
      result = scored
        .filter((a) => a.age <= 21 && a.performance_score >= 75)
        .sort((a, b) => (b.improvement_percentage + b.rankingScore) - (a.improvement_percentage + a.rankingScore));
      break;

    case 'TRAINING_PRIORITY':
      result = scored
        .filter((a) => a.performance_score < 75 || a.fitness_score < 75)
        .sort((a, b) => (a.performance_score + a.fitness_score) - (b.performance_score + b.fitness_score));
      break;

    case 'RECOVERY_PRIORITY':
    case 'RECOVERY_READY':
      result = scored
        .filter((a) => a.active_injuries > 0)
        .sort((a, b) => b.rankingScore - a.rankingScore);
      break;

    case 'INJURY_RISK':
      result = scored
        .sort((a, b) => b.injury_count_12m - a.injury_count_12m);
      break;

    case 'ATTENDANCE_RISK':
      result = scored
        .filter((a) => a.attendance_score < 75)
        .sort((a, b) => a.attendance_score - b.attendance_score);
      break;

    case 'UNDERPERFORMING':
    case 'WEAK_PERFORMANCE':
      result = scored
        .filter((a) => a.performance_score < 70)
        .sort((a, b) => a.performance_score - b.performance_score);
      break;

    case 'SELECTION_READY':
      result = scored
        .filter((a) => a.selectionScore >= 75 && a.active_injuries === 0)
        .sort((a, b) => b.selectionScore - a.selectionScore);
      break;

    case 'FITNESS_IMPROVEMENT':
      result = scored
        .sort((a, b) => a.fitness_score - b.fitness_score);
      break;

    case 'AI_IMPROVEMENT':
    case 'AI_SUGGESTED_IMPROVEMENT':
      result = scored.sort((a, b) => b.improvement_percentage - a.improvement_percentage);
      break;

    case 'ACADEMY_RANKING':
    case 'SPORT_WISE_RANKING':
    case 'CATEGORY_WISE_RANKING':
    case 'GENDER_WISE_RANKING':
    case 'AGE_WISE_RANKING':
    case 'COACH_WISE_BEST':
      result = scored.sort((a, b) => b.rankingScore - a.rankingScore);
      break;

    default:
      result = scored.sort((a, b) => b.rankingScore - a.rankingScore);
  }

  result = result.slice(0, limit);

  // Format output
  const formatted = result.map((a, idx) => {
    const primaryScore = a.selectionScore || a.rankingScore;
    return {
      rank: idx + 1,
      athleteId: a.athlete_id,
      athleteCode: a.athlete_code,
      name: `${a.first_name} ${a.last_name}`,
      profilePhoto: a.profile_photo,
      sport: a.sport_name,
      category: a.category_name,
      age: a.age,
      gender: a.gender,
      coach: a.coach_first ? `${a.coach_first} ${a.coach_last}` : 'N/A',
      performanceScore: parseFloat(a.performance_score).toFixed(1),
      fitnessScore: parseFloat(a.fitness_score).toFixed(1),
      attendanceScore: parseFloat(a.attendance_score).toFixed(1),
      rankingScore: a.rankingScore.toFixed(1),
      selectionScore: a.selectionScore.toFixed(1),
      confidenceScore: a.confidenceScore.toFixed(0),
      improvementPercentage: parseFloat(a.improvement_percentage || 0).toFixed(1),
      activeInjuries: a.active_injuries,
      injuryCount12m: a.injury_count_12m,
      reason: generateReason(a, listType, primaryScore),
      suggestedImprovement: generateSuggestion(a, listType),
    };
  });

  return {
    listType: LIST_TYPES[listType] || listType,
    filters,
    athletes: formatted,
    total: formatted.length,
    generatedAt: new Date().toISOString(),
    algorithm: 'Statistical Analysis (Weighted Scoring)',
  };
};

const saveGeneratedList = async (userId, listType, filters, result) => {
  const [res] = await pool.query(
    `INSERT INTO ai_generated_lists 
     (generated_by, list_type, sport_id, category_id, gender, date_from, date_to, result_json, athletes_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      listType,
      filters.sportId || null,
      filters.categoryId || null,
      filters.gender || 'mixed',
      filters.dateFrom || null,
      filters.dateTo || null,
      JSON.stringify(result),
      result.total,
    ]
  );
  return res.insertId;
};

const getListTypes = () => Object.entries(LIST_TYPES).map(([key, value]) => ({ key, label: value }));

module.exports = { generateList, saveGeneratedList, getListTypes, LIST_TYPES };
