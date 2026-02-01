import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { useUsers } from "@/hooks/use-users";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";
import { Loader2, Calendar, Clock, UserCheck, UserX, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminAttendance() {
  const { data: user } = useCurrentUser();
  const { data: users } = useUsers();
  const { data: attendance, isLoading } = useAttendance();
  const markAttendance = useMarkAttendance();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    date: "",
    status: "present",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  });

  const staffUsers = users?.filter(u => u.role === "staff") || [];
  const orgAttendance = attendance?.filter(a => !user?.organizationId || a.organizationId === user.organizationId) || [];

  // Get unique dates for filter
  const uniqueDates = [...new Set(orgAttendance.map(a => a.date))].sort().reverse();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const filteredAttendance = orgAttendance.filter(a => {
    const matchesSearch = a.user?.firstName.toLowerCase().includes(search.toLowerCase()) ||
                         a.user?.lastName.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !selectedDate || a.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = orgAttendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === "present").length;
  const absentToday = todayAttendance.filter(a => a.status === "absent").length;
  const leaveToday = todayAttendance.filter(a => a.status === "leave").length;
  const halfDayToday = todayAttendance.filter(a => a.status === "half_day").length;

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await markAttendance.mutateAsync({
        userId: parseInt(formData.userId),
        date: formData.date,
        status: formData.status as any,
        checkInTime: formData.checkInTime ? new Date(`${formData.date}T${formData.checkInTime}`).toISOString() : null,
        checkOutTime: formData.checkOutTime ? new Date(`${formData.date}T${formData.checkOutTime}`).toISOString() : null,
        notes: formData.notes,
        organizationId: user?.organizationId,
      });
      toast({ title: "Attendance Marked", description: "Attendance record has been saved." });
      setIsMarkOpen(false);
      setFormData({ userId: "", date: "", status: "present", checkInTime: "", checkOutTime: "", notes: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark attendance.", variant: "destructive" });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">Attendance Log</h2>
          <p className="text-muted-foreground">Monitor and manage employee attendance records.</p>
        </div>
        
        <Dialog open={isMarkOpen} onOpenChange={setIsMarkOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMarkAttendance} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(val) => setFormData({ ...formData, userId: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check In</Label>
                  <Input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check Out</Label>
                  <Input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={markAttendance.isPending}>
                {markAttendance.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Attendance"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">Present</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800 mt-2">{presentToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-800 mt-2">{absentToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">Half Day</span>
            </div>
            <p className="text-2xl font-bold text-amber-800 mt-2">{halfDayToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">On Leave</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-2">{leaveToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All dates</SelectItem>
            {uniqueDates.map(date => (
              <SelectItem key={date} value={date}>
                {format(parseISO(date), "MMM d, yyyy")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance List */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Complete attendance history for all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found.
              </div>
            ) : (
              filteredAttendance
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={record.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {record.user?.firstName[0]}{record.user?.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{record.user?.firstName} {record.user?.lastName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(parseISO(record.date), "EEEE, MMM d, yyyy")}</span>
                          {record.checkInTime && (
                            <>
                              <span>•</span>
                              <span>In: {format(parseISO(record.checkInTime), "h:mm a")}</span>
                            </>
                          )}
                          {record.checkOutTime && (
                            <>
                              <span>•</span>
                              <span>Out: {format(parseISO(record.checkOutTime), "h:mm a")}</span>
                            </>
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
