import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCamera } from '@/hooks/useCamera';
import { useGeolocation } from '@/hooks/useGeolocation';
import { isWithinGeofence, getGeofenceStatusMessage, type GeofenceLocation } from '@/utils/geofence';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface AttendanceCameraProps {
  geofence: GeofenceLocation;
  onCapture: (photo: Blob, location: { latitude: number; longitude: number }) => void;
  isCheckingIn?: boolean;
  disabled?: boolean;
}

export function AttendanceCamera({ 
  geofence, 
  onCapture, 
  isCheckingIn = true,
  disabled = false 
}: AttendanceCameraProps) {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const {
    isActive: cameraActive,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  } = useCamera();

  const {
    coordinates,
    error: locationError,
    loading: locationLoading,
    getCurrentPosition,
  } = useGeolocation();

  // Check geofence status
  const geofenceStatus = coordinates 
    ? isWithinGeofence(coordinates.latitude, coordinates.longitude, geofence)
    : null;

  const canTakePhoto = geofenceStatus?.isInside && cameraActive && !disabled;

  useEffect(() => {
    // Clean up camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleStartCamera = async () => {
    try {
      await startCamera();
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const handleCapturePhoto = async () => {
    if (!canTakePhoto) {
      toast({
        title: "Cannot take photo",
        description: geofenceStatus?.isInside 
          ? "Camera not ready" 
          : "You must be at the office location to take attendance photo",
        variant: "destructive"
      });
      return;
    }

    setIsCapturing(true);
    
    try {
      // Get current precise location
      const currentLocation = await getCurrentPosition();
      
      // Verify we're still in geofence with fresh location
      const freshGeofenceCheck = isWithinGeofence(
        currentLocation.latitude, 
        currentLocation.longitude, 
        geofence
      );

      if (!freshGeofenceCheck.isInside) {
        throw new Error('You have moved outside the allowed area');
      }

      // Capture photo
      const photoBlob = await capturePhoto();
      
      // Create preview URL
      const photoUrl = URL.createObjectURL(photoBlob);
      setCapturedPhoto(photoUrl);

      // Call parent handler
      onCapture(photoBlob, currentLocation);

      toast({
        title: "Photo captured",
        description: `Attendance ${isCheckingIn ? 'check-in' : 'check-out'} photo taken successfully`,
      });

    } catch (error) {
      console.error('Photo capture failed:', error);
      toast({
        title: "Capture failed",
        description: error instanceof Error ? error.message : "Failed to capture photo",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const resetCapture = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Attendance {isCheckingIn ? 'Check-in' : 'Check-out'}
        </CardTitle>
        <CardDescription>
          Take a photo for attendance verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Location Status</span>
          </div>
          {locationLoading ? (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </Badge>
          ) : locationError ? (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          ) : geofenceStatus ? (
            <Badge variant={geofenceStatus.isInside ? "default" : "destructive"}>
              {geofenceStatus.isInside ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {geofenceStatus.isInside ? "At Office" : "Outside"}
            </Badge>
          ) : null}
        </div>

        {coordinates && geofenceStatus && (
          <p className="text-sm text-muted-foreground text-center">
            {getGeofenceStatusMessage(
              geofenceStatus.isInside, 
              geofenceStatus.distance, 
              geofence.name
            )}
          </p>
        )}

        {/* Camera View */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                data-testid="camera-video"
              />
              {!geofenceStatus?.isInside && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <XCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Must be at office location</p>
                  </div>
                </div>
              )}
            </>
          ) : capturedPhoto ? (
            <img 
              src={capturedPhoto} 
              alt="Captured attendance photo" 
              className="w-full h-full object-cover"
              data-testid="captured-photo"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {(cameraError || locationError) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {cameraError || locationError}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!cameraActive && !capturedPhoto && (
            <Button 
              onClick={handleStartCamera} 
              className="flex-1"
              disabled={disabled}
              data-testid="button-start-camera"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          )}

          {cameraActive && !capturedPhoto && (
            <>
              <Button 
                onClick={handleCapturePhoto}
                disabled={!canTakePhoto || isCapturing}
                className="flex-1"
                data-testid="button-capture-photo"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={switchCamera}
                disabled={disabled}
                data-testid="button-switch-camera"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={stopCamera}
                disabled={disabled}
                data-testid="button-stop-camera"
              >
                <CameraOff className="h-4 w-4" />
              </Button>
            </>
          )}

          {capturedPhoto && (
            <>
              <Button 
                variant="outline" 
                onClick={resetCapture}
                className="flex-1"
                data-testid="button-retake-photo"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
            </>
          )}
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}