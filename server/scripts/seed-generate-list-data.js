const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const FIRST_NAMES_MALE = [
  'Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Kabir', 'Dev', 'Manish', 'Karthik',
  'Sai', 'Pranav', 'Nikhil', 'Gaurav', 'Vikram', 'Harsh', 'Siddharth', 'Varun',
  'Yash', 'Aryan', 'Ayush', 'Rishi', 'Kunal', 'Tejas', 'Tanmay', 'Alok',
  'Omkar', 'Sameer', 'Deepak', 'Akash', 'Suraj', 'Neeraj', 'Sumit', 'Lakshya'
];

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Diya', 'Isha', 'Aanya', 'Saanvi', 'Pooja', 'Riya', 'Shreya',
  'Neha', 'Meera', 'Tanvi', 'Kritika', 'Swati', 'Snehal', 'Pavitra', 'Anjali',
  'Divya', 'Deepika', 'Manasi', 'Simran', 'Rashmi', 'Komal', 'Bhavna', 'Payal',
  'Aditi', 'Prerna', 'Vandana', 'Sakshi', 'Geeta', 'Babita', 'Vinesh', 'Saina'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Kumar', 'Patel', 'Singh', 'Reddy', 'Nair', 'Iyer',
  'Gupta', 'Joshi', 'Mehta', 'Rao', 'Choudhary', 'Yadav', 'Mishra', 'Pandey',
  'Deshmukh', 'Kulkarni', 'Bose', 'Mukherjee', 'Das', 'Sen', 'Gill', 'Sandhu',
  'Malik', 'Phogat', 'Poddar', 'Chauhan', 'Thakur', 'Bhatt', 'Nambiar', 'Pillai'
];

const SPORT_COACHES = {
  1: { first: 'Rajesh', last: 'Kumar', email: 'rajesh.kumar@academy.sports', user_id: 2, coach_id: 1 },
  2: { first: 'Priya', last: 'Sharma', email: 'priya.sharma@academy.sports', user_id: 3, coach_id: 2 },
  3: { first: 'Arun', last: 'Verma', email: 'arun.verma@academy.sports', user_id: 4, coach_id: 3 },
  4: { first: 'Adhithyan', last: 'M S', email: 'adhithyan.cricket@academy.sports', user_id: 14, coach_id: 5 },
  5: { first: 'Pullela', last: 'Gopichand', email: 'pullela.badminton@academy.sports' },
  6: { first: 'Mahavir', last: 'Phogat', email: 'mahavir.wrestling@academy.sports' },
  7: { first: 'Vijender', last: 'Singh', email: 'vijender.boxing@academy.sports' },
  8: { first: 'Bishweshwar', last: 'Nandi', email: 'nandi.gymnastics@academy.sports' },
  9: { first: 'G.E.', last: 'Sridharan', email: 'sridharan.volleyball@academy.sports' },
  10: { first: 'Sharath', last: 'Kamal', email: 'sharath.tt@academy.sports' }
};

