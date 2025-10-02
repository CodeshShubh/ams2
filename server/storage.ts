import { User, InsertUser, AttendanceRecord, InsertAttendanceRecord, GeofenceSettings, InsertGeofenceSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { MongoDBStorage } from "./mongodb-storage";

// Storage interface for attendance management system
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Attendance records
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  getUserAttendanceRecords(userId: string, limit?: number): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
  getAllAttendanceRecords(limit?: number): Promise<AttendanceRecord[]>;
  getUserActiveRecord(userId: string): Promise<AttendanceRecord | undefined>;
  
  // Geofence settings
  getGeofenceSettings(): Promise<GeofenceSettings[]>;
  createGeofenceSettings(settings: InsertGeofenceSettings): Promise<GeofenceSettings>;
  updateGeofenceSettings(id: string, settings: Partial<GeofenceSettings>): Promise<GeofenceSettings>;
  getActiveGeofenceSettings(): Promise<GeofenceSettings[]>;
}

class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map();
  private geofenceSettings: Map<string, GeofenceSettings> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      role: insertUser.role || "staff",
      avatar: insertUser.avatar || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = randomUUID();
    const newRecord: AttendanceRecord = {
      ...record,
      id,
      status: record.status || "checked_in",
      checkOutTime: record.checkOutTime || null,
      checkInLatitude: record.checkInLatitude || null,
      checkInLongitude: record.checkInLongitude || null,
      checkOutLatitude: record.checkOutLatitude || null,
      checkOutLongitude: record.checkOutLongitude || null,
      totalHours: record.totalHours || null,
      notes: record.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.attendanceRecords.set(id, newRecord);
    return newRecord;
  }
  
  async updateAttendanceRecord(id: string, recordData: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const record = this.attendanceRecords.get(id);
    if (!record) throw new Error('Attendance record not found');
    const updatedRecord = { ...record, ...recordData, updatedAt: new Date() };
    this.attendanceRecords.set(id, updatedRecord);
    return updatedRecord;
  }
  
  async getUserAttendanceRecords(userId: string, limit = 50): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime())
      .slice(0, limit);
  }
  
  async getAttendanceRecordsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(r => 
      r.userId === userId && 
      r.checkInTime >= startDate && 
      r.checkInTime <= endDate
    );
  }
  
  async getAllAttendanceRecords(limit = 100): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values())
      .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime())
      .slice(0, limit);
  }
  
  async getUserActiveRecord(userId: string): Promise<AttendanceRecord | undefined> {
    return Array.from(this.attendanceRecords.values()).find(r => 
      r.userId === userId && r.status === 'checked_in' && !r.checkOutTime
    );
  }
  
  async getGeofenceSettings(): Promise<GeofenceSettings[]> {
    return Array.from(this.geofenceSettings.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createGeofenceSettings(settings: InsertGeofenceSettings): Promise<GeofenceSettings> {
    const id = randomUUID();
    const newSettings: GeofenceSettings = {
      ...settings,
      id,
      isActive: settings.isActive !== undefined ? settings.isActive : true,
      radius: settings.radius || 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.geofenceSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateGeofenceSettings(id: string, settingsData: Partial<GeofenceSettings>): Promise<GeofenceSettings> {
    const settings = this.geofenceSettings.get(id);
    if (!settings) throw new Error('Geofence settings not found');
    const updatedSettings = { ...settings, ...settingsData, updatedAt: new Date() };
    this.geofenceSettings.set(id, updatedSettings);
    return updatedSettings;
  }
  
  async getActiveGeofenceSettings(): Promise<GeofenceSettings[]> {
    return Array.from(this.geofenceSettings.values()).filter(s => s.isActive);
  }
}

// Create storage instance based on environment
function createStorage(): IStorage {
  const mongoUri = process.env.MONGODB_URI;
  
  if (mongoUri) {
    console.log('📊 Using MongoDB storage');
    return new MongoDBStorage();
  } else {
    console.log('📊 Using in-memory storage (MONGODB_URI not set)');
    return new MemStorage();
  }
}

export const storage = createStorage();

// Database storage implementation - will be activated after schema push
// Uncomment and import db dependencies when ready to switch to database
/*
import { users, attendanceRecords, geofenceSettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const [updatedRecord] = await db.update(attendanceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async getUserAttendanceRecords(userId: string, limit = 50): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(eq(attendanceRecords.userId, userId))
      .orderBy(desc(attendanceRecords.checkInTime))
      .limit(limit);
  }

  async getAttendanceRecordsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.checkInTime, startDate),
        lte(attendanceRecords.checkInTime, endDate)
      ));
  }

  async getAllAttendanceRecords(limit = 100): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .orderBy(desc(attendanceRecords.checkInTime))
      .limit(limit);
  }

  async getUserActiveRecord(userId: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.status, 'checked_in')
      ))
      .orderBy(desc(attendanceRecords.checkInTime))
      .limit(1);
    return record || undefined;
  }

  async getGeofenceSettings(): Promise<GeofenceSettings[]> {
    return await db.select().from(geofenceSettings).orderBy(desc(geofenceSettings.createdAt));
  }

  async createGeofenceSettings(settings: InsertGeofenceSettings): Promise<GeofenceSettings> {
    const [newSettings] = await db.insert(geofenceSettings).values(settings).returning();
    return newSettings;
  }

  async updateGeofenceSettings(id: string, settings: Partial<GeofenceSettings>): Promise<GeofenceSettings> {
    const [updatedSettings] = await db.update(geofenceSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(geofenceSettings.id, id))
      .returning();
    return updatedSettings;
  }

  async getActiveGeofenceSettings(): Promise<GeofenceSettings[]> {
    return await db.select().from(geofenceSettings).where(eq(geofenceSettings.isActive, true));
  }
}

// Export database storage when ready
// export const storage = new DatabaseStorage();
*/

