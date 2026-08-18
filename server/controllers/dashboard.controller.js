const dashboardModel = require('../models/dashboard.model');
const aiService = require('../services/ai.service');
const { pool } = require('../config/database');

// ─── Admin Dashboard ──────────────────────────────────────
const getAdminDashboard = async (req, res, next) => {
  try {
    const [stats, topAthletes, perfTrend, attTrend, attMonthly, fitTrend, sportPerf, rankDist, activities] =
      await Promise.all([
        dashboardModel.getAdminStats(),
        dashboardModel.getTopRankedAthletes(10),
        dashboardModel.getPerformanceTrend(6),
        dashboardModel.getAttendanceTrend(14),
        dashboardModel.getAttendanceMonthlyTrend(6),
        dashboardModel.getFitnessTrend(6),
        dashboardModel.getSportWisePerformance(),
        dashboardModel.getRankingDistribution(),
        dashboardModel.getRecentActivities(15),
      ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        topAthletes,
        charts: {
          performanceTrend: perfTrend,
          attendanceTrend: attTrend,
          attendanceMonthlyTrend: attMonthly,
          fitnessTrend: fitTrend,
          sportWisePerformance: sportPerf,
          rankingDistribution: rankDist,
        },
        recentActivities: activities,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Coach Dashboard ──────────────────────────────────────
const getCoachDashboard = async (req, res, next) => {
  try {
    const [coachRow] = await pool.query(
      'SELECT id FROM coaches WHERE user_id = ?',
      [req.user.id]
    );

    if (coachRow.length === 0) {
      return res.status(404).json({ success: false, message: 'Coach profile not found.' });
    }

    const coachId = coachRow[0].id;
    const [stats, athletes, perfTrend, fitTrend, attMonthly] = await Promise.all([
      dashboardModel.getCoachStats(coachId),
      dashboardModel.getCoachAthletes(coachId, 10),
      dashboardModel.getPerformanceTrend(6),
      dashboardModel.getFitnessTrend(6),
      dashboardModel.getAttendanceMonthlyTrend(6),
    ]);

    res.status(200).json({
      success: true,
      data: {
        coachId,
        stats,
        athletes,
        charts: {
          performanceTrend: perfTrend,
          fitnessTrend: fitTrend,
          attendanceMonthlyTrend: attMonthly,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Selector Dashboard ───────────────────────────────────
const getSelectorDashboard = async (req, res, next) => {
  try {
    const selectorService = require('../services/selector.service');
    const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);

    const [stats, topAthletes, recommendations, rankDist] = await Promise.all([
      dashboardModel.getSelectorStats(sportIds),
      dashboardModel.getTopRankedAthletes(10, sportIds),
      dashboardModel.getSelectionRecommendations(10, sportIds),
      dashboardModel.getRankingDistribution(),
    ]);

    const formattedAthletes = (topAthletes && topAthletes.length > 0 ? topAthletes : recommendations || []).map((a) => ({
      ...a,
      selection_score: a.selection_score || a.overall_ranking_score || 80,
      confidence_score: a.confidence_score || 85,
      status: a.status || 'recommended',
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: stats || {},
        topRankedAthletes: formattedAthletes,
        topAthletes: formattedAthletes,
        recommendations,
        charts: { rankingDistribution: rankDist },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Athlete Dashboard ────────────────────────────────────
const getAthleteDashboard = async (req, res, next) => {
  try {
    const athleteData = await dashboardModel.getAthleteStats(req.user.id);

    if (!athleteData) {
      return res.status(404).json({ success: false, message: 'Athlete profile not found.' });
    }

    const [perfHistory, remarks, notifications] = await Promise.all([
      dashboardModel.getAthletePerformanceHistory(athleteData.athlete.id, 6),
      dashboardModel.getAthleteCoachRemarks(athleteData.athlete.id, 5),
      pool.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [req.user.id]
      ),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...athleteData,
        performanceHistory: perfHistory,
        coachRemarks: remarks,
        notifications: notifications[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── AI Generate List ─────────────────────────────────────
const generateAIList = async (req, res, next) => {
  try {
    const {
      listType,
      sportId,
      categoryId,
      gender,
      ageMin,
      ageMax,
      dateFrom,
      dateTo,
      save = false,
    } = req.body;

    if (!listType) {
      return res.status(400).json({ success: false, message: 'List type is required.' });
    }

    const role = req.user.role?.toLowerCase();
    let coachId = null;
    let sportIds = null;

    // Coaches can only generate lists for their assigned athletes
    if (role === 'coach') {
      const [coachRow] = await pool.query('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
      if (coachRow.length > 0) coachId = coachRow[0].id;
    } else if (role === 'selector' || role === 'state_selector') {
      const selectorService = require('../services/selector.service');
      sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
    }

    const filters = {
      sportId: sportId ? parseInt(sportId) : null,
      sportIds: sportIds && sportIds.length > 0 ? sportIds : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      gender: gender || 'mixed',
      ageMin: ageMin ? parseInt(ageMin) : null,
      ageMax: ageMax ? parseInt(ageMax) : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      coachId,
      limit: 50,
    };

    const result = await aiService.generateList(listType, filters);

    let savedId = null;
    if (save) {
      savedId = await aiService.saveGeneratedList(req.user.id, listType, filters, result);
    }

    res.status(200).json({
      success: true,
      data: { ...result, savedId },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Available List Types ─────────────────────────────
const getListTypes = async (req, res, next) => {
  try {
    const types = aiService.getListTypes();
    res.status(200).json({ success: true, data: { listTypes: types } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Notifications ────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.status(200).json({ success: true, data: { notifications: rows } });
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Get AI Generated Lists History ──────────────────────
const getAIListHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT agl.id, agl.list_type, agl.athletes_count, agl.created_at,
              u.first_name, u.last_name,
              s.name AS sport_name, c.name AS category_name
       FROM ai_generated_lists agl
       JOIN users u ON agl.generated_by = u.id
       LEFT JOIN sports s ON agl.sport_id = s.id
       LEFT JOIN categories c ON agl.category_id = c.id
       ORDER BY agl.created_at DESC
       LIMIT 20`
    );
    res.status(200).json({ success: true, data: { history: rows } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getCoachDashboard,
  getSelectorDashboard,
  getAthleteDashboard,
  generateAIList,
  getListTypes,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getAIListHistory,
};
