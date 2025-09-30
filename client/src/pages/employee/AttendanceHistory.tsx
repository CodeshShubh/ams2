import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppSelector, useAppDispatch } from "@/store";
import { 
  selectAttendanceHistory, 
  selectAttendanceLoading,
  getAttendanceHistory
} from "@/store/slices/attendanceSlice";
import { Calendar, Clock, MapPin, Download, Search, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";

export function AttendanceHistory() {
  const dispatch = useAppDispatch();
  const history = useAppSelector(selectAttendanceHistory);
  const isLoading = useAppSelector(selectAttendanceLoading);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHistory, setFilteredHistory] = useState(history);

  useEffect(() => {
    dispatch(getAttendanceHistory());
  }, [dispatch]);

  useEffect(() => {
    const filtered = history.filter(record => {
      const searchLower = searchTerm.toLowerCase();
      const date = format(parseISO(record.checkInTime), 'PPP').toLowerCase();
      const status = record.status.toLowerCase();
      return date.includes(searchLower) || status.includes(searchLower);
    });
    setFilteredHistory(filtered);
  }, [history, searchTerm]);

  const calculateTotalHours = (checkIn: string, checkOut?: string | null) => {
    if (!checkOut) return "In Progress";
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diff = checkOutTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'default';
      case 'checked_out': return 'secondary';
      case 'break': return 'outline';
      default: return 'secondary';
    }
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Notes'].join(','),
      ...filteredHistory.map(record => [
        format(parseISO(record.checkInTime), 'yyyy-MM-dd'),
        format(parseISO(record.checkInTime), 'HH:mm:ss'),
        record.checkOutTime ? format(parseISO(record.checkOutTime), 'HH:mm:ss') : 'N/A',
        calculateTotalHours(record.checkInTime, record.checkOutTime),
        record.status,
        record.notes || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-history">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance History</h1>
          <p className="text-muted-foreground">
            View and manage your attendance records
          </p>
        </div>
        <Button onClick={exportHistory} className="gap-2" data-testid="button-export">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by date or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{history.length}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {history.filter(r => r.status === 'checked_out').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {history.filter(r => r.status === 'checked_in').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(history.filter(r => r.totalHours).reduce((acc, r) => {
                  const hours = parseFloat(r.totalHours?.split('h')[0] || '0');
                  return acc + hours;
                }, 0) / Math.max(history.filter(r => r.totalHours).length, 1))}h
              </div>
              <div className="text-sm text-muted-foreground">Avg Daily Hours</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Records */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Records Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No records match your search criteria." : "You haven't recorded any attendance yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((record) => (
            <Card key={record.id} data-testid={`record-${record.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(parseISO(record.checkInTime), 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      Work session on {format(parseISO(record.checkInTime), 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(record.status)} data-testid={`badge-${record.id}`}>
                    {record.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Check In */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-green-600" />
                      Check In
                    </div>
                    <div className="text-lg font-mono">
                      {format(parseISO(record.checkInTime), 'HH:mm:ss')}
                    </div>
                    {record.checkInLatitude && record.checkInLongitude && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {record.checkInLatitude.toFixed(4)}, {record.checkInLongitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {/* Check Out */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-red-600" />
                      Check Out
                    </div>
                    <div className="text-lg font-mono">
                      {record.checkOutTime ? format(parseISO(record.checkOutTime), 'HH:mm:ss') : 'In Progress'}
                    </div>
                    {record.checkOutLatitude && record.checkOutLongitude && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {record.checkOutLatitude.toFixed(4)}, {record.checkOutLongitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {/* Total Hours */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Total Hours
                    </div>
                    <div className="text-lg font-bold">
                      {calculateTotalHours(record.checkInTime, record.checkOutTime)}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Notes</div>
                    <div className="text-sm text-muted-foreground">{record.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}