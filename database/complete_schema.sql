-- ============================================================
-- COMPLETE ACADEMY SCHEMA & SEED DATA (v2)
-- All tables created natively without ALTER TABLE statements.
-- ============================================================

CREATE DATABASE IF NOT EXISTS sports_acadmey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
-- SPORT METRICS
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
-- PERFORMANCE RECORDS
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
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
);

-- ============================================================
-- FITNESS ASSESSMENTS
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
    bmi DECIMAL(5,2),
    overall_fitness_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    coach_id INT UNSIGNED,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave') DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_athlete_date (athlete_id, attendance_date),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- ============================================================
-- INJURIES
-- ============================================================
CREATE TABLE IF NOT EXISTS injuries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT UNSIGNED NOT NULL,
    injury_type VARCHAR(200) NOT NULL,
    injury_date DATE NOT NULL,
    body_part VARCHAR(100),
    severity ENUM('minor', 'moderate', 'severe') DEFAULT 'minor',
    recovery_date DATE,
    recovery_status ENUM('recovering', 'recovered', 'chronic') DEFAULT 'recovering',
    is_available BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
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
-- COACH REMARKS
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
-- SEED DATA
-- ============================================================

INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'admin', 'System Administrator with full access'),
(2, 'coach', 'Coach who manages and trains athletes'),
(3, 'selector', 'Selector who evaluates and selects athletes'),
(4, 'athlete', 'Athlete registered in the academy');

INSERT IGNORE INTO users (id, role_id, username, email, password_hash, first_name, last_name, phone, is_active) VALUES
(1, 1, 'admin', 'admin@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Super', 'Admin', '+91-9876543210', TRUE),
(2, 2, 'coach.rajesh', 'rajesh.kumar@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Rajesh', 'Kumar', '+91-9876543211', TRUE),
(3, 2, 'coach.priya', 'priya.sharma@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Priya', 'Sharma', '+91-9876543212', TRUE),
(4, 2, 'coach.arun', 'arun.verma@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arun', 'Verma', '+91-9876543213', TRUE),
(5, 3, 'selector.vikram', 'vikram.singh@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Vikram', 'Singh', '+91-9876543214', TRUE),
(6, 3, 'selector.meera', 'meera.reddy@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Meera', 'Reddy', '+91-9876543215', TRUE),
(7, 4, 'athlete.arjun', 'arjun.nair@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Arjun', 'Nair', '+91-9876543216', TRUE),
(8, 4, 'athlete.sneha', 'sneha.patel@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Sneha', 'Patel', '+91-9876543217', TRUE),
(9, 4, 'athlete.rohit', 'rohit.sharma@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Rohit', 'Sharma', '+91-9876543218', TRUE),
(10, 4, 'athlete.kavya', 'kavya.menon@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kavya', 'Menon', '+91-9876543219', TRUE),
(11, 4, 'athlete.kiran', 'kiran.rao@sportsacademy.com', '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u', 'Kiran', 'Rao', '+91-9876543220', TRUE);

INSERT IGNORE INTO sports (id, name, description, icon, is_active) VALUES
(1, 'Athletics', 'Track and field events', 'run', TRUE),
(2, 'Swimming', 'Aquatic sports and events', 'waves', TRUE),
(3, 'Football', 'Association football / Soccer', 'circle', TRUE),
(4, 'Cricket', 'Bat and ball sport', 'target', TRUE),
(5, 'Badminton', 'Racquet sport', 'zap', TRUE),
(6, 'Wrestling', 'Combat sport', 'shield', TRUE),
(7, 'Boxing', 'Combat sport with gloves', 'shield', TRUE),
(8, 'Gymnastics', 'Artistic gymnastics', 'star', TRUE),
(9, 'Volleyball', 'Net sport', 'circle', TRUE),
(10, 'Table Tennis', 'Racquet sport', 'zap', TRUE);

INSERT IGNORE INTO age_groups (name, age_min, age_max, description) VALUES
  ('Sub-Junior', 10, 14, 'Sub-junior category'),
  ('Junior', 15, 18, 'Junior category'),
  ('Senior', 19, 25, 'Senior category'),
  ('Open', 19, 99, 'Open / general category');

INSERT IGNORE INTO gender_categories (name, code) VALUES
  ('Male', 'M'),
  ('Female', 'F'),
  ('Mixed', 'MX');

