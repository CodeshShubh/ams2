import mongoose from 'mongoose';

const geofenceSettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Office Location'
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
    required: true,
    min: 1,
    max: 10000, // Maximum 10km radius
    default: 100 // Default 100 meters
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
geofenceSettingsSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
geofenceSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active geofence
geofenceSettingsSchema.statics.getActiveGeofence = function() {
  return this.findOne({ isActive: true });
};

// Instance method to calculate distance from a point
geofenceSettingsSchema.methods.calculateDistance = function(lat: number, lon: number) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = this.latitude * Math.PI / 180;
  const φ2 = lat * Math.PI / 180;
  const Δφ = (lat - this.latitude) * Math.PI / 180;
  const Δλ = (lon - this.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Instance method to check if location is within geofence
geofenceSettingsSchema.methods.isLocationWithin = function(lat: number, lon: number) {
  const distance = this.calculateDistance(lat, lon);
  return distance <= this.radius;
};

export default mongoose.models.GeofenceSettings || mongoose.model('GeofenceSettings', geofenceSettingsSchema);