const EXTRA_SPORT_METRICS = {
  6: [ // Wrestling
    { key: 'takedown_success', label: 'Takedown Success', unit: '%', type: 'number', higher_better: 1 },
    { key: 'control_time', label: 'Control Time', unit: 'sec', type: 'number', higher_better: 1 },
    { key: 'pin_rate', label: 'Pin Fall Rate', unit: '%', type: 'number', higher_better: 1 },
    { key: 'defense_score', label: 'Defense Score', unit: 'pts', type: 'number', higher_better: 1 }
  ],
  7: [ // Boxing
    { key: 'punch_accuracy', label: 'Punch Accuracy', unit: '%', type: 'number', higher_better: 1 },
    { key: 'punches_landed', label: 'Punches Landed', unit: 'punches', type: 'number', higher_better: 1 },
    { key: 'reaction_time', label: 'Reaction Time', unit: 'ms', type: 'number', higher_better: 0 },
    { key: 'rounds_sparred', label: 'Rounds Sparred', unit: 'rounds', type: 'number', higher_better: 1 }
  ],
  8: [ // Gymnastics
    { key: 'execution_score', label: 'Execution Score', unit: 'pts', type: 'number', higher_better: 1 },
    { key: 'difficulty_score', label: 'Difficulty Score', unit: 'pts', type: 'number', higher_better: 1 },
    { key: 'balance_stability', label: 'Balance & Stability', unit: 'score', type: 'number', higher_better: 1 },
    { key: 'landing_accuracy', label: 'Landing Accuracy', unit: '%', type: 'number', higher_better: 1 }
  ],
  9: [ // Volleyball
    { key: 'spike_speed', label: 'Spike Speed', unit: 'km/h', type: 'number', higher_better: 1 },
    { key: 'serve_aces', label: 'Serve Aces', unit: 'aces', type: 'number', higher_better: 1 },
    { key: 'block_success', label: 'Block Success Rate', unit: '%', type: 'number', higher_better: 1 },
    { key: 'dig_accuracy', label: 'Dig Accuracy', unit: '%', type: 'number', higher_better: 1 }
  ],
  10: [ // Table Tennis
    { key: 'smash_speed', label: 'Smash Speed', unit: 'km/h', type: 'number', higher_better: 1 },
    { key: 'forehand_accuracy', label: 'Forehand Accuracy', unit: '%', type: 'number', higher_better: 1 },
    { key: 'rally_length', label: 'Avg Rally Length', unit: 'shots', type: 'number', higher_better: 1 },
    { key: 'serve_win_rate', label: 'Serve Win Rate', unit: '%', type: 'number', higher_better: 1 }
  ]
};

// Spread dates across 2024, 2025, 2026, 2027
const DATE_MILESTONES = [
  '2024-02-15', '2024-04-10', '2024-06-20', '2024-08-15', '2024-10-12', '2024-12-05',
  '2025-01-20', '2025-03-15', '2025-05-18', '2025-07-22', '2025-09-14', '2025-11-20',
  '2026-01-15', '2026-03-10', '2026-05-20', '2026-07-15', '2026-09-10', '2026-10-25',
  '2027-01-10', '2027-02-20', '2027-04-15'
];

