import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService, authenticateToken, requireAdmin, requireStaff, type AuthRequest } from "./auth";
import { GeofenceService } from "./geofence";
import { insertUserSchema, insertAttendanceRecordSchema, insertGeofenceSettingsSchema } from "@shared/schema";
import { Request, Response } from "express";
import { z } from "zod";

// Import MongoDB models and utilities
import User from "./models/User.js";
import Attendance from "./models/Attendance.js";
import GeofenceSettings from "./models/GeofenceSettings.js";

// Validation schemas for API requests
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  notes: z.string().optional()
});

const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90, "Invalid latitude").optional(),
  longitude: z.number().min(-180).max(180, "Invalid longitude").optional(),
  notes: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check for new MongoDB API
  app.get('/api/v2', (req: Request, res: Response) => {
    res.json({
      message: 'Attendance Management API v2',
      version: '2.0.0',
      status: 'active',
      database: 'MongoDB',
      endpoints: {
        auth: '/api/v2/auth',
        users: '/api/v2/users',
        attendance: '/api/v2/attendance',
        admin: '/api/v2/admin'
      },
      timestamp: new Date().toISOString()
    });
  });

  // New MongoDB-based authentication endpoints
  app.post('/api/v2/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }

      // Check password using bcrypt directly since TypeScript compilation issue
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token: 'jwt-token-placeholder' // Will implement JWT properly
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  });

  // Get attendance status endpoint
  app.get('/api/v2/attendance/status', async (req: Request, res: Response) => {
    try {
      // For now, return mock data - will implement proper auth later
      const geofence = await GeofenceSettings.findOne({ isActive: true });
      
      res.json({
        success: true,
        data: {
          isCheckedIn: false,
          geofence,
          message: 'Attendance status retrieved'
        }
      });
    } catch (error) {
      console.error('Get attendance status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance status'
      });
    }
  });

  // Legacy routes (v1) - keeping for compatibility
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(userData.password);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Generate token and return response
      const token = AuthService.generateToken(newUser);
      const loginResponse = AuthService.createLoginResponse(newUser, token);
      
      res.status(201).json(loginResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check password
      const isPasswordValid = await AuthService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      // Generate token and return response
      const token = AuthService.generateToken(user);
      const loginResponse = AuthService.createLoginResponse(user, token);
      
      res.json(loginResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Protected route to get current user profile
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Invalid token data" });
      }

      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Attendance routes
  app.post("/api/attendance/check-in", authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Invalid token data" });
      }

      // Validate request data - latitude/longitude are required
      const validatedData = checkInSchema.parse(req.body);
      const { latitude, longitude, notes } = validatedData;

      // Check if user already has an active check-in
      const activeRecord = await storage.getUserActiveRecord(req.user.userId);
      if (activeRecord) {
        return res.status(400).json({ error: "You are already checked in" });
      }

      // Get active geofences and validate location - this is mandatory
      const activeGeofences = await storage.getActiveGeofenceSettings();
      if (activeGeofences.length === 0) {
        return res.status(400).json({ 
          error: "No active geofence configured. Please contact your administrator." 
        });
      }

      const geofenceValidation = GeofenceService.validateAgainstClosestGeofence(
        latitude, longitude, activeGeofences
      );
      
      if (!geofenceValidation || !geofenceValidation.isValid) {
        return res.status(403).json({ 
          error: "Check-in location is outside allowed area",
          geofenceValidation,
          message: geofenceValidation 
            ? `You are ${geofenceValidation.distance}m from ${geofenceValidation.geofenceName}. Maximum allowed distance is ${geofenceValidation.allowedRadius}m.`
            : "Unable to validate location against geofence."
        });
      }

      const checkInData = {
        userId: req.user.userId,
        checkInTime: new Date(),
        status: "checked_in" as const,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        notes: notes || null
      };

      const newRecord = await storage.createAttendanceRecord(checkInData);
      res.status(201).json({ 
        record: newRecord,
        geofenceValidation
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Location coordinates are required for check-in", details: error.errors });
      }
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attendance/check-out", authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Invalid token data" });
      }

      // Find the active check-in record
      const activeRecord = await storage.getUserActiveRecord(req.user.userId);
      if (!activeRecord) {
        return res.status(400).json({ error: "No active check-in found" });
      }

      // Validate request data - coordinates are optional for check-out
      const validatedData = checkOutSchema.parse(req.body);
      const { latitude, longitude, notes } = validatedData;

      // Validate location if coordinates are provided
      let geofenceValidation = null;
      if (latitude !== undefined && longitude !== undefined) {
        const activeGeofences = await storage.getActiveGeofenceSettings();
        if (activeGeofences.length > 0) {
          geofenceValidation = GeofenceService.validateAgainstClosestGeofence(
            latitude, longitude, activeGeofences
          );
          
          // For check-out, we log violations but allow the check-out to prevent users getting stuck
          // This is a policy decision: prioritize user experience over strict geofence enforcement on exit
          if (geofenceValidation && !geofenceValidation.isValid) {
            console.warn(`🚨 Check-out outside geofence: User ${req.user.userId} is ${geofenceValidation.distance}m from ${geofenceValidation.geofenceName} (allowed: ${geofenceValidation.allowedRadius}m)`);
          }
        }
      }

      const checkOutTime = new Date();
      const totalHours = ((checkOutTime.getTime() - activeRecord.checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2);

      const updatedRecord = await storage.updateAttendanceRecord(activeRecord.id, {
        checkOutTime,
        status: "checked_out",
        totalHours,
        checkOutLatitude: latitude || null,
        checkOutLongitude: longitude || null,
        notes: notes || activeRecord.notes
      });

      res.json({ 
        record: updatedRecord,
        geofenceValidation
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Check-out error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's attendance history
  app.get("/api/attendance/history", authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Invalid token data" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const records = await storage.getUserAttendanceRecords(req.user.userId, limit);
      res.json({ records });
    } catch (error) {
      console.error("Get attendance history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's current status (checked in or out)
  app.get("/api/attendance/status", authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Invalid token data" });
      }

      const activeRecord = await storage.getUserActiveRecord(req.user.userId);
      res.json({ 
        isCheckedIn: !!activeRecord,
        activeRecord: activeRecord || null
      });
    } catch (error) {
      console.error("Get attendance status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/attendance", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const records = await storage.getAllAttendanceRecords(limit);
      res.json({ records });
    } catch (error) {
      console.error("Get all attendance records error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Geofence settings routes
  app.get("/api/geofence", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await storage.getActiveGeofenceSettings();
      res.json({ geofenceSettings: settings });
    } catch (error) {
      console.error("Get geofence settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/geofence", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertGeofenceSettingsSchema.parse(req.body);
      const newSettings = await storage.createGeofenceSettings(validatedData);
      res.status(201).json({ geofenceSettings: newSettings });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create geofence settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/geofence/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSettings = await storage.updateGeofenceSettings(id, updates);
      res.json({ geofenceSettings: updatedSettings });
    } catch (error) {
      console.error("Update geofence settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allRecords = await storage.getAllAttendanceRecords();
      
      const totalEmployees = allUsers.filter(u => u.role === 'staff').length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkedInToday = allRecords.filter(r => 
        r.checkInTime >= today && r.status === 'checked_in'
      ).length;
      
      // Calculate average hours this week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekRecords = allRecords.filter(r => 
        r.checkInTime >= weekStart && r.totalHours
      );
      
      const avgHoursThisWeek = weekRecords.length > 0 
        ? weekRecords.reduce((sum, r) => sum + parseFloat(r.totalHours || '0'), 0) / weekRecords.length
        : 0;

      const stats = {
        totalEmployees,
        checkedInToday,
        pendingApprovals: 0, // Placeholder for future approval system
        avgHoursThisWeek: Math.round(avgHoursThisWeek * 100) / 100
      };

      res.json({ stats });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}