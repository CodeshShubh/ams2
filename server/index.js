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
const PORT =  5000;

// Initialize database and external services
const initializeServices = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
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
    : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

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
    },
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the client build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React Router routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Development mode - let Vite handle static files
  app.get('/', (req, res) => {
    res.json({
      message: 'Attendance Management API - Development Mode',
      endpoints: '/api'
    });
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Initialize services and start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, 'localhost', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Using MongoDB storage`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server terminated');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;