async function seed() {
  console.log('🚀 Starting comprehensive data seed for Generate List...');

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 1. Ensure Sport Metrics exist for all sports
  for (const [sportId, metrics] of Object.entries(EXTRA_SPORT_METRICS)) {
    for (const m of metrics) {
      await pool.query(`
        INSERT INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE metric_label = VALUES(metric_label), metric_unit = VALUES(metric_unit), is_active = 1
      `, [sportId, m.key, m.label, m.unit, m.type, m.higher_better]);
    }
  }
  console.log('✅ Sport metrics verified and populated for all sports.');

  // 2. Ensure Coaches exist for all sports
  const coachMap = {}; // sport_id -> coach_id
  for (const [sportIdStr, coachInfo] of Object.entries(SPORT_COACHES)) {
    const sportId = parseInt(sportIdStr);
    const [existing] = await pool.query('SELECT c.id FROM coaches c WHERE c.sport_id = ? LIMIT 1', [sportId]);
    if (existing.length > 0) {
      coachMap[sportId] = existing[0].id;
    } else {
      // Create user for coach
      const [uRes] = await pool.query(`
        INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (2, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
      `, [
        `coach_${sportId}_${Date.now() % 10000}`,
        coachInfo.email,
        defaultPasswordHash,
        coachInfo.first,
        coachInfo.last,
        `98765${10000 + sportId}`
      ]);
      const userId = uRes.insertId;
      const coachCode = `CCH-${sportId}-${Date.now() % 1000}`;
      const [cRes] = await pool.query(`
        INSERT INTO coaches (coach_code, user_id, sport_id, specialization, experience_years, qualification, is_active)
        VALUES (?, ?, ?, 'Head Coach', 10, 'National Level Certified', 1)
      `, [coachCode, userId, sportId]);
      coachMap[sportId] = cRes.insertId;
      console.log(`Created coach ${coachInfo.first} ${coachInfo.last} for sport ${sportId}`);
    }
  }

  // 3. Fetch all categories across all sports
  const [categories] = await pool.query(`
    SELECT c.id, c.sport_id, s.name as sport_name, c.name, c.gender, c.age_min, c.age_max
    FROM categories c
    JOIN sports s ON c.sport_id = s.id
    ORDER BY c.sport_id, c.id
  `);

  console.log(`Checking ${categories.length} categories across all sports...`);

  let addedAthletesCount = 0;
  let nameIndex = 0;

  for (const cat of categories) {
    // Check how many active athletes already exist in this category
    const [currAthletes] = await pool.query(
      'SELECT id FROM athletes WHERE category_id = ? AND is_active = 1',
      [cat.id]
    );

    const needed = Math.max(0, 2 - currAthletes.length);
    for (let i = 0; i < needed; i++) {
      nameIndex++;
      const isFemale = cat.gender === 'female' || (cat.gender === 'mixed' && i % 2 === 1);
      const firstNameList = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
      const firstName = firstNameList[(nameIndex + cat.id * 3 + i) % firstNameList.length];
      const lastName = LAST_NAMES[(nameIndex * 7 + cat.id + i) % LAST_NAMES.length];
      const genderVal = isFemale ? 'female' : 'male';

      // Age within range
      const minAge = cat.age_min || 14;
      const maxAge = cat.age_max || 25;
      const targetAge = Math.min(maxAge, Math.max(minAge, minAge + (i % (maxAge - minAge + 1 || 1))));
      const birthYear = 2026 - targetAge;
      const dob = `${birthYear}-${String((cat.id % 12) + 1).padStart(2, '0')}-${String(((cat.id * 5 + i * 7) % 25) + 1).padStart(2, '0')}`;

      const uniqueTag = `${Date.now() % 100000}_${nameIndex}`;
      const username = `ath_${cat.sport_id}_${cat.id}_${i + 1}_${uniqueTag}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${cat.id}.${i + 1}.${uniqueTag}@academy.sports`;
      const athleteCode = `ATH-${cat.sport_name.slice(0, 3).toUpperCase()}-${cat.id}-${String(i + 1).padStart(2, '0')}-${nameIndex}`;
      const coachId = coachMap[cat.sport_id] || 1;

      // 1. Insert user
      const [uRes] = await pool.query(`
        INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active)
        VALUES (4, ?, ?, ?, ?, ?, ?, 1)
      `, [
        username,
        email,
        defaultPasswordHash,
        firstName,
        lastName,
        `99${String(cat.id % 900 + 100)}${String(nameIndex % 9000 + 1000)}`
      ]);
      const userId = uRes.insertId;

      // 2. Insert athlete
      const height = isFemale ? 160 + (cat.id % 15) : 170 + (cat.id % 20);
      const weight = isFemale ? 52 + (cat.id % 14) : 64 + (cat.id % 22);

      const [aRes] = await pool.query(`
        INSERT INTO athletes (
          user_id, coach_id, sport_id, category_id, athlete_code,
          date_of_birth, gender, height_cm, weight_kg, blood_group,
          city, state, academy_name, registration_date, joining_date,
          medical_status, current_status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'B+', 'Bangalore', 'Karnataka', 'National Sports Academy', '2024-01-01', '2024-01-05', 'fit', 'active', 1)
      `, [
        userId, coachId, cat.sport_id, cat.id, athleteCode,
        dob, genderVal, height, weight
      ]);
      const athleteId = aRes.insertId;
      addedAthletesCount++;

      // Seed data records for this athlete across date milestones
      await seedAthleteRecords(athleteId, coachId, cat.sport_id, cat.id, targetAge);
    }
  }

  console.log(`✅ Added ${addedAthletesCount} new athletes across underrepresented categories.`);

  // 4. Ensure ALL athletes in the database have full historical records across 2024-2027
  const [allAthletes] = await pool.query(`
    SELECT a.id, a.coach_id, a.sport_id, a.category_id,
           TIMESTAMPDIFF(YEAR, a.date_of_birth, CURDATE()) as age,
           COUNT(pr.id) as perf_count
    FROM athletes a
    LEFT JOIN performance_records pr ON pr.athlete_id = a.id
    WHERE a.is_active = 1
    GROUP BY a.id, a.coach_id, a.sport_id, a.category_id, a.date_of_birth
  `);

  let enrichedAthletesCount = 0;
  for (const ath of allAthletes) {
    if (ath.perf_count < 10) {
      await seedAthleteRecords(ath.id, ath.coach_id || coachMap[ath.sport_id] || 1, ath.sport_id, ath.category_id, ath.age || 18);
      enrichedAthletesCount++;
    }
  }

  console.log(`✅ Enriched ${enrichedAthletesCount} existing athletes with records across date ranges.`);
  console.log('🎉 Comprehensive database seeding complete!');
  process.exit(0);
}

