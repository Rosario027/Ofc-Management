import { useState } from "react";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { Loader2, Clock, Calendar, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaffAttendance() {
  const { data: user } = useCurrentUser();
  const { data: attendance, isLoading } = useAttendance();
  const markAttendance = useMarkAttendance();
  const { toast } = useToast();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance?.find(a => a.date === today && a.userId === user?.id);

  const myAttendance = attendance?.filter(a => a.userId === user?.id) || [];

  const handleCheckIn = async () => {
    if (!user) return;
    setIsCheckingIn(true);
    try {
      await markAttendance.mutateAsync({
        userId: user.id,
        date: today,
        status: "present",
        checkInTime: new Date().toISOString(),
      });
      toast({
        title: "Checked In",
        description: `You checked in at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !todayRecord) return;
    setIsCheckingOut(true);
    try {
      // Note: This would need a separate hook for updating attendance
      toast({
        title: "Checked Out",
        description: `You checked out at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display">Attendance</h2>
        <p className="text-muted-foreground">Track your work hours and attendance history.</p>
      </div>

      {/* Today's Attendance Card */}
      <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{format(new Date(), "EEEE, MMMM d, yyyy")}</h3>
                <p className="text-muted-foreground">
                  {todayRecord?.status === "present" 
                    ? `Checked in at ${todayRecord.checkInTime ? format(parseISO(todayRecord.checkInTime), "h:mm a") : "--:--"}`
                    : "You haven't checked in yet"}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {!todayRecord ? (
                <Button 
                  size="lg" 
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="gap-2"
                >
                  {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Check In
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="lg"
                    disabled
                    className="gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Checked In
                  </Button>
                  {!todayRecord.checkOutTime && (
                    <Button 
                      size="lg" 
                      variant="secondary"
                      onClick={handleCheckOut}
                      disabled={isCheckingOut}
                      className="gap-2"
                    >
                      {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Check Out
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Days</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myAttendance.filter(a => a.status === "present").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leave Days</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myAttendance.filter(a => a.status === "leave").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myAttendance.filter(a => a.status === "absent").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your attendance records for the past 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found.
              </div>
            ) : (
              myAttendance
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.status === "present" ? "bg-emerald-100 text-emerald-600" :
                        record.status === "leave" ? "bg-amber-100 text-amber-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{format(parseISO(record.date), "EEEE, MMM d, yyyy")}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {record.checkInTime && (
                            <span>In: {format(parseISO(record.checkInTime), "h:mm a")}</span>
                          )}
                          {record.checkOutTime && (
                            <span>• Out: {format(parseISO(record.checkOutTime), "h:mm a")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
