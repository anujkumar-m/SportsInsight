'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/database');

const MALE_FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Advik', 'Kabir', 'Ansh', 'Reyansh',
  'Dhruv', 'Siddharth', 'Atharv', 'Aayush', 'Samar', 'Shaurya', 'Tejas', 'Utkarsh',
  'Yash', 'Tanmay', 'Pranav', 'Nikhil', 'Mayank', 'Harsh', 'Gaurav', 'Chirag',
  'Bhavin', 'Akshat', 'Tushar', 'Tarun', 'Sarthak', 'Rohan', 'Kunal', 'Jayesh',
  'Himanshu', 'Hardik', 'Devansh', 'Ayush', 'Aryan', 'Arman', 'Arvind', 'Aalok',
  'Bhavesh', 'Chetan', 'Darshan', 'Deepak', 'Girish', 'Hemant', 'Inder', 'Jitendra',
  'Kailash', 'Lalit', 'Manish', 'Naveen', 'Omkar', 'Pankaj', 'Raghav', 'Sachin',
  'Umesh', 'Varun', 'Yogesh', 'Abhay', 'Abhishek', 'Adarsh', 'Ajay', 'Akhil',
  'Alok', 'Amit', 'Anand', 'Aniket', 'Anil', 'Ankit', 'Anup', 'Ashish',
  'Ashok', 'Atul', 'Avinash', 'Balraj', 'Bharat', 'Bipin', 'Brijesh', 'Chandan',
  'Deepesh', 'Dhanush', 'Dharmesh', 'Dinesh', 'Divyansh', 'Gagan', 'Ganesh', 'Gautam',
  'Govind', 'Hari', 'Harish', 'Hitesh', 'Ishaan', 'Jagdish', 'Jaspreet', 'Kalyan',
  'Kapil', 'Karan', 'Karthik', 'Keshav', 'Kishore', 'Krishna', 'Kuldeep', 'Lakshya',
  'Madhav', 'Mahesh', 'Manav', 'Manoj', 'Mohan', 'Mukesh', 'Murli', 'Naresh',
  'Neeraj', 'Niranjan', 'Nitin', 'Parth', 'Pawan', 'Piyush', 'Pradeep', 'Prakash'
];

const FEMALE_FIRST_NAMES = [
  'Aadhya', 'Saanvi', 'Kiara', 'Diya', 'Pihu', 'Prisha', 'Anika', 'Myra',
  'Sara', 'Ira', 'Ahana', 'Riya', 'Meera', 'Navya', 'Avani', 'Siya',
  'Ishita', 'Tanya', 'Sanjana', 'Ritu', 'Pooja', 'Neha', 'Mansi', 'Khushi',
  'Jiya', 'Harini', 'Divya', 'Chhavi', 'Bhavya', 'Ashmita', 'Aarti', 'Simran',
  'Shalini', 'Radhika', 'Payal', 'Nandini', 'Megha', 'Lavanya', 'Kriti', 'Jyoti',
  'Isha', 'Gunjan', 'Garima', 'Esha', 'Disha', 'Charu', 'Bhumika', 'Barkha',
  'Anushka', 'Amrita', 'Aditi', 'Alka', 'Anjali', 'Ankita', 'Archana', 'Asha',
  'Bhavana', 'Bindu', 'Chitra', 'Deepa', 'Deepika', 'Geeta', 'Gita', 'Indu',
  'Jaya', 'Kajal', 'Kalpana', 'Kamala', 'Kavita', 'Komal', 'Lata', 'Leela',
  'Madhavi', 'Madhu', 'Malini', 'Mamta', 'Manju', 'Maya', 'Mona', 'Mukta',
  'Naina', 'Namrata', 'Nisha', 'Pallavi', 'Parul', 'Pratibha', 'Preeti', 'Priyanka',
  'Rachna', 'Rajeshwari', 'Rakhi', 'Rashmi', 'Rekha', 'Richa', 'Rina', 'Rupa',
  'Sakshi', 'Sandhya', 'Sarita', 'Seema', 'Shashi', 'Sheetal', 'Shikha', 'Shilpa'
];

