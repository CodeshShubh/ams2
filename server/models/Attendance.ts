import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  checkInLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  checkOutLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      default: ''
    }
  },
  checkInPhoto: {
    type: String, // Cloudinary URL
    default: null
  },
  checkOutPhoto: {
    type: String, // Cloudinary URL
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out', 'incomplete'],
    default: 'checked-in'
  },
  notes: {
    type: String,
    default: ''
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  approvedBy: {
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

// Indexes for performance
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Calculate total hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const timeDiff = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.totalHours = parseFloat((timeDiff / (1000 * 60 * 60)).toFixed(2));
    
    if (this.status === 'checked-in') {
      this.status = 'checked-out';
    }
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to get attendance by date range
attendanceSchema.statics.getByDateRange = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    userId: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get today's attendance
attendanceSchema.statics.getTodayAttendance = function(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.findOne({
    userId: userId,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  });
};

// Static method to get monthly stats
attendanceSchema.statics.getMonthlyStats = function(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        totalHours: { $sum: '$totalHours' },
        averageHours: { $avg: '$totalHours' },
        checkedOutDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);