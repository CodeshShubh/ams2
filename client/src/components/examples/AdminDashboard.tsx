import { AdminDashboard } from '../AdminDashboard';

export default function AdminDashboardExample() {
  // Mock data for demonstration
  const mockStats = {
    totalEmployees: 42,
    checkedInToday: 38,
    pendingApprovals: 3,
    avgHoursThisWeek: 41.2
  };

  const mockGeofence = {
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100,
    address: "Main Office Building, San Francisco"
  };

  return (
    <div className="p-4 space-y-4 bg-background">
      <h2 className="text-lg font-semibold">Admin Dashboard Component</h2>
      <AdminDashboard
        stats={mockStats}
        geofence={mockGeofence}
        onUpdateGeofence={(settings) => {
          console.log("Updated geofence:", settings);
        }}
        onViewReports={() => {
          console.log("View reports clicked");
        }}
        onManageUsers={() => {
          console.log("Manage users clicked");
        }}
      />
    </div>
  );
}