import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

type AttendanceType = "check-in" | "check-out";

interface CheckInOutButtonProps {
  type: AttendanceType;
  onAction?: (type: AttendanceType, location?: GeolocationPosition) => void;
  disabled?: boolean;
  isLoading?: boolean;
  lastAction?: {
    type: AttendanceType;
    timestamp: string;
    location?: string;
  };
}

export function CheckInOutButton({ 
  type, 
  onAction, 
  disabled = false, 
  isLoading = false,
  lastAction 
}: CheckInOutButtonProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const isCheckIn = type === "check-in";
  
  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsGettingLocation(true);
    console.log(`${type} button clicked`);
    
    // Mock geolocation for demo
    setTimeout(() => {
      const mockLocation = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10
        },
        timestamp: Date.now()
      } as GeolocationPosition;
      
      onAction?.(type, mockLocation);
      setIsGettingLocation(false);
    }, 1500);
  };

  const buttonLoading = isLoading || isGettingLocation;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isCheckIn ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}>
              {isCheckIn ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold">
              {isCheckIn ? "Check In" : "Check Out"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCheckIn ? "Start your work day" : "End your work day"}
            </p>
          </div>

          <Button
            onClick={handleClick}
            disabled={disabled || buttonLoading}
            size="lg"
            className={`w-full h-12 text-lg font-medium ${
              isCheckIn 
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' 
                : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
            }`}
            data-testid={`button-${type}`}
          >
            {buttonLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {isGettingLocation ? 'Getting Location...' : 'Processing...'}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                {isCheckIn ? "Check In Now" : "Check Out Now"}
              </>
            )}
          </Button>

          {lastAction && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last {lastAction.type}: {lastAction.timestamp}</span>
              </div>
              {lastAction.location && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{lastAction.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}