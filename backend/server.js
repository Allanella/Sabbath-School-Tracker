require('dotenv').config();
const path = require('path');
const classMemberRoutes = require('./routes/classMemberRoutes');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// -------------------- PATHS --------------------
const ROUTES_PATH = path.join(__dirname, 'src', 'routes');
const MIDDLEWARE_PATH = path.join(__dirname, 'src', 'middleware');

// -------------------- ROUTES --------------------
const authRoutes = require(path.join(ROUTES_PATH, 'auth.routes'));
const userRoutes = require(path.join(ROUTES_PATH, 'user.routes'));
const classRoutes = require(path.join(ROUTES_PATH, 'class.routes'));
const quarterRoutes = require(path.join(ROUTES_PATH, 'quarter.routes'));
const weeklyDataRoutes = require(path.join(ROUTES_PATH, 'weeklyData.routes'));
const reportRoutes = require(path.join(ROUTES_PATH, 'report.routes'));

// -------------------- MIDDLEWARE --------------------
const errorHandler = require(path.join(MIDDLEWARE_PATH, 'errorHandler'));

// -------------------- APP INIT --------------------
const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- SECURITY --------------------
app.use(helmet());
app.use(cookieParser());
app.use('/api/class-members', classMemberRoutes);

// -------------------- CORS --------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://sabbath-school-tracker.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost')
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// -------------------- RATE LIMIT --------------------
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// -------------------- BODY PARSER --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------- LOGGING --------------------
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// -------------------- HEALTH CHECK --------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Sabbath School Tracker API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// -------------------- API ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quarters', quarterRoutes);
app.use('/api/weekly-data', weeklyDataRoutes);
app.use('/api/reports', reportRoutes);

// -------------------- ROOT --------------------
app.get('/', (req, res) => {
  res.json({
    name: 'Sabbath School Tracker API',
    version: '1.0.0',
    health: '/health',
  });
});

// -------------------- 404 --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// -------------------- ERROR HANDLER --------------------
app.use(errorHandler);

// -------------------- START SERVER --------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// -------------------- GRACEFUL SHUTDOWN --------------------
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
