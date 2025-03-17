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

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(apiCallCounter);
register.registerMetric(databaseConnectionGauge);
register.registerMetric(movieCountGauge);
register.registerMetric(actorCountGauge);
register.registerMetric(producerCountGauge);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://imdb-app.jayachandran.xyz",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware to track request duration and count API calls
app.use((req, res, next) => {
  const start = Date.now();
  
  // Count API call
  apiCallCounter.inc({ method: req.method, endpoint: req.originalUrl });
  
  // Record end time and calculate duration after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route: req.route?.path || req.originalUrl, status_code: res.statusCode },
      duration
    );
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Define base routes
const setupRoutes = (router, prefix = '') => {
  // Root endpoint
  router.get(`${prefix}/`, (req, res) => {
    res.json({
      message: "IMDB Clone API - Welcome",
      version: "1.0.0",
      endpoints: {
        health: `${prefix}/health`,
        actors: `${prefix}/actors`,
        movies: `${prefix}/movies`,
        producers: `${prefix}/producers`
      }
    });
  });

  // Health check endpoint
  router.get(`${prefix}/health`, async (req, res) => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
      
      // Update DB connection metric
      databaseConnectionGauge.set(dbStatus === "connected" ? 1 : 0);
      
      res.json({
        status: "success",
        database: dbStatus,
        api: {
          actor: true,
          movie: true,
          producer: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  // Status endpoints
  router.get(`${prefix}/actors/status`, (req, res) => {
    res.json({ status: "ok" });
  });

  router.get(`${prefix}/movies/status`, (req, res) => {
    res.json({ status: "ok" });
  });

  router.get(`${prefix}/producers/status`, (req, res) => {
    res.json({ status: "ok" });
  });

  // API routes
  router.use(`${prefix}/movies`, movieRouter);
  router.use(`${prefix}/actors`, actorRouter);
  router.use(`${prefix}/producers`, producerRouter);
};

// Set up regular routes
setupRoutes(app);

// Set up routes with /api prefix
setupRoutes(app, '/api');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// Update metrics for database counts
const updateDbMetrics = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // If DB models are available, update metrics with actual counts
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
    }
  } catch (error) {
    console.error("Error updating DB metrics:", error);
  }
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Fix: Ensure MongoDB URL is properly formatted and handle potential issues
    const mongoUrl = process.env.MONGO_URL;
    
    // Validate MongoDB URL
    if (!mongoUrl || (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://"))) {
      console.error("Invalid MongoDB URL format. URL must start with mongodb:// or mongodb+srv://");
      console.log("Attempting to fix MongoDB URL...");
      
      // Try to extract and reconstruct the URL if possible
      const urlParts = mongoUrl ? mongoUrl.split('@') : [];
      if (urlParts.length > 1) {
        const credentials = urlParts[0].split(':');
        const username = credentials.length > 1 ? credentials[credentials.length - 2] : "";
        const password = credentials.length > 1 ? credentials[credentials.length - 1] : "";
        const hostAndParams = urlParts[1];
        
        const fixedUrl = `mongodb+srv://${username}:${password}@${hostAndParams}`;
        console.log("Using reconstructed MongoDB URL");
        await mongoose.connect(fixedUrl);
      } else {
        // Fallback to a hardcoded URL as last resort
        const fallbackUrl = "mongodb+srv://JAYACHANDRAN:KQJrxDn44181NsqT@cluster0.w45he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        console.log("Using fallback MongoDB URL");
        await mongoose.connect(fallbackUrl);
      }
    } else {
      // URL format is valid, proceed with connection
      console.log("Connecting to MongoDB with provided URL");
      await mongoose.connect(mongoUrl);
    }
    
    console.log("Database connected successfully");
    
    // Update DB connection metric
    databaseConnectionGauge.set(1);
    
    // Set up metrics update interval
    setInterval(updateDbMetrics, 30000);
    
    // Initial update of DB metrics
    await updateDbMetrics();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    // Update DB connection metric
    databaseConnectionGauge.set(0);
    process.exit(1);
  }
};

startServer();
