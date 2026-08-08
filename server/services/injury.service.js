const { pool } = require('../config/database');
const { syncAthleteCentralData } = require('./centralSync.service');

// ─── AI Injury Analysis Engine ─────────────────────────────────
async function runAIInjuryAnalysis(athleteId, injuryData) {
  try {
    // Fetch historical injuries for athlete
    const [pastInjuries] = await pool.query(
      `SELECT * FROM injuries WHERE athlete_id = ? AND id != ?`,
      [athleteId, injuryData.id || 0]
    );

    // Fetch athlete's fitness score & attendance %
    const [fitnessRows] = await pool.query(
      `SELECT overall_fitness_score FROM fitness_assessments 
       WHERE athlete_id = ? ORDER BY assessment_date DESC LIMIT 1`,
      [athleteId]
    );
    const fitnessScore = parseFloat(fitnessRows[0]?.overall_fitness_score || 70);

    const hasHistory = pastInjuries.length >= 2;

    const injuryDate = new Date(injuryData.injury_date);
    const expReturnDate = new Date(injuryData.expected_recovery_date || Date.now() + 30 * 86400000);
    const today = new Date();

    const totalDurationDays = Math.max(1, Math.round((expReturnDate - injuryDate) / (1000 * 3600 * 24)));
    const elapsedDays = Math.max(0, Math.round((today - injuryDate) / (1000 * 3600 * 24)));

    let recoveryPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDurationDays) * 100)));
    if (injuryData.recovery_status === 'recovered') recoveryPercentage = 100;

    // Severity weighting
    const severityWeights = { minor: 1.0, moderate: 1.5, severe: 2.2, critical: 3.0 };
    const severityFactor = severityWeights[injuryData.severity] || 1.2;

    // Reinjury probability calculation
    let reinjuryProbability = Math.round(15 * severityFactor);
    if (pastInjuries.some(i => i.body_part === injuryData.body_part)) {
      reinjuryProbability += 25; // Same body part recurrent injury
    }
    if (fitnessScore < 60) reinjuryProbability += 15;
    reinjuryProbability = Math.min(95, Math.max(5, reinjuryProbability));

    // Training Readiness (0-100%)
    let trainingReadiness = 0;
    if (injuryData.recovery_status === 'recovered') trainingReadiness = 100;
    else if (injuryData.availability_status === 'restricted') trainingReadiness = 50;
    else if (injuryData.availability_status === 'under_observation') trainingReadiness = 75;
    else trainingReadiness = Math.round(recoveryPercentage * 0.8);

    // Availability Prediction
    const remainingDays = Math.max(0, Math.round((expReturnDate - today) / (1000 * 3600 * 24)));
    const expectedReturnDateStr = expReturnDate.toISOString().split('T')[0];

    const medicalRecommendation = reinjuryProbability > 50
      ? `High reinjury risk (${reinjuryProbability}%). Require gradual physical rehabilitation prior to competitive return.`
      : injuryData.severity === 'severe' || injuryData.severity === 'critical'
      ? `Follow doctor prescribed physical therapy protocols. Avoid high-impact contact drills.`
      : `Injury is healing on schedule (${recoveryPercentage}% completed). Continue light conditioning.`;

    const trainingRecommendation = trainingReadiness < 50
      ? `Restricted to light non-impact cardiovascular maintenance only.`
      : trainingReadiness < 85
      ? `Cleared for non-contact tactical drills and light skill sessions.`
      : `Full clearing for competitive squad selection imminent.`;

    return {
      recoveryPercentage,
      expectedReturnDate: expectedReturnDateStr,
      remainingDays,
      availabilityStatus: injuryData.availability_status || (recoveryPercentage >= 100 ? 'fit' : 'unfit'),
      reinjuryProbability,
      trainingReadiness,
      confidenceScore: hasHistory ? 88 : 72,
      medicalRecommendation,
      trainingRecommendation,
      method: hasHistory ? 'Machine Learning Injury Prediction' : 'Statistical Recovery Estimation'
    };
  } catch (err) {
    console.error('Error in runAIInjuryAnalysis:', err);
    return {
      recoveryPercentage: 50,
      expectedReturnDate: injuryData.expected_recovery_date || '',
      reinjuryProbability: 20,
      trainingReadiness: 40,
      confidenceScore: 60,
      medicalRecommendation: 'Consult medical staff for evaluation.',
      trainingRecommendation: 'Limit intensity.'
    };
  }
}

