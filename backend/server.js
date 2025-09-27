require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const uploadRoutes = require('./routes/upload');
const customersRoutes = require('./routes/customers');
const errorsRoutes = require('./routes/errors');
const downloadRoutes = require('./routes/download');

// Import database connection
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VizFlow Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/download', downloadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to VizFlow API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      upload: {
        cleaned: 'POST /api/upload/cleaned',
        errors: 'POST /api/upload/errors',
        status: 'GET /api/upload/status'
      },
      customers: {
        list: 'GET /api/customers',
        getById: 'GET /api/customers/:id',
        stats: 'GET /api/customers/stats/summary',
        uniqueFields: 'GET /api/customers/fields/unique'
      },
      errors: {
        list: 'GET /api/errors',
        getById: 'GET /api/errors/:id',
        stats: 'GET /api/errors/stats/summary',
        updateStatus: 'PATCH /api/errors/:id/status',
        uniqueFields: 'GET /api/errors/fields/unique'
      },
      download: {
        customers: 'GET /api/download/customers',
        errors: 'GET /api/download/errors',
        combined: 'GET /api/download/combined',
        summary: 'GET /api/download/summary',
        formats: 'GET /api/download/formats'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/upload/cleaned',
      'POST /api/upload/errors',
      'GET /api/customers',
      'GET /api/errors',
      'GET /api/download/customers',
      'GET /api/download/errors'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
      field
    });
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      field: error.path
    });
  }

  // JSON parsing error
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 VizFlow Backend Server Started!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server running on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
📖 API docs: http://localhost:${PORT}/
🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed.');
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed.');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
    
    process.exit(0);
  });
}

module.exports = app;