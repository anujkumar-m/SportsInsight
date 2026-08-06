-- ============================================================
-- Sports Academy — Schema Additions (Prompt 2)
-- Adds: Athlete extended tables, Coach extended tables,
--       Selector extended tables, Sport metrics, Categories+
-- Run AFTER schema.sql (Prompt 1)
-- ============================================================

USE sports_acadmey;

-- ============================================================
-- SPORT METRICS (dynamic, configurable per sport)
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
-- ATHLETE HISTORY (timeline/audit trail)
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
-- COACH ASSIGNMENTS
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
-- COACH HISTORY
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
-- Extend athletes table with extra columns
-- ============================================================
ALTER TABLE athletes
    ADD COLUMN academy_name VARCHAR(255) AFTER state,
    ADD COLUMN district VARCHAR(100) AFTER state,
    ADD COLUMN joining_date DATE AFTER registration_date,
    ADD COLUMN medical_status ENUM('fit','unfit','injured','under_observation') DEFAULT 'fit' AFTER joining_date,
    ADD COLUMN current_status ENUM('active','inactive','archived','transferred') DEFAULT 'active' AFTER medical_status,
    ADD COLUMN archived_at TIMESTAMP NULL AFTER current_status,
    ADD COLUMN archived_by INT UNSIGNED AFTER archived_at;

-- ============================================================
-- Extend coaches table
-- ============================================================
ALTER TABLE coaches
    ADD COLUMN coach_code VARCHAR(50) UNIQUE AFTER id,
    ADD COLUMN date_of_birth DATE AFTER coach_code,
    ADD COLUMN gender ENUM('male','female','other') AFTER date_of_birth,
    ADD COLUMN address TEXT AFTER gender,
    ADD COLUMN joining_date DATE AFTER address,
    ADD COLUMN current_status ENUM('active','inactive','archived') DEFAULT 'active' AFTER is_active;

-- ============================================================
-- Extend selectors table
-- ============================================================
ALTER TABLE selectors
    ADD COLUMN selector_code VARCHAR(50) UNIQUE AFTER id,
    ADD COLUMN sport_expertise VARCHAR(255) AFTER organization,
    ADD COLUMN years_experience INT DEFAULT 0 AFTER sport_expertise;

-- ============================================================
-- DEFAULT SEED — Sport Metrics for common sports
-- ============================================================
INSERT IGNORE INTO sports (name, description, icon) VALUES
  ('Football', 'Association football / soccer', 'football'),
  ('Cricket', 'Cricket - bat and ball sport', 'cricket'),
  ('Athletics', 'Track and field athletics', 'athletics'),
  ('Swimming', 'Competitive swimming', 'swimming'),
  ('Badminton', 'Racket sport', 'badminton'),
  ('Basketball', 'Team basket ball', 'basketball'),
  ('Volleyball', 'Team volleyball', 'volleyball'),
  ('Wrestling', 'Combat wrestling', 'wrestling'),
  ('Kabaddi', 'Contact team sport', 'kabaddi'),
  ('Gymnastics', 'Artistic gymnastics', 'gymnastics');

-- Age Groups
INSERT IGNORE INTO age_groups (name, age_min, age_max, description) VALUES
  ('Sub-Junior', 10, 14, 'Sub-junior category'),
  ('Junior', 15, 18, 'Junior category'),
  ('Senior', 19, 25, 'Senior category'),
  ('Open', 19, 99, 'Open / general category');

-- Gender Categories
INSERT IGNORE INTO gender_categories (name, code) VALUES
  ('Male', 'M'),
  ('Female', 'F'),
  ('Mixed', 'MX');
