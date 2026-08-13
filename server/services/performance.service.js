const { pool } = require('../config/database');
const { syncAthleteCentralData } = require('./centralSync.service');

// ─── AI Performance Analysis Engine ───────────────────────────
async function runAIPerformanceAnalysis(athleteId, sportId, metricName, metricValue, recordDate) {
  try {
    // 1. Fetch metric definition
    const [metrics] = await pool.query(
      `SELECT metric_key, metric_label, metric_unit, metric_type, is_higher_better 
       FROM sport_metrics WHERE sport_id = ? AND metric_key = ?`,
      [sportId, metricName]
    );
    const metricMeta = metrics[0] || { is_higher_better: true, metric_type: 'number' };

    // 2. Fetch past performance records for this athlete & metric
    const [history] = await pool.query(
      `SELECT id, metric_value, performance_score, record_date 
       FROM performance_records 
       WHERE athlete_id = ? AND metric_name = ? AND record_date <= ?
       ORDER BY record_date ASC`,
      [athleteId, metricName, recordDate]
    );

    const numericVal = parseFloat(metricValue);

    // 3. Compute normalized Performance Score (0-100)
    let performanceScore = 75; // baseline default
    if (history.length > 0) {
      const values = history.map(h => parseFloat(h.metric_value)).concat([numericVal]);
      const maxVal = Math.max(...values, 0.001);
      const minVal = Math.min(...values);
      
      if (maxVal === minVal) {
        performanceScore = 80;
      } else if (metricMeta.is_higher_better) {
        performanceScore = Math.round(50 + ((numericVal - minVal) / (maxVal - minVal || 1)) * 48);
      } else {
        // Lower is better (e.g. lap time, reaction time)
        performanceScore = Math.round(50 + ((maxVal - numericVal) / (maxVal - minVal || 1)) * 48);
      }
    } else {
      // First record heuristic
      performanceScore = metricMeta.is_higher_better ? Math.min(95, Math.max(50, numericVal > 0 ? 70 + numericVal % 25 : 65)) : 75;
    }
    performanceScore = Math.min(100, Math.max(10, performanceScore));

    // 4. ML vs Weighted Statistical Analysis decision
    const hasSufficientHistory = history.length >= 3;
    let improvementPercentage = 0;
    let trend = 'Stable';
    let prediction = numericVal;
    let confidenceScore = hasSufficientHistory ? 88 : 65;
    let isDeclining = false;
    let isExceptional = false;

    if (hasSufficientHistory) {
      // Machine Learning / Linear Regression on historical data points
      const n = history.length;
      const prevVal = parseFloat(history[n - 1].metric_value);
      improvementPercentage = prevVal !== 0 
        ? Math.round(((numericVal - prevVal) / Math.abs(prevVal)) * 100 * 100) / 100
        : 0;
      
      if (!metricMeta.is_higher_better) {
        improvementPercentage = -improvementPercentage; // Invert so positive means improvement (e.g., faster time)
      }

      // Regression slope
      const xValues = history.map((_, i) => i);
      const yValues = history.map(h => parseFloat(h.metric_value));
      xValues.push(n);
      yValues.push(numericVal);

      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const count = xValues.length;
      const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX || 1);

      // Next value prediction
      prediction = Math.round((numericVal + slope) * 100) / 100;

      if (metricMeta.is_higher_better) {
        if (slope > 0.05) trend = 'Improving';
        else if (slope < -0.05) { trend = 'Declining'; isDeclining = true; }
      } else {
        if (slope < -0.05) trend = 'Improving';
        else if (slope > 0.05) { trend = 'Declining'; isDeclining = true; }
      }

      // Outlier detection for exceptional performance (> 1.5 standard deviation above mean)
      const avg = sumY / count;
      const stdDev = Math.sqrt(yValues.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / count);
      if (metricMeta.is_higher_better && numericVal > avg + 1.2 * stdDev) isExceptional = true;
      if (!metricMeta.is_higher_better && numericVal < avg - 1.2 * stdDev) isExceptional = true;
    } else if (history.length > 0) {
      // Weighted Statistical Analysis fallback
      const prevVal = parseFloat(history[history.length - 1].metric_value);
      improvementPercentage = prevVal !== 0
        ? Math.round(((numericVal - prevVal) / Math.abs(prevVal)) * 100 * 100) / 100
        : 0;
      if (!metricMeta.is_higher_better) improvementPercentage = -improvementPercentage;
      trend = improvementPercentage > 2 ? 'Improving' : improvementPercentage < -2 ? 'Declining' : 'Stable';
      prediction = numericVal * (1 + (improvementPercentage / 200));
    }

    // 5. Generate AI Suggestions & Reasons
    const reason = isExceptional
      ? `Exceptional effort recorded for ${metricName}! Performance exceeds historical baseline by significant margin.`
      : isDeclining
      ? `Performance in ${metricName} shows a declining trend over recent assessments. Focus training intervention.`
      : `Performance is tracking steadily along the expected target curve for ${metricName}.`;

    const suggestedImprovements = [
      isDeclining 
        ? `Incorporate targeted drill sessions focusing on ${metricName} execution.`
        : `Maintain current high-intensity training block and optimize recovery.`,
      `Review technical form during video analysis sessions.`,
      `Track stamina and endurance markers to prevent fatigue-related drops.`
    ];

    const coachRemarks = isDeclining
      ? `Recommend immediate 1-on-1 coaching feedback session for ${metricName}.`
      : `Solid performance entry. Keep up the high standard.`;

    return {
      performanceScore,
      improvementPercentage,
      trend,
      prediction,
      confidenceScore,
      isDeclining,
      isExceptional,
      reason,
      suggestedImprovements,
      coachRemarks,
      method: hasSufficientHistory ? 'Machine Learning Regression' : 'Weighted Statistical Analysis'
    };
  } catch (err) {
    console.error('Error in runAIPerformanceAnalysis:', err);
    return {
      performanceScore: 75,
      improvementPercentage: 0,
      trend: 'Stable',
      prediction: parseFloat(metricValue),
      confidenceScore: 60,
      reason: 'Standard performance calculation applied.',
      suggestedImprovements: ['Continue standard training schedule.']
    };
  }
}

