import { storage } from "./storage";
import { AuthService } from "./auth";

export async function seedDatabase() {
  // Only seed in development environment
  if (process.env.NODE_ENV !== 'development') {
    console.log("🔒 Skipping database seeding in production environment");
    return;
  }

  console.log("🌱 Starting database seeding...");
  
  try {
    // Check if users already exist
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length > 0) {
      console.log("✅ Database already has users, skipping seed");
      return;
    }

    // Create admin user
    const adminPassword = await AuthService.hashPassword("admin123");
    const adminUser = await storage.createUser({
      name: "Admin User",
      username: "admin",
      email: "admin@company.com",
      password: adminPassword,
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    });
    console.log("✅ Created admin user:", adminUser.email);

    // Create staff user
    const staffPassword = await AuthService.hashPassword("john123");
    const staffUser = await storage.createUser({
      name: "John Doe",
      username: "john",
      email: "john@company.com", 
      password: staffPassword,
      role: "staff",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    });
    console.log("✅ Created staff user:", staffUser.email);

    // Create default geofence setting
    const defaultGeofence = await storage.createGeofenceSettings({
      name: "Main Office",
      address: "Main Office Building, San Francisco",
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      isActive: true
    });
    console.log("✅ Created default geofence:", defaultGeofence.name);

    console.log("🎉 Database seeding completed successfully!");
    
    // Log the credentials for easy access
    console.log("\n📋 Default Login Credentials:");
    console.log("Admin: admin@company.com / admin123");
    console.log("Staff: john@company.com / john123");
    
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
  }
}