async function seedAthleteRecords(athleteId, coachId, sportId, categoryId, age) {
  // 1. Get sport metrics
  const [metrics] = await pool.query('SELECT metric_key, metric_label, metric_unit, is_higher_better FROM sport_metrics WHERE sport_id = ? AND is_active = 1', [sportId]);
  const metricList = metrics.length > 0 ? metrics : [
    { metric_key: 'general_score', metric_label: 'Overall Performance', metric_unit: 'pts', is_higher_better: 1 }
  ];

  // Base skill level for this athlete (70-95)
  const baseSkill = 70 + (athleteId % 24);

  // Seed Performance Records across all DATE_MILESTONES
  for (let idx = 0; idx < DATE_MILESTONES.length; idx++) {
    const d = DATE_MILESTONES[idx];
    const metric = metricList[idx % metricList.length];

    // Gradually improving trajectory
    const progressBonus = Math.min(8, idx * 0.4);
    const scoreVal = Math.min(98, Math.max(62, Math.round(baseSkill + progressBonus + (Math.sin(idx + athleteId) * 4))));
    const improvementRate = idx === 0 ? 0 : parseFloat(((scoreVal - (baseSkill - 2)) * 0.4).toFixed(1));

    let metricVal = scoreVal;
    if (metric.metric_unit === 'sec') {
      metricVal = metric.metric_key.includes('400') ? (55 - scoreVal * 0.1).toFixed(2) : (12.5 - scoreVal * 0.025).toFixed(2);
    } else if (metric.metric_unit === 'km/h') {
      metricVal = (25 + scoreVal * 0.15).toFixed(1);
    } else if (metric.metric_unit === 'ms') {
      metricVal = Math.round(220 - scoreVal * 0.8);
    } else if (metric.metric_unit === '%') {
      metricVal = Math.min(99, Math.round(scoreVal));
    }

    const aiAnalysis = JSON.stringify({
      trend: improvementRate >= 2 ? 'Improving' : improvementRate < -2 ? 'Declining' : 'Stable',
      isExceptional: scoreVal >= 90,
      isDeclining: scoreVal < 68,
      confidence: 85 + (idx % 10)
    });

    await pool.query(`
      INSERT INTO performance_records (
        athlete_id, coach_id, sport_id, record_date,
        metric_name, metric_value, metric_unit, performance_score,
        improvement_rate, notes, ai_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Routine academy tracking log', ?)
      ON DUPLICATE KEY UPDATE performance_score = VALUES(performance_score)
    `, [
      athleteId, coachId, sportId, d,
      metric.metric_key, String(metricVal), metric.metric_unit, scoreVal,
      improvementRate, aiAnalysis
    ]);
  }

  // Seed Fitness Assessments (4 key assessments: 2024, 2025, 2026, 2027)
  const fitnessDates = ['2024-03-20', '2024-09-15', '2025-03-20', '2025-09-15', '2026-03-20', '2026-08-15', '2027-02-15'];
  for (let fIdx = 0; fIdx < fitnessDates.length; fIdx++) {
    const fDate = fitnessDates[fIdx];
    const fitnessScore = Math.min(96, Math.max(68, Math.round(baseSkill + fIdx * 0.8 + ((athleteId * 3) % 7))));
    await pool.query(`
      INSERT INTO fitness_assessments (
        athlete_id, coach_id, assessment_date,
        strength_score, endurance_score, stamina_score, flexibility_score,
        agility_score, speed_score, balance_score, bmi, overall_fitness_score,
        body_fat_percentage, vo2_max, resting_heart_rate, recovery_rate_bpm, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 21.5, ?, 14.2, 54.5, 58, 88, 'Comprehensive physical conditioning test')
      ON DUPLICATE KEY UPDATE overall_fitness_score = VALUES(overall_fitness_score)
    `, [
      athleteId, coachId, fDate,
      fitnessScore, fitnessScore + 1, fitnessScore - 1, fitnessScore,
      fitnessScore + 2, fitnessScore, fitnessScore - 2, fitnessScore
    ]);
  }

  // Seed Attendance Records (monthly attendance batches across 2024 to 2027)
  for (let aIdx = 0; aIdx < DATE_MILESTONES.length; aIdx++) {
    const aDate = DATE_MILESTONES[aIdx];
    // 92% present rate
    const isPresent = (athleteId + aIdx) % 10 !== 0;
    await pool.query(`
      INSERT INTO attendance (athlete_id, coach_id, attendance_date, session, status, remarks)
      VALUES (?, ?, ?, 'Morning', ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `, [
      athleteId, coachId, aDate,
      isPresent ? 'present' : 'absent',
      isPresent ? 'Regular training session' : 'Authorized medical leave'
    ]);
  }

  // Seed Coach Remarks
  await pool.query(`
    INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks)
    VALUES (?, ?, '2026-08-01', 'performance', ?, 'Demonstrates outstanding tactical discipline and consistent athletic drive.')
    ON DUPLICATE KEY UPDATE rating = VALUES(rating)
  `, [athleteId, coachId, (7.5 + (baseSkill % 20) * 0.1).toFixed(1)]);

  // Seed Rankings
  await pool.query(`
    INSERT INTO rankings (
      athlete_id, sport_id, category_id, rank_position,
      performance_score, fitness_score, consistency_score,
      overall_ranking_score, rank_type, rank_date
    ) VALUES (?, ?, ?, ?, ?, ?, 90, ?, 'overall', '2026-08-01')
    ON DUPLICATE KEY UPDATE overall_ranking_score = VALUES(overall_ranking_score)
  `, [
    athleteId, sportId, categoryId,
    (athleteId % 50) + 1,
    baseSkill,
    baseSkill + 2,
    baseSkill
  ]);

  // For ~10% athletes, add injury records
  if (athleteId % 8 === 0) {
    const isRecovered = athleteId % 16 === 0;
    await pool.query(`
      INSERT INTO injuries (
        athlete_id, injury_type, body_part, injury_date, severity,
        diagnosis, treatment, recovery_status, availability_status, is_available
      ) VALUES (?, 'Sprain', 'Ankle', '2025-06-10', 'minor', 'Grade 1 Ligament Strain', 'Physiotherapy & rest', ?, ?, ?)
      ON DUPLICATE KEY UPDATE recovery_status = VALUES(recovery_status)
    `, [
      athleteId,
      isRecovered ? 'recovered' : 'recovering',
      isRecovered ? 'fit' : 'unfit',
      isRecovered ? 1 : 0
    ]);
  }
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
