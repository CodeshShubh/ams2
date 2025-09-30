import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  BarChart3,
  PieChart,
  FileText
} from "lucide-react";

export function Reports() {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [selectedUser, setSelectedUser] = useState("all");
  const [reportType, setReportType] = useState("summary");

  const generateReport = () => {
    console.log("Generating report:", { dateRange, selectedUser, reportType });
    // TODO: Implement report generation
  };

  const exportReport = (format: string) => {
    console.log("Exporting report as:", format);
    // TODO: Implement report export
  };

  const mockSummaryData = {
    totalHours: 1240,
    averageDaily: 8.2,
    attendanceRate: 95,
    lateArrivals: 12,
    earlyDepartures: 8,
    overtimeHours: 45
  };

  const mockUserData = [
    { name: "John Doe", hours: 168, attendance: 98, late: 1, overtime: 5 },
    { name: "Jane Smith", hours: 160, attendance: 95, late: 2, overtime: 0 },
    { name: "Mike Johnson", hours: 172, attendance: 100, late: 0, overtime: 8 },
    { name: "Sarah Wilson", hours: 156, attendance: 92, late: 3, overtime: 0 },
    { name: "David Brown", hours: 164, attendance: 97, late: 1, overtime: 4 }
  ];

  return (
    <div className="space-y-6" data-testid="reports">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate detailed attendance reports and analytics
        </p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Configure your report parameters and generate custom reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-filter">User Filter</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger data-testid="select-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Administrators Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                  <SelectItem value="active">Active Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="timesheet">Timesheet Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} className="gap-2" data-testid="button-generate">
              <BarChart3 className="h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => exportReport('pdf')} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('csv')} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockSummaryData.totalHours}h</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockSummaryData.averageDaily}h</div>
                  <div className="text-sm text-muted-foreground">Avg Daily</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{mockSummaryData.attendanceRate}%</div>
                  <div className="text-sm text-muted-foreground">Attendance</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{mockSummaryData.lateArrivals}</div>
                  <div className="text-sm text-muted-foreground">Late Arrivals</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{mockSummaryData.earlyDepartures}</div>
                  <div className="text-sm text-muted-foreground">Early Departures</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mockSummaryData.overtimeHours}h</div>
                  <div className="text-sm text-muted-foreground">Overtime</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Performance
              </CardTitle>
              <CardDescription>
                Individual employee attendance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div>Employee</div>
                  <div>Hours Worked</div>
                  <div>Attendance %</div>
                  <div>Late Arrivals</div>
                  <div>Overtime Hours</div>
                  <div>Performance</div>
                </div>
                {mockUserData.map((user, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 items-center py-2 border-b">
                    <div className="font-medium">{user.name}</div>
                    <div>{user.hours}h</div>
                    <div>
                      <Badge variant={user.attendance >= 95 ? "default" : "secondary"}>
                        {user.attendance}%
                      </Badge>
                    </div>
                    <div>{user.late}</div>
                    <div>{user.overtime}h</div>
                    <div>
                      <Badge variant={user.attendance >= 95 ? "default" : user.attendance >= 90 ? "secondary" : "destructive"}>
                        {user.attendance >= 95 ? "Excellent" : user.attendance >= 90 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Analytics Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Attendance Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chart visualization would appear here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Time Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Pie chart visualization would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Trends
              </CardTitle>
              <CardDescription>
                Historical attendance patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Trend analysis visualization would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}