const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const movieRouter = require("./routes/movie");
const actorRouter = require("./routes/actor");
const producerRouter = require("./routes/producer");
const cors = require("cors");
const app = express();

// Prometheus setup
const promClient = require('prom-client');
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const apiCallCounter = new promClient.Counter({
  name: 'api_calls_total',
  help: 'Total number of API calls',
  labelNames: ['method', 'endpoint']
});

const databaseConnectionGauge = new promClient.Gauge({
  name: 'database_connection_status',
  help: 'Status of database connection (1 for connected, 0 for disconnected)'
});

const movieCountGauge = new promClient.Gauge({
  name: 'movies_count',
  help: 'Total number of movies in the database'
});

const actorCountGauge = new promClient.Gauge({
  name: 'actors_count',
  help: 'Total number of actors in the database'
});

const producerCountGauge = new promClient.Gauge({
  name: 'producers_count',
  help: 'Total number of producers in the database'
});

// Frontend metrics counter
const frontendMetricsReceived = new promClient.Counter({
  name: 'frontend_metrics_received_total',
  help: 'Total number of frontend metrics reports received'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(apiCallCounter);
register.registerMetric(databaseConnectionGauge);
register.registerMetric(movieCountGauge);
register.registerMetric(actorCountGauge);
register.registerMetric(producerCountGauge);
register.registerMetric(frontendMetricsReceived);

// Enhanced CORS Configuration - Allow frontend on port 3000
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React development server
    'http://127.0.0.1:3000',  // Alternative localhost
    'http://localhost:3001',  // Alternative React port
    true  // Allow all origins in development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: false,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Apply CORS first - this is crucial
app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced middleware to track request duration and count API calls
app.use((req, res, next) => {
  const start = Date.now();
  
  // Add CORS headers to every response as backup
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  
  // Count API call (skip metrics endpoints)
  if (!req.originalUrl.includes('/metrics')) {
    apiCallCounter.inc({ method: req.method, endpoint: req.originalUrl });
  }
  
  // Record end time and calculate duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.originalUrl.includes('/metrics')) {
      httpRequestDurationMicroseconds.observe(
        { method: req.method, route: req.route?.path || req.originalUrl, status_code: res.statusCode },
        duration
      );
    }
  });
  
  next();
});

// Backend Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

