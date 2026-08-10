-- ============================================================
-- COMPLETE ACADEMY SCHEMA & SEED DATA (v3)
-- SportsInsight - Sports Academy Management System
-- Includes: Auth, Athletes, Coaches, Selectors, Sports,
--           Performance, Fitness, Attendance, Injuries,
--           Rankings, Selections, AI Lists, Notifications
-- ============================================================

DROP DATABASE IF EXISTS sports_acadmey;
CREATE DATABASE sports_acadmey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sports_acadmey;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id INT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- LOGIN HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') DEFAULT 'success',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SPORT METRICS (Dynamic per-sport performance metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS sport_metrics (
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
    UNIQUE KEY uq_sport_metric (sport_id, metric_key),
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sport_id INT UNSIGNED,
    name VARCHAR(100) NOT NULL,
    age_min INT,
    age_max INT,
    gender ENUM('male', 'female', 'mixed') DEFAULT 'mixed',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- AGE GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS age_groups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    age_min INT NOT NULL,
    age_max INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- GENDER CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS gender_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sport_id INT UNSIGNED,
    name VARCHAR(200) NOT NULL,
    event_type ENUM('individual','team','relay') DEFAULT 'individual',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- COACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_code VARCHAR(50) UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    sport_id INT UNSIGNED,
    qualification VARCHAR(255),
    experience_years INT DEFAULT 0,
    specialization VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('male','female','other'),
    address TEXT,
    joining_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    current_status ENUM('active','inactive','archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_certificates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_id INT UNSIGNED NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    issuing_body VARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    certificate_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- COACH HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','assigned','unassigned','status_change','other') DEFAULT 'other',
    description TEXT NOT NULL,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH PERFORMANCE ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_performance (
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
    UNIQUE KEY uq_coach_period (coach_id, period_month, period_year),
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- SELECTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS selectors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selector_code VARCHAR(50) UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    designation VARCHAR(255),
    organization VARCHAR(255),
    sport_expertise VARCHAR(255),
    years_experience INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SELECTOR SPORT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS selector_sports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selector_id INT UNSIGNED NOT NULL,
    sport_id INT UNSIGNED NOT NULL,
    assigned_date DATE NOT NULL DEFAULT (CURDATE()),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_selector_sport (selector_id, sport_id),
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- ============================================================
-- ATHLETES
-- ============================================================
CREATE TABLE IF NOT EXISTS athletes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    coach_id INT UNSIGNED,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    athlete_code VARCHAR(50) UNIQUE,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_group VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    academy_name VARCHAR(255),
    pincode VARCHAR(10),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(20),
    registration_date DATE DEFAULT (CURDATE()),
    joining_date DATE,
    medical_status ENUM('fit','unfit','injured','under_observation') DEFAULT 'fit',
    current_status ENUM('active','inactive','archived','transferred') DEFAULT 'active',
    archived_at TIMESTAMP NULL,
    archived_by INT UNSIGNED,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH ASSIGNMENTS (linking coaches to athletes)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_assignments (
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
    UNIQUE KEY uq_coach_athlete_active (coach_id, athlete_id, is_active),
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_documents (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE MEDICAL HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_medical_history (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- ATHLETE ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_achievements (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE HISTORY (Audit Trail / Timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','archived','restored','status_change',
                     'sport_changed','coach_changed','category_changed','other') DEFAULT 'other',
    description TEXT NOT NULL,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE RECORDS
-- Includes: ai_analysis JSON + improvement_rate columns
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    sport_id INT UNSIGNED,
    record_date DATE NOT NULL,
    metric_name VARCHAR(150) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(50),
    performance_score DECIMAL(5,2),
    improvement_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performance_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_attachments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performance_id INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE SUMMARY (Monthly aggregated per athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_summary (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    avg_score DECIMAL(5,2) DEFAULT 0,
    total_records INT DEFAULT 0,
    top_metric VARCHAR(150),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_perf_summary (athlete_id, period_month, period_year),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- FITNESS ASSESSMENTS
-- Includes: speed_score, reaction_time_ms, balance_score,
--           body_fat_percentage, vo2_max, resting_heart_rate,
--           recovery_rate_bpm, ai_analysis columns
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_assessments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    assessment_date DATE NOT NULL,
    strength_score DECIMAL(5,2) DEFAULT 0,
    endurance_score DECIMAL(5,2) DEFAULT 0,
    stamina_score DECIMAL(5,2) DEFAULT 0,
    flexibility_score DECIMAL(5,2) DEFAULT 0,
    agility_score DECIMAL(5,2) DEFAULT 0,
    speed_score DECIMAL(5,2) DEFAULT 0,
    reaction_time_ms DECIMAL(6,2) DEFAULT 0,
    balance_score DECIMAL(5,2) DEFAULT 0,
    body_fat_percentage DECIMAL(5,2) DEFAULT 0,
    vo2_max DECIMAL(5,2) DEFAULT 0,
    resting_heart_rate INT DEFAULT 70,
    recovery_rate_bpm INT DEFAULT 30,
    bmi DECIMAL(5,2),
    overall_fitness_score DECIMAL(5,2),
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- FITNESS PARAMETERS (Configurable fitness metric definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_parameters (
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
);

-- ============================================================
-- FITNESS HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fitness_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- FITNESS SCORE HISTORY (Trend tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_score_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    assessment_id INT UNSIGNED NOT NULL,
    assessment_date DATE NOT NULL,
    overall_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- ATTENDANCE
-- Includes: half_day and late status values
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave', 'half_day', 'late') DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_athlete_date (athlete_id, attendance_date),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- ATTENDANCE HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATTENDANCE SUMMARY (Monthly aggregated per athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_summary (
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
    UNIQUE KEY uq_att_summary (athlete_id, period_month, period_year),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- INJURIES
-- Includes: body_part, diagnosis, treatment, medication,
--           doctor_name, hospital, expected_recovery_date,
--           actual_recovery_date, availability_status, ai_analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS injuries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    injury_type VARCHAR(200) NOT NULL,
    body_part VARCHAR(100),
    injury_date DATE NOT NULL,
    severity ENUM('minor', 'moderate', 'severe', 'critical') DEFAULT 'minor',
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    doctor_name VARCHAR(200),
    hospital VARCHAR(255),
    expected_recovery_date DATE,
    actual_recovery_date DATE,
    recovery_date DATE,
    recovery_status ENUM('recovering', 'recovered', 'chronic') DEFAULT 'recovering',
    availability_status ENUM('fit', 'unfit', 'restricted', 'under_observation') DEFAULT 'unfit',
    is_available BOOLEAN DEFAULT FALSE,
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- RECOVERY HISTORY (Doctor checkup logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS recovery_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    checkup_date DATE NOT NULL,
    recovery_percentage DECIMAL(5,2) DEFAULT 0,
    status_update ENUM('recovering', 'recovered', 'chronic', 'active') DEFAULT 'recovering',
    doctor_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- DOCTOR REMARKS (Formal clearance notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_remarks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    doctor_name VARCHAR(200) NOT NULL,
    remark_date DATE NOT NULL,
    remarks TEXT NOT NULL,
    cleared_for_training BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- MEDICAL REPORTS (File attachments per injury)
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    report_type VARCHAR(100) DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    doctor_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- INJURY ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS injury_attachments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- RANKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS rankings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    rank_position INT,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    consistency_score DECIMAL(6,2) DEFAULT 0,
    overall_ranking_score DECIMAL(6,2) DEFAULT 0,
    rank_type ENUM('overall', 'sport', 'category', 'gender', 'age') DEFAULT 'overall',
    rank_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- SELECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS selections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    selector_id INT UNSIGNED,
    selection_type VARCHAR(200),
    selection_date DATE NOT NULL,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    attendance_score DECIMAL(6,2) DEFAULT 0,
    coach_rating DECIMAL(6,2) DEFAULT 0,
    selection_score DECIMAL(6,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    status ENUM('recommended', 'selected', 'rejected', 'pending') DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE SET NULL
);

-- ============================================================
-- SELECTION HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS selection_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selection_id INT UNSIGNED NOT NULL,
    selector_id INT UNSIGNED,
    athlete_id INT UNSIGNED NOT NULL,
    action ENUM('recommended','shortlisted','selected','rejected','waitlisted','reviewed') DEFAULT 'reviewed',
    notes TEXT,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE SET NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'danger') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- AI GENERATED LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_generated_lists (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    generated_by INT UNSIGNED NOT NULL,
    list_type VARCHAR(200) NOT NULL,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    age_group VARCHAR(50),
    gender ENUM('male', 'female', 'mixed') DEFAULT 'mixed',
    date_from DATE,
    date_to DATE,
    result_json LONGTEXT,
    athletes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH REMARKS (General coach notes on athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_remarks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED NOT NULL,
    remark_date DATE NOT NULL,
    remark_type ENUM('performance', 'fitness', 'behavior', 'general') DEFAULT 'general',
    rating DECIMAL(3,1),
    remarks TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- ============================================================
-- SEED DATA
-- ============================================================
-- ============================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'System Administrator with full access'),
(2, 'coach', 'Coach who manages and trains athletes'),
(3, 'selector', 'Selector who evaluates and selects athletes'),
(4, 'athlete', 'Athlete registered in the academy');

-- Users (password: Admin@123 for all)
INSERT INTO users (id, role_id, username, email, password_hash, first_name, last_name, phone, is_active) VALUES
(1,  1, 'admin',            'admin@sportsacademy.com',      '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Super',  'Admin',   '+91-9876543210', TRUE),
(2,  2, 'coach.rajesh',     'rajesh.kumar@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Rajesh', 'Kumar',   '+91-9876543211', TRUE),
(3,  2, 'coach.priya',      'priya.sharma@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Priya',  'Sharma',  '+91-9876543212', TRUE),
(4,  2, 'coach.arun',       'arun.verma@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arun',   'Verma',   '+91-9876543213', TRUE),
(5,  3, 'selector.vikram',  'vikram.singh@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Vikram', 'Singh',   '+91-9876543214', TRUE),
(6,  3, 'selector.meera',   'meera.reddy@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Meera',  'Reddy',   '+91-9876543215', TRUE),
(7,  4, 'athlete.arjun',    'arjun.nair@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arjun',  'Nair',    '+91-9876543216', TRUE),
(8,  4, 'athlete.sneha',    'sneha.patel@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Sneha',  'Patel',   '+91-9876543217', TRUE),
(9,  4, 'athlete.rohit',    'rohit.sharma@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u','Rohit',  'Sharma',  '+91-9876543218', TRUE),
(10, 4, 'athlete.kavya',    'kavya.menon@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kavya',  'Menon',   '+91-9876543219', TRUE),
(11, 4, 'athlete.kiran',    'kiran.rao@sportsacademy.com',  '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kiran',  'Rao',     '+91-9876543220', TRUE);

-- Sports
INSERT INTO sports (id, name, description, icon, is_active) VALUES
(1,  'Athletics',     'Track and field events',         'run',    TRUE),
(2,  'Swimming',      'Aquatic sports and events',      'waves',  TRUE),
(3,  'Football',      'Association football / Soccer',  'circle', TRUE),
(4,  'Cricket',       'Bat and ball sport',             'target', TRUE),
(5,  'Badminton',     'Racquet sport',                  'zap',    TRUE),
(6,  'Wrestling',     'Combat sport',                   'shield', TRUE),
(7,  'Boxing',        'Combat sport with gloves',       'shield', TRUE),
(8,  'Gymnastics',    'Artistic gymnastics',            'star',   TRUE),
(9,  'Volleyball',    'Net sport',                      'circle', TRUE),
(10, 'Table Tennis',  'Racquet sport',                  'zap',    TRUE);

-- Sport Metrics (Football, Cricket, Athletics, Swimming, Badminton)
INSERT INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better, display_order) VALUES
-- Football (sport_id = 3)
(3, 'goals',           'Goals',           'goals',    'number',     TRUE,  1),
(3, 'assists',         'Assists',         'assists',  'number',     TRUE,  2),
(3, 'pass_accuracy',   'Pass Accuracy',   '%',        'percentage', TRUE,  3),
(3, 'shots_on_target', 'Shots on Target', 'shots',    'number',     TRUE,  4),
(3, 'distance_covered','Distance Covered','km',        'number',     TRUE,  5),
-- Cricket (sport_id = 4)
(4, 'runs',            'Runs',            'runs',     'number',     TRUE,  1),
(4, 'strike_rate',     'Strike Rate',     'sr',       'number',     TRUE,  2),
(4, 'boundaries',      'Boundaries',      'fours',    'number',     TRUE,  3),
(4, 'sixes',           'Sixes',           'sixes',    'number',     TRUE,  4),
(4, 'wickets',         'Wickets',         'wickets',  'number',     TRUE,  5),
(4, 'economy',         'Economy Rate',    'runs/ov',  'number',     FALSE, 6),
(4, 'catches',         'Catches',         'catches',  'number',     TRUE,  7),
-- Athletics (sport_id = 1)
(1, 'sprint_time',     'Sprint Time (100m)','sec',    'time',       FALSE, 1),
(1, 'lap_time',        'Lap Time (400m)', 'sec',      'time',       FALSE, 2),
(1, 'reaction_time',   'Reaction Time',   'ms',       'number',     FALSE, 3),
(1, 'maximum_speed',   'Maximum Speed',   'km/h',     'number',     TRUE,  4),
-- Swimming (sport_id = 2)
(2, 'lap_time',        'Lap Time (50m)',  'sec',      'time',       FALSE, 1),
(2, 'stroke_rate',     'Stroke Rate',    'spm',       'number',     TRUE,  2),
(2, 'finish_position', 'Finish Position','pos',       'number',     FALSE, 3),
-- Badminton (sport_id = 5)
(5, 'smash_accuracy',  'Smash Accuracy', '%',         'percentage', TRUE,  1),
(5, 'reaction_time',   'Reaction Time',  'ms',        'number',     FALSE, 2),
(5, 'points_won',      'Points Won',     'pts',       'number',     TRUE,  3);

-- Age Groups
INSERT INTO age_groups (name, age_min, age_max, description) VALUES
('Sub-Junior', 10, 14, 'Sub-junior category'),
('Junior',     15, 18, 'Junior category'),
('Senior',     19, 25, 'Senior category'),
('Open',       19, 99, 'Open / general category');

-- Gender Categories
INSERT INTO gender_categories (name, code) VALUES
('Male',   'M'),
('Female', 'F'),
('Mixed',  'MX');

-- Categories
INSERT INTO categories (id, sport_id, name, age_min, age_max, gender, is_active) VALUES
(1,  1, 'U-14 Boys',    12, 14, 'male',   TRUE),
(2,  1, 'U-14 Girls',   12, 14, 'female', TRUE),
(3,  1, 'U-17 Boys',    14, 17, 'male',   TRUE),
(4,  1, 'U-17 Girls',   14, 17, 'female', TRUE),
(5,  1, 'U-19 Boys',    17, 19, 'male',   TRUE),
(6,  1, 'U-19 Girls',   17, 19, 'female', TRUE),
(7,  1, 'Senior Men',   19, 40, 'male',   TRUE),
(8,  1, 'Senior Women', 19, 40, 'female', TRUE),
(9,  3, 'U-17 Boys',    14, 17, 'male',   TRUE),
(10, 3, 'U-19 Boys',    17, 19, 'male',   TRUE),
(11, 4, 'U-17 Boys',    14, 17, 'male',   TRUE),
(12, 4, 'U-19 Boys',    17, 19, 'male',   TRUE),
(13, 2, 'U-14 Mixed',   12, 14, 'mixed',  TRUE),
(14, 2, 'U-17 Mixed',   14, 17, 'mixed',  TRUE),
(15, 5, 'U-17 Mixed',   14, 17, 'mixed',  TRUE);

-- Coaches
INSERT INTO coaches (id, user_id, sport_id, qualification, experience_years, specialization) VALUES
(1, 2, 1, 'NIS Diploma in Athletics',  12, 'Sprint & Track Events'),
(2, 3, 2, 'NIS Diploma in Swimming',   8,  'Freestyle & Backstroke'),
(3, 4, 3, 'UEFA B License',            10, 'Youth Football Development');

-- Selectors
INSERT INTO selectors (id, user_id, designation, organization) VALUES
(1, 5, 'Chief Selector',  'State Sports Authority'),
(2, 6, 'Senior Selector', 'State Sports Authority');

-- Athletes
INSERT INTO athletes (id, user_id, coach_id, sport_id, category_id, athlete_code, date_of_birth, gender, height_cm, weight_kg, blood_group, city, state, registration_date) VALUES
(1, 7,  1, 1, 3,  'ATH-2024-001', '2008-05-15', 'male',   172.50, 62.00, 'B+',  'Chennai',   'Tamil Nadu',  '2024-01-10'),
(2, 8,  2, 2, 14, 'ATH-2024-002', '2007-09-22', 'female', 165.00, 55.00, 'O+',  'Bangalore', 'Karnataka',   '2024-01-15'),
(3, 9,  1, 1, 5,  'ATH-2024-003', '2005-03-08', 'male',   178.00, 68.50, 'A+',  'Hyderabad', 'Telangana',   '2024-01-20'),
(4, 10, 2, 2, 13, 'ATH-2024-004', '2009-11-30', 'female', 158.00, 48.00, 'AB+', 'Kochi',     'Kerala',      '2024-02-01'),
(5, 11, 3, 3, 9,  'ATH-2024-005', '2007-07-18', 'male',   170.00, 65.00, 'O-',  'Mumbai',    'Maharashtra', '2024-02-10');

-- Performance Records
INSERT INTO performance_records (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score, improvement_rate) VALUES
(1, 1, 1, '2024-01-15', '100m Sprint', 11.52, 'seconds', 78.50, 0.00),
(1, 1, 1, '2024-02-15', '100m Sprint', 11.38, 'seconds', 81.20, 3.43),
(1, 1, 1, '2024-03-15', '100m Sprint', 11.20, 'seconds', 84.00, 3.44),
(1, 1, 1, '2024-04-15', '100m Sprint', 11.05, 'seconds', 86.50, 2.97),
(1, 1, 1, '2024-05-15', '100m Sprint', 10.95, 'seconds', 88.20, 1.97),
(1, 1, 1, '2024-06-15', '100m Sprint', 10.82, 'seconds', 90.50, 2.49),
(2, 2, 2, '2024-01-20', '100m Freestyle', 68.50, 'seconds', 76.00, 0.00),
(2, 2, 2, '2024-02-20', '100m Freestyle', 66.80, 'seconds', 79.50, 4.60),
(2, 2, 2, '2024-03-20', '100m Freestyle', 65.20, 'seconds', 82.00, 3.15),
(2, 2, 2, '2024-04-20', '100m Freestyle', 63.90, 'seconds', 84.50, 3.04),
(2, 2, 2, '2024-05-20', '100m Freestyle', 62.50, 'seconds', 87.00, 2.96),
(3, 1, 1, '2024-01-25', '200m Sprint', 23.80, 'seconds', 80.00, 0.00),
(3, 1, 1, '2024-03-25', '200m Sprint', 23.10, 'seconds', 84.50, 5.63),
(3, 1, 1, '2024-05-25', '200m Sprint', 22.65, 'seconds', 88.00, 4.13),
(5, 3, 3, '2024-02-01', 'Goals Scored', 8.00,  'goals',   75.00, 0.00),
(5, 3, 3, '2024-03-01', 'Goals Scored', 11.00, 'goals',   82.00, 9.33),
(5, 3, 3, '2024-04-01', 'Goals Scored', 14.00, 'goals',   87.50, 6.71);

-- Fitness Assessments
INSERT INTO fitness_assessments (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, speed_score, reaction_time_ms, balance_score, body_fat_percentage, vo2_max, resting_heart_rate, recovery_rate_bpm, bmi, overall_fitness_score) VALUES
(1, 1, '2024-01-15', 75.00, 80.00, 82.00, 70.00, 85.00, 78.00, 210.00, 72.00, 14.50, 52.00, 62, 28, 20.80, 78.40),
(1, 1, '2024-03-15', 80.00, 85.00, 86.00, 75.00, 88.00, 83.00, 198.00, 77.00, 13.80, 54.50, 60, 30, 20.60, 82.80),
(1, 1, '2024-05-15', 85.00, 88.00, 90.00, 80.00, 92.00, 88.00, 185.00, 82.00, 13.20, 57.00, 58, 32, 20.50, 87.00),
(2, 2, '2024-01-20', 65.00, 85.00, 80.00, 88.00, 75.00, 72.00, 225.00, 84.00, 18.00, 48.00, 65, 25, 20.20, 78.60),
(2, 2, '2024-03-20', 70.00, 88.00, 84.00, 90.00, 79.00, 76.00, 215.00, 87.00, 17.50, 50.00, 63, 27, 20.00, 82.20),
(2, 2, '2024-05-20', 74.00, 91.00, 87.00, 92.00, 82.00, 80.00, 205.00, 89.00, 16.80, 52.50, 61, 29, 19.90, 85.20),
(3, 1, '2024-01-25', 82.00, 78.00, 80.00, 72.00, 84.00, 81.00, 205.00, 74.00, 15.20, 51.00, 63, 27, 21.60, 79.20),
(3, 1, '2024-03-25', 87.00, 83.00, 85.00, 77.00, 88.00, 86.00, 195.00, 79.00, 14.50, 54.00, 61, 29, 21.40, 84.00),
(3, 1, '2024-05-25', 91.00, 87.00, 89.00, 82.00, 91.00, 90.00, 182.00, 84.00, 13.80, 56.50, 59, 31, 21.20, 88.00),
(5, 3, '2024-02-01', 78.00, 82.00, 79.00, 75.00, 86.00, 80.00, 210.00, 76.00, 16.00, 50.00, 64, 26, 22.50, 80.00),
(5, 3, '2024-04-01', 83.00, 86.00, 84.00, 79.00, 89.00, 85.00, 198.00, 80.00, 15.20, 52.50, 62, 28, 22.20, 84.20);

-- Attendance Records
INSERT INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'absent'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 6 DAY),  'late'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 7 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'leave'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 4 DAY),  'half_day'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'absent'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'absent');

-- Injuries
INSERT INTO injuries (athlete_id, injury_type, body_part, injury_date, severity, diagnosis, treatment, doctor_name, hospital, expected_recovery_date, recovery_status, availability_status, is_available) VALUES
(3, 'Hamstring Strain', 'Left Hamstring', '2024-05-10', 'moderate',
 'Grade 2 hamstring muscle strain',
 'Rest, Ice therapy, physiotherapy sessions',
 'Dr. Suresh Menon', 'Apollo Sports Medicine Clinic',
 DATE_ADD(CURDATE(), INTERVAL 14 DAY),
 'recovering', 'restricted', FALSE),
(4, 'Shoulder Sprain', 'Right Shoulder', '2024-04-20', 'minor',
 'AC joint sprain Grade 1',
 'Rest, NSAIDs, shoulder immobilization for 1 week',
 'Dr. Anita Rao', 'Fortis Sports Rehabilitation',
 DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 'recovered', 'fit', TRUE);

-- Rankings
INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date) VALUES
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'sport',   CURDATE()),
(3, 1, 5, 1, 88.00, 88.00, 84.00, 87.20, 'sport',   CURDATE()),
(2, 2, 14,1, 87.00, 85.20, 82.00, 85.46, 'sport',   CURDATE()),
(5, 3, 9, 1, 87.50, 84.20, 80.00, 84.85, 'sport',   CURDATE()),
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'overall', CURDATE()),
(3, 1, 5, 2, 88.00, 88.00, 84.00, 87.20, 'overall', CURDATE()),
(2, 2, 14,3, 87.00, 85.20, 82.00, 85.46, 'overall', CURDATE()),
(5, 3, 9, 4, 87.50, 84.20, 80.00, 84.85, 'overall', CURDATE());

-- Selections
INSERT INTO selections (athlete_id, selector_id, selection_type, selection_date, performance_score, fitness_score, attendance_score, coach_rating, selection_score, confidence_score, status, remarks) VALUES
(1, 1, 'State Selection',  '2024-06-01', 90.50, 87.00, 92.00, 88.00, 89.50, 91.00, 'selected',    'Outstanding sprint performance'),
(2, 1, 'National Camp',    '2024-06-05', 87.00, 85.20, 88.00, 86.00, 86.50, 88.00, 'recommended', 'Strong swimming potential'),
(3, 2, 'State Selection',  '2024-06-10', 88.00, 88.00, 85.00, 87.00, 87.50, 85.00, 'pending',     'Pending fitness clearance after injury');

-- Coach Remarks
INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks) VALUES
(1, 1, '2024-06-01', 'performance', 9.0, 'Excellent improvement in sprint timing. Ready for state trials.'),
(2, 2, '2024-06-02', 'fitness',     8.5, 'Good endurance. Needs more strength training.'),
(3, 1, '2024-06-03', 'general',     7.5, 'Recovering from hamstring strain. Light training only.');

-- Notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'System Initialized',      'Sports Academy Management System v3 is ready.', 'success'),
(2, 'New Athlete Assigned',    'Athlete Arjun Nair has been assigned to your training group.', 'info'),
(5, 'Ranking Updated',         'New athlete rankings have been computed for this month.', 'info'),
(7, 'Fitness Assessment Due',  'Your next fitness assessment is scheduled for next week.', 'warning');





-- ============================================================
-- COMPLETE ACADEMY SCHEMA & SEED DATA (v3)
-- SportsInsight - Sports Academy Management System
-- Includes: Auth, Athletes, Coaches, Selectors, Sports,
--           Performance, Fitness, Attendance, Injuries,
--           Rankings, Selections, AI Lists, Notifications
-- ============================================================

DROP DATABASE IF EXISTS sports_acadmey;
CREATE DATABASE sports_acadmey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sports_acadmey;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id INT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- LOGIN HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') DEFAULT 'success',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SPORT METRICS (Dynamic per-sport performance metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS sport_metrics (
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
    UNIQUE KEY uq_sport_metric (sport_id, metric_key),
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sport_id INT UNSIGNED,
    name VARCHAR(100) NOT NULL,
    age_min INT,
    age_max INT,
    gender ENUM('male', 'female', 'mixed') DEFAULT 'mixed',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- AGE GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS age_groups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    age_min INT NOT NULL,
    age_max INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- GENDER CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS gender_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sport_id INT UNSIGNED,
    name VARCHAR(200) NOT NULL,
    event_type ENUM('individual','team','relay') DEFAULT 'individual',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- COACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_code VARCHAR(50) UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    sport_id INT UNSIGNED,
    qualification VARCHAR(255),
    experience_years INT DEFAULT 0,
    specialization VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('male','female','other'),
    address TEXT,
    joining_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    current_status ENUM('active','inactive','archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_certificates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_id INT UNSIGNED NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    issuing_body VARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    certificate_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- COACH HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coach_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','assigned','unassigned','status_change','other') DEFAULT 'other',
    description TEXT NOT NULL,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH PERFORMANCE ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_performance (
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
    UNIQUE KEY uq_coach_period (coach_id, period_month, period_year),
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- SELECTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS selectors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selector_code VARCHAR(50) UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    designation VARCHAR(255),
    organization VARCHAR(255),
    sport_expertise VARCHAR(255),
    years_experience INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SELECTOR SPORT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS selector_sports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selector_id INT UNSIGNED NOT NULL,
    sport_id INT UNSIGNED NOT NULL,
    assigned_date DATE NOT NULL DEFAULT (CURDATE()),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_selector_sport (selector_id, sport_id),
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- ============================================================
-- ATHLETES
-- ============================================================
CREATE TABLE IF NOT EXISTS athletes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    coach_id INT UNSIGNED,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    athlete_code VARCHAR(50) UNIQUE,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_group VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    academy_name VARCHAR(255),
    pincode VARCHAR(10),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(20),
    registration_date DATE DEFAULT (CURDATE()),
    joining_date DATE,
    medical_status ENUM('fit','unfit','injured','under_observation') DEFAULT 'fit',
    current_status ENUM('active','inactive','archived','transferred') DEFAULT 'active',
    archived_at TIMESTAMP NULL,
    archived_by INT UNSIGNED,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH ASSIGNMENTS (linking coaches to athletes)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_assignments (
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
    UNIQUE KEY uq_coach_athlete_active (coach_id, athlete_id, is_active),
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_documents (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE MEDICAL HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_medical_history (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- ATHLETE ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_achievements (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- ATHLETE HISTORY (Audit Trail / Timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS athlete_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','archived','restored','status_change',
                     'sport_changed','coach_changed','category_changed','other') DEFAULT 'other',
    description TEXT NOT NULL,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE RECORDS
-- Includes: ai_analysis JSON + improvement_rate columns
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    sport_id INT UNSIGNED,
    record_date DATE NOT NULL,
    metric_name VARCHAR(150) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(50),
    performance_score DECIMAL(5,2),
    improvement_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performance_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_attachments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performance_id INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PERFORMANCE SUMMARY (Monthly aggregated per athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_summary (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    avg_score DECIMAL(5,2) DEFAULT 0,
    total_records INT DEFAULT 0,
    top_metric VARCHAR(150),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_perf_summary (athlete_id, period_month, period_year),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- FITNESS ASSESSMENTS
-- Includes: speed_score, reaction_time_ms, balance_score,
--           body_fat_percentage, vo2_max, resting_heart_rate,
--           recovery_rate_bpm, ai_analysis columns
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_assessments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    assessment_date DATE NOT NULL,
    strength_score DECIMAL(5,2) DEFAULT 0,
    endurance_score DECIMAL(5,2) DEFAULT 0,
    stamina_score DECIMAL(5,2) DEFAULT 0,
    flexibility_score DECIMAL(5,2) DEFAULT 0,
    agility_score DECIMAL(5,2) DEFAULT 0,
    speed_score DECIMAL(5,2) DEFAULT 0,
    reaction_time_ms DECIMAL(6,2) DEFAULT 0,
    balance_score DECIMAL(5,2) DEFAULT 0,
    body_fat_percentage DECIMAL(5,2) DEFAULT 0,
    vo2_max DECIMAL(5,2) DEFAULT 0,
    resting_heart_rate INT DEFAULT 70,
    recovery_rate_bpm INT DEFAULT 30,
    bmi DECIMAL(5,2),
    overall_fitness_score DECIMAL(5,2),
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- FITNESS PARAMETERS (Configurable fitness metric definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_parameters (
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
);

-- ============================================================
-- FITNESS HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fitness_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- FITNESS SCORE HISTORY (Trend tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_score_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    assessment_id INT UNSIGNED NOT NULL,
    assessment_date DATE NOT NULL,
    overall_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- ATTENDANCE
-- Includes: half_day and late status values
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave', 'half_day', 'late') DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_athlete_date (athlete_id, attendance_date),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- ATTENDANCE HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    action_type ENUM('created','updated','deleted') DEFAULT 'created',
    description TEXT,
    changed_by INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ATTENDANCE SUMMARY (Monthly aggregated per athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_summary (
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
    UNIQUE KEY uq_att_summary (athlete_id, period_month, period_year),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- INJURIES
-- Includes: body_part, diagnosis, treatment, medication,
--           doctor_name, hospital, expected_recovery_date,
--           actual_recovery_date, availability_status, ai_analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS injuries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    injury_type VARCHAR(200) NOT NULL,
    body_part VARCHAR(100),
    injury_date DATE NOT NULL,
    severity ENUM('minor', 'moderate', 'severe', 'critical') DEFAULT 'minor',
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    doctor_name VARCHAR(200),
    hospital VARCHAR(255),
    expected_recovery_date DATE,
    actual_recovery_date DATE,
    recovery_date DATE,
    recovery_status ENUM('recovering', 'recovered', 'chronic') DEFAULT 'recovering',
    availability_status ENUM('fit', 'unfit', 'restricted', 'under_observation') DEFAULT 'unfit',
    is_available BOOLEAN DEFAULT FALSE,
    notes TEXT,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- RECOVERY HISTORY (Doctor checkup logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS recovery_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    checkup_date DATE NOT NULL,
    recovery_percentage DECIMAL(5,2) DEFAULT 0,
    status_update ENUM('recovering', 'recovered', 'chronic', 'active') DEFAULT 'recovering',
    doctor_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- DOCTOR REMARKS (Formal clearance notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_remarks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    doctor_name VARCHAR(200) NOT NULL,
    remark_date DATE NOT NULL,
    remarks TEXT NOT NULL,
    cleared_for_training BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- MEDICAL REPORTS (File attachments per injury)
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    athlete_id INT UNSIGNED NOT NULL,
    report_type VARCHAR(100) DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    doctor_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- INJURY ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS injury_attachments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    injury_id INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- RANKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS rankings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    rank_position INT,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    consistency_score DECIMAL(6,2) DEFAULT 0,
    overall_ranking_score DECIMAL(6,2) DEFAULT 0,
    rank_type ENUM('overall', 'sport', 'category', 'gender', 'age') DEFAULT 'overall',
    rank_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- SELECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS selections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    selector_id INT UNSIGNED,
    selection_type VARCHAR(200),
    selection_date DATE NOT NULL,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    attendance_score DECIMAL(6,2) DEFAULT 0,
    coach_rating DECIMAL(6,2) DEFAULT 0,
    selection_score DECIMAL(6,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    status ENUM('recommended', 'selected', 'rejected', 'pending') DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE SET NULL
);

-- ============================================================
-- SELECTION HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS selection_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    selection_id INT UNSIGNED NOT NULL,
    selector_id INT UNSIGNED,
    athlete_id INT UNSIGNED NOT NULL,
    action ENUM('recommended','shortlisted','selected','rejected','waitlisted','reviewed') DEFAULT 'reviewed',
    notes TEXT,
    performance_score DECIMAL(6,2) DEFAULT 0,
    fitness_score DECIMAL(6,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
    FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE SET NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'danger') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- AI GENERATED LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_generated_lists (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    generated_by INT UNSIGNED NOT NULL,
    list_type VARCHAR(200) NOT NULL,
    sport_id INT UNSIGNED,
    category_id INT UNSIGNED,
    age_group VARCHAR(50),
    gender ENUM('male', 'female', 'mixed') DEFAULT 'mixed',
    date_from DATE,
    date_to DATE,
    result_json LONGTEXT,
    athletes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- COACH REMARKS (General coach notes on athlete)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_remarks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED NOT NULL,
    remark_date DATE NOT NULL,
    remark_type ENUM('performance', 'fitness', 'behavior', 'general') DEFAULT 'general',
    rating DECIMAL(3,1),
    remarks TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- ============================================================
-- ============================================================
-- SEED DATA
-- ============================================================
-- ============================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'System Administrator with full access'),
(2, 'coach', 'Coach who manages and trains athletes'),
(3, 'selector', 'Selector who evaluates and selects athletes'),
(4, 'athlete', 'Athlete registered in the academy');

-- Users (password: Admin@123 for all)
INSERT INTO users (id, role_id, username, email, password_hash, first_name, last_name, phone, is_active) VALUES
(1,  1, 'admin',            'admin@sportsacademy.com',      '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Super',  'Admin',   '+91-9876543210', TRUE),
(2,  2, 'coach.rajesh',     'rajesh.kumar@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Rajesh', 'Kumar',   '+91-9876543211', TRUE),
(3,  2, 'coach.priya',      'priya.sharma@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Priya',  'Sharma',  '+91-9876543212', TRUE),
(4,  2, 'coach.arun',       'arun.verma@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arun',   'Verma',   '+91-9876543213', TRUE),
(5,  3, 'selector.vikram',  'vikram.singh@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Vikram', 'Singh',   '+91-9876543214', TRUE),
(6,  3, 'selector.meera',   'meera.reddy@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Meera',  'Reddy',   '+91-9876543215', TRUE),
(7,  4, 'athlete.arjun',    'arjun.nair@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arjun',  'Nair',    '+91-9876543216', TRUE),
(8,  4, 'athlete.sneha',    'sneha.patel@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Sneha',  'Patel',   '+91-9876543217', TRUE),
(9,  4, 'athlete.rohit',    'rohit.sharma@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u','Rohit',  'Sharma',  '+91-9876543218', TRUE),
(10, 4, 'athlete.kavya',    'kavya.menon@sportsacademy.com','$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kavya',  'Menon',   '+91-9876543219', TRUE),
(11, 4, 'athlete.kiran',    'kiran.rao@sportsacademy.com',  '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kiran',  'Rao',     '+91-9876543220', TRUE);

-- Sports
INSERT INTO sports (id, name, description, icon, is_active) VALUES
(1,  'Athletics',     'Track and field events',         'run',    TRUE),
(2,  'Swimming',      'Aquatic sports and events',      'waves',  TRUE),
(3,  'Football',      'Association football / Soccer',  'circle', TRUE),
(4,  'Cricket',       'Bat and ball sport',             'target', TRUE),
(5,  'Badminton',     'Racquet sport',                  'zap',    TRUE),
(6,  'Wrestling',     'Combat sport',                   'shield', TRUE),
(7,  'Boxing',        'Combat sport with gloves',       'shield', TRUE),
(8,  'Gymnastics',    'Artistic gymnastics',            'star',   TRUE),
(9,  'Volleyball',    'Net sport',                      'circle', TRUE),
(10, 'Table Tennis',  'Racquet sport',                  'zap',    TRUE);

-- Sport Metrics (Football, Cricket, Athletics, Swimming, Badminton)
INSERT INTO sport_metrics (sport_id, metric_key, metric_label, metric_unit, metric_type, is_higher_better, display_order) VALUES
-- Football (sport_id = 3)
(3, 'goals',           'Goals',           'goals',    'number',     TRUE,  1),
(3, 'assists',         'Assists',         'assists',  'number',     TRUE,  2),
(3, 'pass_accuracy',   'Pass Accuracy',   '%',        'percentage', TRUE,  3),
(3, 'shots_on_target', 'Shots on Target', 'shots',    'number',     TRUE,  4),
(3, 'distance_covered','Distance Covered','km',        'number',     TRUE,  5),
-- Cricket (sport_id = 4)
(4, 'runs',            'Runs',            'runs',     'number',     TRUE,  1),
(4, 'strike_rate',     'Strike Rate',     'sr',       'number',     TRUE,  2),
(4, 'boundaries',      'Boundaries',      'fours',    'number',     TRUE,  3),
(4, 'sixes',           'Sixes',           'sixes',    'number',     TRUE,  4),
(4, 'wickets',         'Wickets',         'wickets',  'number',     TRUE,  5),
(4, 'economy',         'Economy Rate',    'runs/ov',  'number',     FALSE, 6),
(4, 'catches',         'Catches',         'catches',  'number',     TRUE,  7),
-- Athletics (sport_id = 1)
(1, 'sprint_time',     'Sprint Time (100m)','sec',    'time',       FALSE, 1),
(1, 'lap_time',        'Lap Time (400m)', 'sec',      'time',       FALSE, 2),
(1, 'reaction_time',   'Reaction Time',   'ms',       'number',     FALSE, 3),
(1, 'maximum_speed',   'Maximum Speed',   'km/h',     'number',     TRUE,  4),
-- Swimming (sport_id = 2)
(2, 'lap_time',        'Lap Time (50m)',  'sec',      'time',       FALSE, 1),
(2, 'stroke_rate',     'Stroke Rate',    'spm',       'number',     TRUE,  2),
(2, 'finish_position', 'Finish Position','pos',       'number',     FALSE, 3),
-- Badminton (sport_id = 5)
(5, 'smash_accuracy',  'Smash Accuracy', '%',         'percentage', TRUE,  1),
(5, 'reaction_time',   'Reaction Time',  'ms',        'number',     FALSE, 2),
(5, 'points_won',      'Points Won',     'pts',       'number',     TRUE,  3);

-- Age Groups
INSERT INTO age_groups (name, age_min, age_max, description) VALUES
('Sub-Junior', 10, 14, 'Sub-junior category'),
('Junior',     15, 18, 'Junior category'),
('Senior',     19, 25, 'Senior category'),
('Open',       19, 99, 'Open / general category');

-- Gender Categories
INSERT INTO gender_categories (name, code) VALUES
('Male',   'M'),
('Female', 'F'),
('Mixed',  'MX');

-- Categories
INSERT INTO categories (id, sport_id, name, age_min, age_max, gender, is_active) VALUES
(1,  1, 'U-14 Boys',    12, 14, 'male',   TRUE),
(2,  1, 'U-14 Girls',   12, 14, 'female', TRUE),
(3,  1, 'U-17 Boys',    14, 17, 'male',   TRUE),
(4,  1, 'U-17 Girls',   14, 17, 'female', TRUE),
(5,  1, 'U-19 Boys',    17, 19, 'male',   TRUE),
(6,  1, 'U-19 Girls',   17, 19, 'female', TRUE),
(7,  1, 'Senior Men',   19, 40, 'male',   TRUE),
(8,  1, 'Senior Women', 19, 40, 'female', TRUE),
(9,  3, 'U-17 Boys',    14, 17, 'male',   TRUE),
(10, 3, 'U-19 Boys',    17, 19, 'male',   TRUE),
(11, 4, 'U-17 Boys',    14, 17, 'male',   TRUE),
(12, 4, 'U-19 Boys',    17, 19, 'male',   TRUE),
(13, 2, 'U-14 Mixed',   12, 14, 'mixed',  TRUE),
(14, 2, 'U-17 Mixed',   14, 17, 'mixed',  TRUE),
(15, 5, 'U-17 Mixed',   14, 17, 'mixed',  TRUE);

-- Coaches
INSERT INTO coaches (id, user_id, sport_id, qualification, experience_years, specialization) VALUES
(1, 2, 1, 'NIS Diploma in Athletics',  12, 'Sprint & Track Events'),
(2, 3, 2, 'NIS Diploma in Swimming',   8,  'Freestyle & Backstroke'),
(3, 4, 3, 'UEFA B License',            10, 'Youth Football Development');

-- Selectors
INSERT INTO selectors (id, user_id, designation, organization) VALUES
(1, 5, 'Chief Selector',  'State Sports Authority'),
(2, 6, 'Senior Selector', 'State Sports Authority');

-- Athletes
INSERT INTO athletes (id, user_id, coach_id, sport_id, category_id, athlete_code, date_of_birth, gender, height_cm, weight_kg, blood_group, city, state, registration_date) VALUES
(1, 7,  1, 1, 3,  'ATH-2024-001', '2008-05-15', 'male',   172.50, 62.00, 'B+',  'Chennai',   'Tamil Nadu',  '2024-01-10'),
(2, 8,  2, 2, 14, 'ATH-2024-002', '2007-09-22', 'female', 165.00, 55.00, 'O+',  'Bangalore', 'Karnataka',   '2024-01-15'),
(3, 9,  1, 1, 5,  'ATH-2024-003', '2005-03-08', 'male',   178.00, 68.50, 'A+',  'Hyderabad', 'Telangana',   '2024-01-20'),
(4, 10, 2, 2, 13, 'ATH-2024-004', '2009-11-30', 'female', 158.00, 48.00, 'AB+', 'Kochi',     'Kerala',      '2024-02-01'),
(5, 11, 3, 3, 9,  'ATH-2024-005', '2007-07-18', 'male',   170.00, 65.00, 'O-',  'Mumbai',    'Maharashtra', '2024-02-10');

-- Performance Records
INSERT INTO performance_records (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score, improvement_rate) VALUES
(1, 1, 1, '2024-01-15', '100m Sprint', 11.52, 'seconds', 78.50, 0.00),
(1, 1, 1, '2024-02-15', '100m Sprint', 11.38, 'seconds', 81.20, 3.43),
(1, 1, 1, '2024-03-15', '100m Sprint', 11.20, 'seconds', 84.00, 3.44),
(1, 1, 1, '2024-04-15', '100m Sprint', 11.05, 'seconds', 86.50, 2.97),
(1, 1, 1, '2024-05-15', '100m Sprint', 10.95, 'seconds', 88.20, 1.97),
(1, 1, 1, '2024-06-15', '100m Sprint', 10.82, 'seconds', 90.50, 2.49),
(2, 2, 2, '2024-01-20', '100m Freestyle', 68.50, 'seconds', 76.00, 0.00),
(2, 2, 2, '2024-02-20', '100m Freestyle', 66.80, 'seconds', 79.50, 4.60),
(2, 2, 2, '2024-03-20', '100m Freestyle', 65.20, 'seconds', 82.00, 3.15),
(2, 2, 2, '2024-04-20', '100m Freestyle', 63.90, 'seconds', 84.50, 3.04),
(2, 2, 2, '2024-05-20', '100m Freestyle', 62.50, 'seconds', 87.00, 2.96),
(3, 1, 1, '2024-01-25', '200m Sprint', 23.80, 'seconds', 80.00, 0.00),
(3, 1, 1, '2024-03-25', '200m Sprint', 23.10, 'seconds', 84.50, 5.63),
(3, 1, 1, '2024-05-25', '200m Sprint', 22.65, 'seconds', 88.00, 4.13),
(5, 3, 3, '2024-02-01', 'Goals Scored', 8.00,  'goals',   75.00, 0.00),
(5, 3, 3, '2024-03-01', 'Goals Scored', 11.00, 'goals',   82.00, 9.33),
(5, 3, 3, '2024-04-01', 'Goals Scored', 14.00, 'goals',   87.50, 6.71);

-- Fitness Assessments
INSERT INTO fitness_assessments (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, speed_score, reaction_time_ms, balance_score, body_fat_percentage, vo2_max, resting_heart_rate, recovery_rate_bpm, bmi, overall_fitness_score) VALUES
(1, 1, '2024-01-15', 75.00, 80.00, 82.00, 70.00, 85.00, 78.00, 210.00, 72.00, 14.50, 52.00, 62, 28, 20.80, 78.40),
(1, 1, '2024-03-15', 80.00, 85.00, 86.00, 75.00, 88.00, 83.00, 198.00, 77.00, 13.80, 54.50, 60, 30, 20.60, 82.80),
(1, 1, '2024-05-15', 85.00, 88.00, 90.00, 80.00, 92.00, 88.00, 185.00, 82.00, 13.20, 57.00, 58, 32, 20.50, 87.00),
(2, 2, '2024-01-20', 65.00, 85.00, 80.00, 88.00, 75.00, 72.00, 225.00, 84.00, 18.00, 48.00, 65, 25, 20.20, 78.60),
(2, 2, '2024-03-20', 70.00, 88.00, 84.00, 90.00, 79.00, 76.00, 215.00, 87.00, 17.50, 50.00, 63, 27, 20.00, 82.20),
(2, 2, '2024-05-20', 74.00, 91.00, 87.00, 92.00, 82.00, 80.00, 205.00, 89.00, 16.80, 52.50, 61, 29, 19.90, 85.20),
(3, 1, '2024-01-25', 82.00, 78.00, 80.00, 72.00, 84.00, 81.00, 205.00, 74.00, 15.20, 51.00, 63, 27, 21.60, 79.20),
(3, 1, '2024-03-25', 87.00, 83.00, 85.00, 77.00, 88.00, 86.00, 195.00, 79.00, 14.50, 54.00, 61, 29, 21.40, 84.00),
(3, 1, '2024-05-25', 91.00, 87.00, 89.00, 82.00, 91.00, 90.00, 182.00, 84.00, 13.80, 56.50, 59, 31, 21.20, 88.00),
(5, 3, '2024-02-01', 78.00, 82.00, 79.00, 75.00, 86.00, 80.00, 210.00, 76.00, 16.00, 50.00, 64, 26, 22.50, 80.00),
(5, 3, '2024-04-01', 83.00, 86.00, 84.00, 79.00, 89.00, 85.00, 198.00, 80.00, 15.20, 52.50, 62, 28, 22.20, 84.20);

-- Attendance Records
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'absent'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 6 DAY),  'late'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 7 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'leave'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 4 DAY),  'half_day'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'absent'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'present'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'absent');

-- Injuries
INSERT INTO injuries (athlete_id, injury_type, body_part, injury_date, severity, diagnosis, treatment, doctor_name, hospital, expected_recovery_date, recovery_status, availability_status, is_available) VALUES
(3, 'Hamstring Strain', 'Left Hamstring', '2024-05-10', 'moderate',
 'Grade 2 hamstring muscle strain',
 'Rest, Ice therapy, physiotherapy sessions',
 'Dr. Suresh Menon', 'Apollo Sports Medicine Clinic',
 DATE_ADD(CURDATE(), INTERVAL 14 DAY),
 'recovering', 'restricted', FALSE),
(4, 'Shoulder Sprain', 'Right Shoulder', '2024-04-20', 'minor',
 'AC joint sprain Grade 1',
 'Rest, NSAIDs, shoulder immobilization for 1 week',
 'Dr. Anita Rao', 'Fortis Sports Rehabilitation',
 DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 'recovered', 'fit', TRUE);

-- Rankings
INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date) VALUES
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'sport',   CURDATE()),
(3, 1, 5, 1, 88.00, 88.00, 84.00, 87.20, 'sport',   CURDATE()),
(2, 2, 14,1, 87.00, 85.20, 82.00, 85.46, 'sport',   CURDATE()),
(5, 3, 9, 1, 87.50, 84.20, 80.00, 84.85, 'sport',   CURDATE()),
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'overall', CURDATE()),
(3, 1, 5, 2, 88.00, 88.00, 84.00, 87.20, 'overall', CURDATE()),
(2, 2, 14,3, 87.00, 85.20, 82.00, 85.46, 'overall', CURDATE()),
(5, 3, 9, 4, 87.50, 84.20, 80.00, 84.85, 'overall', CURDATE());

-- Selections
INSERT INTO selections (athlete_id, selector_id, selection_type, selection_date, performance_score, fitness_score, attendance_score, coach_rating, selection_score, confidence_score, status, remarks) VALUES
(1, 1, 'State Selection',  '2024-06-01', 90.50, 87.00, 92.00, 88.00, 89.50, 91.00, 'selected',    'Outstanding sprint performance'),
(2, 1, 'National Camp',    '2024-06-05', 87.00, 85.20, 88.00, 86.00, 86.50, 88.00, 'recommended', 'Strong swimming potential'),
(3, 2, 'State Selection',  '2024-06-10', 88.00, 88.00, 85.00, 87.00, 87.50, 85.00, 'pending',     'Pending fitness clearance after injury');

-- Coach Remarks
INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks) VALUES
(1, 1, '2024-06-01', 'performance', 9.0, 'Excellent improvement in sprint timing. Ready for state trials.'),
(2, 2, '2024-06-02', 'fitness',     8.5, 'Good endurance. Needs more strength training.'),
(3, 1, '2024-06-03', 'general',     7.5, 'Recovering from hamstring strain. Light training only.');

-- Notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'System Initialized',      'Sports Academy Management System v3 is ready.', 'success'),
(2, 'New Athlete Assigned',    'Athlete Arjun Nair has been assigned to your training group.', 'info'),
(5, 'Ranking Updated',         'New athlete rankings have been computed for this month.', 'info'),
(7, 'Fitness Assessment Due',  'Your next fitness assessment is scheduled for next week.', 'warning');

-- ============================================================
-- 6-MONTH TREND SEED DATA (2026-03 to 2026-08)
-- Required for: Dashboard Performance/Fitness/Attendance Trend
-- Required for: Athlete Comparison Module (multi-athlete data)
-- ============================================================

-- ── Performance Records (monthly, 2026-03 to 2026-08) ─────────
INSERT INTO performance_records (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score, improvement_rate) VALUES
-- Athlete 1 — Athletics sprint
(1, 1, 1, '2026-03-15', '100m Sprint', 10.95, 'seconds', 76.5, 0.00),
(1, 1, 1, '2026-04-15', '100m Sprint', 10.80, 'seconds', 79.2, 3.53),
(1, 1, 1, '2026-05-15', '100m Sprint', 10.65, 'seconds', 81.8, 3.28),
(1, 1, 1, '2026-06-15', '100m Sprint', 10.52, 'seconds', 84.3, 3.06),
(1, 1, 1, '2026-07-15', '100m Sprint', 10.40, 'seconds', 86.9, 3.09),
(1, 1, 1, '2026-08-01', '100m Sprint', 10.28, 'seconds', 89.2, 2.65),
-- Athlete 3 — Athletics 200m
(3, 1, 1, '2026-03-20', '200m Sprint', 22.80, 'seconds', 75.0, 0.00),
(3, 1, 1, '2026-04-20', '200m Sprint', 22.55, 'seconds', 78.5, 4.67),
(3, 1, 1, '2026-05-20', '200m Sprint', 22.25, 'seconds', 81.5, 3.33),
(3, 1, 1, '2026-06-20', '200m Sprint', 22.00, 'seconds', 84.0, 3.07),
(3, 1, 1, '2026-07-20', '200m Sprint', 21.75, 'seconds', 86.5, 2.98),
(3, 1, 1, '2026-08-01', '200m Sprint', 21.50, 'seconds', 89.0, 2.89),
-- Athlete 2 — Swimming
(2, 2, 2, '2026-03-15', '100m Freestyle', 62.50, 'seconds', 74.0, 0.00),
(2, 2, 2, '2026-04-15', '100m Freestyle', 61.80, 'seconds', 77.2, 4.32),
(2, 2, 2, '2026-05-15', '100m Freestyle', 61.10, 'seconds', 80.0, 3.63),
(2, 2, 2, '2026-06-15', '100m Freestyle', 60.40, 'seconds', 82.8, 3.50),
(2, 2, 2, '2026-07-15', '100m Freestyle', 59.70, 'seconds', 85.6, 3.38),
(2, 2, 2, '2026-08-01', '100m Freestyle', 59.00, 'seconds', 88.4, 3.27),
-- Athlete 4 — Swimming
(4, 2, 2, '2026-03-18', '50m Backstroke', 38.20, 'seconds', 73.0, 0.00),
(4, 2, 2, '2026-04-18', '50m Backstroke', 37.60, 'seconds', 76.5, 4.79),
(4, 2, 2, '2026-05-18', '50m Backstroke', 37.00, 'seconds', 79.8, 4.31),
(4, 2, 2, '2026-06-18', '50m Backstroke', 36.40, 'seconds', 82.5, 3.40),
(4, 2, 2, '2026-07-18', '50m Backstroke', 35.80, 'seconds', 85.3, 3.39),
(4, 2, 2, '2026-08-01', '50m Backstroke', 35.20, 'seconds', 88.0, 3.27),
-- Athlete 5 — Football
(5, 3, 3, '2026-03-10', 'Goals Scored', 4.00, 'goals', 74.0, 0.00),
(5, 3, 3, '2026-04-10', 'Goals Scored', 5.00, 'goals', 78.0, 5.41),
(5, 3, 3, '2026-05-10', 'Goals Scored', 6.00, 'goals', 81.5, 4.49),
(5, 3, 3, '2026-06-10', 'Goals Scored', 7.00, 'goals', 84.0, 3.07),
(5, 3, 3, '2026-07-10', 'Goals Scored', 8.00, 'goals', 86.5, 2.98),
(5, 3, 3, '2026-08-01', 'Goals Scored', 9.00, 'goals', 89.0, 2.89);

-- ── Fitness Assessments (monthly, 2026-03 to 2026-08) ─────────
INSERT INTO fitness_assessments (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, speed_score, reaction_time_ms, balance_score, body_fat_percentage, vo2_max, resting_heart_rate, recovery_rate_bpm, bmi, overall_fitness_score) VALUES
-- Athlete 1
(1, 1, '2026-03-15', 74.0, 79.0, 81.0, 70.0, 84.0, 77.0, 212, 71.0, 14.6, 51.5, 62, 28, 20.80, 74.0),
(1, 1, '2026-04-15', 77.0, 82.0, 84.0, 73.0, 86.0, 80.0, 205, 74.0, 14.2, 53.0, 61, 29, 20.70, 77.8),
(1, 1, '2026-05-15', 80.0, 85.0, 87.0, 76.0, 89.0, 83.0, 198, 77.0, 13.8, 54.5, 60, 30, 20.60, 80.9),
(1, 1, '2026-06-15', 83.0, 87.0, 89.0, 78.0, 91.0, 86.0, 192, 80.0, 13.4, 56.0, 59, 31, 20.55, 83.8),
(1, 1, '2026-07-15', 86.0, 89.0, 91.0, 80.0, 92.0, 88.0, 186, 82.0, 13.1, 57.0, 58, 32, 20.50, 86.7),
(1, 1, '2026-08-01', 88.0, 91.0, 93.0, 82.0, 94.0, 90.0, 181, 84.0, 12.8, 58.0, 57, 33, 20.45, 89.2),
-- Athlete 3
(3, 1, '2026-03-20', 80.0, 77.0, 79.0, 71.0, 83.0, 80.0, 207, 73.0, 15.3, 50.5, 63, 27, 21.60, 73.0),
(3, 1, '2026-04-20', 83.0, 80.0, 82.0, 74.0, 86.0, 83.0, 200, 76.0, 14.9, 52.0, 62, 28, 21.50, 76.8),
(3, 1, '2026-05-20', 85.0, 83.0, 85.0, 77.0, 88.0, 86.0, 193, 79.0, 14.5, 53.5, 61, 29, 21.40, 80.2),
(3, 1, '2026-06-20', 88.0, 85.0, 87.0, 79.0, 90.0, 88.0, 187, 81.0, 14.1, 55.0, 60, 30, 21.35, 83.2),
(3, 1, '2026-07-20', 90.0, 87.0, 89.0, 81.0, 92.0, 90.0, 182, 83.0, 13.8, 56.0, 59, 31, 21.30, 86.1),
(3, 1, '2026-08-01', 92.0, 89.0, 91.0, 83.0, 93.0, 91.0, 178, 85.0, 13.5, 57.0, 58, 32, 21.25, 88.6),
-- Athlete 2
(2, 2, '2026-03-15', 64.0, 84.0, 79.0, 87.0, 74.0, 71.0, 226, 83.0, 18.1, 47.5, 65, 25, 20.20, 72.0),
(2, 2, '2026-04-15', 67.0, 86.0, 82.0, 89.0, 77.0, 74.0, 218, 85.0, 17.7, 49.0, 64, 26, 20.10, 75.5),
(2, 2, '2026-05-15', 70.0, 88.0, 85.0, 91.0, 80.0, 77.0, 210, 87.0, 17.3, 50.5, 63, 27, 20.00, 78.7),
(2, 2, '2026-06-15', 73.0, 90.0, 87.0, 92.0, 82.0, 79.0, 203, 89.0, 16.9, 52.0, 62, 28, 19.90, 82.0),
(2, 2, '2026-07-15', 76.0, 92.0, 89.0, 93.0, 84.0, 81.0, 197, 90.0, 16.5, 53.5, 61, 29, 19.80, 85.0),
(2, 2, '2026-08-01', 78.0, 93.0, 91.0, 94.0, 86.0, 83.0, 192, 91.0, 16.2, 55.0, 60, 30, 19.75, 87.6),
-- Athlete 4
(4, 2, '2026-03-18', 60.0, 82.0, 77.0, 85.0, 72.0, 69.0, 232, 81.0, 19.5, 45.5, 67, 23, 19.20, 70.0),
(4, 2, '2026-04-18', 63.0, 84.0, 80.0, 87.0, 75.0, 72.0, 224, 83.0, 19.1, 47.0, 66, 24, 19.10, 73.5),
(4, 2, '2026-05-18', 66.0, 86.0, 83.0, 89.0, 78.0, 75.0, 216, 85.0, 18.7, 48.5, 65, 25, 19.00, 77.0),
(4, 2, '2026-06-18', 69.0, 88.0, 85.0, 91.0, 80.0, 77.0, 209, 87.0, 18.3, 50.0, 64, 26, 18.90, 80.5),
(4, 2, '2026-07-18', 72.0, 90.0, 87.0, 92.0, 82.0, 79.0, 203, 88.0, 17.9, 51.5, 63, 27, 18.80, 83.5),
(4, 2, '2026-08-01', 74.0, 91.0, 89.0, 93.0, 84.0, 81.0, 198, 89.0, 17.6, 52.5, 62, 28, 18.75, 86.0),
-- Athlete 5
(5, 3, '2026-03-10', 77.0, 81.0, 78.0, 74.0, 85.0, 79.0, 211, 75.0, 16.1, 49.5, 64, 26, 22.50, 71.5),
(5, 3, '2026-04-10', 80.0, 84.0, 81.0, 77.0, 87.0, 82.0, 204, 78.0, 15.7, 51.0, 63, 27, 22.40, 75.0),
(5, 3, '2026-05-10', 82.0, 86.0, 84.0, 79.0, 89.0, 84.0, 198, 80.0, 15.3, 52.5, 62, 28, 22.30, 78.5),
(5, 3, '2026-06-10', 84.0, 88.0, 86.0, 81.0, 91.0, 86.0, 192, 82.0, 14.9, 54.0, 61, 29, 22.20, 81.8),
(5, 3, '2026-07-10', 86.0, 90.0, 88.0, 83.0, 92.0, 88.0, 186, 84.0, 14.5, 55.5, 60, 30, 22.10, 85.0),
(5, 3, '2026-08-01', 88.0, 91.0, 90.0, 85.0, 93.0, 89.0, 181, 86.0, 14.2, 56.5, 59, 31, 22.05, 87.5);

-- ── Attendance Records (daily, 2026-03-01 to 2026-08-09) ──────
-- Generates monthly totals for the attendance trend chart
-- Athlete 1 — ~88% present
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(1, 1, '2026-03-03', 'present'), (1, 1, '2026-03-04', 'present'), (1, 1, '2026-03-05', 'absent'),
(1, 1, '2026-03-06', 'present'), (1, 1, '2026-03-07', 'present'), (1, 1, '2026-03-10', 'present'),
(1, 1, '2026-03-11', 'present'), (1, 1, '2026-03-12', 'present'), (1, 1, '2026-03-13', 'absent'),
(1, 1, '2026-03-14', 'present'), (1, 1, '2026-03-17', 'present'), (1, 1, '2026-03-18', 'present'),
(1, 1, '2026-03-19', 'present'), (1, 1, '2026-03-20', 'present'), (1, 1, '2026-03-21', 'absent'),
(1, 1, '2026-03-24', 'present'), (1, 1, '2026-03-25', 'present'), (1, 1, '2026-03-26', 'present'),
(1, 1, '2026-03-27', 'present'), (1, 1, '2026-03-28', 'present'),
(1, 1, '2026-04-01', 'present'), (1, 1, '2026-04-02', 'absent'),  (1, 1, '2026-04-03', 'present'),
(1, 1, '2026-04-04', 'present'), (1, 1, '2026-04-07', 'present'), (1, 1, '2026-04-08', 'present'),
(1, 1, '2026-04-09', 'present'), (1, 1, '2026-04-10', 'present'), (1, 1, '2026-04-11', 'absent'),
(1, 1, '2026-04-14', 'present'), (1, 1, '2026-04-15', 'present'), (1, 1, '2026-04-16', 'present'),
(1, 1, '2026-04-17', 'present'), (1, 1, '2026-04-22', 'present'), (1, 1, '2026-04-23', 'present'),
(1, 1, '2026-04-24', 'present'), (1, 1, '2026-04-25', 'absent'),  (1, 1, '2026-04-28', 'present'),
(1, 1, '2026-04-29', 'present'), (1, 1, '2026-04-30', 'present'),
(1, 1, '2026-05-05', 'present'), (1, 1, '2026-05-06', 'present'), (1, 1, '2026-05-07', 'absent'),
(1, 1, '2026-05-08', 'present'), (1, 1, '2026-05-09', 'present'), (1, 1, '2026-05-12', 'present'),
(1, 1, '2026-05-13', 'present'), (1, 1, '2026-05-14', 'present'), (1, 1, '2026-05-15', 'present'),
(1, 1, '2026-05-16', 'present'), (1, 1, '2026-05-19', 'absent'),  (1, 1, '2026-05-20', 'present'),
(1, 1, '2026-05-21', 'present'), (1, 1, '2026-05-22', 'present'), (1, 1, '2026-05-23', 'present'),
(1, 1, '2026-05-26', 'present'), (1, 1, '2026-05-27', 'present'), (1, 1, '2026-05-28', 'present'),
(1, 1, '2026-05-29', 'present'), (1, 1, '2026-05-30', 'present'),
(1, 1, '2026-06-02', 'present'), (1, 1, '2026-06-03', 'present'), (1, 1, '2026-06-04', 'present'),
(1, 1, '2026-06-05', 'absent'),  (1, 1, '2026-06-06', 'present'), (1, 1, '2026-06-09', 'present'),
(1, 1, '2026-06-10', 'present'), (1, 1, '2026-06-11', 'present'), (1, 1, '2026-06-12', 'present'),
(1, 1, '2026-06-13', 'present'), (1, 1, '2026-06-16', 'absent'),  (1, 1, '2026-06-17', 'present'),
(1, 1, '2026-06-18', 'present'), (1, 1, '2026-06-19', 'present'), (1, 1, '2026-06-20', 'present'),
(1, 1, '2026-06-23', 'present'), (1, 1, '2026-06-24', 'present'), (1, 1, '2026-06-25', 'present'),
(1, 1, '2026-06-26', 'present'), (1, 1, '2026-06-27', 'present'),
(1, 1, '2026-07-01', 'present'), (1, 1, '2026-07-02', 'present'), (1, 1, '2026-07-03', 'present'),
(1, 1, '2026-07-04', 'absent'),  (1, 1, '2026-07-07', 'present'), (1, 1, '2026-07-08', 'present'),
(1, 1, '2026-07-09', 'present'), (1, 1, '2026-07-10', 'present'), (1, 1, '2026-07-11', 'present'),
(1, 1, '2026-07-14', 'present'), (1, 1, '2026-07-15', 'present'), (1, 1, '2026-07-16', 'absent'),
(1, 1, '2026-07-17', 'present'), (1, 1, '2026-07-18', 'present'), (1, 1, '2026-07-21', 'present'),
(1, 1, '2026-07-22', 'present'), (1, 1, '2026-07-23', 'present'), (1, 1, '2026-07-24', 'present'),
(1, 1, '2026-07-25', 'present'), (1, 1, '2026-07-28', 'present'), (1, 1, '2026-07-29', 'present'),
(1, 1, '2026-07-30', 'present'), (1, 1, '2026-07-31', 'present'),
(1, 1, '2026-08-01', 'present'), (1, 1, '2026-08-04', 'present'), (1, 1, '2026-08-05', 'present'),
(1, 1, '2026-08-06', 'present'), (1, 1, '2026-08-07', 'absent'),  (1, 1, '2026-08-08', 'present');

-- Athlete 3 — ~85% present
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(3, 1, '2026-03-03', 'present'), (3, 1, '2026-03-04', 'absent'),  (3, 1, '2026-03-05', 'present'),
(3, 1, '2026-03-06', 'present'), (3, 1, '2026-03-07', 'present'), (3, 1, '2026-03-10', 'present'),
(3, 1, '2026-03-11', 'absent'),  (3, 1, '2026-03-12', 'present'), (3, 1, '2026-03-13', 'present'),
(3, 1, '2026-03-14', 'present'), (3, 1, '2026-03-17', 'present'), (3, 1, '2026-03-18', 'absent'),
(3, 1, '2026-03-19', 'present'), (3, 1, '2026-03-20', 'present'), (3, 1, '2026-03-21', 'present'),
(3, 1, '2026-03-24', 'present'), (3, 1, '2026-03-25', 'present'), (3, 1, '2026-03-26', 'absent'),
(3, 1, '2026-03-27', 'present'), (3, 1, '2026-03-28', 'present'),
(3, 1, '2026-04-01', 'present'), (3, 1, '2026-04-02', 'present'), (3, 1, '2026-04-03', 'absent'),
(3, 1, '2026-04-04', 'present'), (3, 1, '2026-04-07', 'present'), (3, 1, '2026-04-08', 'absent'),
(3, 1, '2026-04-09', 'present'), (3, 1, '2026-04-10', 'present'), (3, 1, '2026-04-11', 'present'),
(3, 1, '2026-04-14', 'present'), (3, 1, '2026-04-15', 'present'), (3, 1, '2026-04-16', 'absent'),
(3, 1, '2026-04-17', 'present'), (3, 1, '2026-04-22', 'present'), (3, 1, '2026-04-23', 'present'),
(3, 1, '2026-04-24', 'present'), (3, 1, '2026-04-25', 'present'), (3, 1, '2026-04-28', 'absent'),
(3, 1, '2026-04-29', 'present'), (3, 1, '2026-04-30', 'present'),
(3, 1, '2026-05-05', 'present'), (3, 1, '2026-05-06', 'present'), (3, 1, '2026-05-07', 'present'),
(3, 1, '2026-05-08', 'absent'),  (3, 1, '2026-05-09', 'present'), (3, 1, '2026-05-12', 'present'),
(3, 1, '2026-05-13', 'absent'),  (3, 1, '2026-05-14', 'present'), (3, 1, '2026-05-15', 'present'),
(3, 1, '2026-05-16', 'present'), (3, 1, '2026-05-19', 'present'), (3, 1, '2026-05-20', 'present'),
(3, 1, '2026-05-21', 'present'), (3, 1, '2026-05-22', 'absent'),  (3, 1, '2026-05-23', 'present'),
(3, 1, '2026-05-26', 'present'), (3, 1, '2026-05-27', 'present'), (3, 1, '2026-05-28', 'present'),
(3, 1, '2026-05-29', 'present'), (3, 1, '2026-05-30', 'present'),
(3, 1, '2026-06-02', 'present'), (3, 1, '2026-06-03', 'absent'),  (3, 1, '2026-06-04', 'present'),
(3, 1, '2026-06-05', 'present'), (3, 1, '2026-06-06', 'present'), (3, 1, '2026-06-09', 'absent'),
(3, 1, '2026-06-10', 'present'), (3, 1, '2026-06-11', 'present'), (3, 1, '2026-06-12', 'present'),
(3, 1, '2026-06-13', 'present'), (3, 1, '2026-06-16', 'present'), (3, 1, '2026-06-17', 'present'),
(3, 1, '2026-06-18', 'absent'),  (3, 1, '2026-06-19', 'present'), (3, 1, '2026-06-20', 'present'),
(3, 1, '2026-06-23', 'present'), (3, 1, '2026-06-24', 'present'), (3, 1, '2026-06-25', 'present'),
(3, 1, '2026-06-26', 'present'), (3, 1, '2026-06-27', 'absent'),
(3, 1, '2026-07-01', 'present'), (3, 1, '2026-07-02', 'present'), (3, 1, '2026-07-03', 'absent'),
(3, 1, '2026-07-04', 'present'), (3, 1, '2026-07-07', 'present'), (3, 1, '2026-07-08', 'present'),
(3, 1, '2026-07-09', 'absent'),  (3, 1, '2026-07-10', 'present'), (3, 1, '2026-07-11', 'present'),
(3, 1, '2026-07-14', 'present'), (3, 1, '2026-07-15', 'present'), (3, 1, '2026-07-16', 'present'),
(3, 1, '2026-07-17', 'absent'),  (3, 1, '2026-07-18', 'present'), (3, 1, '2026-07-21', 'present'),
(3, 1, '2026-07-22', 'present'), (3, 1, '2026-07-23', 'present'), (3, 1, '2026-07-24', 'present'),
(3, 1, '2026-07-25', 'present'), (3, 1, '2026-07-28', 'absent'),  (3, 1, '2026-07-29', 'present'),
(3, 1, '2026-07-30', 'present'), (3, 1, '2026-07-31', 'present'),
(3, 1, '2026-08-01', 'present'), (3, 1, '2026-08-04', 'present'), (3, 1, '2026-08-05', 'absent'),
(3, 1, '2026-08-06', 'present'), (3, 1, '2026-08-07', 'present'), (3, 1, '2026-08-08', 'present');

-- Athlete 2 — ~86% present
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(2, 2, '2026-03-03', 'present'), (2, 2, '2026-03-04', 'present'), (2, 2, '2026-03-05', 'present'),
(2, 2, '2026-03-06', 'absent'),  (2, 2, '2026-03-07', 'present'), (2, 2, '2026-03-10', 'present'),
(2, 2, '2026-03-11', 'present'), (2, 2, '2026-03-12', 'absent'),  (2, 2, '2026-03-13', 'present'),
(2, 2, '2026-03-14', 'present'), (2, 2, '2026-03-17', 'present'), (2, 2, '2026-03-18', 'present'),
(2, 2, '2026-03-19', 'absent'),  (2, 2, '2026-03-20', 'present'), (2, 2, '2026-03-21', 'present'),
(2, 2, '2026-03-24', 'present'), (2, 2, '2026-03-25', 'present'), (2, 2, '2026-03-26', 'present'),
(2, 2, '2026-03-27', 'present'), (2, 2, '2026-03-28', 'absent'),
(2, 2, '2026-04-01', 'present'), (2, 2, '2026-04-02', 'present'), (2, 2, '2026-04-03', 'present'),
(2, 2, '2026-04-04', 'absent'),  (2, 2, '2026-04-07', 'present'), (2, 2, '2026-04-08', 'present'),
(2, 2, '2026-04-09', 'present'), (2, 2, '2026-04-10', 'present'), (2, 2, '2026-04-11', 'absent'),
(2, 2, '2026-04-14', 'present'), (2, 2, '2026-04-15', 'present'), (2, 2, '2026-04-16', 'present'),
(2, 2, '2026-04-17', 'present'), (2, 2, '2026-04-22', 'absent'),  (2, 2, '2026-04-23', 'present'),
(2, 2, '2026-04-24', 'present'), (2, 2, '2026-04-25', 'present'), (2, 2, '2026-04-28', 'present'),
(2, 2, '2026-04-29', 'present'), (2, 2, '2026-04-30', 'absent'),
(2, 2, '2026-05-05', 'present'), (2, 2, '2026-05-06', 'present'), (2, 2, '2026-05-07', 'present'),
(2, 2, '2026-05-08', 'present'), (2, 2, '2026-05-09', 'absent'),  (2, 2, '2026-05-12', 'present'),
(2, 2, '2026-05-13', 'present'), (2, 2, '2026-05-14', 'present'), (2, 2, '2026-05-15', 'absent'),
(2, 2, '2026-05-16', 'present'), (2, 2, '2026-05-19', 'present'), (2, 2, '2026-05-20', 'present'),
(2, 2, '2026-05-21', 'present'), (2, 2, '2026-05-22', 'present'), (2, 2, '2026-05-23', 'absent'),
(2, 2, '2026-05-26', 'present'), (2, 2, '2026-05-27', 'present'), (2, 2, '2026-05-28', 'present'),
(2, 2, '2026-05-29', 'present'), (2, 2, '2026-05-30', 'present'),
(2, 2, '2026-06-02', 'present'), (2, 2, '2026-06-03', 'present'), (2, 2, '2026-06-04', 'absent'),
(2, 2, '2026-06-05', 'present'), (2, 2, '2026-06-06', 'present'), (2, 2, '2026-06-09', 'present'),
(2, 2, '2026-06-10', 'absent'),  (2, 2, '2026-06-11', 'present'), (2, 2, '2026-06-12', 'present'),
(2, 2, '2026-06-13', 'present'), (2, 2, '2026-06-16', 'present'), (2, 2, '2026-06-17', 'absent'),
(2, 2, '2026-06-18', 'present'), (2, 2, '2026-06-19', 'present'), (2, 2, '2026-06-20', 'present'),
(2, 2, '2026-06-23', 'present'), (2, 2, '2026-06-24', 'present'), (2, 2, '2026-06-25', 'absent'),
(2, 2, '2026-06-26', 'present'), (2, 2, '2026-06-27', 'present'),
(2, 2, '2026-07-01', 'present'), (2, 2, '2026-07-02', 'present'), (2, 2, '2026-07-03', 'present'),
(2, 2, '2026-07-04', 'present'), (2, 2, '2026-07-07', 'absent'),  (2, 2, '2026-07-08', 'present'),
(2, 2, '2026-07-09', 'present'), (2, 2, '2026-07-10', 'present'), (2, 2, '2026-07-11', 'present'),
(2, 2, '2026-07-14', 'present'), (2, 2, '2026-07-15', 'absent'),  (2, 2, '2026-07-16', 'present'),
(2, 2, '2026-07-17', 'present'), (2, 2, '2026-07-18', 'present'), (2, 2, '2026-07-21', 'present'),
(2, 2, '2026-07-22', 'present'), (2, 2, '2026-07-23', 'absent'),  (2, 2, '2026-07-24', 'present'),
(2, 2, '2026-07-25', 'present'), (2, 2, '2026-07-28', 'present'), (2, 2, '2026-07-29', 'present'),
(2, 2, '2026-07-30', 'present'), (2, 2, '2026-07-31', 'absent'),
(2, 2, '2026-08-01', 'present'), (2, 2, '2026-08-04', 'present'), (2, 2, '2026-08-05', 'present'),
(2, 2, '2026-08-06', 'absent'),  (2, 2, '2026-08-07', 'present'), (2, 2, '2026-08-08', 'present');

-- Athlete 4 — ~84% present
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(4, 2, '2026-03-03', 'present'), (4, 2, '2026-03-04', 'absent'),  (4, 2, '2026-03-05', 'present'),
(4, 2, '2026-03-06', 'present'), (4, 2, '2026-03-07', 'absent'),  (4, 2, '2026-03-10', 'present'),
(4, 2, '2026-03-11', 'present'), (4, 2, '2026-03-12', 'present'), (4, 2, '2026-03-13', 'absent'),
(4, 2, '2026-03-14', 'present'), (4, 2, '2026-03-17', 'present'), (4, 2, '2026-03-18', 'present'),
(4, 2, '2026-03-19', 'absent'),  (4, 2, '2026-03-20', 'present'), (4, 2, '2026-03-21', 'present'),
(4, 2, '2026-03-24', 'present'), (4, 2, '2026-03-25', 'present'), (4, 2, '2026-03-26', 'absent'),
(4, 2, '2026-03-27', 'present'), (4, 2, '2026-03-28', 'present'),
(4, 2, '2026-04-01', 'present'), (4, 2, '2026-04-02', 'absent'),  (4, 2, '2026-04-03', 'present'),
(4, 2, '2026-04-04', 'present'), (4, 2, '2026-04-07', 'present'), (4, 2, '2026-04-08', 'absent'),
(4, 2, '2026-04-09', 'present'), (4, 2, '2026-04-10', 'present'), (4, 2, '2026-04-11', 'present'),
(4, 2, '2026-04-14', 'absent'),  (4, 2, '2026-04-15', 'present'), (4, 2, '2026-04-16', 'present'),
(4, 2, '2026-04-17', 'present'), (4, 2, '2026-04-22', 'present'), (4, 2, '2026-04-23', 'absent'),
(4, 2, '2026-04-24', 'present'), (4, 2, '2026-04-25', 'present'), (4, 2, '2026-04-28', 'present'),
(4, 2, '2026-04-29', 'present'), (4, 2, '2026-04-30', 'absent'),
(4, 2, '2026-05-05', 'present'), (4, 2, '2026-05-06', 'present'), (4, 2, '2026-05-07', 'absent'),
(4, 2, '2026-05-08', 'present'), (4, 2, '2026-05-09', 'present'), (4, 2, '2026-05-12', 'absent'),
(4, 2, '2026-05-13', 'present'), (4, 2, '2026-05-14', 'present'), (4, 2, '2026-05-15', 'present'),
(4, 2, '2026-05-16', 'absent'),  (4, 2, '2026-05-19', 'present'), (4, 2, '2026-05-20', 'present'),
(4, 2, '2026-05-21', 'present'), (4, 2, '2026-05-22', 'present'), (4, 2, '2026-05-23', 'present'),
(4, 2, '2026-05-26', 'absent'),  (4, 2, '2026-05-27', 'present'), (4, 2, '2026-05-28', 'present'),
(4, 2, '2026-05-29', 'present'), (4, 2, '2026-05-30', 'present'),
(4, 2, '2026-06-02', 'present'), (4, 2, '2026-06-03', 'present'), (4, 2, '2026-06-04', 'absent'),
(4, 2, '2026-06-05', 'present'), (4, 2, '2026-06-06', 'present'), (4, 2, '2026-06-09', 'absent'),
(4, 2, '2026-06-10', 'present'), (4, 2, '2026-06-11', 'present'), (4, 2, '2026-06-12', 'absent'),
(4, 2, '2026-06-13', 'present'), (4, 2, '2026-06-16', 'present'), (4, 2, '2026-06-17', 'present'),
(4, 2, '2026-06-18', 'present'), (4, 2, '2026-06-19', 'absent'),  (4, 2, '2026-06-20', 'present'),
(4, 2, '2026-06-23', 'present'), (4, 2, '2026-06-24', 'present'), (4, 2, '2026-06-25', 'present'),
(4, 2, '2026-06-26', 'absent'),  (4, 2, '2026-06-27', 'present'),
(4, 2, '2026-07-01', 'present'), (4, 2, '2026-07-02', 'absent'),  (4, 2, '2026-07-03', 'present'),
(4, 2, '2026-07-04', 'present'), (4, 2, '2026-07-07', 'present'), (4, 2, '2026-07-08', 'absent'),
(4, 2, '2026-07-09', 'present'), (4, 2, '2026-07-10', 'present'), (4, 2, '2026-07-11', 'present'),
(4, 2, '2026-07-14', 'absent'),  (4, 2, '2026-07-15', 'present'), (4, 2, '2026-07-16', 'present'),
(4, 2, '2026-07-17', 'present'), (4, 2, '2026-07-18', 'absent'),  (4, 2, '2026-07-21', 'present'),
(4, 2, '2026-07-22', 'present'), (4, 2, '2026-07-23', 'present'), (4, 2, '2026-07-24', 'present'),
(4, 2, '2026-07-25', 'absent'),  (4, 2, '2026-07-28', 'present'), (4, 2, '2026-07-29', 'present'),
(4, 2, '2026-07-30', 'present'), (4, 2, '2026-07-31', 'present'),
(4, 2, '2026-08-01', 'absent'),  (4, 2, '2026-08-04', 'present'), (4, 2, '2026-08-05', 'present'),
(4, 2, '2026-08-06', 'present'), (4, 2, '2026-08-07', 'present'), (4, 2, '2026-08-08', 'absent');

-- Athlete 5 — ~87% present
INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(5, 3, '2026-03-03', 'present'), (5, 3, '2026-03-04', 'present'), (5, 3, '2026-03-05', 'absent'),
(5, 3, '2026-03-06', 'present'), (5, 3, '2026-03-07', 'present'), (5, 3, '2026-03-10', 'present'),
(5, 3, '2026-03-11', 'absent'),  (5, 3, '2026-03-12', 'present'), (5, 3, '2026-03-13', 'present'),
(5, 3, '2026-03-14', 'present'), (5, 3, '2026-03-17', 'present'), (5, 3, '2026-03-18', 'present'),
(5, 3, '2026-03-19', 'absent'),  (5, 3, '2026-03-20', 'present'), (5, 3, '2026-03-21', 'present'),
(5, 3, '2026-03-24', 'present'), (5, 3, '2026-03-25', 'present'), (5, 3, '2026-03-26', 'present'),
(5, 3, '2026-03-27', 'absent'),  (5, 3, '2026-03-28', 'present'),
(5, 3, '2026-04-01', 'present'), (5, 3, '2026-04-02', 'present'), (5, 3, '2026-04-03', 'present'),
(5, 3, '2026-04-04', 'absent'),  (5, 3, '2026-04-07', 'present'), (5, 3, '2026-04-08', 'present'),
(5, 3, '2026-04-09', 'absent'),  (5, 3, '2026-04-10', 'present'), (5, 3, '2026-04-11', 'present'),
(5, 3, '2026-04-14', 'present'), (5, 3, '2026-04-15', 'present'), (5, 3, '2026-04-16', 'absent'),
(5, 3, '2026-04-17', 'present'), (5, 3, '2026-04-22', 'present'), (5, 3, '2026-04-23', 'present'),
(5, 3, '2026-04-24', 'present'), (5, 3, '2026-04-25', 'absent'),  (5, 3, '2026-04-28', 'present'),
(5, 3, '2026-04-29', 'present'), (5, 3, '2026-04-30', 'present'),
(5, 3, '2026-05-05', 'present'), (5, 3, '2026-05-06', 'absent'),  (5, 3, '2026-05-07', 'present'),
(5, 3, '2026-05-08', 'present'), (5, 3, '2026-05-09', 'present'), (5, 3, '2026-05-12', 'absent'),
(5, 3, '2026-05-13', 'present'), (5, 3, '2026-05-14', 'present'), (5, 3, '2026-05-15', 'present'),
(5, 3, '2026-05-16', 'present'), (5, 3, '2026-05-19', 'absent'),  (5, 3, '2026-05-20', 'present'),
(5, 3, '2026-05-21', 'present'), (5, 3, '2026-05-22', 'present'), (5, 3, '2026-05-23', 'present'),
(5, 3, '2026-05-26', 'present'), (5, 3, '2026-05-27', 'absent'),  (5, 3, '2026-05-28', 'present'),
(5, 3, '2026-05-29', 'present'), (5, 3, '2026-05-30', 'present'),
(5, 3, '2026-06-02', 'present'), (5, 3, '2026-06-03', 'present'), (5, 3, '2026-06-04', 'present'),
(5, 3, '2026-06-05', 'absent'),  (5, 3, '2026-06-06', 'present'), (5, 3, '2026-06-09', 'present'),
(5, 3, '2026-06-10', 'present'), (5, 3, '2026-06-11', 'absent'),  (5, 3, '2026-06-12', 'present'),
(5, 3, '2026-06-13', 'present'), (5, 3, '2026-06-16', 'present'), (5, 3, '2026-06-17', 'present'),
(5, 3, '2026-06-18', 'present'), (5, 3, '2026-06-19', 'absent'),  (5, 3, '2026-06-20', 'present'),
(5, 3, '2026-06-23', 'present'), (5, 3, '2026-06-24', 'present'), (5, 3, '2026-06-25', 'present'),
(5, 3, '2026-06-26', 'present'), (5, 3, '2026-06-27', 'present'),
(5, 3, '2026-07-01', 'present'), (5, 3, '2026-07-02', 'present'), (5, 3, '2026-07-03', 'absent'),
(5, 3, '2026-07-04', 'present'), (5, 3, '2026-07-07', 'present'), (5, 3, '2026-07-08', 'present'),
(5, 3, '2026-07-09', 'absent'),  (5, 3, '2026-07-10', 'present'), (5, 3, '2026-07-11', 'present'),
(5, 3, '2026-07-14', 'present'), (5, 3, '2026-07-15', 'present'), (5, 3, '2026-07-16', 'absent'),
(5, 3, '2026-07-17', 'present'), (5, 3, '2026-07-18', 'present'), (5, 3, '2026-07-21', 'present'),
(5, 3, '2026-07-22', 'present'), (5, 3, '2026-07-23', 'present'), (5, 3, '2026-07-24', 'absent'),
(5, 3, '2026-07-25', 'present'), (5, 3, '2026-07-28', 'present'), (5, 3, '2026-07-29', 'present'),
(5, 3, '2026-07-30', 'present'), (5, 3, '2026-07-31', 'present'),
(5, 3, '2026-08-01', 'present'), (5, 3, '2026-08-04', 'absent'),  (5, 3, '2026-08-05', 'present'),
(5, 3, '2026-08-06', 'present'), (5, 3, '2026-08-07', 'present'), (5, 3, '2026-08-08', 'present');

-- ── Additional Coach Remarks for 2026 period ──────────────────
INSERT INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks) VALUES
(1, 1, '2026-03-15', 'performance', 7.5, 'Good start to the season. Needs to work on starting block technique.'),
(1, 1, '2026-05-15', 'performance', 8.5, 'Sprint times improving consistently. On track for state trials.'),
(1, 1, '2026-07-15', 'performance', 9.2, 'Outstanding sprint performance. Ready for national-level competition.'),
(3, 1, '2026-03-20', 'performance', 7.0, 'Recovery from hamstring strain progressing. Light training only.'),
(3, 1, '2026-05-20', 'fitness',     8.0, 'Fitness levels fully restored. 200m times improving well.'),
(3, 1, '2026-07-20', 'performance', 8.8, 'Peak performance achieved. Consistent improvement throughout season.'),
(2, 2, '2026-03-15', 'fitness',     7.2, 'Good endurance base. Needs more work on flip turns.'),
(2, 2, '2026-06-15', 'performance', 8.5, 'Freestyle times excellent. Ready for state selection trials.'),
(4, 2, '2026-04-18', 'general',     7.5, 'Consistent training attendance. Backstroke technique improving.'),
(4, 2, '2026-07-18', 'performance', 8.2, 'Strong season performance. Backstroke times at personal best.'),
(5, 3, '2026-03-10', 'general',     7.0, 'Solid season start. Focus on shooting accuracy needed.'),
(5, 3, '2026-07-10', 'performance', 8.6, 'Excellent goal-scoring record this season. Strong team player.');

-- ── Updated Rankings for 2026 ─────────────────────────────────
INSERT INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date) VALUES
(1, 1, 3, 1, 89.2, 89.2, 88.0, 89.00, 'sport',   '2026-08-01'),
(3, 1, 5, 2, 89.0, 88.6, 86.0, 88.30, 'sport',   '2026-08-01'),
(2, 2, 14,1, 88.4, 87.6, 87.0, 87.80, 'sport',   '2026-08-01'),
(4, 2, 13,2, 88.0, 86.0, 85.0, 86.50, 'sport',   '2026-08-01'),
(5, 3, 9, 1, 89.0, 87.5, 86.0, 87.80, 'sport',   '2026-08-01'),
(1, 1, 3, 1, 89.2, 89.2, 88.0, 89.00, 'overall', '2026-08-01'),
(3, 1, 5, 2, 89.0, 88.6, 86.0, 88.30, 'overall', '2026-08-01'),
(2, 2, 14,3, 88.4, 87.6, 87.0, 87.80, 'overall', '2026-08-01'),
(5, 3, 9, 4, 89.0, 87.5, 86.0, 87.80, 'overall', '2026-08-01'),
(4, 2, 13,5, 88.0, 86.0, 85.0, 86.50, 'overall', '2026-08-01');

