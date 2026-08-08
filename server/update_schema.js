const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runUpdates() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const runQuery = async (query) => {
    try {
      await pool.query(query);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_TABLE_EXISTS_ERROR') {
        console.error('Error on query:', query);
        console.error(e.message);
      }
    }
  };

  const queries = [
    // Create new tables
    `CREATE TABLE IF NOT EXISTS sport_metrics (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sport_id INT UNSIGNED NOT NULL,
      metric_key VARCHAR(100) NOT NULL,
      metric_label VARCHAR(150) NOT NULL,
      metric_unit VARCHAR(50),
      metric_type ENUM('number','time','percentage','text') DEFAULT 'number',
      is_higher_better BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sport_metric (sport_id, metric_key)
    )`,
    `CREATE TABLE IF NOT EXISTS age_groups (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      age_min INT NOT NULL,
      age_max INT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS gender_categories (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(20) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sport_id INT UNSIGNED,
      name VARCHAR(200) NOT NULL,
      event_type ENUM('individual','team','relay') DEFAULT 'individual',
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS athlete_documents (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      document_type ENUM('identity','medical','achievement','photo','other') DEFAULT 'other',
      document_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT,
      mime_type VARCHAR(100),
      uploaded_by INT UNSIGNED,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS athlete_medical_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      record_date DATE NOT NULL,
      condition_type ENUM('injury','illness','surgery','allergy','chronic','other') DEFAULT 'other',
      condition_name VARCHAR(255) NOT NULL,
      severity ENUM('mild','moderate','severe') DEFAULT 'moderate',
      treatment_details TEXT,
      recovery_date DATE,
      is_resolved BOOLEAN DEFAULT FALSE,
      cleared_to_play BOOLEAN DEFAULT TRUE,
      doctor_name VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS athlete_achievements (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      achievement_type ENUM('medal','trophy','certificate','award','record','other') DEFAULT 'other',
      title VARCHAR(255) NOT NULL,
      description TEXT,
      competition_name VARCHAR(255),
      achievement_date DATE NOT NULL,
      level ENUM('district','state','national','international','academy') DEFAULT 'academy',
      position VARCHAR(50),
      sport_id INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS athlete_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      action_type ENUM('created','updated','archived','restored','status_change',
                       'sport_changed','coach_changed','category_changed','other') DEFAULT 'other',
      description TEXT NOT NULL,
      changed_by INT UNSIGNED,
      old_values JSON,
      new_values JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coach_assignments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      coach_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      assigned_by INT UNSIGNED,
      assigned_date DATE NOT NULL DEFAULT (CURDATE()),
      removed_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_coach_athlete_active (coach_id, athlete_id, is_active)
    )`,
    `CREATE TABLE IF NOT EXISTS coach_certificates (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      coach_id INT UNSIGNED NOT NULL,
      certificate_name VARCHAR(255) NOT NULL,
      issuing_body VARCHAR(255),
      issued_date DATE,
      expiry_date DATE,
      certificate_url VARCHAR(500),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coach_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      coach_id INT UNSIGNED NOT NULL,
      action_type ENUM('created','updated','assigned','unassigned','status_change','other') DEFAULT 'other',
      description TEXT NOT NULL,
      changed_by INT UNSIGNED,
      old_values JSON,
      new_values JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coach_performance (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      coach_id INT UNSIGNED NOT NULL,
      period_month INT NOT NULL,
      period_year INT NOT NULL,
      athletes_count INT DEFAULT 0,
      avg_athlete_performance DECIMAL(5,2) DEFAULT 0,
      avg_athlete_fitness DECIMAL(5,2) DEFAULT 0,
      avg_attendance_rate DECIMAL(5,2) DEFAULT 0,
      athletes_selected INT DEFAULT 0,
      athletes_improved INT DEFAULT 0,
      overall_score DECIMAL(5,2) DEFAULT 0,
      computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_coach_period (coach_id, period_month, period_year)
    )`,
    `CREATE TABLE IF NOT EXISTS selection_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      selection_id INT UNSIGNED NOT NULL,
      selector_id INT UNSIGNED,
      athlete_id INT UNSIGNED NOT NULL,
      action ENUM('recommended','shortlisted','selected','rejected','waitlisted','reviewed') DEFAULT 'reviewed',
      notes TEXT,
      performance_score DECIMAL(6,2) DEFAULT 0,
      fitness_score DECIMAL(6,2) DEFAULT 0,
      confidence_score DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS selector_sports (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      selector_id INT UNSIGNED NOT NULL,
      sport_id INT UNSIGNED NOT NULL,
      assigned_date DATE NOT NULL DEFAULT (CURDATE()),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_selector_sport (selector_id, sport_id)
    )`,
    
    // Add columns to performance_records, fitness_assessments, injuries if needed
    "ALTER TABLE performance_records ADD COLUMN ai_analysis JSON AFTER notes",
    "ALTER TABLE performance_records ADD COLUMN improvement_rate DECIMAL(5,2) DEFAULT 0 AFTER performance_score",
    
    "ALTER TABLE fitness_assessments ADD COLUMN speed_score DECIMAL(5,2) DEFAULT 0 AFTER agility_score",
    "ALTER TABLE fitness_assessments ADD COLUMN reaction_time_ms DECIMAL(6,2) DEFAULT 0 AFTER speed_score",
    "ALTER TABLE fitness_assessments ADD COLUMN balance_score DECIMAL(5,2) DEFAULT 0 AFTER reaction_time_ms",
    "ALTER TABLE fitness_assessments ADD COLUMN body_fat_percentage DECIMAL(5,2) DEFAULT 0 AFTER balance_score",
    "ALTER TABLE fitness_assessments ADD COLUMN vo2_max DECIMAL(5,2) DEFAULT 0 AFTER body_fat_percentage",
    "ALTER TABLE fitness_assessments ADD COLUMN resting_heart_rate INT DEFAULT 70 AFTER vo2_max",
    "ALTER TABLE fitness_assessments ADD COLUMN recovery_rate_bpm INT DEFAULT 30 AFTER resting_heart_rate",
    "ALTER TABLE fitness_assessments ADD COLUMN ai_analysis JSON AFTER notes",
    
    "ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'leave', 'half_day', 'late') DEFAULT 'present'",
    
    "ALTER TABLE injuries ADD COLUMN body_part VARCHAR(100) AFTER injury_type",
    "ALTER TABLE injuries ADD COLUMN diagnosis TEXT AFTER severity",
    "ALTER TABLE injuries ADD COLUMN treatment TEXT AFTER diagnosis",
    "ALTER TABLE injuries ADD COLUMN medication TEXT AFTER treatment",
    "ALTER TABLE injuries ADD COLUMN doctor_name VARCHAR(200) AFTER medication",
    "ALTER TABLE injuries ADD COLUMN hospital VARCHAR(255) AFTER doctor_name",
    "ALTER TABLE injuries ADD COLUMN expected_recovery_date DATE AFTER hospital",
    "ALTER TABLE injuries ADD COLUMN actual_recovery_date DATE AFTER expected_recovery_date",
    "ALTER TABLE injuries ADD COLUMN availability_status ENUM('fit', 'unfit', 'restricted', 'under_observation') DEFAULT 'unfit' AFTER recovery_status",
    "ALTER TABLE injuries ADD COLUMN ai_analysis JSON AFTER notes",

    // New Prompt 3 tables
    `CREATE TABLE IF NOT EXISTS performance_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      performance_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      action_type ENUM('created','updated','deleted') DEFAULT 'created',
      description TEXT,
      changed_by INT UNSIGNED,
      old_values JSON,
      new_values JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS performance_attachments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      performance_id INT UNSIGNED NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT,
      mime_type VARCHAR(100),
      uploaded_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS performance_summary (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      period_month INT NOT NULL,
      period_year INT NOT NULL,
      avg_score DECIMAL(5,2) DEFAULT 0,
      total_records INT DEFAULT 0,
      top_metric VARCHAR(150),
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_perf_summary (athlete_id, period_month, period_year)
    )`,
    `CREATE TABLE IF NOT EXISTS fitness_parameters (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL UNIQUE,
      unit VARCHAR(30),
      description TEXT,
      min_value DECIMAL(8,2) DEFAULT 0,
      max_value DECIMAL(8,2) DEFAULT 100,
      is_higher_better BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS fitness_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      fitness_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      action_type ENUM('created','updated','deleted') DEFAULT 'created',
      description TEXT,
      changed_by INT UNSIGNED,
      old_values JSON,
      new_values JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS fitness_score_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      assessment_id INT UNSIGNED NOT NULL,
      assessment_date DATE NOT NULL,
      overall_score DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      attendance_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      action_type ENUM('created','updated','deleted') DEFAULT 'created',
      description TEXT,
      changed_by INT UNSIGNED,
      old_values JSON,
      new_values JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_summary (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      athlete_id INT UNSIGNED NOT NULL,
      period_month INT NOT NULL,
      period_year INT NOT NULL,
      total_days INT DEFAULT 0,
      present_days INT DEFAULT 0,
      absent_days INT DEFAULT 0,
      leave_days INT DEFAULT 0,
      half_days INT DEFAULT 0,
      late_days INT DEFAULT 0,
      attendance_percentage DECIMAL(5,2) DEFAULT 0,
      consistency_score DECIMAL(5,2) DEFAULT 0,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_att_summary (athlete_id, period_month, period_year)
    )`,
    `CREATE TABLE IF NOT EXISTS medical_reports (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      injury_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      report_type VARCHAR(100) DEFAULT 'general',
      title VARCHAR(255) NOT NULL,
      file_path VARCHAR(500),
      doctor_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS recovery_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      injury_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      checkup_date DATE NOT NULL,
      recovery_percentage DECIMAL(5,2) DEFAULT 0,
      status_update ENUM('recovering', 'recovered', 'chronic', 'active') DEFAULT 'recovering',
      doctor_name VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS doctor_remarks (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      injury_id INT UNSIGNED NOT NULL,
      athlete_id INT UNSIGNED NOT NULL,
      doctor_name VARCHAR(200) NOT NULL,
      remark_date DATE NOT NULL,
      remarks TEXT NOT NULL,
      cleared_for_training BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS injury_attachments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      injury_id INT UNSIGNED NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT,
      mime_type VARCHAR(100),
      uploaded_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Insert seeds
    `INSERT IGNORE INTO sports (id, name, description) VALUES
      (1, 'Football', 'Association football / soccer'),
      (2, 'Cricket', 'Cricket - bat and ball sport'),
      (3, 'Athletics', 'Track and field athletics'),
      (4, 'Swimming', 'Competitive swimming'),
      (5, 'Badminton', 'Racket sport'),
      (6, 'Basketball', 'Team basket ball')`,
    `INSERT IGNORE INTO age_groups (name, age_min, age_max, description) VALUES
      ('Sub-Junior', 10, 14, 'Sub-junior category'),
      ('Junior', 15, 18, 'Junior category'),
      ('Senior', 19, 25, 'Senior category'),
      ('Open', 19, 99, 'Open / general category')`,
    `INSERT IGNORE INTO gender_categories (name, code) VALUES
      ('Male', 'M'),
      ('Female', 'F'),
      ('Mixed', 'MX')`,

    // Seed Sport Metrics (Football, Cricket, Athletics, Swimming, Badminton)
    `INSERT IGNORE INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better, display_order) VALUES
      (1, 'goals', 'Goals', 'goals', 'number', TRUE, 1),
      (1, 'assists', 'Assists', 'assists', 'number', TRUE, 2),
      (1, 'pass_accuracy', 'Pass Accuracy', '%', 'percentage', TRUE, 3),
      (1, 'shots_on_target', 'Shots on Target', 'shots', 'number', TRUE, 4),
      (1, 'distance_covered', 'Distance Covered', 'km', 'number', TRUE, 5),
      
      (2, 'runs', 'Runs', 'runs', 'number', TRUE, 1),
      (2, 'strike_rate', 'Strike Rate', 'sr', 'number', TRUE, 2),
      (2, 'boundaries', 'Boundaries', 'fours', 'number', TRUE, 3),
      (2, 'sixes', 'Sixes', 'sixes', 'number', TRUE, 4),
      (2, 'wickets', 'Wickets', 'wickets', 'number', TRUE, 5),
      (2, 'economy', 'Economy Rate', 'runs/ov', 'number', FALSE, 6),
      (2, 'catches', 'Catches', 'catches', 'number', TRUE, 7),
      
      (3, 'sprint_time', 'Sprint Time (100m)', 'sec', 'time', FALSE, 1),
      (3, 'lap_time', 'Lap Time (400m)', 'sec', 'time', FALSE, 2),
      (3, 'reaction_time', 'Reaction Time', 'ms', 'number', FALSE, 3),
      (3, 'maximum_speed', 'Maximum Speed', 'km/h', 'number', TRUE, 4),
      
      (4, 'lap_time', 'Lap Time (50m)', 'sec', 'time', FALSE, 1),
      (4, 'stroke_rate', 'Stroke Rate', 'spm', 'number', TRUE, 2),
      (4, 'finish_position', 'Finish Position', 'pos', 'number', FALSE, 3),
      
      (5, 'smash_accuracy', 'Smash Accuracy', '%', 'percentage', TRUE, 1),
      (5, 'reaction_time', 'Reaction Time', 'ms', 'number', FALSE, 2),
      (5, 'points_won', 'Points Won', 'pts', 'number', TRUE, 3)`
  ];

  for (const q of queries) {
    await runQuery(q);
  }
  console.log('Finished applying updates.');
  process.exit(0);
}
runUpdates();

