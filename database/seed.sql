-- ============================================================
-- Integrated Athlete Performance Monitoring System
-- Seed Data — Run AFTER schema.sql in MySQL Workbench
-- Database: sports_acadmey
-- Default password for all users: Admin@123
-- ============================================================

USE sports_acadmey;

-- Roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'admin', 'System Administrator with full access'),
(2, 'coach', 'Coach who manages and trains athletes'),
(3, 'selector', 'Selector who evaluates and selects athletes'),
(4, 'athlete', 'Athlete registered in the academy');

-- Users (password hash = Admin@123)
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

-- Sports
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

-- Categories
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

-- Coaches
INSERT IGNORE INTO coaches (id, user_id, sport_id, qualification, experience_years, specialization) VALUES
(1, 2, 1, 'NIS Diploma in Athletics', 12, 'Sprint & Track Events'),
(2, 3, 2, 'NIS Diploma in Swimming', 8, 'Freestyle & Backstroke'),
(3, 4, 3, 'UEFA B License', 10, 'Youth Football Development');

-- Selectors
INSERT IGNORE INTO selectors (id, user_id, designation, organization) VALUES
(1, 5, 'Chief Selector', 'State Sports Authority'),
(2, 6, 'Senior Selector', 'State Sports Authority');

-- Athletes
INSERT IGNORE INTO athletes (id, user_id, coach_id, sport_id, category_id, athlete_code, date_of_birth, gender, height_cm, weight_kg, blood_group, city, state, registration_date) VALUES
(1, 7, 1, 1, 3, 'ATH-2024-001', '2008-05-15', 'male', 172.50, 62.00, 'B+', 'Chennai', 'Tamil Nadu', '2024-01-10'),
(2, 8, 2, 2, 14, 'ATH-2024-002', '2007-09-22', 'female', 165.00, 55.00, 'O+', 'Bangalore', 'Karnataka', '2024-01-15'),
(3, 9, 1, 1, 5, 'ATH-2024-003', '2005-03-08', 'male', 178.00, 68.50, 'A+', 'Hyderabad', 'Telangana', '2024-01-20'),
(4, 10, 2, 2, 13, 'ATH-2024-004', '2009-11-30', 'female', 158.00, 48.00, 'AB+', 'Kochi', 'Kerala', '2024-02-01'),
(5, 11, 3, 3, 9, 'ATH-2024-005', '2007-07-18', 'male', 170.00, 65.00, 'O-', 'Mumbai', 'Maharashtra', '2024-02-10');

-- Performance Records
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

-- Fitness Assessments
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

-- Attendance (recent days)
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

-- Injuries
INSERT IGNORE INTO injuries (athlete_id, injury_type, injury_date, body_part, severity, recovery_status, is_available) VALUES
(3, 'Hamstring Strain', '2024-05-10', 'Left Hamstring', 'moderate', 'recovering', FALSE),
(4, 'Shoulder Sprain', '2024-04-20', 'Right Shoulder', 'minor', 'recovered', TRUE);

-- Rankings
INSERT IGNORE INTO rankings (athlete_id, sport_id, category_id, rank_position, performance_score, fitness_score, consistency_score, overall_ranking_score, rank_type, rank_date) VALUES
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'sport', CURDATE()),
(3, 1, 5, 1, 88.00, 88.00, 84.00, 87.20, 'sport', CURDATE()),
(2, 2, 14, 1, 87.00, 85.20, 82.00, 85.46, 'sport', CURDATE()),
(5, 3, 9, 1, 87.50, 84.20, 80.00, 84.85, 'sport', CURDATE()),
(1, 1, 3, 1, 90.50, 87.00, 85.00, 88.85, 'overall', CURDATE()),
(3, 1, 5, 2, 88.00, 88.00, 84.00, 87.20, 'overall', CURDATE());

-- Selections
INSERT IGNORE INTO selections (athlete_id, selector_id, selection_type, selection_date, performance_score, fitness_score, attendance_score, coach_rating, selection_score, confidence_score, status, remarks) VALUES
(1, 1, 'State Selection', '2024-06-01', 90.50, 87.00, 92.00, 88.00, 89.50, 91.00, 'selected', 'Outstanding sprint performance'),
(2, 1, 'National Camp', '2024-06-05', 87.00, 85.20, 88.00, 86.00, 86.50, 88.00, 'recommended', 'Strong swimming potential'),
(3, 2, 'State Selection', '2024-06-10', 88.00, 88.00, 85.00, 87.00, 87.50, 85.00, 'pending', 'Pending fitness clearance after injury');

-- Coach Remarks
INSERT IGNORE INTO coach_remarks (athlete_id, coach_id, remark_date, remark_type, rating, remarks) VALUES
(1, 1, '2024-06-01', 'performance', 9.0, 'Excellent improvement in sprint timing. Ready for state trials.'),
(2, 2, '2024-06-02', 'fitness', 8.5, 'Good endurance. Needs more strength training.'),
(3, 1, '2024-06-03', 'general', 7.5, 'Recovering from hamstring strain. Light training only.');

-- Notifications
INSERT IGNORE INTO notifications (user_id, title, message, type) VALUES
(1, 'System Initialized', 'Sports Academy Management System is ready.', 'success'),
(2, 'New Athlete Assigned', 'Athlete Arjun Nair has been assigned to your training group.', 'info'),
(5, 'Ranking Updated', 'New athlete rankings have been computed for this month.', 'info'),
(7, 'Fitness Assessment Due', 'Your next fitness assessment is scheduled for next week.', 'warning');