const LAST_NAMES = [
  'Choudhary', 'Chauhan', 'Rajput', 'Sengupta', 'Mukherjee', 'Chatterjee', 'Bhat', 'Pillai',
  'Namboodiri', 'Gowda', 'Hegde', 'Nayak', 'Shetty', 'Kulkarni', 'Joshi', 'Deshpande',
  'Patil', 'Shinde', 'More', 'Salunke', 'Yadav', 'Tiwari', 'Shukla', 'Mishra',
  'Tripathi', 'Pandey', 'Bhattacharya', 'Dutta', 'Chakraborty', 'Roy', 'Das', 'Ghosh',
  'Sen', 'Bose', 'Mitra', 'Guha', 'Sarkar', 'Biswas', 'Barman', 'Mandal',
  'Poddar', 'Ghoshal', 'Bhowmick', 'Majumdar', 'Nath', 'Pal', 'Kundu', 'Saha',
  'Reddy', 'Rao', 'Naidu', 'Chowdary', 'Varma', 'Raju', 'Verma', 'Singh',
  'Gupta', 'Agrawal', 'Mittal', 'Jindal', 'Goyal', 'Bansal', 'Singhal', 'Kansal',
  'Mehta', 'Shah', 'Modi', 'Parekh', 'Vora', 'Doshi', 'Sanghvi', 'Zaveri',
  'Nair', 'Menon', 'Pillai', 'Kurup', 'Panicker', 'Warrier', 'Nambiar', 'Marar',
  'Swaminathan', 'Subramanian', 'Ranganathan', 'Balasubramanian', 'Venkataraman', 'Krishnamurthy', 'Sundaram', 'Natarajan',
  'Iyer', 'Iyengar', 'Srinivasan', 'Raghavan', 'Parthasarathy', 'Soundararajan', 'Anand', 'Kannan',
  'Kaur', 'Sandhu', 'Dhillon', 'Grewal', 'Sidhu', 'Gill', 'Mann', 'Brar'
];

const SPORT_SPECIFIC_METRICS = {
  1: [ // Athletics
    { name: '100m Sprint', unit: 'sec', min: 10.5, max: 13.5, lowerIsBetter: true },
    { name: '400m Run', unit: 'sec', min: 48.0, max: 62.0, lowerIsBetter: true },
    { name: 'Maximum Speed', unit: 'km/h', min: 28.0, max: 37.0, lowerIsBetter: false },
    { name: 'Reaction Time', unit: 'ms', min: 140, max: 230, lowerIsBetter: true }
  ],
  2: [ // Swimming
    { name: 'Lap Time (50m)', unit: 'sec', min: 23.5, max: 32.0, lowerIsBetter: true },
    { name: 'Stroke Rate', unit: 'spm', min: 35, max: 52, lowerIsBetter: false },
    { name: 'Endurance Swim', unit: 'sec', min: 110, max: 150, lowerIsBetter: true }
  ],
  3: [ // Football
    { name: 'Pass Accuracy', unit: '%', min: 65, max: 94, lowerIsBetter: false },
    { name: 'Shots on Target', unit: 'shots', min: 2, max: 8, lowerIsBetter: false },
    { name: 'Sprint Speed', unit: 'km/h', min: 27, max: 34, lowerIsBetter: false },
    { name: 'Distance Covered', unit: 'km', min: 8.5, max: 12.5, lowerIsBetter: false }
  ],
  4: [ // Cricket
    { name: 'Strike Rate', unit: 'sr', min: 110, max: 175, lowerIsBetter: false },
    { name: 'Runs', unit: 'runs', min: 35, max: 95, lowerIsBetter: false },
    { name: 'Bowling Speed', unit: 'km/h', min: 120, max: 148, lowerIsBetter: false },
    { name: 'Catch Success Rate', unit: '%', min: 70, max: 95, lowerIsBetter: false }
  ],
  5: [ // Badminton
    { name: 'Smash Accuracy', unit: '%', min: 65, max: 92, lowerIsBetter: false },
    { name: 'Reaction Time', unit: 'ms', min: 160, max: 240, lowerIsBetter: true },
    { name: 'Agility Drill', unit: 'sec', min: 12.0, max: 16.5, lowerIsBetter: true }
  ],
  6: [ // Wrestling
    { name: 'Takedown Efficiency', unit: '%', min: 60, max: 90, lowerIsBetter: false },
    { name: 'Grip Strength', unit: 'kg', min: 45, max: 75, lowerIsBetter: false },
    { name: 'Stamina Index', unit: 'pts', min: 70, max: 95, lowerIsBetter: false }
  ],
  7: [ // Boxing
    { name: 'Punch Power', unit: 'psi', min: 400, max: 800, lowerIsBetter: false },
    { name: 'Punch Accuracy', unit: '%', min: 65, max: 90, lowerIsBetter: false },
    { name: 'Reflex Speed', unit: 'ms', min: 150, max: 230, lowerIsBetter: true }
  ],
  8: [ // Gymnastics
    { name: 'Execution Score', unit: 'pts', min: 7.5, max: 9.8, lowerIsBetter: false },
    { name: 'Difficulty Score', unit: 'pts', min: 4.5, max: 6.8, lowerIsBetter: false },
    { name: 'Balance Hold Time', unit: 'sec', min: 15, max: 45, lowerIsBetter: false }
  ],
  9: [ // Volleyball
    { name: 'Spike Height', unit: 'cm', min: 280, max: 345, lowerIsBetter: false },
    { name: 'Serve Velocity', unit: 'km/h', min: 75, max: 110, lowerIsBetter: false },
    { name: 'Block Success', unit: '%', min: 55, max: 88, lowerIsBetter: false }
  ],
  10: [ // Table Tennis
    { name: 'Spin Velocity', unit: 'rpm', min: 3000, max: 6000, lowerIsBetter: false },
    { name: 'Return Accuracy', unit: '%', min: 65, max: 93, lowerIsBetter: false },
    { name: 'Footwork Speed', unit: 'ms', min: 180, max: 260, lowerIsBetter: true }
  ],
  11: [ // karathe
    { name: 'Kata Precision', unit: '%', min: 70, max: 95, lowerIsBetter: false },
    { name: 'Kick Velocity', unit: 'km/h', min: 60, max: 95, lowerIsBetter: false },
    { name: 'Reaction Time', unit: 'ms', min: 160, max: 240, lowerIsBetter: true }
  ]
};