INSERT IGNORE INTO categories (id, sport_id, name, age_min, age_max, gender, is_active) VALUES
(1, 1, 'U-14 Boys', 12, 14, 'male', TRUE),
(2, 1, 'U-14 Girls', 12, 14, 'female', TRUE),
(3, 1, 'U-17 Boys', 14, 17, 'male', TRUE),
(4, 1, 'U-17 Girls', 14, 17, 'female', TRUE),
(5, 1, 'U-19 Boys', 17, 19, 'male', TRUE),
(6, 1, 'U-19 Girls', 17, 19, 'female', TRUE),
(7, 1, 'Senior Men', 19, 40, 'male', TRUE),
(8, 1, 'Senior Women', 19, 40, 'female', TRUE),
(9, 3, 'U-17 Boys', 14, 17, 'male', TRUE),
(10, 3, 'U-19 Boys', 17, 19, 'male', TRUE),
(11, 4, 'U-17 Boys', 14, 17, 'male', TRUE),
(12, 4, 'U-19 Boys', 17, 19, 'male', TRUE),
(13, 2, 'U-14 Mixed', 12, 14, 'mixed', TRUE),
(14, 2, 'U-17 Mixed', 14, 17, 'mixed', TRUE),
(15, 5, 'U-17 Mixed', 14, 17, 'mixed', TRUE);

INSERT IGNORE INTO coaches (id, user_id, sport_id, qualification, experience_years, specialization) VALUES
(1, 2, 1, 'NIS Diploma in Athletics', 12, 'Sprint & Track Events'),
(2, 3, 2, 'NIS Diploma in Swimming', 8, 'Freestyle & Backstroke'),
(3, 4, 3, 'UEFA B License', 10, 'Youth Football Development');

INSERT IGNORE INTO selectors (id, user_id, designation, organization) VALUES
(1, 5, 'Chief Selector', 'State Sports Authority'),
(2, 6, 'Senior Selector', 'State Sports Authority');

INSERT IGNORE INTO athletes (id, user_id, coach_id, sport_id, category_id, athlete_code, date_of_birth, gender, height_cm, weight_kg, blood_group, city, state, registration_date) VALUES
(1, 7, 1, 1, 3, 'ATH-2024-001', '2008-05-15', 'male', 172.50, 62.00, 'B+', 'Chennai', 'Tamil Nadu', '2024-01-10'),
(2, 8, 2, 2, 14, 'ATH-2024-002', '2007-09-22', 'female', 165.00, 55.00, 'O+', 'Bangalore', 'Karnataka', '2024-01-15'),
(3, 9, 1, 1, 5, 'ATH-2024-003', '2005-03-08', 'male', 178.00, 68.50, 'A+', 'Hyderabad', 'Telangana', '2024-01-20'),
(4, 10, 2, 2, 13, 'ATH-2024-004', '2009-11-30', 'female', 158.00, 48.00, 'AB+', 'Kochi', 'Kerala', '2024-02-01'),
(5, 11, 3, 3, 9, 'ATH-2024-005', '2007-07-18', 'male', 170.00, 65.00, 'O-', 'Mumbai', 'Maharashtra', '2024-02-10');

INSERT IGNORE INTO performance_records (athlete_id, coach_id, sport_id, record_date, metric_name, metric_value, metric_unit, performance_score) VALUES
(1, 1, 1, '2024-01-15', '100m Sprint', 11.52, 'seconds', 78.50),
(1, 1, 1, '2024-02-15', '100m Sprint', 11.38, 'seconds', 81.20),
(1, 1, 1, '2024-03-15', '100m Sprint', 11.20, 'seconds', 84.00),
(1, 1, 1, '2024-04-15', '100m Sprint', 11.05, 'seconds', 86.50),
(1, 1, 1, '2024-05-15', '100m Sprint', 10.95, 'seconds', 88.20),
(1, 1, 1, '2024-06-15', '100m Sprint', 10.82, 'seconds', 90.50),
(2, 2, 2, '2024-01-20', '100m Freestyle', 68.50, 'seconds', 76.00),
(2, 2, 2, '2024-02-20', '100m Freestyle', 66.80, 'seconds', 79.50),
(2, 2, 2, '2024-03-20', '100m Freestyle', 65.20, 'seconds', 82.00),
(2, 2, 2, '2024-04-20', '100m Freestyle', 63.90, 'seconds', 84.50),
(2, 2, 2, '2024-05-20', '100m Freestyle', 62.50, 'seconds', 87.00),
(3, 1, 1, '2024-01-25', '200m Sprint', 23.80, 'seconds', 80.00),
(3, 1, 1, '2024-03-25', '200m Sprint', 23.10, 'seconds', 84.50),
(3, 1, 1, '2024-05-25', '200m Sprint', 22.65, 'seconds', 88.00),
(5, 3, 3, '2024-02-01', 'Goals Scored', 8.00, 'goals', 75.00),
(5, 3, 3, '2024-03-01', 'Goals Scored', 11.00, 'goals', 82.00),
(5, 3, 3, '2024-04-01', 'Goals Scored', 14.00, 'goals', 87.50);

