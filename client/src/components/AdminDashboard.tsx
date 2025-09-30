import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  Clock, 
  Calendar, 
  Settings2,
  TrendingUp,
  AlertTriangle,
  CheckCircle 
} from "lucide-react";
import { useState } from "react";

interface GeofenceSettings {
  latitude: number;
  longitude: number; 
  radius: number;
  address: string;
}

interface DashboardStats {
  totalEmployees: number;
  checkedInToday: number;
  pendingApprovals: number;
  avgHoursThisWeek: number;
}

interface AdminDashboardProps {
  stats: DashboardStats;
  geofence: GeofenceSettings;
  onUpdateGeofence?: (settings: GeofenceSettings) => void;
  onViewReports?: () => void;
  onManageUsers?: () => void;
}

export function AdminDashboard({ 
  stats, 
  geofence, 
  onUpdateGeofence,
  onViewReports,
  onManageUsers
}: AdminDashboardProps) {
  const [geoSettings, setGeoSettings] = useState(geofence);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGeofence = async () => {
    setIsSaving(true);
    console.log("Saving geofence settings:", geoSettings);
    
    // Simulate API call
    setTimeout(() => {
      onUpdateGeofence?.(geoSettings);
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedInToday}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.checkedInToday / stats.totalEmployees) * 100)}% attendance rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours/Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHoursThisWeek}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different admin functions */}
      <Tabs defaultValue="geofence" className="w-full">
        <TabsList>
          <TabsTrigger value="geofence">Geofence Settings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="geofence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geofence Configuration
              </CardTitle>
              <CardDescription>
                Set the allowed location for employee check-ins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={geoSettings.latitude}
                    onChange={(e) => setGeoSettings(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    data-testid="input-latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={geoSettings.longitude}
                    onChange={(e) => setGeoSettings(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    data-testid="input-longitude"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={geoSettings.radius}
                  onChange={(e) => setGeoSettings(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                  data-testid="input-radius"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address Description</Label>
                <Input
                  id="address"
                  value={geoSettings.address}
                  onChange={(e) => setGeoSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Main Office Building"
                  data-testid="input-address"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveGeofence}
                  disabled={isSaving}
                  data-testid="button-save-geofence"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={() => console.log("Test geofence")}>
                  Test Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Reports
              </CardTitle>
              <CardDescription>
                Generate and view attendance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={onViewReports} data-testid="button-daily-report">
                    Daily Report
                  </Button>
                  <Button variant="outline" onClick={() => console.log("Weekly report")}>
                    Weekly Report
                  </Button>
                  <Button variant="outline" onClick={() => console.log("Monthly report")}>
                    Monthly Report
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Reports will include check-in/out times, total hours, and location data
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage employee accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={onManageUsers} data-testid="button-manage-users">
                    Manage Users
                  </Button>
                  <Button variant="outline" onClick={() => console.log("Add user")}>
                    Add New User
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {stats.totalEmployees} Active Users
                  </Badge>
                  <Badge variant="outline">
                    <Settings2 className="w-3 h-3 mr-1" />
                    2 Admins
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}