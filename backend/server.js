require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const ROUTES_PATH = path.join(__dirname, 'src', 'routes');

// -------------------- ROUTES --------------------
const authRoutes = require(path.join(ROUTES_PATH, 'auth.routes'));
const userRoutes = require(path.join(ROUTES_PATH, 'user.routes'));
const classRoutes = require(path.join(ROUTES_PATH, 'class.routes'));
const quarterRoutes = require(path.join(ROUTES_PATH, 'quarter.routes'));
const weeklyDataRoutes = require(path.join(ROUTES_PATH, 'weeklyData.routes'));
const reportRoutes = require(path.join(ROUTES_PATH, 'report.routes'));
const classMemberRoutes = require(path.join(ROUTES_PATH, 'classMemberRoutes'));
const memberRoutes = require(path.join(ROUTES_PATH, 'memberRoutes'));
const memberPaymentRoutes = require(path.join(ROUTES_PATH, 'memberPayment.routes'));

// -------------------- MIDDLEWARE --------------------
const allowedOrigins = [
  'https://sabbath-school-tracker-85tb.vercel.app',
  'https://sabbath-school-tracker.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow all Vercel deployments and localhost
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost')
      ) {
        return callback(null, true);
      }

      // Log blocked origins for debugging
      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// -------------------- TEMPORARY MIGRATION ENDPOINT --------------------
// ⚠️ REMOVE THIS AFTER MIGRATION IS COMPLETE!
app.get('/migrate-payments-secret-endpoint-12345', async (req, res) => {
  try {
    console.log('🚀 Starting payment migration via HTTP endpoint...');
    const { migratePaymentData } = require('./src/scripts/migratePaymentData');
    
    // Run migration
    await migratePaymentData();
    
    console.log('✅ Migration completed successfully!');
    res.json({ 
      success: true, 
      message: 'Payment data migration completed successfully! Check server logs for details.',
      instructions: 'Now remove this endpoint from server.js for security'
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// -------------------- API ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quarters', quarterRoutes);
app.use('/api/weekly-data', weeklyDataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/class-members', classMemberRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/member-payments', memberPaymentRoutes);

// -------------------- ROOT --------------------
app.get('/', (req, res) => {
  res.json({ message: 'Sabbath School Tracker API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sabbath School Tracker API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
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