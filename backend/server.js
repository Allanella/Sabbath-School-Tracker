require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Resolve paths relative to this file
const ROUTES_PATH = path.join(__dirname, 'src', 'routes');
const MIDDLEWARE_PATH = path.join(__dirname, 'src', 'middleware');

// Import routes
const authRoutes = require(path.join(ROUTES_PATH, 'auth.routes'));
const userRoutes = require(path.join(ROUTES_PATH, 'user.routes'));
const classRoutes = require(path.join(ROUTES_PATH, 'class.routes'));
const quarterRoutes = require(path.join(ROUTES_PATH, 'quarter.routes'));
const weeklyDataRoutes = require(path.join(ROUTES_PATH, 'weeklyData.routes'));
const reportRoutes = require(path.join(ROUTES_PATH, 'report.routes'));

// Import middleware
const errorHandler = require(path.join(MIDDLEWARE_PATH, 'errorHandler'));

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Dynamic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        /\.vercel\.app$/, // Allow all Vercel deployments
      ];
      const isAllowed = allowedOrigins.some(o =>
        typeof o === 'string' ? origin === o : o.test(origin)
      );
      return isAllowed
        ? callback(null, true)
        : callback(new Error('Not allowed by CORS'), false);
    }

    // Development allowed origins
    const allowedDevOrigins = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      'http://localhost:5173',
      'http://localhost:5174',
    ];
    const isAllowed = allowedDevOrigins.some(o =>
      typeof o === 'string' ? origin === o : o.test(origin)
    );
    return isAllowed
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 100,
  message: { error: 'Too many requests from this IP, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Sabbath School Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    church: process.env.CHURCH_NAME || 'Not configured',
  };
  res.status(200).json(healthCheck);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quarters', quarterRoutes);
app.use('/api/weekly-data', weeklyDataRoutes);
app.use('/api/reports', reportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sabbath School Tracker API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    docs: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`⛪ Church: ${process.env.CHURCH_NAME || 'Not configured'}`);
});

// Graceful error handling
process.on('unhandledRejection', err => {
  console.error('💥 Unhandled Promise Rejection:', err);
  process.exit(1);
});
process.on('uncaughtException', err => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