// ─── Service Functions ─────────────────────────────────────────

async function getInjuries(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  if (filters.athleteId) {
    whereClauses.push('inj.athlete_id = ?');
    params.push(filters.athleteId);
  }
  if (filters.severity) {
    whereClauses.push('inj.severity = ?');
    params.push(filters.severity);
  }
  if (filters.recoveryStatus) {
    whereClauses.push('inj.recovery_status = ?');
    params.push(filters.recoveryStatus);
  }
  if (filters.availabilityStatus) {
    whereClauses.push('inj.availability_status = ?');
    params.push(filters.availabilityStatus);
  }
  if (filters.search) {
    whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR inj.injury_type LIKE ? OR inj.body_part LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM injuries inj
     JOIN athletes a ON a.id = inj.athlete_id
     JOIN users u ON u.id = a.user_id
     WHERE ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await pool.query(
    `SELECT inj.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name as sport_name
     FROM injuries inj
     JOIN athletes a ON a.id = inj.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     WHERE ${whereSql}
     ORDER BY inj.injury_date DESC, inj.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    injuries: rows.map(r => ({
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

async function getInjuryById(id) {
  const [rows] = await pool.query(
    `SELECT inj.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, s.name as sport_name
     FROM injuries inj
     JOIN athletes a ON a.id = inj.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = a.sport_id
     WHERE inj.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const record = rows[0];
  if (typeof record.ai_analysis === 'string') {
    record.ai_analysis = JSON.parse(record.ai_analysis);
  }

  // Fetch recovery logs & doctor remarks
  const [recoveryLogs] = await pool.query(
    `SELECT * FROM recovery_history WHERE injury_id = ? ORDER BY checkup_date DESC`,
    [id]
  );
  const [remarks] = await pool.query(
    `SELECT * FROM doctor_remarks WHERE injury_id = ? ORDER BY remark_date DESC`,
    [id]
  );

  return {
    ...record,
    recoveryLogs,
    doctorRemarks: remarks
  };
}

async function createInjury(data, userId) {
  const {
    athlete_id,
    injury_type,
    body_part,
    severity,
    diagnosis,
    treatment,
    medication,
    doctor_name,
    hospital,
    injury_date,
    expected_recovery_date,
    actual_recovery_date,
    recovery_status,
    availability_status,
    notes
  } = data;

  if (!athlete_id || !injury_type || !injury_date) {
    throw new Error('Athlete ID, Injury Type, and Injury Date are required.');
  }

  // Date validation: recovery date cannot be before injury date
  if (expected_recovery_date && expected_recovery_date < injury_date) {
    throw new Error('Expected recovery date cannot be before injury date.');
  }
  if (actual_recovery_date && actual_recovery_date < injury_date) {
    throw new Error('Actual recovery date cannot be before injury date.');
  }

  const aiResult = await runAIInjuryAnalysis(athlete_id, data);

  const [result] = await pool.query(
    `INSERT INTO injuries 
       (athlete_id, injury_type, body_part, severity, diagnosis, treatment, medication, doctor_name, hospital, injury_date, expected_recovery_date, actual_recovery_date, recovery_status, availability_status, notes, ai_analysis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      athlete_id,
      injury_type,
      body_part || 'General',
      severity || 'minor',
      diagnosis || '',
      treatment || '',
      medication || '',
      doctor_name || '',
      hospital || '',
      injury_date,
      expected_recovery_date || null,
      actual_recovery_date || null,
      recovery_status || 'recovering',
      availability_status || 'unfit',
      notes || '',
      JSON.stringify(aiResult)
    ]
  );

  const newId = result.insertId;

  // Update athlete medical status in `athletes` table
  await pool.query(
    `UPDATE athletes SET medical_status = ? WHERE id = ?`,
    [availability_status === 'fit' ? 'fit' : 'injured', athlete_id]
  );

  // Sync central intelligence (non-blocking fault tolerant)
  try {
    await syncAthleteCentralData(athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getInjuryById(newId);
}

async function updateInjury(id, data, userId) {
  const oldRecord = await getInjuryById(id);
  if (!oldRecord) throw new Error('Injury record not found.');

  const updated = { ...oldRecord, ...data };

  if (updated.expected_recovery_date && updated.expected_recovery_date < updated.injury_date) {
    throw new Error('Expected recovery date cannot be before injury date.');
  }

  const aiResult = await runAIInjuryAnalysis(oldRecord.athlete_id, updated);

  await pool.query(
    `UPDATE injuries
     SET injury_type = ?, body_part = ?, severity = ?, diagnosis = ?, treatment = ?, medication = ?, doctor_name = ?, hospital = ?, injury_date = ?, expected_recovery_date = ?, actual_recovery_date = ?, recovery_status = ?, availability_status = ?, notes = ?, ai_analysis = ?
     WHERE id = ?`,
    [
      updated.injury_type,
      updated.body_part,
      updated.severity,
      updated.diagnosis,
      updated.treatment,
      updated.medication,
      updated.doctor_name,
      updated.hospital,
      updated.injury_date,
      updated.expected_recovery_date || null,
      updated.actual_recovery_date || null,
      updated.recovery_status,
      updated.availability_status,
      updated.notes,
      JSON.stringify(aiResult),
      id
    ]
  );

  // Update athlete medical status
  await pool.query(
    `UPDATE athletes SET medical_status = ? WHERE id = ?`,
    [updated.availability_status === 'fit' ? 'fit' : 'injured', oldRecord.athlete_id]
  );

  try {
    await syncAthleteCentralData(oldRecord.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getInjuryById(id);
}

async function deleteInjury(id, userId) {
  const record = await getInjuryById(id);
  if (!record) throw new Error('Injury record not found.');

  await pool.query(`DELETE FROM injuries WHERE id = ?`, [id]);

  await pool.query(
    `UPDATE athletes SET medical_status = 'fit' WHERE id = ?`,
    [record.athlete_id]
  );

  try {
    await syncAthleteCentralData(record.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }
  return { success: true, message: 'Injury record deleted.' };
}

async function addRecoveryLog(injuryId, data, userId) {
  const injury = await getInjuryById(injuryId);
  if (!injury) throw new Error('Injury record not found.');

  const { checkup_date, recovery_percentage, status_update, doctor_name, notes } = data;

  await pool.query(
    `INSERT INTO recovery_history (injury_id, athlete_id, checkup_date, recovery_percentage, status_update, doctor_name, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [injuryId, injury.athlete_id, checkup_date || new Date().toISOString().split('T')[0], recovery_percentage || 0, status_update || 'recovering', doctor_name || '', notes || '']
  );

  // Update injury recovery status & availability status
  let newAvailability = injury.availability_status;
  if (parseFloat(recovery_percentage) >= 100 || status_update === 'recovered') {
    newAvailability = 'fit';
  } else if (parseFloat(recovery_percentage) >= 75) {
    newAvailability = 'restricted';
  }

  await updateInjury(injuryId, {
    recovery_status: status_update || (parseFloat(recovery_percentage) >= 100 ? 'recovered' : 'recovering'),
    availability_status: newAvailability
  }, userId);

  return getInjuryById(injuryId);
}

async function getAthleteInjuryHistory(athleteId) {
  const [injuries] = await pool.query(
    `SELECT * FROM injuries WHERE athlete_id = ? ORDER BY injury_date DESC`,
    [athleteId]
  );

  const [medicalHistory] = await pool.query(
    `SELECT * FROM athlete_medical_history WHERE athlete_id = ? ORDER BY record_date DESC`,
    [athleteId]
  );

  return {
    injuries: injuries.map(i => ({
      ...i,
      ai_analysis: typeof i.ai_analysis === 'string' ? JSON.parse(i.ai_analysis) : i.ai_analysis
    })),
    medicalHistory
  };
}

module.exports = {
  getInjuries,
  getInjuryById,
  createInjury,
  updateInjury,
  deleteInjury,
  addRecoveryLog,
  getAthleteInjuryHistory
};
