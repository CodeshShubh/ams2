const User = require('../models/User');
const Attendance = require('../models/Attendance');
const GeofenceSettings = require('../models/GeofenceSettings');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          employeeUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'employee'] }, 1, 0] }
          }
        }
      }
    ]);

    // Today's attendance statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalCheckIns: { $sum: 1 },
          checkedOut: {
            $sum: { $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0] }
          },
          stillCheckedIn: {
            $sum: { $cond: [{ $eq: ['$status', 'checked-in'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' }
        }
      }
    ]);

    // Weekly attendance trend
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTrend = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: weekAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Department attendance
    const departmentStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          employeeUsers: 0
        },
        attendance: attendanceStats[0] || {
          totalCheckIns: 0,
          checkedOut: 0,
          stillCheckedIn: 0,
          totalHours: 0,
          averageHours: 0
        },
        weeklyTrend,
        departments: departmentStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics'
    });
  }
};

// Get all attendance records (admin view)
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
      department,
      employeeId,
      search
    } = req.query;

    // Build filter
    let filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = { $regex: employeeId, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    // Add filters
    if (department) {
      pipeline.push({
        $match: { 'user.department': { $regex: department, $options: 'i' } }
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.firstName': { $regex: search, $options: 'i' } },
            { 'user.lastName': { $regex: search, $options: 'i' } },
            { 'user.employeeId': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Sort and paginate
    pipeline.push(
      { $sort: { date: -1, checkInTime: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const attendanceRecords = await Attendance.aggregate(pipeline);

    // Get total count
    const countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.push({ $count: 'total' });

    const totalResult = await Attendance.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        records: attendanceRecords,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records'
    });
  }
};

// Generate attendance report
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json', department } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build filter
    const filter = {
      date: { $gte: start, $lte: end }
    };

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    if (department) {
      pipeline.push({
        $match: { 'user.department': { $regex: department, $options: 'i' } }
      });
    }

    // Get detailed records
    const records = await Attendance.aggregate([
      ...pipeline,
      { $sort: { 'user.employeeId': 1, date: 1 } }
    ]);

    // Get summary statistics
    const summary = await Attendance.aggregate([
      ...pipeline,
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' },
          onTimeCheckIns: {
            $sum: {
              $cond: [
                {
                  $lte: [
                    { $hour: '$checkInTime' },
                    9 // Assuming 9 AM is on time
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Employee-wise summary
    const employeeSummary = await Attendance.aggregate([
      ...pipeline,
      {
        $group: {
          _id: '$userId',
          employee: { $first: '$user' },
          totalDays: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' },
          checkedOutDays: {
            $sum: { $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0] }
          }
        }
      },
      { $sort: { 'employee.employeeId': 1 } }
    ]);

    const reportData = {
      period: {
        startDate: start,
        endDate: end,
        department: department || 'All Departments'
      },
      summary: summary[0] || {
        totalRecords: 0,
        totalHours: 0,
        averageHours: 0,
        onTimeCheckIns: 0
      },
      employeeSummary,
      detailedRecords: records,
      generatedAt: new Date(),
      generatedBy: req.user.employeeId
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

// Get geofence settings
const getGeofenceSettings = async (req, res) => {
  try {
    const geofence = await GeofenceSettings.getActiveGeofence();

    res.json({
      success: true,
      data: { geofence }
    });
  } catch (error) {
    console.error('Get geofence settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geofence settings'
    });
  }
};

// Update geofence settings
const updateGeofenceSettings = async (req, res) => {
  try {
    const { name, latitude, longitude, radius, address } = req.body;

    // Deactivate existing geofences
    await GeofenceSettings.updateMany({}, { isActive: false });

    // Create new geofence
    const geofence = new GeofenceSettings({
      name,
      latitude,
      longitude,
      radius,
      address,
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await geofence.save();

    res.json({
      success: true,
      message: 'Geofence settings updated successfully',
      data: { geofence }
    });
  } catch (error) {
    console.error('Update geofence settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update geofence settings'
    });
  }
};

// Get system health
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'connected',
        cloudinary: 'connected'
      },
      stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllAttendance,
  generateReport,
  getGeofenceSettings,
  updateGeofenceSettings,
  getSystemHealth
};