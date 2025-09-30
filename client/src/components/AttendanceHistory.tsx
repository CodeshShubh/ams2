import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: {
    time: string;
    location: string;
    status: "ok" | "pending" | "rejected" | "needs-approval";
  };
  checkOut?: {
    time: string;
    location: string;
    status: "ok" | "pending" | "rejected" | "needs-approval";
  };
  totalHours?: string;
  notes?: string;
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  onViewDetails?: (recordId: string) => void;
  isLoading?: boolean;
}

export function AttendanceHistory({ records, onViewDetails, isLoading = false }: AttendanceHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-md"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Attendance History
        </CardTitle>
        <CardDescription>
          Your recent attendance records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{record.date}</h4>
                      {record.totalHours && (
                        <span className="text-sm text-muted-foreground">
                          ({record.totalHours})
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {record.checkIn && (
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">In: {record.checkIn.time}</span>
                            <StatusBadge status={record.checkIn.status} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                            <MapPin className="w-3 h-3" />
                            {record.checkIn.location}
                          </div>
                        </div>
                      )}
                      
                      {record.checkIn && record.checkOut && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block mt-1" />
                      )}
                      
                      {record.checkOut && (
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium">Out: {record.checkOut.time}</span>
                            <StatusBadge status={record.checkOut.status} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                            <MapPin className="w-3 h-3" />
                            {record.checkOut.location}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(record.id)}
                    data-testid={`button-view-details-${record.id}`}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}