// Enhanced Frontend metrics reporting endpoint
app.post('/metrics-report', (req, res) => {
  try {
    // Increment the counter for received frontend metrics
    frontendMetricsReceived.inc();
    
    console.log('📊 Frontend metrics received at:', new Date().toISOString());
    
    // Parse and log the metrics if they're in Prometheus format
    if (typeof req.body === 'string' && req.body.includes('frontend_')) {
      console.log('📈 Prometheus format metrics:');
      console.log(req.body);
    } else {
      console.log('📈 Raw metrics data:', req.body);
    }
    
    res.json({ 
      status: 'success', 
      message: 'Frontend metrics received successfully',
      timestamp: new Date().toISOString(),
      dataType: typeof req.body,
      dataLength: typeof req.body === 'string' ? req.body.length : JSON.stringify(req.body).length
    });
  } catch (error) {
    console.error('❌ Error processing frontend metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Alternative API route for frontend metrics
app.post('/api/metrics-report', (req, res) => {
  try {
    frontendMetricsReceived.inc();
    console.log('📊 Frontend metrics received (API route) at:', new Date().toISOString());
    console.log('📈 Metrics data:', req.body);
    
    res.json({ 
      status: 'success', 
      message: 'Frontend metrics received via API route',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error processing frontend metrics (API route):', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "IMDB Clone API - Welcome",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    server: {
      port: process.env.PORT || 5000,
      environment: process.env.NODE_ENV || 'development'
    },
    endpoints: {
      health: '/health',
      api_health: '/api/health',
      actors: '/api/actors',
      movies: '/api/movies',
      producers: '/api/producers',
      metrics: '/metrics',
      frontend_metrics: '/metrics-report'
    },
    cors: {
      enabled: true,
      allowedOrigins: corsOptions.origin
    }
  });
});

// Enhanced Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    databaseConnectionGauge.set(dbStatus === "connected" ? 1 : 0);
    
    res.json({
      status: "success",
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        port: process.env.PORT || 5000
      },
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      api: {
        actor: true,
        movie: true,
        producer: true,
      },
      cors: {
        enabled: true,
        origin: req.headers.origin || 'none',
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with /api prefix
app.get('/api/', (req, res) => {
  res.json({
    message: "IMDB Clone API - API Routes",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      actors: '/api/actors',
      movies: '/api/movies',
      producers: '/api/producers',
      metrics_report: '/api/metrics-report'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    res.json({
      status: "success",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState
      },
      services: {
        actors: "ok",
        movies: "ok",
        producers: "ok"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoints
app.get('/api/actors/status', (req, res) => {
  res.json({ status: "ok", service: "actors", timestamp: new Date().toISOString() });
});

app.get('/api/movies/status', (req, res) => {
  res.json({ status: "ok", service: "movies", timestamp: new Date().toISOString() });
});

app.get('/api/producers/status', (req, res) => {
  res.json({ status: "ok", service: "producers", timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/movies', movieRouter);
app.use('/api/actors', actorRouter);
app.use('/api/producers', producerRouter);

// Direct routes (without /api prefix) for backward compatibility
app.use('/movies', movieRouter);
app.use('/actors', actorRouter);
app.use('/producers', producerRouter);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    requestDetails: {
      method: req.method,
      url: req.originalUrl,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    },
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/',
      'GET /api/health',
      'GET /api/movies',
      'GET /api/actors',
      'GET /api/producers',
      'GET /metrics',
      'POST /metrics-report',
      'POST /api/metrics-report'
    ]
  });
});

// Enhanced Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    status: "error",
    message: isDevelopment ? err.message : "Internal server error",
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    })
  });
});

// Update metrics for database counts
const updateDbMetrics = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      databaseConnectionGauge.set(1);
      
      if (mongoose.models.Movie) {
        const movieCount = await mongoose.models.Movie.countDocuments();
        movieCountGauge.set(movieCount);
      }
      
      if (mongoose.models.Actor) {
        const actorCount = await mongoose.models.Actor.countDocuments();
        actorCountGauge.set(actorCount);
      }
      
      if (mongoose.models.Producer) {
        const producerCount = await mongoose.models.Producer.countDocuments();
        producerCountGauge.set(producerCount);
      }
    } else {
      databaseConnectionGauge.set(0);
    }
  } catch (error) {
    console.error("Error updating DB metrics:", error);
    databaseConnectionGauge.set(0);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting IMDB Clone API Server...');
    
    const mongoUrl = process.env.MONGO_URL;
    
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is required');
    }
    
    // MongoDB connection options
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    if (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://")) {
      console.error("Invalid MongoDB URL format. Attempting to fix...");
      
      const urlParts = mongoUrl.split('@');
      if (urlParts.length > 1) {
        const credentials = urlParts[0].split(':');
        const username = credentials[credentials.length - 2] || "";
        const password = credentials[credentials.length - 1] || "";
        const hostAndParams = urlParts[1];
        
        const fixedUrl = `mongodb+srv://${username}:${password}@${hostAndParams}`;
        console.log("Using reconstructed MongoDB URL");
        await mongoose.connect(fixedUrl, mongoOptions);
      } else {
        const fallbackUrl = "mongodb+srv://JAYACHANDRAN:KQJrxDn44181NsqT@cluster0.w45he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        console.log("Using fallback MongoDB URL");
        await mongoose.connect(fallbackUrl, mongoOptions);
      }
    } else {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(mongoUrl, mongoOptions);
    }
    
    console.log("✅ Database connected successfully");
    
    databaseConnectionGauge.set(1);
    
    // Set up metrics update interval
    const metricsInterval = setInterval(updateDbMetrics, 30000);
    await updateDbMetrics();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Backend Metrics: http://localhost:${PORT}/metrics`);
      console.log(`📨 Frontend Metrics Endpoint: http://localhost:${PORT}/metrics-report`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🎬 API Endpoints: http://localhost:${PORT}/api/`);
      console.log(`🌐 CORS enabled for frontend on port 3000`);
      console.log(`📅 Server Started: ${new Date().toISOString()}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

    // Cleanup
    const cleanup = () => {
      clearInterval(metricsInterval);
      server.close();
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    databaseConnectionGauge.set(0);
    
    if (err.message.includes('ENOTFOUND')) {
      console.error('DNS resolution failed. Check MongoDB connection string.');
    } else if (err.message.includes('authentication failed')) {
      console.error('MongoDB authentication failed. Check credentials.');
    }
    
    process.exit(1);
  }
};

startServer().catch(console.error);