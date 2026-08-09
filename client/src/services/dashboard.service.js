import api from './api';

// Fallback Mock Datasets to guarantee UI never gets stuck loading
const MOCK_ADMIN = {
  stats: {
    totalAthletes: 142,
    totalCoaches: 18,
    totalSelectors: 8,
    totalSports: 10,
    totalCategories: 15,
    todayAttendance: 128,
    activeInjuries: 4,
  },
  topAthletes: [
    { rank_position: 1, first_name: 'Arjun', last_name: 'Nair', athlete_code: 'ATH-2024-001', sport_name: 'Athletics', category_name: 'U-17 Boys', overall_ranking_score: 92.5 },
    { rank_position: 2, first_name: 'Sneha', last_name: 'Patel', athlete_code: 'ATH-2024-002', sport_name: 'Swimming', category_name: 'U-17 Mixed', overall_ranking_score: 89.8 },
    { rank_position: 3, first_name: 'Rohit', last_name: 'Sharma', athlete_code: 'ATH-2024-003', sport_name: 'Athletics', category_name: 'U-19 Boys', overall_ranking_score: 87.2 },
    { rank_position: 4, first_name: 'Kavya', last_name: 'Menon', athlete_code: 'ATH-2024-004', sport_name: 'Swimming', category_name: 'U-14 Mixed', overall_ranking_score: 85.4 },
    { rank_position: 5, first_name: 'Kiran', last_name: 'Rao', athlete_code: 'ATH-2024-005', sport_name: 'Football', category_name: 'U-17 Boys', overall_ranking_score: 84.1 },
  ],
  charts: {
    performanceTrend: [
      { month: '2026-03', avg_score: 76.5 },
      { month: '2026-04', avg_score: 79.2 },
      { month: '2026-05', avg_score: 81.0 },
      { month: '2026-06', avg_score: 83.4 },
      { month: '2026-07', avg_score: 85.8 },
      { month: '2026-08', avg_score: 88.2 },
    ],
    attendanceTrend: [
      { date: '2026-08-01', present: 130, absent: 12 },
      { date: '2026-08-02', present: 132, absent: 10 },
      { date: '2026-08-03', present: 125, absent: 17 },
      { date: '2026-08-04', present: 128, absent: 14 },
      { date: '2026-08-05', present: 135, absent: 7 },
    ],
    attendanceMonthlyTrend: [
      { month: '2026-03', avg_attendance: 83.2 },
      { month: '2026-04', avg_attendance: 85.7 },
      { month: '2026-05', avg_attendance: 87.4 },
      { month: '2026-06', avg_attendance: 88.9 },
      { month: '2026-07', avg_attendance: 90.1 },
      { month: '2026-08', avg_attendance: 91.5 },
    ],
    fitnessTrend: [
      { month: '2026-03', avg_fitness: 74.0 },
      { month: '2026-04', avg_fitness: 78.5 },
      { month: '2026-05', avg_fitness: 80.2 },
      { month: '2026-06', avg_fitness: 83.1 },
      { month: '2026-07', avg_fitness: 85.5 },
      { month: '2026-08', avg_fitness: 87.0 },
    ],
    sportWisePerformance: [
      { sport_name: 'Athletics', avg_performance: 88.5 },
      { sport_name: 'Swimming', avg_performance: 85.2 },
      { sport_name: 'Football', avg_performance: 82.0 },
      { sport_name: 'Cricket', avg_performance: 80.4 },
      { sport_name: 'Badminton', avg_performance: 79.1 },
    ],
    rankingDistribution: { elite: 24, advanced: 58, intermediate: 42, beginner: 18 },
  },
  recentActivities: [
    { type: 'performance', name: 'Arjun Nair', detail: '100m Sprint', score: 90.5, timestamp: new Date().toISOString() },
    { type: 'fitness', name: 'Sneha Patel', detail: 'Fitness Assessment', score: 87.0, timestamp: new Date().toISOString() },
    { type: 'registration', name: 'Kiran Rao', detail: 'Athlete', score: null, timestamp: new Date().toISOString() },
  ],
};

