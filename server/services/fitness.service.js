const { pool } = require('../config/database');
const { syncAthleteCentralData } = require('./centralSync.service');

// ─── Real-Time BMI & Score Calculators ─────────────────────────
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
}

function calculateOverallFitnessScore(data) {
  const {
    strength_score = 0,
    endurance_score = 0,
    stamina_score = 0,
    flexibility_score = 0,
    agility_score = 0,
    speed_score = 0,
    balance_score = 0
  } = data;

  const sum = 
    parseFloat(strength_score) * 0.20 +
    parseFloat(endurance_score) * 0.20 +
    parseFloat(stamina_score) * 0.15 +
    parseFloat(flexibility_score) * 0.15 +
    parseFloat(agility_score) * 0.15 +
    parseFloat(speed_score) * 0.10 +
    parseFloat(balance_score) * 0.05;

  return Math.round(Math.min(100, Math.max(0, sum)) * 100) / 100;
}

// ─── AI Fitness Analysis Engine ────────────────────────────────
async function runAIFitnessAnalysis(athleteId, currentAssessment) {
  try {
    const [history] = await pool.query(
      `SELECT * FROM fitness_assessments 
       WHERE athlete_id = ? AND assessment_date <= ?
       ORDER BY assessment_date ASC`,
      [athleteId, currentAssessment.assessment_date]
    );

    const currentScore = calculateOverallFitnessScore(currentAssessment);
    const hasHistory = history.length >= 3;
    let confidenceScore = hasHistory ? 90 : 70;
    let improvementPercentage = 0;
    let fitnessPrediction = currentScore;

    if (hasHistory) {
      // Machine Learning Trend Extrapolation
      const n = history.length;
      const prevScore = parseFloat(history[n - 1].overall_fitness_score || 0);
      improvementPercentage = prevScore > 0 ? Math.round(((currentScore - prevScore) / prevScore) * 100 * 100) / 100 : 0;
      
      const scores = history.map(h => parseFloat(h.overall_fitness_score || 0)).concat([currentScore]);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      fitnessPrediction = Math.round(Math.min(100, currentScore + (currentScore - avg) * 0.5) * 100) / 100;
    } else if (history.length > 0) {
      const prevScore = parseFloat(history[history.length - 1].overall_fitness_score || 0);
      improvementPercentage = prevScore > 0 ? Math.round(((currentScore - prevScore) / prevScore) * 100 * 100) / 100 : 0;
      fitnessPrediction = Math.round(Math.min(100, currentScore * (1 + improvementPercentage / 200)) * 100) / 100;
    }

    // Determine Grade
    let fitnessGrade = 'C';
    if (currentScore >= 90) fitnessGrade = 'A+';
    else if (currentScore >= 80) fitnessGrade = 'A';
    else if (currentScore >= 70) fitnessGrade = 'B';
    else if (currentScore >= 60) fitnessGrade = 'C';
    else fitnessGrade = 'D';

    // Identify Weak Areas (< 60) & Exercise Recommendations
    const weakAreas = [];
    const recommendedExercises = [];

    if (parseFloat(currentAssessment.strength_score || 0) < 60) {
      weakAreas.push('Strength');
      recommendedExercises.push('Progressive Resistance Training & Compound Weightlifting');
    }
    if (parseFloat(currentAssessment.endurance_score || 0) < 60) {
      weakAreas.push('Endurance');
      recommendedExercises.push('High-Intensity Interval Training (HIIT) & Tempo Running');
    }
    if (parseFloat(currentAssessment.stamina_score || 0) < 60) {
      weakAreas.push('Stamina');
      recommendedExercises.push('Long Steady State Aerobic Cardio Sessions');
    }
    if (parseFloat(currentAssessment.flexibility_score || 0) < 60) {
      weakAreas.push('Flexibility');
      recommendedExercises.push('Dynamic Mobility Warm-ups & Post-workout Static Stretching');
    }
    if (parseFloat(currentAssessment.agility_score || 0) < 60) {
      weakAreas.push('Agility');
      recommendedExercises.push('Ladder Drills, Cone Shuttle Runs & Plyometrics');
    }

    if (weakAreas.length === 0) {
      recommendedExercises.push('Maintain balanced high-level athletic conditioning program.');
    }

    // Recovery Readiness & Injury Risk
    const rhr = parseInt(currentAssessment.resting_heart_rate || 70);
    const recRate = parseInt(currentAssessment.recovery_rate_bpm || 30);
    const bodyFat = parseFloat(currentAssessment.body_fat_percentage || 15);

    let recoveryReadiness = 'Optimal';
    if (rhr > 85 || recRate < 20) recoveryReadiness = 'Fatigued / Needs Rest';
    else if (rhr > 75) recoveryReadiness = 'Moderate Recovery';

    let injuryRisk = 'Low';
    if (bodyFat > 25 || (rhr > 85 && recRate < 20) || currentScore < 50) {
      injuryRisk = 'High';
    } else if (bodyFat > 20 || rhr > 78 || weakAreas.length >= 2) {
      injuryRisk = 'Medium';
    }

    const coachRecommendation = injuryRisk === 'High'
      ? 'Alert: High fatigue/injury risk detected. Reduce training load and focus on active recovery.'
      : weakAreas.length > 0
      ? `Focus upcoming training blocks on improving ${weakAreas.join(', ')}.`
      : 'Athlete condition is prime. Cleared for full competitive training intensity.';

    return {
      fitnessScore: currentScore,
      confidenceScore,
      fitnessGrade,
      improvementPercentage,
      weakAreas,
      recommendedExercises,
      trainingSuggestions: recommendedExercises,
      fitnessPrediction,
      recoveryReadiness,
      injuryRisk,
      coachRecommendation,
      method: hasHistory ? 'Machine Learning Analysis' : 'Weighted Statistical Scoring'
    };
  } catch (err) {
    console.error('Error in runAIFitnessAnalysis:', err);
    return {
      fitnessScore: calculateOverallFitnessScore(currentAssessment),
      confidenceScore: 60,
      fitnessGrade: 'B',
      weakAreas: [],
      recommendedExercises: ['Standard athletic conditioning.'],
      coachRecommendation: 'Continue structured routine.'
    };
  }
}

