const Attendance = require('../models/Attendance');
const GeofenceSettings = require('../models/GeofenceSettings');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Check in
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user._id;
    const employeeId = req.user.employeeId;

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today'
      });
    }

    // Get active geofence settings
    const geofence = await GeofenceSettings.getActiveGeofence();
    if (!geofence) {
      return res.status(400).json({
        success: false,
        message: 'No active geofence configured. Please contact administrator.'
      });
    }

    // Validate location is within geofence
    const isWithinGeofence = geofence.isLocationWithin(latitude, longitude);
    if (!isWithinGeofence) {
      const distance = geofence.calculateDistance(latitude, longitude);
      return res.status(400).json({
        success: false,
        message: `You are ${Math.round(distance)}m away from the office. Please check in from the office location.`,
        data: {
          distance: Math.round(distance),
          requiredRadius: geofence.radius
        }
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      employeeId,
      date: today,
      checkInTime: new Date(),
      checkInLocation: {
        latitude,
        longitude,
        address: address || ''
      },
      status: 'checked-in'
    });

    await attendance.save();

    // Populate user data
    await attendance.populate('userId', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: { attendance }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in'
    });
  }
};

// Check out
const checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address, notes } = req.body;
    const userId = req.user._id;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow },
      status: 'checked-in'
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found for today'
      });
    }

    // Get active geofence settings
    const geofence = await GeofenceSettings.getActiveGeofence();
    if (geofence) {
      // Validate location is within geofence
      const isWithinGeofence = geofence.isLocationWithin(latitude, longitude);
      if (!isWithinGeofence) {
        const distance = geofence.calculateDistance(latitude, longitude);
        return res.status(400).json({
          success: false,
          message: `You are ${Math.round(distance)}m away from the office. Please check out from the office location.`,
          data: {
            distance: Math.round(distance),
            requiredRadius: geofence.radius
          }
        });
      }
    }

    // Update attendance record
    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      latitude,
      longitude,
      address: address || ''
    };
    attendance.notes = notes || '';
    attendance.status = 'checked-out';

    await attendance.save();

    // Populate user data
    await attendance.populate('userId', 'firstName lastName employeeId');

    res.json({
      success: true,
      message: 'Check-out successful',
      data: { attendance }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out'
    });
  }
};

// Upload attendance photo
const uploadAttendancePhoto = async (req, res) => {
  try {
    const { attendanceId, photoType, image } = req.body;

    if (!attendanceId || !photoType || !image) {
      return res.status(400).json({
        success: false,
        message: 'Attendance ID, photo type, and image are required'
      });
    }

    if (!['checkin', 'checkout'].includes(photoType)) {
      return res.status(400).json({
        success: false,
        message: 'Photo type must be either checkin or checkout'
      });
    }

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Verify ownership
    if (attendance.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'attendance/photos',
      public_id: `${photoType}_${attendanceId}_${Date.now()}`,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { format: 'auto', quality: 'auto' }
      ]
    });

    // Update attendance record
    if (photoType === 'checkin') {
      attendance.checkInPhoto = result.secure_url;
    } else {
      attendance.checkOutPhoto = result.secure_url;
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        photoUrl: result.secure_url,
        attendance
      }
    });
  } catch (error) {
    console.error('Upload attendance photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo'
    });
  }
};

// Get current attendance status
const getCurrentStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get today's attendance
    const todayAttendance = await Attendance.getTodayAttendance(userId);

    // Get active geofence
    const geofence = await GeofenceSettings.getActiveGeofence();

    res.json({
      success: true,
      data: {
        attendance: todayAttendance,
        geofence,
        isCheckedIn: todayAttendance && todayAttendance.status === 'checked-in'
      }
    });
  } catch (error) {
    console.error('Get current status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance status'
    });
  }
};

// Get attendance history
const getAttendanceHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      status
    } = req.query;

    const userId = req.user._id;

    // Build filter
    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get attendance records
    const attendanceRecords = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName employeeId');

    const total = await Attendance.countDocuments(filter);

    // Calculate statistics
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' },
          checkedOutDays: {
            $sum: { $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        records: attendanceRecords,
        statistics: stats[0] || {
          totalDays: 0,
          totalHours: 0,
          averageHours: 0,
          checkedOutDays: 0
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history'
    });
  }
};

// Get monthly summary
const getMonthlySummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    const userId = req.user._id;

    const stats = await Attendance.getMonthlyStats(userId, parseInt(year), parseInt(month));

    // Get daily breakdown
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const dailyRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalDays: 0,
          totalHours: 0,
          averageHours: 0,
          checkedOutDays: 0
        },
        dailyRecords,
        month: parseInt(month),
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly summary'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  uploadAttendancePhoto,
  getCurrentStatus,
  getAttendanceHistory,
  getMonthlySummary
};