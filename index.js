// const express = require("express");
// const mongoose = require("mongoose");
// require("dotenv").config();
// const movieRouter = require("./routes/movie");
// const actorRouter = require("./routes/actor");
// const producerRouter = require("./routes/producer");
// const cors = require("cors");
// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://imdb-app.jayachandran.xyz",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true
// }));

// // Root endpoint
// app.get("/", (req, res) => {
//   res.json({
//     message: "IMDB Clone API - Welcome",
//     version: "1.0.0",
//     endpoints: {
//       health: "/health",
//       actors: "/actors",
//       movies: "/movies",
//       producers: "/producers"
//     }
//   });
// });

// // Health check endpoint
// app.get("/health", async (req, res) => {
//   try {
//     const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
//     res.json({
//       status: "success",
//       database: dbStatus,
//       api: {
//         actor: true,
//         movie: true,
//         producer: true,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: error.message,
//     });
//   }
// });

// // API routes
// app.use("/movies", movieRouter);
// app.use("/actors", actorRouter);
// app.use("/producers", producerRouter);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     status: "error",
//     message: err.message || "Internal server error",
//   });
// });

// // Connect to MongoDB and start server
// const startServer = async () => {
//   try {
//     // Fix: Ensure MongoDB URL is properly formatted and handle potential issues
//     const mongoUrl = process.env.MONGO_URL;
    
//     // Validate MongoDB URL
//     if (!mongoUrl || (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://"))) {
//       console.error("Invalid MongoDB URL format. URL must start with mongodb:// or mongodb+srv://");
//       console.log("Attempting to fix MongoDB URL...");
      
//       // Try to extract and reconstruct the URL if possible
//       const urlParts = mongoUrl ? mongoUrl.split('@') : [];
//       if (urlParts.length > 1) {
//         const credentials = urlParts[0].split(':');
//         const username = credentials.length > 1 ? credentials[credentials.length - 2] : "";
//         const password = credentials.length > 1 ? credentials[credentials.length - 1] : "";
//         const hostAndParams = urlParts[1];
        
//         const fixedUrl = `mongodb+srv://${username}:${password}@${hostAndParams}`;
//         console.log("Using reconstructed MongoDB URL");
//         await mongoose.connect(fixedUrl);
//       } else {
//         // Fallback to a hardcoded URL as last resort
//         const fallbackUrl = "mongodb+srv://JAYACHANDRAN:KQJrxDn44181NsqT@cluster0.w45he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//         console.log("Using fallback MongoDB URL");
//         await mongoose.connect(fallbackUrl);
//       }
//     } else {
//       // URL format is valid, proceed with connection
//       console.log("Connecting to MongoDB with provided URL");
//       await mongoose.connect(mongoUrl);
//     }
    
//     console.log("Database connected successfully");
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error("Database connection failed:", err);
//     process.exit(1);
//   }
// };

// startServer();
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const movieRouter = require("./routes/movie");
const actorRouter = require("./routes/actor");
const producerRouter = require("./routes/producer");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://imdb-app.jayachandran.xyz",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

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
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

startServer();
