require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const classRoutes = require('./src/routes/class.routes');
const quarterRoutes = require('./src/routes/quarter.routes');
const weeklyDataRoutes = require('./src/routes/weeklyData.routes');
const reportRoutes = require('./src/routes/report.routes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// DYNAMIC CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // In production: only allow the specific frontend URL and Vercel preview URLs
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://sabbath-school-tracker.vercel.app', // Your main Vercel domain
        /\.vercel\.app$/, // Allow all Vercel preview deployments
        /\.vercel\.app$/  // Allow Vercel deployments
      ];
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        return callback(null, true);
      } else {
        console.log('🚫 Blocked by CORS in production:', origin);
        return callback(new Error('Not allowed by CORS'), false);
      }
    }
    
    // In development: allow all localhost ports and common dev URLs
    const allowedDevOrigins = [
      /^http:\/\/localhost(:\d+)?$/, // localhost with any port
      /^http:\/\/127.0.0.1(:\d+)?$/, // 127.0.0.1 with any port
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Local network IPs
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    
    // Check if the origin matches any allowed pattern
    const isAllowed = allowedDevOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS in development:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - more permissive in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 100, // Higher limit in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parser middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware with production format
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // Use 'combined' format in production for more details
}

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Sabbath School Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    church: process.env.CHURCH_NAME || 'Not configured'
  };
  
  // Add database health check in production
  if (process.env.NODE_ENV === 'production') {
    healthCheck.database = 'Connected'; // You can add actual DB health check here
  }
  
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
    docs: '/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 CORS: ${process.env.NODE_ENV === 'production' ? 'Production mode' : 'Development mode'}`);
  console.log(`⛪ Church: ${process.env.CHURCH_NAME || 'Not configured'}`);
});

// Enhanced error handling
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  // Graceful shutdown
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;