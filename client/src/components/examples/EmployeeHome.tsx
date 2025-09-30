import { EmployeeHome } from '../EmployeeHome';

export default function EmployeeHomeExample() {
  const mockUser = {
    name: "John Doe",
    lastCheckIn: "Today, 9:00 AM",
    lastCheckOut: "Yesterday, 5:30 PM",
    isCheckedIn: true,
    todayHours: "8h 30m"
  };

  return (
    <div className="p-4 space-y-4 bg-background">
      <h2 className="text-lg font-semibold">Employee Home Component</h2>
      <EmployeeHome
        user={mockUser}
        isOnline={true}
        currentLocation="Office Building A, San Francisco"
        geofenceStatus="inside"
      />
    </div>
  );
}