// ─── Service Functions ─────────────────────────────────────────

async function getPerformanceRecords(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  const coachId = filters.coach_id ?? filters.coachId;
  if (coachId !== undefined && coachId !== null && coachId !== '') {
    whereClauses.push('a.coach_id = ?');
    params.push(coachId);
  }
  if (filters.athleteId) {
    whereClauses.push('pr.athlete_id = ?');
    params.push(filters.athleteId);
  }
  if (filters.sportId) {
    whereClauses.push('pr.sport_id = ?');
    params.push(filters.sportId);
  }
  if (filters.metricName) {
    whereClauses.push('pr.metric_name = ?');
    params.push(filters.metricName);
  }
  if (filters.search) {
    whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR a.athlete_code LIKE ? OR pr.metric_name LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  if (filters.dateFrom) {
    whereClauses.push('pr.record_date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    whereClauses.push('pr.record_date <= ?');
    params.push(filters.dateTo);
  }

  const whereSql = whereClauses.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     JOIN users u ON u.id = a.user_id
     WHERE ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await pool.query(
    `SELECT pr.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, a.coach_id, s.name as sport_name
     FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = pr.sport_id
     WHERE ${whereSql}
     ORDER BY pr.record_date DESC, pr.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    records: rows.map(r => ({
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

async function getPerformanceById(id) {
  const [rows] = await pool.query(
    `SELECT pr.*, 
            u.first_name, u.last_name, u.profile_photo,
            a.athlete_code, a.coach_id, s.name as sport_name
     FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = pr.sport_id
     WHERE pr.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const record = rows[0];
  if (typeof record.ai_analysis === 'string') {
    record.ai_analysis = JSON.parse(record.ai_analysis);
  }
  return record;
}

async function createPerformanceRecord(data, userId) {
  const { athlete_id, sport_id, record_date, metric_name, metric_value, metric_unit, notes } = data;

  // Validations
  if (!athlete_id || !metric_name || metric_value === undefined || metric_value === null) {
    throw new Error('Athlete, Metric Name, and Metric Value are required.');
  }
  if (parseFloat(metric_value) < 0) {
    throw new Error('Performance values cannot be negative.');
  }

  // Prevent Duplicate Record on exact date & metric
  const [existing] = await pool.query(
    `SELECT id FROM performance_records WHERE athlete_id = ? AND metric_name = ? AND record_date = ?`,
    [athlete_id, metric_name, record_date]
  );
  if (existing.length > 0) {
    throw new Error(`A performance record for metric "${metric_name}" on ${record_date} already exists for this athlete.`);
  }

  // Fetch coach_id from athlete
  const [ath] = await pool.query(`SELECT coach_id, sport_id FROM athletes WHERE id = ?`, [athlete_id]);
  const coach_id = ath[0]?.coach_id || null;
  const finalSportId = sport_id || ath[0]?.sport_id || 1;

  // Run AI Analysis
  const aiResult = await runAIPerformanceAnalysis(athlete_id, finalSportId, metric_name, metric_value, record_date);

  const [result] = await pool.query(
    `INSERT INTO performance_records 
       (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score, improvement_rate, notes, ai_analysis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      athlete_id,
      coach_id,
      finalSportId,
      record_date,
      metric_name,
      parseFloat(metric_value),
      metric_unit || 'units',
      aiResult.performanceScore,
      aiResult.improvementPercentage,
      notes || '',
      JSON.stringify(aiResult)
    ]
  );

  const newId = result.insertId;

  // Audit history
  await pool.query(
    `INSERT INTO performance_history (performance_id, athlete_id, action_type, description, changed_by, new_values)
     VALUES (?, ?, 'created', ?, ?, ?)`,
    [newId, athlete_id, `Created record for metric ${metric_name}`, userId || null, JSON.stringify(data)]
  );

  // Sync central tables (non-blocking fault tolerant)
  try {
    await syncAthleteCentralData(athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getPerformanceById(newId);
}

async function updatePerformanceRecord(id, data, userId) {
  const oldRecord = await getPerformanceById(id);
  if (!oldRecord) throw new Error('Performance record not found.');

  const { record_date, metric_name, metric_value, metric_unit, notes } = data;
  if (metric_value !== undefined && parseFloat(metric_value) < 0) {
    throw new Error('Performance values cannot be negative.');
  }

  const finalDate = record_date || oldRecord.record_date;
  const finalMetric = metric_name || oldRecord.metric_name;
  const finalVal = metric_value !== undefined ? parseFloat(metric_value) : oldRecord.metric_value;

  const aiResult = await runAIPerformanceAnalysis(oldRecord.athlete_id, oldRecord.sport_id, finalMetric, finalVal, finalDate);

  await pool.query(
    `UPDATE performance_records
     SET record_date = ?, metric_name = ?, metric_value = ?, metric_unit = ?, 
         performance_score = ?, improvement_rate = ?, notes = ?, ai_analysis = ?
     WHERE id = ?`,
    [
      finalDate,
      finalMetric,
      finalVal,
      metric_unit || oldRecord.metric_unit,
      aiResult.performanceScore,
      aiResult.improvementPercentage,
      notes !== undefined ? notes : oldRecord.notes,
      JSON.stringify(aiResult),
      id
    ]
  );

  await pool.query(
    `INSERT INTO performance_history (performance_id, athlete_id, action_type, description, changed_by, old_values, new_values)
     VALUES (?, ?, 'updated', ?, ?, ?, ?)`,
    [id, oldRecord.athlete_id, `Updated performance record #${id}`, userId || null, JSON.stringify(oldRecord), JSON.stringify(data)]
  );

  try {
    await syncAthleteCentralData(oldRecord.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }

  return getPerformanceById(id);
}

async function deletePerformanceRecord(id, userId) {
  const record = await getPerformanceById(id);
  if (!record) throw new Error('Performance record not found.');

  await pool.query(`DELETE FROM performance_records WHERE id = ?`, [id]);

  await pool.query(
    `INSERT INTO performance_history (performance_id, athlete_id, action_type, description, changed_by, old_values)
     VALUES (?, ?, 'deleted', ?, ?, ?)`,
    [id, record.athlete_id, `Deleted performance record #${id}`, userId || null, JSON.stringify(record)]
  );

  try {
    await syncAthleteCentralData(record.athlete_id);
  } catch (syncErr) {
    console.error('Central sync non-fatal warning:', syncErr);
  }
  return { success: true, message: 'Performance record deleted successfully.' };
}

async function getAthletePerformanceHistory(athleteId) {
  const [records] = await pool.query(
    `SELECT pr.*, s.name as sport_name 
     FROM performance_records pr
     LEFT JOIN sports s ON s.id = pr.sport_id
     WHERE pr.athlete_id = ?
     ORDER BY pr.record_date DESC`,
    [athleteId]
  );

  const [historyLogs] = await pool.query(
    `SELECT ph.*, u.first_name, u.last_name
     FROM performance_history ph
     LEFT JOIN users u ON u.id = ph.changed_by
     WHERE ph.athlete_id = ?
     ORDER BY ph.created_at DESC`,
    [athleteId]
  );

  return {
    records: records.map(r => ({
      ...r,
      ai_analysis: typeof r.ai_analysis === 'string' ? JSON.parse(r.ai_analysis) : r.ai_analysis
    })),
    timeline: historyLogs
  };
}

async function getPerformanceAnalytics(filters = {}) {
  const coachId = filters.coach_id ?? filters.coachId;
  const whereClauses = [];
  const params = [];

  if (coachId !== undefined && coachId !== null && coachId !== '') {
    whereClauses.push('a.coach_id = ?');
    params.push(coachId);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [overview] = await pool.query(
    `SELECT 
       COUNT(*) as total_records,
       COUNT(DISTINCT pr.athlete_id) as total_athletes,
       AVG(pr.performance_score) as avg_score,
       MAX(pr.performance_score) as top_score,
       SUM(CASE WHEN pr.improvement_rate > 0 THEN 1 ELSE 0 END) as total_improved,
       SUM(CASE WHEN pr.improvement_rate < 0 THEN 1 ELSE 0 END) as total_declining
     FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     ${whereSql}`,
    params
  );

  const [trendData] = await pool.query(
    `SELECT DATE_FORMAT(pr.record_date, '%Y-%m') as month, 
            AVG(pr.performance_score) as avg_score,
            COUNT(*) as record_count
     FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     ${whereSql}
     GROUP BY month
     ORDER BY month ASC LIMIT 12`,
    params
  );

  const [topPerformers] = await pool.query(
    `SELECT pr.athlete_id, u.first_name, u.last_name, u.profile_photo, 
            s.name as sport_name, AVG(pr.performance_score) as avg_score
     FROM performance_records pr
     JOIN athletes a ON a.id = pr.athlete_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN sports s ON s.id = pr.sport_id
     ${whereSql}
     GROUP BY pr.athlete_id, u.first_name, u.last_name, u.profile_photo, s.name
     ORDER BY avg_score DESC LIMIT 5`,
    params
  );

  return {
    summary: overview[0] || {},
    trends: trendData,
    topPerformers
  };
}

// ─── Custom Sport Metrics Management ─────────────────────────
async function getSportMetrics(sportId) {
  let query = `SELECT sm.*, s.name as sport_name FROM sport_metrics sm JOIN sports s ON s.id = sm.sport_id WHERE sm.is_active = TRUE`;
  const params = [];
  if (sportId) {
    query += ` AND sm.sport_id = ?`;
    params.push(sportId);
  }
  query += ` ORDER BY sm.display_order ASC, sm.id ASC`;
  const [rows] = await pool.query(query, params);
  return rows;
}

async function createCustomMetric(data) {
  const { sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better } = data;
  if (!sport_id || !metric_key || !metric_label) {
    throw new Error('Sport ID, Metric Key, and Metric Label are required.');
  }

  const keySlug = metric_key.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  await pool.query(
    `INSERT INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE metric_label = VALUES(metric_label), metric_unit = VALUES(metric_unit), metric_type = VALUES(metric_type), is_higher_better = VALUES(is_higher_better)`,
    [sport_id, keySlug, metric_label, metric_unit || '', metric_type || 'number', is_higher_better !== false]
  );

  return getSportMetrics(sport_id);
}

// ─── Import & Export Data ─────────────────────────────────────
async function importPerformanceData(records, userId) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Import data must be a non-empty array of records.');
  }

  let importedCount = 0;
  for (const item of records) {
    try {
      await createPerformanceRecord(item, userId);
      importedCount++;
    } catch (err) {
      console.warn('Import record failed:', item, err.message);
    }
  }

  return { importedCount, total: records.length };
}

async function exportPerformanceData(filters = {}) {
  const result = await getPerformanceRecords({ ...filters, limit: 500, page: 1 });
  return result.records;
}

module.exports = {
  getPerformanceRecords,
  getPerformanceById,
  createPerformanceRecord,
  updatePerformanceRecord,
  deletePerformanceRecord,
  getAthletePerformanceHistory,
  getPerformanceAnalytics,
  getSportMetrics,
  createCustomMetric,
  importPerformanceData,
  exportPerformanceData
};
