import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector, useAppDispatch } from "@/store";
import { 
  selectGeofenceSettings, 
  selectGeofenceLoading,
  getGeofenceSettings,
  createGeofenceSettings,
  updateGeofenceSettings
} from "@/store/slices/adminSlice";
import { 
  MapPin, 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database,
  Save,
  Plus,
  Trash2
} from "lucide-react";

export function Settings() {
  const dispatch = useAppDispatch();
  const geofenceSettings = useAppSelector(selectGeofenceSettings);
  const isLoading = useAppSelector(selectGeofenceLoading);
  const [geofenceForm, setGeofenceForm] = useState({
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    radius: 100,
    isActive: true
  });

  useEffect(() => {
    dispatch(getGeofenceSettings());
  }, [dispatch]);

  const handleSaveGeofence = async () => {
    try {
      if (geofenceSettings.length === 0) {
        await dispatch(createGeofenceSettings(geofenceForm)).unwrap();
      } else {
        await dispatch(updateGeofenceSettings({
          id: geofenceSettings[0].id,
          updates: geofenceForm
        })).unwrap();
      }
    } catch (error) {
      console.error("Failed to save geofence settings:", error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeofenceForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-6" data-testid="settings">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="geofence" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geofence">Geofence</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Geofence Settings */}
        <TabsContent value="geofence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geofence Configuration
              </CardTitle>
              <CardDescription>
                Define office location boundaries for attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Geofence Settings */}
              {geofenceSettings.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Current Settings</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span> {geofenceSettings[0].name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span> {geofenceSettings[0].address}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coordinates:</span> {geofenceSettings[0].latitude.toFixed(6)}, {geofenceSettings[0].longitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Radius:</span> {geofenceSettings[0].radius}m
                    </div>
                  </div>
                </div>
              )}

              {/* Geofence Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geofence-name">Location Name</Label>
                  <Input
                    id="geofence-name"
                    placeholder="e.g., Main Office"
                    value={geofenceForm.name}
                    onChange={(e) => setGeofenceForm(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-geofence-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-address">Address</Label>
                  <Input
                    id="geofence-address"
                    placeholder="Office address"
                    value={geofenceForm.address}
                    onChange={(e) => setGeofenceForm(prev => ({ ...prev, address: e.target.value }))}
                    data-testid="input-geofence-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-latitude">Latitude</Label>
                  <Input
                    id="geofence-latitude"
                    type="number"
                    step="any"
                    value={geofenceForm.latitude}
                    onChange={(e) => setGeofenceForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    data-testid="input-geofence-latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-longitude">Longitude</Label>
                  <Input
                    id="geofence-longitude"
                    type="number"
                    step="any"
                    value={geofenceForm.longitude}
                    onChange={(e) => setGeofenceForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    data-testid="input-geofence-longitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-radius">Radius (meters)</Label>
                  <Input
                    id="geofence-radius"
                    type="number"
                    value={geofenceForm.radius}
                    onChange={(e) => setGeofenceForm(prev => ({ ...prev, radius: parseInt(e.target.value) || 100 }))}
                    data-testid="input-geofence-radius"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={getCurrentLocation} variant="outline" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Use Current Location
                </Button>
                <Button onClick={handleSaveGeofence} disabled={isLoading} className="gap-2" data-testid="button-save-geofence">
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Password Policy</h3>
                    <p className="text-sm text-muted-foreground">Configure password requirements</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Session Timeout</h3>
                    <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Late Arrival Alerts</h3>
                    <p className="text-sm text-muted-foreground">Notify when employees arrive late</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Missed Check-out Alerts</h3>
                    <p className="text-sm text-muted-foreground">Alert when employees forget to check out</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Daily Reports</h3>
                    <p className="text-sm text-muted-foreground">Send daily attendance summaries</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                System maintenance and configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Database Backup</h3>
                    <p className="text-sm text-muted-foreground">Schedule automatic database backups</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data Retention</h3>
                    <p className="text-sm text-muted-foreground">Configure how long to keep attendance data</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Logs</h3>
                    <p className="text-sm text-muted-foreground">View and manage system activity logs</p>
                  </div>
                  <Button variant="outline" size="sm">View Logs</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Export Data</h3>
                    <p className="text-sm text-muted-foreground">Export all system data for backup</p>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}