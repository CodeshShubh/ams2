const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./utils/database');
const { initializeCloudinary } = require('./utils/cloudinary');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const app = express();

// Initialize database and external services
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Cloudinary
    await initializeCloudinary();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Attendance Management API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      attendance: '/api/attendance',
      admin: '/api/admin'
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize services
initializeServices();

module.exports = app;