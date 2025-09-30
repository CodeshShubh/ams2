import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckInOutButton } from "@/components/CheckInOutButton";
import { AttendanceCamera } from "@/components/AttendanceCamera";
import { useAppSelector, useAppDispatch } from "@/store";
import { 
  selectIsCheckedIn, 
  selectCurrentRecord, 
  selectAttendanceLoading,
  selectAttendanceError,
  getAttendanceStatus,
  checkIn,
  checkOut
} from "@/store/slices/attendanceSlice";
import { selectUser } from "@/store/slices/authSlice";
import { selectGeofenceSettings } from "@/store/slices/adminSlice";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Calendar, Timer, Wifi, WifiOff, Camera, AlertTriangle } from "lucide-react";
import { formatDistance } from "date-fns";

export function EmployeeDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isCheckedIn = useAppSelector(selectIsCheckedIn);
  const currentRecord = useAppSelector(selectCurrentRecord);
  const isLoading = useAppSelector(selectAttendanceLoading);
  const error = useAppSelector(selectAttendanceError);
  const geofenceSettings = useAppSelector(selectGeofenceSettings);
  const { toast } = useToast();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOnline] = useState(navigator.onLine);
  const [showCamera, setShowCamera] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError("Location access denied or unavailable");
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Load attendance status on component mount
  useEffect(() => {
    dispatch(getAttendanceStatus());
  }, [dispatch]);

  const handleCheckIn = async () => {
    if (!location) {
      setLocationError("Location is required for check-in");
      return;
    }

    try {
      await dispatch(checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
        notes: "Check-in from dashboard"
      })).unwrap();
    } catch (error) {
      console.error("Check-in failed:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await dispatch(checkOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
        notes: "Check-out from dashboard"
      })).unwrap();
    } catch (error) {
      console.error("Check-out failed:", error);
    }
  };

  const getWorkDuration = () => {
    if (!currentRecord?.checkInTime) return "00:00:00";
    
    const checkInTime = new Date(currentRecord.checkInTime);
    const now = new Date();
    const diff = now.getTime() - checkInTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGeofenceStatus = () => {
    // This would normally check against actual geofence coordinates
    // For now, returning a mock status
    return location ? "inside" : "unknown";
  };

  return (
    <div className="space-y-6" data-testid="employee-dashboard">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-welcome">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <p className="text-2xl font-mono" data-testid="text-current-time">
          {currentTime.toLocaleTimeString()}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Check-in Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge 
                variant={isCheckedIn ? "default" : "secondary"}
                data-testid={`badge-status-${isCheckedIn ? 'checked-in' : 'checked-out'}`}
              >
                {isCheckedIn ? "Checked In" : "Checked Out"}
              </Badge>
              {isCheckedIn && currentRecord?.checkInTime && (
                <p className="text-sm text-muted-foreground">
                  Since {new Date(currentRecord.checkInTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge 
                variant={getGeofenceStatus() === "inside" ? "default" : "destructive"}
                data-testid="badge-location-status"
              >
                {location ? "Location Available" : "Location Unavailable"}
              </Badge>
              {locationError && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={isOnline ? "default" : "destructive"} data-testid="badge-connection-status">
                {isOnline ? "Online" : "Offline"}
              </Badge>
              {!isOnline && (
                <p className="text-sm text-muted-foreground">
                  Data will sync when connection is restored
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Work Session */}
      {isCheckedIn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Current Work Session
            </CardTitle>
            <CardDescription>
              You checked in at {currentRecord?.checkInTime ? new Date(currentRecord.checkInTime).toLocaleTimeString() : 'Unknown time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold" data-testid="text-work-duration">
                  {getWorkDuration()}
                </div>
                <p className="text-muted-foreground">Hours worked today</p>
              </div>
              
              {currentRecord?.checkInLatitude && currentRecord?.checkInLongitude && (
                <div className="text-sm text-muted-foreground text-center">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Checked in from: {currentRecord.checkInLatitude.toFixed(6)}, {currentRecord.checkInLongitude.toFixed(6)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-in/Check-out Button */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {isCheckedIn ? (
            <Button
              onClick={handleCheckOut}
              disabled={isLoading}
              size="lg"
              variant="destructive"
              className="w-full h-16 text-lg"
              data-testid="button-check-out"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Checking Out...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check Out
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckIn}
              disabled={isLoading || !location}
              size="lg"
              className="w-full h-16 text-lg"
              data-testid="button-check-in"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Checking In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check In
                  {!location && <AlertTriangle className="h-4 w-4 ml-2" />}
                </div>
              )}
            </Button>
          )}
          
          {!location && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Location access required for check-in
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover-elevate" data-testid="card-view-history">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-medium">View History</h3>
              <p className="text-sm text-muted-foreground">
                Check your attendance records
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover-elevate" data-testid="card-camera-check">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-medium">Photo Check-in</h3>
              <p className="text-sm text-muted-foreground">
                Take photo during attendance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}