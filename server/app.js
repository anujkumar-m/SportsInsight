const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const athleteRoutes = require('./routes/athlete.routes');
const coachRoutes = require('./routes/coach.routes');
const selectorRoutes = require('./routes/selector.routes');
const sportRoutes = require('./routes/sport.routes');
const categoryRoutes = require('./routes/category.routes');
const performanceRoutes = require('./routes/performance.routes');
const fitnessRoutes = require('./routes/fitness.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const injuryRoutes = require('./routes/injury.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const rankingRoutes = require('./routes/ranking.routes');
const selectionRoutes = require('./routes/selection.routes');
const comparisonRoutes = require('./routes/comparison.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// ─── Rate Limiting ────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Routes ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Sports Academy Performance System API',
    version: '1.0.0',
    status: '🟢 Online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      athletes: '/api/athletes',
      coaches: '/api/coaches',
      dashboard: '/api/dashboard',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🏅 Sports Academy API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/athletes', generalLimiter, athleteRoutes);
app.use('/api/coaches', generalLimiter, coachRoutes);
app.use('/api/selectors', generalLimiter, selectorRoutes);
app.use('/api/sports', generalLimiter, sportRoutes);
app.use('/api/categories', generalLimiter, categoryRoutes);
app.use('/api/performance', generalLimiter, performanceRoutes);
app.use('/api/fitness', generalLimiter, fitnessRoutes);
app.use('/api/attendance', generalLimiter, attendanceRoutes);
app.use('/api/injuries', generalLimiter, injuryRoutes);
app.use('/api/analytics', generalLimiter, analyticsRoutes);
app.use('/api/rankings', generalLimiter, rankingRoutes);
app.use('/api/selections', generalLimiter, selectionRoutes);
app.use('/api/comparison', generalLimiter, comparisonRoutes);

// ─── Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
