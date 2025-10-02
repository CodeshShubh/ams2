const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const configureCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    console.log('🌤️ Cloudinary configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary configuration failed:', error);
    return false;
  }
};

// Create upload preset if it doesn't exist
const createUploadPreset = async () => {
  try {
    // Check if preset already exists
    const presets = await cloudinary.api.upload_presets();
    const existingPreset = presets.presets.find(p => p.name === 'attendance_uploads');
    
    if (existingPreset) {
      console.log('✅ Cloudinary upload preset already exists');
      return;
    }

    // Create new preset
    await cloudinary.api.create_upload_preset({
      name: 'attendance_uploads',
      unsigned: true,
      folder: 'attendance',
      allowed_formats: 'jpg,png,jpeg,gif,webp',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { format: 'auto', quality: 'auto' }
      ]
    });

    console.log('✅ Cloudinary upload preset created successfully');
  } catch (error) {
    if (error.http_code === 409) {
      console.log('✅ Cloudinary upload preset already exists');
    } else {
      console.error('❌ Error creating Cloudinary upload preset:', error);
    }
  }
};

// Initialize Cloudinary
const initializeCloudinary = async () => {
  const isConfigured = configureCloudinary();
  if (isConfigured) {
    await createUploadPreset();
  }
};

module.exports = {
  configureCloudinary,
  createUploadPreset,
  initializeCloudinary
};