const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'department', 'position', 'phone'];
    const updates = {};

    // Filter allowed updates
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let imageUrl;

    if (req.file) {
      // Upload file to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'attendance/avatars',
        public_id: `avatar_${req.user._id}_${Date.now()}`,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { format: 'auto', quality: 'auto' }
        ]
      });
      imageUrl = result.secure_url;
    } else if (req.body.image) {
      // Handle base64 image
      const result = await cloudinary.uploader.upload(req.body.image, {
        folder: 'attendance/avatars',
        public_id: `avatar_${req.user._id}_${Date.now()}`,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { format: 'auto', quality: 'auto' }
        ]
      });
      imageUrl = result.secure_url;
    }

    // Delete old avatar if exists
    const user = await User.findById(req.user._id);
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`attendance/avatars/${publicId}`);
    }

    // Update user avatar
    user.avatar = imageUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user,
        avatarUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
};

// Delete avatar
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.avatar) {
      return res.status(400).json({
        success: false,
        message: 'No avatar to delete'
      });
    }

    // Delete from Cloudinary
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`attendance/avatars/${publicId}`);

    // Update user
    user.avatar = null;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar'
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      department = '',
      isActive = ''
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (isActive !== '') filter.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// Update user by ID (admin only)
const updateUserById = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'role', 
      'department', 'position', 'phone', 'isActive'
    ];
    
    const updates = {};

    // Filter allowed updates
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Delete user by ID (admin only)
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`attendance/avatars/${publicId}`);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Get user statistics (admin only)
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
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

    const departmentStats = await User.aggregate([
      {
        $match: { department: { $ne: null, $ne: '' } }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          adminUsers: 0,
          employeeUsers: 0
        },
        departments: departmentStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserStats
};