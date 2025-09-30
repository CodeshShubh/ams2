import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector, useAppDispatch } from "@/store";
import { 
  selectAdminStats, 
  selectUsers, 
  selectAdminLoading,
  getAdminStats,
  getAllUsers
} from "@/store/slices/adminSlice";
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Calendar,
  Settings
} from "lucide-react";

export function AdminDashboard() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectAdminStats);
  const users = useAppSelector(selectUsers);
  const isLoading = useAppSelector(selectAdminLoading);

  useEffect(() => {
    dispatch(getAdminStats());
    dispatch(getAllUsers());
  }, [dispatch]);

  const mockRecentActivity = [
    {
      id: '1',
      user: 'John Doe',
      action: 'Checked in',
      time: '9:00 AM',
      location: 'Main Office'
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'Checked out',
      time: '5:30 PM',
      location: 'Main Office'
    },
    {
      id: '3',
      user: 'Mike Johnson',
      action: 'Checked in',
      time: '8:45 AM',
      location: 'Main Office'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage attendance across your organization
          </p>
        </div>
        <Button className="gap-2" data-testid="button-settings">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-employees">
              {stats?.totalEmployees || users.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-checked-in">
              {stats?.checkedInToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently at work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending">
              {stats?.pendingApprovals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-hours">
              {stats?.avgHoursThisWeek || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              This week's average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover-elevate" data-testid="card-manage-users">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or deactivate employee accounts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover-elevate" data-testid="card-view-reports">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-medium">View Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generate detailed attendance reports
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover-elevate" data-testid="card-geofence-settings">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-medium">Geofence Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure office location boundaries
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest attendance events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{activity.user}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{activity.action}</span>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Status
            </CardTitle>
            <CardDescription>
              Current attendance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                    {Math.random() > 0.5 ? "Checked In" : "Checked Out"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Summary
          </CardTitle>
          <CardDescription>
            Attendance summary for {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.checkedInToday || 0}
              </div>
              <div className="text-sm text-muted-foreground">Employees Present</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {(stats?.totalEmployees || users.length) - (stats?.checkedInToday || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Employees Absent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(((stats?.checkedInToday || 0) / Math.max(stats?.totalEmployees || users.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}