INSERT IGNORE INTO fitness_assessments (athlete_id, coach_id, assessment_date, strength_score, endurance_score, stamina_score, flexibility_score, agility_score, bmi, overall_fitness_score) VALUES
(1, 1, '2024-01-15', 75.00, 80.00, 82.00, 70.00, 85.00, 20.80, 78.40),
(1, 1, '2024-03-15', 80.00, 85.00, 86.00, 75.00, 88.00, 20.60, 82.80),
(1, 1, '2024-05-15', 85.00, 88.00, 90.00, 80.00, 92.00, 20.50, 87.00),
(2, 2, '2024-01-20', 65.00, 85.00, 80.00, 88.00, 75.00, 20.20, 78.60),
(2, 2, '2024-03-20', 70.00, 88.00, 84.00, 90.00, 79.00, 20.00, 82.20),
(2, 2, '2024-05-20', 74.00, 91.00, 87.00, 92.00, 82.00, 19.90, 85.20),
(3, 1, '2024-01-25', 82.00, 78.00, 80.00, 72.00, 84.00, 21.60, 79.20),
(3, 1, '2024-03-25', 87.00, 83.00, 85.00, 77.00, 88.00, 21.40, 84.00),
(3, 1, '2024-05-25', 91.00, 87.00, 89.00, 82.00, 91.00, 21.20, 88.00),
(5, 3, '2024-02-01', 78.00, 82.00, 79.00, 75.00, 86.00, 22.50, 80.00),
(5, 3, '2024-04-01', 83.00, 86.00, 84.00, 79.00, 89.00, 22.20, 84.20);

INSERT IGNORE INTO attendance (athlete_id, coach_id, attendance_date, status) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'absent'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'leave'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present'),
(5, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'absent');

INSERT IGNORE INTO injuries (athlete_id, injury_type, injury_date, body_part, severity, recovery_status, is_available) VALUES
(3, 'Hamstring Strain', '2024-05-10', 'Left Hamstring', 'moderate', 'recovering', FALSE),
(4, 'Shoulder Sprain', '2024-04-20', 'Right Shoulder', 'minor', 'recovered', TRUE);

INSERT IGNORE INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date) VALUES
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'sport', CURDATE()),
(3, 1, 5, 1, 88.00, 88.00, 84.00, 87.20, 'sport', CURDATE()),
(2, 2, 14, 1, 87.00, 85.20, 82.00, 85.46, 'sport', CURDATE()),
(5, 3, 9, 1, 87.50, 84.20, 80.00, 84.85, 'sport', CURDATE()),
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'overall', CURDATE()),
(3, 1, 5, 2, 88.00, 88.00, 84.00, 87.20, 'overall', CURDATE());

INSERT IGNORE INTO selections (athlete_id, selector_id, selection_type, selection_date, performance_score, fitness_score, attendance_score, coach_rating, selection_score, confidence_score, status, remarks) VALUES
(1, 1, 'State Selection', '2024-06-01', 90.50, 87.00, 92.00, 88.00, 89.50, 91.00, 'selected', 'Outstanding sprint performance'),
(2, 1, 'National Camp', '2024-06-05', 87.00, 85.20, 88.00, 86.00, 86.50, 88.00, 'recommended', 'Strong swimming potential'),
(3, 2, 'State Selection', '2024-06-10', 88.00, 88.00, 85.00, 87.00, 87.50, 85.00, 'pending', 'Pending fitness clearance after injury');

INSERT IGNORE INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks) VALUES
(1, 1, '2024-06-01', 'performance', 9.0, 'Excellent improvement in sprint timing. Ready for state trials.'),
(2, 2, '2024-06-02', 'fitness', 8.5, 'Good endurance. Needs more strength training.'),
(3, 1, '2024-06-03', 'general', 7.5, 'Recovering from hamstring strain. Light training only.');

INSERT IGNORE INTO notifications (user_id, title, message, type) VALUES
(1, 'System Initialized', 'Sports Academy Management System is ready.', 'success'),
(2, 'New Athlete Assigned', 'Athlete Arjun Nair has been assigned to your training group.', 'info'),
(5, 'Ranking Updated', 'New athlete rankings have been computed for this month.', 'info'),
(7, 'Fitness Assessment Due', 'Your next fitness assessment is scheduled for next week.', 'warning');