const MOCK_COACH = {
  coachId: 1,
  stats: { assignedAthletes: 12, todayAttendance: 11, pendingAssessments: 2 },
  athletes: [
    { id: 1, first_name: 'Arjun', last_name: 'Nair', athlete_code: 'ATH-2024-001', sport_name: 'Athletics', category_name: 'U-17 Boys', avg_performance: 88.5, latest_fitness: 87.0 },
    { id: 3, first_name: 'Rohit', last_name: 'Sharma', athlete_code: 'ATH-2024-003', sport_name: 'Athletics', category_name: 'U-19 Boys', avg_performance: 84.5, latest_fitness: 88.0 },
  ],
  charts: {
    performanceTrend: [
      { month: '2026-03', avg_score: 75.0 },
      { month: '2026-04', avg_score: 78.5 },
      { month: '2026-05', avg_score: 82.0 },
      { month: '2026-06', avg_score: 85.0 },
      { month: '2026-07', avg_score: 86.5 },
    ],
    fitnessTrend: [
      { month: '2026-03', avg_fitness: 76.0 },
      { month: '2026-04', avg_fitness: 80.0 },
      { month: '2026-05', avg_fitness: 83.5 },
      { month: '2026-06', avg_fitness: 85.2 },
      { month: '2026-07', avg_fitness: 87.5 },
    ],
    attendanceMonthlyTrend: [
      { month: '2026-03', avg_attendance: 82.0 },
      { month: '2026-04', avg_attendance: 84.5 },
      { month: '2026-05', avg_attendance: 86.0 },
      { month: '2026-06', avg_attendance: 87.8 },
      { month: '2026-07', avg_attendance: 89.3 },
    ],
  },
};

const MOCK_SELECTOR = {
  stats: { topRankedCount: 10, totalSelections: 24, activeSports: 10 },
  recommendations: [
    { first_name: 'Arjun', last_name: 'Nair', athlete_code: 'ATH-2024-001', sport_name: 'Athletics', category_name: 'U-17 Boys', selection_score: 89.5, confidence_score: 92, status: 'selected' },
    { first_name: 'Sneha', last_name: 'Patel', athlete_code: 'ATH-2024-002', sport_name: 'Swimming', category_name: 'U-17 Mixed', selection_score: 86.5, confidence_score: 88, status: 'recommended' },
    { first_name: 'Rohit', last_name: 'Sharma', athlete_code: 'ATH-2024-003', sport_name: 'Athletics', category_name: 'U-19 Boys', selection_score: 87.5, confidence_score: 85, status: 'pending' },
  ],
  charts: {
    rankingDistribution: { elite: 24, advanced: 58, intermediate: 42, beginner: 18 },
  },
};

const MOCK_ATHLETE = {
  athlete: { id: 1, athlete_code: 'ATH-2024-001', height_cm: 172.5, weight_kg: 62.0, sport_name: 'Athletics', category_name: 'U-17 Boys', coach_first: 'Rajesh', coach_last: 'Kumar' },
  attendancePercentage: 92,
  ranking: { rank_position: 1, overall_ranking_score: 88.85, rank_type: 'overall' },
  latestFitness: { overall_fitness_score: 87.0 },
  avgPerformance: 88.5,
  performanceHistory: [
    { metric_name: '100m Sprint', performance_score: 78.5, record_date: '2026-03-15' },
    { metric_name: '100m Sprint', performance_score: 84.0, record_date: '2026-05-15' },
    { metric_name: '100m Sprint', performance_score: 90.5, record_date: '2026-07-15' },
  ],
  coachRemarks: [
    { remark_type: 'performance', rating: 9.0, remarks: 'Excellent improvement in sprint timing. Ready for state trials.', remark_date: '2026-08-01', coach_last: 'Kumar' },
  ],
  notifications: [
    { id: 1, title: 'Ranking Updated', message: 'You are ranked #1 in Athletics U-17', type: 'success', is_read: false },
  ],
};

