require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./src/middleware/errorHandler');
const { staticCache, apiCache, conditionalRequest } = require('./src/middleware/cache');

const app = express();
const PORT = process.env.PORT || 5000;
const ROUTES_PATH = path.join(__dirname, 'src', 'routes');

// -------------------- CORS CONFIGURATION --------------------
const allowedOrigins = [
  'https://sabbath-school-tracker-85tb.vercel.app',
  'https://sabbath-school-tracker.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost')
    ) {
      return callback(null, true);
    }

    console.log('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// 1. Enable CORS & handle OPTIONS preflight globally FIRST
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Parse JSON & Body BEFORE route middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- CACHING MIDDLEWARE --------------------
app.use(staticCache()); // Cache static resources
app.use(conditionalRequest()); // Add ETag support

// -------------------- ROUTES IMPORTS --------------------
const authRoutes = require(path.join(ROUTES_PATH, 'auth.routes'));
const userRoutes = require(path.join(ROUTES_PATH, 'user.routes'));
const classRoutes = require(path.join(ROUTES_PATH, 'class.routes'));
const quarterRoutes = require(path.join(ROUTES_PATH, 'quarter.routes'));
const weeklyDataRoutes = require(path.join(ROUTES_PATH, 'weeklyData.routes'));
const reportRoutes = require(path.join(ROUTES_PATH, 'report.routes'));
const classMemberRoutes = require(path.join(ROUTES_PATH, 'class-member.routes'));
const memberRoutes = require(path.join(ROUTES_PATH, 'member.routes'));
const memberPaymentRoutes = require(path.join(ROUTES_PATH, 'member-payment.routes'));

// -------------------- API ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quarters', quarterRoutes);
app.use('/api/weekly-data', weeklyDataRoutes);
app.use('/api/reports', apiCache(600000), reportRoutes); // Cache reports for 10 minutes
app.use('/api/class-members', classMemberRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/member-payments', memberPaymentRoutes);

// -------------------- ROOT & HEALTH --------------------
app.get('/', (req, res) => {
  res.json({ message: 'Sabbath School Tracker API' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sabbath School Tracker API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// -------------------- MIGRATION ENDPOINT --------------------
const authenticate = require('./src/middleware/auth');

app.post('/api/admin/migrate-payments', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    console.log('🚀 Starting payment migration via API...');
    console.log('👤 Requested by:', req.user.email);

    const { migratePaymentData } = require('./src/scripts/migratePaymentData');
    await migratePaymentData();

    console.log('✅ Migration completed successfully');

    res.json({
      success: true,
      message: 'Payment migration completed successfully!',
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
    });
  }
});

// -------------------- ERROR HANDLING --------------------
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;