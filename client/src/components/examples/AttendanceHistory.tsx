import { AttendanceHistory } from '../AttendanceHistory';

export default function AttendanceHistoryExample() {
  // Mock data for demonstration
  const mockRecords = [
    {
      id: "1",
      date: "Today, Dec 27, 2024",
      checkIn: {
        time: "9:00 AM",
        location: "Office Building A",
        status: "ok" as const
      },
      checkOut: {
        time: "5:30 PM", 
        location: "Office Building A",
        status: "ok" as const
      },
      totalHours: "8h 30m",
      notes: "Regular work day"
    },
    {
      id: "2", 
      date: "Yesterday, Dec 26, 2024",
      checkIn: {
        time: "8:45 AM",
        location: "Office Building A", 
        status: "pending" as const
      },
      checkOut: {
        time: "6:00 PM",
        location: "Remote Location",
        status: "needs-approval" as const
      },
      totalHours: "9h 15m",
      notes: "Worked late on project deadline"
    },
    {
      id: "3",
      date: "Dec 25, 2024", 
      checkIn: {
        time: "9:30 AM",
        location: "Remote Location",
        status: "rejected" as const
      },
      notes: "Outside geofence area"
    }
  ];

  return (
    <div className="p-4 space-y-4 bg-background max-w-4xl">
      <h2 className="text-lg font-semibold">Attendance History Component</h2>
      <AttendanceHistory
        records={mockRecords}
        onViewDetails={(recordId) => {
          console.log(`View details for record: ${recordId}`);
        }}
      />
    </div>
  );
}