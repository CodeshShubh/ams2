import { UserModel, GeofenceSettingsModel } from "@shared/mongodb-schemas";
import { connectToMongoDB } from "./mongodb";
import { AuthService } from "./auth";

export async function seedMongoDB(): Promise<void> {
  try {
    await connectToMongoDB();
    console.log('🌱 Starting MongoDB database seeding...');

    // Check if admin user already exists
    const existingAdmin = await UserModel.findOne({ email: 'admin@company.com' });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new UserModel({
        username: 'admin',
        email: 'admin@company.com',
        password: await AuthService.hashPassword('admin123'),
        name: 'Admin User',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Created admin user: admin@company.com');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if staff user already exists
    const existingStaff = await UserModel.findOne({ email: 'john@company.com' });
    if (!existingStaff) {
      // Create staff user
      const staffUser = new UserModel({
        username: 'john',
        email: 'john@company.com',
        password: await AuthService.hashPassword('john123'),
        name: 'John Doe',
        role: 'staff',
        isActive: true
      });
      await staffUser.save();
      console.log('✅ Created staff user: john@company.com');
    } else {
      console.log('ℹ️ Staff user already exists');
    }

    // Check if geofence already exists
    const existingGeofence = await GeofenceSettingsModel.findOne({ name: 'Main Office' });
    if (!existingGeofence) {
      // Create default geofence
      const geofenceSettings = new GeofenceSettingsModel({
        name: 'Main Office',
        address: '123 Main Street, Business District',
        latitude: 40.7128,  // New York coordinates
        longitude: -74.0060,
        radius: 100,
        isActive: true
      });
      await geofenceSettings.save();
      console.log('✅ Created default geofence: Main Office');
    } else {
      console.log('ℹ️ Geofence already exists');
    }

    console.log('🎉 MongoDB database seeding completed successfully!');
    console.log('📋 Default Login Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('Staff: john@company.com / john123');

  } catch (error) {
    console.error('❌ MongoDB seeding failed:', error);
    throw error;
  }
}