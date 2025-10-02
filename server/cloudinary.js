import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create upload preset for unsigned uploads (frontend direct uploads)
async function createUploadPreset() {
  try {
    await cloudinary.api.create_upload_preset({
      name: 'attendance_avatars',
      unsigned: true,
      folder: 'attendance/avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      max_file_size: 5000000, // 5MB
    });
    console.log('✅ Cloudinary upload preset created: attendance_avatars');
  } catch (error) {
    if (error.error && error.error.message.includes('already exists')) {
      console.log('ℹ️ Cloudinary upload preset already exists: attendance_avatars');
    } else {
      console.error('❌ Error creating Cloudinary upload preset:', error);
    }
  }
}

// Initialize Cloudinary setup
async function initializeCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('⚠️ Cloudinary credentials not found. Image uploads will not work.');
    return;
  }

  console.log('🌤️ Initializing Cloudinary...');
  await createUploadPreset();
}

export {
  cloudinary,
  initializeCloudinary
};