async function seedAthletes() {
  console.log('🚀 Starting Athlete and Coach Assignment Seeding...');

  // 1. Fetch available coaches
  const [coaches] = await pool.query(
    'SELECT c.id, c.user_id, u.first_name, u.last_name FROM coaches c JOIN users u ON c.user_id = u.id WHERE c.is_active = 1'
  );
  if (!coaches || coaches.length === 0) {
    throw new Error('No active coaches found!');
  }
  const coachIds = coaches.map((c) => c.id);
  console.log(`✅ Available coaches (${coachIds.length}):`, coachIds);

  // 2. Fix any existing athletes that have coach_id = NULL
  const [nullCoachUpdate] = await pool.query(
    'UPDATE athletes SET coach_id = ? WHERE coach_id IS NULL',
    [coachIds[0]]
  );
  if (nullCoachUpdate.changedRows > 0) {
    console.log(`✅ Re-assigned ${nullCoachUpdate.changedRows} unassigned athletes to active coaches.`);
  }

  // 3. Ensure categories exist for sports 6 to 11
  const categoriesToEnsure = [
    // Wrestling (6)
    { sport_id: 6, name: 'U-17 Boys', age_min: 14, age_max: 17, gender: 'male' },
    { sport_id: 6, name: 'U-17 Girls', age_min: 14, age_max: 17, gender: 'female' },
    { sport_id: 6, name: 'Senior Men', age_min: 18, age_max: 35, gender: 'male' },
    { sport_id: 6, name: 'Senior Women', age_min: 18, age_max: 35, gender: 'female' },
    // Boxing (7)
    { sport_id: 7, name: 'U-17 Boys', age_min: 14, age_max: 17, gender: 'male' },
    { sport_id: 7, name: 'U-17 Girls', age_min: 14, age_max: 17, gender: 'female' },
    { sport_id: 7, name: 'Senior Men', age_min: 18, age_max: 35, gender: 'male' },
    { sport_id: 7, name: 'Senior Women', age_min: 18, age_max: 35, gender: 'female' },
    // Gymnastics (8)
    { sport_id: 8, name: 'U-14 Mixed', age_min: 10, age_max: 14, gender: 'mixed' },
    { sport_id: 8, name: 'U-17 Mixed', age_min: 14, age_max: 17, gender: 'mixed' },
    { sport_id: 8, name: 'Senior Mixed', age_min: 18, age_max: 30, gender: 'mixed' },
    // Volleyball (9)
    { sport_id: 9, name: 'U-17 Boys', age_min: 14, age_max: 17, gender: 'male' },
    { sport_id: 9, name: 'U-17 Girls', age_min: 14, age_max: 17, gender: 'female' },
    { sport_id: 9, name: 'Senior Men', age_min: 18, age_max: 35, gender: 'male' },
    { sport_id: 9, name: 'Senior Women', age_min: 18, age_max: 35, gender: 'female' },
    // Table Tennis (10)
    { sport_id: 10, name: 'U-14 Mixed', age_min: 10, age_max: 14, gender: 'mixed' },
    { sport_id: 10, name: 'U-17 Mixed', age_min: 14, age_max: 17, gender: 'mixed' },
    { sport_id: 10, name: 'Senior Mixed', age_min: 18, age_max: 35, gender: 'mixed' },
    // karathe (11)
    { sport_id: 11, name: 'U-14 Mixed', age_min: 10, age_max: 14, gender: 'mixed' },
    { sport_id: 11, name: 'U-17 Mixed', age_min: 14, age_max: 17, gender: 'mixed' },
    { sport_id: 11, name: 'Senior Mixed', age_min: 18, age_max: 35, gender: 'mixed' }
  ];

  for (const cat of categoriesToEnsure) {
    const [exist] = await pool.query(
      'SELECT id FROM categories WHERE sport_id = ? AND name = ?',
      [cat.sport_id, cat.name]
    );
    if (exist.length === 0) {
      await pool.query(
        'INSERT INTO categories (sport_id, name, age_min, age_max, gender, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [cat.sport_id, cat.name, cat.age_min, cat.age_max, cat.gender]
      );
    }
  }

  // 4. Get all categories now
  const [allCategories] = await pool.query(
    'SELECT c.id, c.sport_id, s.name as sport_name, c.name as cat_name, c.age_min, c.age_max, c.gender FROM categories c JOIN sports s ON c.sport_id = s.id WHERE c.is_active = 1'
  );
  console.log(`✅ Total active categories to populate: ${allCategories.length}`);

  // 5. Get existing names and athlete codes to ensure 100% UNREPEATED athletes
  const [existingUsers] = await pool.query(
    'SELECT LOWER(CONCAT(first_name, " ", last_name)) as full_name, email, username FROM users'
  );
  const usedFullNames = new Set(existingUsers.map((u) => u.full_name));
  const usedUsernames = new Set(existingUsers.map((u) => u.username));
  const usedEmails = new Set(existingUsers.map((u) => u.email));

  const [lastCodeRow] = await pool.query(
    'SELECT athlete_code FROM athletes WHERE athlete_code LIKE "ATH-2024-%" ORDER BY id DESC LIMIT 1'
  );
  let nextCodeNum = 71;
  if (lastCodeRow.length > 0 && lastCodeRow[0].athlete_code) {
    const parts = lastCodeRow[0].athlete_code.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextCodeNum = lastNum + 1;
  }

  // Standard athlete password hash (Athlete@123)
  const passwordHash = '$2a$12$eUZp9oli8HW.Py.9X5/zTusmrFYdnqym96XU5x7TDflwP9U6UNMOm';

  // Track counts
  let totalNewAthletes = 0;
  const TARGET_PER_CATEGORY = 14;

  for (const cat of allCategories) {
    const [cntRow] = await pool.query(
      'SELECT COUNT(*) as count FROM athletes WHERE category_id = ? AND is_active = 1',
      [cat.id]
    );
    const currentCount = cntRow[0].count;
    const needToAdd = Math.max(0, TARGET_PER_CATEGORY - currentCount);

    if (needToAdd === 0) continue;

    console.log(`Adding ${needToAdd} athletes to Sport: ${cat.sport_name} | Category: ${cat.cat_name}...`);

    for (let i = 0; i < needToAdd; i++) {
      // Pick gender
      let gender = cat.gender;
      if (gender === 'mixed' || !gender) {
        gender = i % 2 === 0 ? 'male' : 'female';
      }

      // Pick unique first & last name
      let firstName = '';
      let lastName = '';
      let fullName = '';
      let attempts = 0;
      do {
        const poolFirst = gender === 'female' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
        firstName = poolFirst[Math.floor(Math.random() * poolFirst.length)];
        lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        fullName = `${firstName} ${lastName}`.toLowerCase();
        attempts++;
        if (attempts > 500) {
          firstName = `${firstName}${i}`;
          fullName = `${firstName} ${lastName}`.toLowerCase();
          break;
        }
      } while (usedFullNames.has(fullName));

      usedFullNames.add(fullName);

      // Generate unique email & username
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${cleanFirst}.${cleanLast}.${nextCodeNum}@sportsacademy.com`;
      const username = `athlete.${cleanFirst}.${cleanLast}.${nextCodeNum}`;
      usedEmails.add(email);
      usedUsernames.add(username);

      // Date of birth calculation
      let age = 17;
      if (cat.age_min && cat.age_max) {
        age = Math.floor(Math.random() * (cat.age_max - cat.age_min + 1)) + cat.age_min;
      } else if (cat.age_min) {
        age = cat.age_min + Math.floor(Math.random() * 8);
      } else if (cat.age_max) {
        age = Math.max(11, cat.age_max - Math.floor(Math.random() * 3));
      } else {
        age = 15 + (i % 8);
      }
      const birthYear = 2026 - age;
      const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;

      // Random available coach
      const assignedCoachId = coachIds[Math.floor(Math.random() * coachIds.length)];

      const athleteCode = `ATH-2024-${String(nextCodeNum).padStart(3, '0')}`;
      nextCodeNum++;

      // Insert into users
      const [userRes] = await pool.query(
        `INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, phone, is_active, auth_provider)
         VALUES (4, ?, ?, ?, ?, ?, ?, 1, 'local')`,
        [
          username,
          email,
          passwordHash,
          firstName,
          lastName,
          `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
        ]
      );
      const userId = userRes.insertId;

      // Injury determination (approx 15% have injuries)
      let medicalStatus = 'fit';
      const hasInjury = (totalNewAthletes + i) % 7 === 0;
      const isInjuryActive = hasInjury && ((totalNewAthletes + i) % 14 === 0);
      if (isInjuryActive) medicalStatus = 'injured';

      const height = (155 + Math.random() * 35).toFixed(1);
      const weight = (48 + Math.random() * 38).toFixed(1);

      // Insert into athletes
      const [athleteRes] = await pool.query(
        `INSERT INTO athletes
         (user_id, coach_id, sport_id, category_id, athlete_code, date_of_birth, gender,
          height_cm, weight_kg, blood_group, city, state, academy_name, registration_date,
          joining_date, medical_status, current_status, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'B+', 'Chennai', 'Tamil Nadu', 'Sports Academy', '2024-01-10', '2024-01-10', ?, 'active', 1)`,
        [
          userId,
          assignedCoachId,
          cat.sport_id,
          cat.id,
          athleteCode,
          dob,
          gender,
          height,
          weight,
          medicalStatus
        ]
      );
      const athleteId = athleteRes.insertId;

      // ─── Performance Records ───────────────────────────────
      const sportMetrics = SPORT_SPECIFIC_METRICS[cat.sport_id] || SPORT_SPECIFIC_METRICS[1];
      const performanceTier = i % 4; // 0, 1 = solid/top, 2 = improving, 3 = underperforming
      const baseScore = performanceTier === 3 ? (55 + Math.random() * 14) : (75 + Math.random() * 20);

      const perfDates = ['2026-03-15', '2026-05-10', '2026-07-01', '2026-08-15'];
      for (let pIdx = 0; pIdx < perfDates.length; pIdx++) {
        const metric = sportMetrics[pIdx % sportMetrics.length];
        const variance = (pIdx * 2.5) + (Math.random() * 4 - 2);
        const recordScore = Math.min(98, Math.max(50, baseScore + variance)).toFixed(2);
        const metricVal = ((metric.min + metric.max) / 2 + (Math.random() * 2 - 1)).toFixed(2);
        const improvement = pIdx === 0 ? '0.00' : (variance * 1.2).toFixed(2);

        await pool.query(
          `INSERT INTO performance_records
           (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score, improvement_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [athleteId, assignedCoachId, cat.sport_id, perfDates[pIdx], metric.name, metricVal, metric.unit, recordScore, improvement]
        );
      }

      // ─── Fitness Assessments ───────────────────────────────
      const fitnessBase = performanceTier === 3 ? (58 + Math.random() * 15) : (74 + Math.random() * 22);
      const fitDates = ['2026-03-20', '2026-06-15', '2026-08-10'];
      for (const fitDate of fitDates) {
        const overallFit = (fitnessBase + Math.random() * 5).toFixed(2);
        await pool.query(
          `INSERT INTO fitness_assessments
           (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, speed_score, overall_fitness_score, bmi, vo2_max, resting_heart_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            athleteId,
            assignedCoachId,
            fitDate,
            overallFit,
            overallFit,
            overallFit,
            (70 + Math.random() * 20).toFixed(2),
            (72 + Math.random() * 20).toFixed(2),
            (75 + Math.random() * 20).toFixed(2),
            overallFit,
            (20.5 + Math.random() * 3).toFixed(2),
            (50 + Math.random() * 12).toFixed(2),
            Math.floor(58 + Math.random() * 12)
          ]
        );
      }

      // ─── Attendance ────────────────────────────────────────
      const isAttendanceRisk = i % 5 === 0;
      const attendanceDates = [];
      const d = new Date(2026, 6, 1); // July 1, 2026
      for (let day = 0; day < 25; day++) {
        d.setDate(d.getDate() + 1);
        attendanceDates.push(d.toISOString().split('T')[0]);
      }

      const attValues = [];
      for (const attDate of attendanceDates) {
        let status = 'present';
        if (isAttendanceRisk) {
          status = Math.random() < 0.45 ? 'absent' : 'present';
        } else {
          status = Math.random() < 0.08 ? 'absent' : 'present';
        }
        attValues.push([athleteId, assignedCoachId, attDate, 'Morning', status]);
      }

      if (attValues.length > 0) {
        await pool.query(
          'INSERT INTO attendance (athlete_id, coach_id, attendance_date, session, status) VALUES ?',
          [attValues]
        );
      }

      // ─── Coach Remarks ─────────────────────────────────────
      const remarkRating = performanceTier === 3 ? (6.2 + Math.random() * 1.2) : (7.8 + Math.random() * 1.8);
      await pool.query(
        `INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks)
         VALUES (?, ?, '2026-08-01', 'performance', ?, ?)`,
        [
          athleteId,
          assignedCoachId,
          remarkRating.toFixed(1),
          'Demonstrates solid technique and commitment during training sessions.'
        ]
      );

      // ─── Injuries ──────────────────────────────────────────
      if (hasInjury) {
        const recoveryStatus = isInjuryActive ? 'recovering' : 'recovered';
        const availStatus = isInjuryActive ? 'restricted' : 'fit';
        const isAvail = isInjuryActive ? 0 : 1;
        await pool.query(
          `INSERT INTO injuries
           (athlete_id, injury_type, body_part, injury_date, severity, recovery_status, availability_status, is_available)
           VALUES (?, 'Muscle Strain', 'Leg', '2026-06-10', 'minor', ?, ?, ?)`,
          [athleteId, recoveryStatus, availStatus, isAvail]
        );
      }

      // ─── Rankings ──────────────────────────────────────────
      const overallRank = (baseScore * 0.5 + fitnessBase * 0.3 + 80 * 0.2).toFixed(2);
      await pool.query(
        `INSERT INTO rankings (athlete_id, sport_id, category_id, overall_ranking_score, rank_type, rank_date)
         VALUES (?, ?, ?, ?, 'overall', '2026-08-20')`,
        [athleteId, cat.sport_id, cat.id, overallRank]
      );

      totalNewAthletes++;
    }
  }

  console.log(`\n🎉 Seeding complete! Successfully added ${totalNewAthletes} new unrepeated athletes with complete data.`);
  process.exit(0);
}

seedAthletes().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});

