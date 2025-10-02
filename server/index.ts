import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Cloudinary
  try {
    const { initializeCloudinary } = await import("./cloudinary.js");
    await initializeCloudinary();
  } catch (error) {
    console.warn('⚠️ Cloudinary initialization failed:', error);
  }

  // Seed database with initial data  
  // Temporarily disable MongoDB for development - will enable after fixing IP whitelist
  const mongoUri = null; // process.env.MONGODB_URI;
  
  if (mongoUri) {
    try {
      const { seedMongoDB } = await import("./mongodb-seed");
      await seedMongoDB();
    } catch (error: any) {
      console.warn('⚠️ MongoDB connection failed, falling back to in-memory storage');
      console.warn('💡 To fix: Add Replit IPs to MongoDB Atlas whitelist or use 0.0.0.0/0 for development');
      console.warn('🔧 Error:', error?.message || 'Unknown connection error');
      
      // Fall back to regular seeding
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    }
  } else {
    const { seedDatabase } = await import("./seed");
    await seedDatabase();
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
