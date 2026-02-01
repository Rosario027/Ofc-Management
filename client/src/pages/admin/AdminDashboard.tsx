import { useCurrentUser } from "@/hooks/use-users";
import { useTasks } from "@/hooks/use-tasks";
import { useAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Briefcase, CalendarCheck, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboard() {
  const { data: user } = useCurrentUser();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();

  // Mock data for charts
  const attendanceData = [
    { name: 'Mon', present: 24, absent: 2 },
    { name: 'Tue', present: 25, absent: 1 },
    { name: 'Wed', present: 22, absent: 4 },
    { name: 'Thu', present: 26, absent: 0 },
    { name: 'Fri', present: 23, absent: 3 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Admin Overview</h2>
          <p className="text-muted-foreground mt-1">Manage your organization at a glance.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => window.location.href = "/admin/tasks"}>
             <Plus className="w-4 h-4 mr-2" /> Assign Task
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Active</CardTitle>
            <Briefcase className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.filter(t => t.status !== "completed").length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground mt-1">2 absent</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Pending approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Employee presence over the last 5 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity / Critical Tasks */}
        <Card className="shadow-md border-none">
          <CardHeader>
             <CardTitle>Critical Tasks</CardTitle>
             <CardDescription>High priority items needing attention.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {tasks?.filter(t => t.priority === "critical" || t.priority === "high").slice(0, 5).map(task => (
                 <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="font-semibold text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <StatusBadge status={task.status} className="text-xs" />
                 </div>
               ))}
               {!tasks?.length && <p className="text-muted-foreground text-center py-4">No critical tasks.</p>}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