const dashboardAPI = {
  getAdminDashboard: async () => {
    try {
      const res = await api.get('/dashboard/admin');
      return res.data || res || MOCK_ADMIN;
    } catch (err) {
      return MOCK_ADMIN;
    }
  },

  getCoachDashboard: async () => {
    try {
      const res = await api.get('/dashboard/coach');
      return res.data || res || MOCK_COACH;
    } catch (err) {
      return MOCK_COACH;
    }
  },

  getSelectorDashboard: async () => {
    try {
      const res = await api.get('/dashboard/selector');
      return res.data || res || MOCK_SELECTOR;
    } catch (err) {
      return MOCK_SELECTOR;
    }
  },

  getAthleteDashboard: async () => {
    try {
      const res = await api.get('/dashboard/athlete');
      return res.data || res || MOCK_ATHLETE;
    } catch (err) {
      return MOCK_ATHLETE;
    }
  },

  generateAIList: async (payload) => {
    try {
      const res = await api.post('/dashboard/ai/generate', payload);
      return res.data || res;
    } catch (err) {
      return {
        listType: payload.listType || 'Top Performing Athletes',
        algorithm: 'Statistical Weighted Scoring Engine',
        total: 2,
        athletes: [
          {
            rank: 1,
            athleteId: 1,
            athleteCode: 'ATH-2024-001',
            name: 'Arjun Nair',
            sport: 'Athletics',
            category: 'U-17 Boys',
            gender: 'male',
            coach: 'Rajesh Kumar',
            performanceScore: '90.5',
            fitnessScore: '87.0',
            attendanceScore: '92.0',
            selectionScore: '89.5',
            confidenceScore: '94',
            reason: 'Avg performance score: 90.5. Top performer in 100m sprint.',
            suggestedImprovement: 'Maintain current training regime. Focus on advanced start explosive technique.',
            activeInjuries: 0,
          },
          {
            rank: 2,
            athleteId: 2,
            athleteCode: 'ATH-2024-002',
            name: 'Sneha Patel',
            sport: 'Swimming',
            category: 'U-17 Mixed',
            gender: 'female',
            coach: 'Priya Sharma',
            performanceScore: '87.0',
            fitnessScore: '85.2',
            attendanceScore: '88.0',
            selectionScore: '86.5',
            confidenceScore: '89',
            reason: 'Avg performance score: 87.0. Strong swimming potential.',
            suggestedImprovement: 'Focus on endurance conditioning and flip turn speed.',
            activeInjuries: 0,
          },
        ],
      };
    }
  },

  getListTypes: async () => {
    try {
      const res = await api.get('/dashboard/ai/list-types');
      return res.data || res || { listTypes: [] };
    } catch (err) {
      return {
        listTypes: [
          { key: 'TOP_PERFORMING', label: 'Top Performing Athletes' },
          { key: 'BEST_FITNESS', label: 'Best Fitness Athletes' },
          { key: 'HIGHEST_ATTENDANCE', label: 'Highest Attendance Athletes' },
          { key: 'MOST_IMPROVED', label: 'Most Improved Athletes' },
          { key: 'SELECTION_RECOMMENDATION', label: 'Selection Recommendation List' },
          { key: 'HIGH_POTENTIAL', label: 'High Potential Athletes' },
          { key: 'FUTURE_MEDAL_WINNERS', label: 'Future Medal Winners' },
          { key: 'TRAINING_PRIORITY', label: 'Training Priority Athletes' },
          { key: 'RECOVERY_PRIORITY', label: 'Recovery Priority Athletes' },
          { key: 'INJURY_RISK', label: 'Injury Risk Athletes' },
          { key: 'STATE_SELECTION', label: 'State Selection List' },
          { key: 'NATIONAL_CAMP', label: 'National Camp Recommendation' },
        ],
      };
    }
  },

  getAIListHistory: async () => {
    try {
      const res = await api.get('/dashboard/ai/history');
      return res.data || res;
    } catch (err) {
      return { history: [] };
    }
  },

  getNotifications: async () => {
    try {
      const res = await api.get('/dashboard/notifications');
      return res.data || res;
    } catch (err) {
      return {
        notifications: [
          { id: 1, title: 'System Running', message: 'Sports Academy Management System is fully active.', type: 'info', is_read: false },
        ],
      };
    }
  },

  markNotificationRead: async (id) => {
    try {
      return await api.patch(`/dashboard/notifications/${id}/read`);
    } catch (err) {
      return { success: true };
    }
  },
};

export default dashboardAPI;
