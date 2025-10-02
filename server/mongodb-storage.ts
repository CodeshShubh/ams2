import { IStorage } from "./storage";
import { 
  UserModel, 
  AttendanceRecordModel, 
  GeofenceSettingsModel,
  MongoUser,
  MongoAttendanceRecord,
  MongoGeofenceSettings
} from "@shared/mongodb-schemas";
import { connectToMongoDB } from "./mongodb";
import type { 
  User, 
  InsertUser, 
  AttendanceRecord, 
  InsertAttendanceRecord, 
  GeofenceSettings, 
  InsertGeofenceSettings 
} from "@shared/schema";

export class MongoDBStorage implements IStorage {
  private initialized = false;

  private async ensureConnection(): Promise<void> {
    if (!this.initialized) {
      await connectToMongoDB();
      this.initialized = true;
    }
  }

  // Helper function to convert MongoDB document to schema type
  private convertUser(mongoUser: any): User {
    if (!mongoUser) return undefined as any;
    return {
      id: mongoUser._id.toString(),
      username: mongoUser.username,
      password: mongoUser.password,
      email: mongoUser.email,
      name: mongoUser.name,
      role: mongoUser.role,
      avatar: mongoUser.avatar || null,
      isActive: mongoUser.isActive,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt
    };
  }

  private convertAttendanceRecord(mongoRecord: any): AttendanceRecord {
    if (!mongoRecord) return undefined as any;
    return {
      id: mongoRecord._id.toString(),
      userId: mongoRecord.userId,
      checkInTime: mongoRecord.checkInTime,
      checkOutTime: mongoRecord.checkOutTime || null,
      checkInLatitude: mongoRecord.checkInLatitude || null,
      checkInLongitude: mongoRecord.checkInLongitude || null,
      checkOutLatitude: mongoRecord.checkOutLatitude || null,
      checkOutLongitude: mongoRecord.checkOutLongitude || null,
      totalHours: mongoRecord.totalHours || null,
      status: mongoRecord.status,
      notes: mongoRecord.notes || null,
      createdAt: mongoRecord.createdAt,
      updatedAt: mongoRecord.updatedAt
    };
  }

  private convertGeofenceSettings(mongoSettings: any): GeofenceSettings {
    if (!mongoSettings) return undefined as any;
    return {
      id: mongoSettings._id.toString(),
      name: mongoSettings.name,
      address: mongoSettings.address,
      latitude: mongoSettings.latitude,
      longitude: mongoSettings.longitude,
      radius: mongoSettings.radius,
      isActive: mongoSettings.isActive,
      createdAt: mongoSettings.createdAt,
      updatedAt: mongoSettings.updatedAt
    };
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await UserModel.findById(id);
    return user ? this.convertUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.convertUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await UserModel.findOne({ username });
    return user ? this.convertUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureConnection();
    const user = new UserModel({
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email.toLowerCase(),
      name: insertUser.name,
      role: insertUser.role || 'staff',
      avatar: insertUser.avatar || null,
      isActive: true
    });
    
    const savedUser = await user.save();
    return this.convertUser(savedUser);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    await this.ensureConnection();
    const updatedUser = await UserModel.findByIdAndUpdate(
      id, 
      { 
        ...userData,
        updatedAt: new Date()
      }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return this.convertUser(updatedUser);
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureConnection();
    const users = await UserModel.find().sort({ createdAt: -1 });
    return users.map(user => this.convertUser(user));
  }

  // Attendance records
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    await this.ensureConnection();
    const attendanceRecord = new AttendanceRecordModel({
      userId: record.userId,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime || null,
      checkInLatitude: record.checkInLatitude || null,
      checkInLongitude: record.checkInLongitude || null,
      checkOutLatitude: record.checkOutLatitude || null,
      checkOutLongitude: record.checkOutLongitude || null,
      totalHours: record.totalHours || null,
      status: record.status || 'checked_in',
      notes: record.notes || null
    });
    
    const savedRecord = await attendanceRecord.save();
    return this.convertAttendanceRecord(savedRecord);
  }

  async updateAttendanceRecord(id: string, recordData: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    await this.ensureConnection();
    const updatedRecord = await AttendanceRecordModel.findByIdAndUpdate(
      id,
      { 
        ...recordData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      throw new Error('Attendance record not found');
    }
    
    return this.convertAttendanceRecord(updatedRecord);
  }

  async getUserAttendanceRecords(userId: string, limit = 50): Promise<AttendanceRecord[]> {
    await this.ensureConnection();
    const records = await AttendanceRecordModel
      .find({ userId })
      .sort({ checkInTime: -1 })
      .limit(limit);
    
    return records.map(record => this.convertAttendanceRecord(record));
  }

  async getAttendanceRecordsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    await this.ensureConnection();
    const records = await AttendanceRecordModel.find({
      userId,
      checkInTime: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ checkInTime: -1 });
    
    return records.map(record => this.convertAttendanceRecord(record));
  }

  async getAllAttendanceRecords(limit = 100): Promise<AttendanceRecord[]> {
    await this.ensureConnection();
    const records = await AttendanceRecordModel
      .find()
      .sort({ checkInTime: -1 })
      .limit(limit);
    
    return records.map(record => this.convertAttendanceRecord(record));
  }

  async getUserActiveRecord(userId: string): Promise<AttendanceRecord | undefined> {
    await this.ensureConnection();
    const record = await AttendanceRecordModel
      .findOne({ 
        userId, 
        status: 'checked_in',
        checkOutTime: null
      })
      .sort({ checkInTime: -1 });
    
    return record ? this.convertAttendanceRecord(record) : undefined;
  }

  // Geofence settings
  async getGeofenceSettings(): Promise<GeofenceSettings[]> {
    await this.ensureConnection();
    const settings = await GeofenceSettingsModel.find().sort({ createdAt: -1 });
    return settings.map(setting => this.convertGeofenceSettings(setting));
  }

  async createGeofenceSettings(settings: InsertGeofenceSettings): Promise<GeofenceSettings> {
    await this.ensureConnection();
    const geofenceSettings = new GeofenceSettingsModel({
      name: settings.name,
      address: settings.address,
      latitude: settings.latitude,
      longitude: settings.longitude,
      radius: settings.radius || 100,
      isActive: settings.isActive !== undefined ? settings.isActive : true
    });
    
    const savedSettings = await geofenceSettings.save();
    return this.convertGeofenceSettings(savedSettings);
  }

  async updateGeofenceSettings(id: string, settingsData: Partial<GeofenceSettings>): Promise<GeofenceSettings> {
    await this.ensureConnection();
    const updatedSettings = await GeofenceSettingsModel.findByIdAndUpdate(
      id,
      { 
        ...settingsData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSettings) {
      throw new Error('Geofence settings not found');
    }
    
    return this.convertGeofenceSettings(updatedSettings);
  }

  async getActiveGeofenceSettings(): Promise<GeofenceSettings[]> {
    await this.ensureConnection();
    const settings = await GeofenceSettingsModel.find({ isActive: true });
    return settings.map(setting => this.convertGeofenceSettings(setting));
  }
}