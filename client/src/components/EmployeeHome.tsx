import { useState } from "react";
import { CheckInOutButton } from "./CheckInOutButton";
import { AttendanceHistory } from "./AttendanceHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wifi, WifiOff, Clock } from "lucide-react";

interface EmployeeHomeProps {
  user: {
    name: string;
    lastCheckIn?: string;
    lastCheckOut?: string;
    isCheckedIn: boolean;
    todayHours?: string;
  };
  isOnline?: boolean;
  currentLocation?: string;
  geofenceStatus?: "inside" | "outside" | "unknown";
}

export function EmployeeHome({ 
  user, 
  isOnline = true, 
  currentLocation,
  geofenceStatus = "unknown"
}: EmployeeHomeProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Mock attendance records for the history component
  const mockAttendanceRecords = [
    {
      id: "1",
      date: "Today, Dec 27, 2024",
      checkIn: user.lastCheckIn ? {
        time: user.lastCheckIn,
        location: "Office Building A",
        status: "ok" as const
      } : undefined,
      checkOut: user.lastCheckOut ? {
        time: user.lastCheckOut,
        location: "Office Building A", 
        status: "ok" as const
      } : undefined,
      totalHours: user.todayHours
    },
    {
      id: "2",
      date: "Yesterday, Dec 26, 2024",
      checkIn: {
        time: "8:45 AM",
        location: "Office Building A",
        status: "ok" as const
      },
      checkOut: {
        time: "6:00 PM",
        location: "Office Building A",
        status: "ok" as const  
      },
      totalHours: "9h 15m"
    }
  ];

  const handleAttendanceAction = async (type: "check-in" | "check-out", location?: GeolocationPosition) => {
    setIsLoading(true);
    console.log(`${type} action triggered`, { location });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log(`${type} completed successfully`);
    }, 2000);
  };

  const getGeofenceStatusColor = () => {
    switch (geofenceStatus) {
      case "inside": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "outside": return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Welcome back, {user.name.split(" ")[0]}!
          </CardTitle>
          <CardDescription className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">
                {isOnline ? "Connected" : "Offline"}
              </span>
            </div>
            
            {currentLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{currentLocation}</span>
                <Badge variant="outline" className={getGeofenceStatusColor()}>
                  {geofenceStatus === "inside" ? "In Range" : 
                   geofenceStatus === "outside" ? "Out of Range" : "Unknown"}
                </Badge>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        {user.todayHours && (
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Today's hours: <strong>{user.todayHours}</strong></span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Check In/Out Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <CheckInOutButton
          type="check-in"
          onAction={handleAttendanceAction}
          disabled={user.isCheckedIn}
          isLoading={isLoading}
          lastAction={user.lastCheckIn ? {
            type: "check-in",
            timestamp: user.lastCheckIn,
            location: "Office Building A"
          } : undefined}
        />
        
        <CheckInOutButton
          type="check-out"
          onAction={handleAttendanceAction}
          disabled={!user.isCheckedIn}
          isLoading={isLoading}
          lastAction={user.lastCheckOut ? {
            type: "check-out", 
            timestamp: user.lastCheckOut,
            location: "Office Building A"
          } : undefined}
        />
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Status</p>
              <p className="text-2xl font-bold">
                {user.isCheckedIn ? (
                  <span className="text-green-600">Checked In</span>
                ) : (
                  <span className="text-muted-foreground">Checked Out</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {user.isCheckedIn ? "Since" : "Last activity"}
              </p>
              <p className="font-medium">
                {user.isCheckedIn ? user.lastCheckIn : user.lastCheckOut || "No activity"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <AttendanceHistory
        records={mockAttendanceRecords}
        onViewDetails={(recordId) => {
          console.log(`View attendance record details: ${recordId}`);
        }}
      />

      {/* Bottom spacing for mobile tab bar */}
      <div className="h-20 md:h-0" />
    </div>
  );
}