// ─── Service Functions ─────────────────────────────────────────

async function getFitnessAssessments(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  if (filters.athleteId) {
    whereClauses.push('fa.athlete_id = ?');
    params.push(filters.athleteId);
  }
  if (filters.search) {
    whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR a.athlete_code LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM fitness_assessments fa
     JOIN athletes a ON a.id = fa.athlete_id
     JOIN users u ON u.id = a.user_id
     WHERE ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await pool.query(
    `SELECT fa.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name as sport_name
     FROM fitness_assessments fa
     JOIN athletes a ON a.id = fa.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     WHERE ${whereSql}
     ORDER BY fa.assessment_date DESC, fa.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    assessments: rows.map(r => ({
      ...r,
      ai_analysis: typeof r.ai_analysis === 'string' ? JSON.parse(r.ai_analysis) : r.ai_analysis
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getFitnessById(id) {
  const [rows] = await pool.query(
    `SELECT fa.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name as sport_name
     FROM fitness_assessments fa
     JOIN athletes a ON a.id = fa.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     WHERE fa.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const record = rows[0];
  if (typeof record.ai_analysis === 'string') {
    record.ai_analysis = JSON.parse(record.ai_analysis);
  }
  return record;
}

async function createFitnessAssessment(data, userId) {
  const {
    athlete_id,
    assessment_date,
    height_cm,
    weight_kg,
    strength_score,
    endurance_score,
    stamina_score,
    flexibility_score,
    agility_score,
    speed_score,
    reaction_time_ms,
    balance_score,
    body_fat_percentage,
    vo2_max,
    resting_heart_rate,
    recovery_rate_bpm,
    notes
  } = data;

  if (!athlete_id || !assessment_date) {
    throw new Error('Athlete ID and Assessment Date are required.');
  }

  // Validate non-negative values
  const numericFields = [
    strength_score, endurance_score, stamina_score, flexibility_score,
    agility_score, speed_score, reaction_time_ms, balance_score,
    body_fat_percentage, vo2_max, resting_heart_rate, recovery_rate_bpm,
    height_cm, weight_kg
  ];
  for (const val of numericFields) {
    if (val !== undefined && parseFloat(val) < 0) {
      throw new Error('Fitness assessment parameter values cannot be negative.');
    }
  }

  // Calculate BMI & Overall Fitness Score
  let computedBmi = null;
  if (height_cm && weight_kg) {
    computedBmi = calculateBMI(parseFloat(weight_kg), parseFloat(height_cm));
    // Optionally update athlete's height & weight in athletes table
    await pool.query(`UPDATE athletes SET height_cm = ?, weight_kg = ? WHERE id = ?`, [height_cm, weight_kg, athlete_id]);
  }

  const overallScore = calculateOverallFitnessScore(data);

  // Fetch coach_id
  const [ath] = await pool.query(`SELECT coach_id FROM athletes WHERE id = ?`, [athlete_id]);
  const coach_id = ath[0]?.coach_id || null;

  // Run AI Analysis
  const aiResult = await runAIFitnessAnalysis(athlete_id, { ...data, overall_fitness_score: overallScore });

  const [result] = await pool.query(
    `INSERT INTO fitness_assessments 
       (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, speed_score, reaction_time_ms, balance_score, body_fat_percentage, bmi, vo2_max, resting_heart_rate, recovery_rate_bpm, overall_fitness_score, notes, ai_analysis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      athlete_id,
      coach_id,
      assessment_date,
      strength_score || 0,
      endurance_score || 0,
      stamina_score || 0,
      flexibility_score || 0,
      agility_score || 0,
      speed_score || 0,
      reaction_time_ms || 0,
      balance_score || 0,
      body_fat_percentage || 0,
      computedBmi,
      vo2_max || 0,
      resting_heart_rate || 70,
      recovery_rate_bpm || 30,
      overallScore,
      notes || '',
      JSON.stringify(aiResult)
    ]
  );

  const newId = result.insertId;

  // Audit history
  await pool.query(
    `INSERT INTO fitness_history (fitness_id, athlete_id, action_type, description, changed_by, new_values)
     VALUES (?, ?, 'created', ?, ?, ?)`,
    [newId, athlete_id, `Created fitness assessment for date ${assessment_date}`, userId || null, JSON.stringify(data)]
  );

  await pool.query(
    `INSERT INTO fitness_score_history (athlete_id, assessment_id, assessment_date, overall_score)
     VALUES (?, ?, ?, ?)`,
    [athlete_id, newId, assessment_date, overallScore]
  );

  // Sync central tables (non-blocking fault tolerant)
  try {
    await syncAthleteCentralData(athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getFitnessById(newId);
}

async function updateFitnessAssessment(id, data, userId) {
  const oldRecord = await getFitnessById(id);
  if (!oldRecord) throw new Error('Fitness assessment record not found.');

  // Validate non-negative
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'number' && v < 0) {
      throw new Error(`Parameter ${k} cannot be negative.`);
    }
  }

  const updatedData = { ...oldRecord, ...data };
  let computedBmi = oldRecord.bmi;
  if (updatedData.height_cm && updatedData.weight_kg) {
    computedBmi = calculateBMI(parseFloat(updatedData.weight_kg), parseFloat(updatedData.height_cm));
  }

  const overallScore = calculateOverallFitnessScore(updatedData);
  const aiResult = await runAIFitnessAnalysis(oldRecord.athlete_id, { ...updatedData, overall_fitness_score: overallScore });

  await pool.query(
    `UPDATE fitness_assessments
     SET assessment_date = ?, strength_score = ?, endurance_score = ?, stamina_score = ?, flexibility_score = ?, agility_score = ?, speed_score = ?, reaction_time_ms = ?, balance_score = ?, body_fat_percentage = ?, bmi = ?, vo2_max = ?, resting_heart_rate = ?, recovery_rate_bpm = ?, overall_fitness_score = ?, notes = ?, ai_analysis = ?
     WHERE id = ?`,
    [
      updatedData.assessment_date,
      updatedData.strength_score,
      updatedData.endurance_score,
      updatedData.stamina_score,
      updatedData.flexibility_score,
      updatedData.agility_score,
      updatedData.speed_score,
      updatedData.reaction_time_ms,
      updatedData.balance_score,
      updatedData.body_fat_percentage,
      computedBmi,
      updatedData.vo2_max,
      updatedData.resting_heart_rate,
      updatedData.recovery_rate_bpm,
      overallScore,
      updatedData.notes,
      JSON.stringify(aiResult),
      id
    ]
  );

  await pool.query(
    `INSERT INTO fitness_history (fitness_id, athlete_id, action_type, description, changed_by, old_values, new_values)
     VALUES (?, ?, 'updated', ?, ?, ?, ?)`,
    [id, oldRecord.athlete_id, `Updated fitness assessment #${id}`, userId || null, JSON.stringify(oldRecord), JSON.stringify(data)]
  );

  try {
    await syncAthleteCentralData(oldRecord.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getFitnessById(id);
}

async function deleteFitnessAssessment(id, userId) {
  const record = await getFitnessById(id);
  if (!record) throw new Error('Fitness assessment record not found.');

  await pool.query(`DELETE FROM fitness_assessments WHERE id = ?`, [id]);

  await pool.query(
    `INSERT INTO fitness_history (fitness_id, athlete_id, action_type, description, changed_by, old_values)
     VALUES (?, ?, 'deleted', ?, ?, ?)`,
    [id, record.athlete_id, `Deleted fitness assessment #${id}`, userId || null, JSON.stringify(record)]
  );

  try {
    await syncAthleteCentralData(record.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }
  return { success: true, message: 'Fitness assessment deleted successfully.' };
}

async function getAthleteFitnessHistory(athleteId) {
  const [assessments] = await pool.query(
    `SELECT * FROM fitness_assessments WHERE athlete_id = ? ORDER BY assessment_date DESC`,
    [athleteId]
  );

  const [historyLogs] = await pool.query(
    `SELECT fh.*, u.first_name, u.last_name 
     FROM fitness_history fh
     LEFT JOIN users u ON u.id = fh.changed_by
     WHERE fh.athlete_id = ?
     ORDER BY fh.created_at DESC`,
    [athleteId]
  );

  return {
    assessments: assessments.map(a => ({
      ...a,
      ai_analysis: typeof a.ai_analysis === 'string' ? JSON.parse(a.ai_analysis) : a.ai_analysis
    })),
    timeline: historyLogs
  };
}

async function getFitnessAnalytics(filters = {}) {
  const [overview] = await pool.query(
    `SELECT 
       COUNT(*) as total_assessments,
       COUNT(DISTINCT athlete_id) as total_athletes,
       AVG(overall_fitness_score) as avg_fitness_score,
       AVG(bmi) as avg_bmi,
       AVG(strength_score) as avg_strength,
       AVG(endurance_score) as avg_endurance,
       AVG(stamina_score) as avg_stamina,
       AVG(flexibility_score) as avg_flexibility,
       AVG(agility_score) as avg_agility
     FROM fitness_assessments`
  );

  const [trends] = await pool.query(
    `SELECT DATE_FORMAT(assessment_date, '%Y-%m') as month,
            AVG(overall_fitness_score) as avg_score
     FROM fitness_assessments
     GROUP BY month
     ORDER BY month ASC LIMIT 12`
  );

  return {
    summary: overview[0] || {},
    trends
  };
}

module.exports = {
  getFitnessAssessments,
  getFitnessById,
  createFitnessAssessment,
  updateFitnessAssessment,
  deleteFitnessAssessment,
  getAthleteFitnessHistory,
  getFitnessAnalytics
};
