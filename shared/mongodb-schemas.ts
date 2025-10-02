import mongoose, { Schema, Document } from 'mongoose';

// User interface and schema
export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'staff'], 
    default: 'staff' 
  },
  avatar: { 
    type: String, 
    default: null 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Attendance Record interface and schema
export interface IAttendanceRecord extends Document {
  _id: string;
  userId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  totalHours?: string;
  status: 'checked_in' | 'checked_out' | 'break';
  notes?: string;
  checkInPhoto?: string; // New field for camera functionality
  checkOutPhoto?: string; // New field for camera functionality
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  userId: { 
    type: String, 
    required: true,
    ref: 'User' 
  },
  checkInTime: { 
    type: Date, 
    required: true 
  },
  checkOutTime: { 
    type: Date, 
    default: null 
  },
  checkInLatitude: { 
    type: Number, 
    default: null 
  },
  checkInLongitude: { 
    type: Number, 
    default: null 
  },
  checkOutLatitude: { 
    type: Number, 
    default: null 
  },
  checkOutLongitude: { 
    type: Number, 
    default: null 
  },
  totalHours: { 
    type: String, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['checked_in', 'checked_out', 'break'], 
    default: 'checked_in' 
  },
  notes: { 
    type: String, 
    default: null,
    trim: true 
  },
  checkInPhoto: { 
    type: String, 
    default: null 
  },
  checkOutPhoto: { 
    type: String, 
    default: null 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Geofence Settings interface and schema
export interface IGeofenceSettings extends Document {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const geofenceSettingsSchema = new Schema<IGeofenceSettings>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  address: { 
    type: String, 
    required: true,
    trim: true 
  },
  latitude: { 
    type: Number, 
    required: true,
    min: -90,
    max: 90 
  },
  longitude: { 
    type: Number, 
    required: true,
    min: -180,
    max: 180 
  },
  radius: { 
    type: Number, 
    default: 100,
    min: 1 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create indexes for better performance (avoiding duplicates with unique: true)
attendanceRecordSchema.index({ userId: 1, checkInTime: -1 });
attendanceRecordSchema.index({ status: 1 });

// Export models
export const UserModel = mongoose.model<IUser>('User', userSchema);
export const AttendanceRecordModel = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
export const GeofenceSettingsModel = mongoose.model<IGeofenceSettings>('GeofenceSettings', geofenceSettingsSchema);

// Type compatibility interfaces to match existing schema types
export interface MongoUser {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoAttendanceRecord {
  id: string;
  userId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  totalHours: string | null;
  status: 'checked_in' | 'checked_out' | 'break';
  notes: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoGeofenceSettings {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}