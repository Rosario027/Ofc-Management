import { useTasks } from "@/hooks/use-tasks";
import { useAttendance } from "@/hooks/use-attendance";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function StaffDashboard() {
  const { data: user } = useCurrentUser();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();

  // Filter tasks assigned to current user
  const myTasks = tasks?.filter(t => t.assignedToId === user?.id) || [];
  const pendingTasks = myTasks.filter(t => t.status !== "completed");
  const upcomingTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date()).slice(0, 3);
  
  // Stats
  const completedCount = myTasks.filter(t => t.status === "completed").length;
  const inProgressCount = myTasks.filter(t => t.status === "in_progress").length;
  const pendingCount = myTasks.filter(t => t.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Welcome back, {user?.firstName}</h2>
        <p className="text-muted-foreground mt-2">Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks waiting for action</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently working on</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks finished this month</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">Today's Status</CardTitle>
            <Calendar className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">Present</div>
            <p className="text-xs text-primary-foreground/80 mt-1">{format(new Date(), "EEEE, MMM d")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due soon that require your attention.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No upcoming deadlines.</div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{task.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <StatusBadge status={task.priority} variant="outline" />
                          <span>Due {format(new Date(task.dueDate!), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = "/tasks"}>
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Attendance */}
        <div className="space-y-6">
          <Card className="h-full border-none shadow-md">
             <CardHeader>
               <CardTitle>Attendance</CardTitle>
               <CardDescription>Log your work hours.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check In</p>
                    <p className="text-lg font-bold">09:00 AM</p>
                  </div>
                  <div className="h-8 w-px bg-border mx-2"></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check Out</p>
                    <p className="text-lg font-bold">--:--</p>
                  </div>
               </div>
               <Button className="w-full" size="lg" disabled>Checked In</Button>
               <Button variant="outline" className="w-full" onClick={() => window.location.href = "/attendance"}>View History</Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
