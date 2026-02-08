import { useCurrentUser, useUsers } from "@/hooks/use-users";

import { useTasks } from "@/hooks/use-tasks";
import { useAttendance } from "@/hooks/use-attendance";
import { useLeaves } from "@/hooks/use-leaves";
import { useExpenses } from "@/hooks/use-expenses";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Briefcase, CalendarCheck, TrendingUp, Building2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { data: user } = useCurrentUser();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: attendance } = useAttendance();
  const { data: leaves } = useLeaves();
  const { data: expenses } = useExpenses();

  const isLoading = usersLoading || tasksLoading;

  // Filter by organization if set
  const orgUsers = users?.filter(u => !user?.organizationId || u.organizationId === user.organizationId) || [];
  const orgTasks = tasks?.filter(t => !user?.organizationId || t.organizationId === user.organizationId) || [];
  const orgAttendance = attendance?.filter(a => !user?.organizationId || a.organizationId === user.organizationId) || [];
  const pendingLeaves = leaves?.filter(l => l.status === "pending" && (!user?.organizationId || l.organizationId === user.organizationId)).length || 0;
  const pendingExpenses = expenses?.filter(e => e.status === "pending" && (!user?.organizationId || e.organizationId === user.organizationId)).length || 0;

  // Task stats
  const totalTasks = orgTasks.length;
  const completedTasks = orgTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = orgTasks.filter(t => t.status === "in_progress").length;
  const pendingTasks = orgTasks.filter(t => t.status === "pending").length;

  // Attendance stats (today)
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = orgAttendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === "present").length;
  const absentToday = todayAttendance.filter(a => a.status === "absent").length;
  const onLeaveToday = todayAttendance.filter(a => a.status === "leave").length;

  // Task priority distribution
  const taskPriorityData = [
    { name: "Critical", value: orgTasks.filter(t => t.priority === "critical" && t.status !== "completed").length, color: "#ef4444" },
    { name: "High", value: orgTasks.filter(t => t.priority === "high" && t.status !== "completed").length, color: "#f97316" },
    { name: "Medium", value: orgTasks.filter(t => t.priority === "medium" && t.status !== "completed").length, color: "#3b82f6" },
    { name: "Low", value: orgTasks.filter(t => t.priority === "low" && t.status !== "completed").length, color: "#22c55e" },
  ].filter(d => d.value > 0);

  // Weekly attendance data
  const weeklyAttendance = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayAttendance = orgAttendance.filter(a => a.date === dateStr);
    const present = dayAttendance.filter(a => a.status === "present" || a.status === "half_day").length;
    // Assume total employees - present = absent (simplification)
    const absent = Math.max(0, orgUsers.length - present);

    return { name: dayName, present, absent };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Admin Overview</h2>
          <p className="text-muted-foreground mt-1">Manage your organization at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tasks">
            <Button className="gap-2">
              <Briefcase className="w-4 h-4" />
              Assign Task
            </Button>
          </Link>
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
            <div className="text-2xl font-bold">{orgUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
            <Briefcase className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks - completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
            <p className="text-xs text-muted-foreground mt-1">{absentToday} absent, {onLeaveToday} on leave</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves + pendingExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingLeaves} leaves, {pendingExpenses} expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800 mt-2">{completedTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-2">{inProgressTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-800 mt-2">{pendingTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              <span className="text-sm text-violet-700">Staff</span>
            </div>
            <p className="text-2xl font-bold text-violet-800 mt-2">{orgUsers.filter(u => u.role === "staff").length}</p>
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
              <BarChart data={weeklyAttendance}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
            <CardDescription>Current tasks by priority level.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {taskPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskPriorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No active tasks
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {taskPriorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Tasks */}
      <Card className="shadow-md border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Critical & High Priority Tasks</CardTitle>
            <CardDescription>Items needing immediate attention.</CardDescription>
          </div>
          <Link href="/admin/tasks">
            <Button variant="outline">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orgTasks
              ?.filter(t => (t.priority === "critical" || t.priority === "high") && t.status !== "completed")
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${task.priority === "critical" ? "bg-red-500" : "bg-orange-500"}`} />
                    <div>
                      <p className="font-semibold text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {task.assignee?.firstName} {task.assignee?.lastName} •
                        Due: {task.dueDate ? format(parseISO(task.dueDate), "MMM d") : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={task.status} className="text-xs" />
                </div>
              ))}
            {!orgTasks?.filter(t => (t.priority === "critical" || t.priority === "high") && t.status !== "completed").length && (
              <p className="text-muted-foreground text-center py-4">No critical tasks.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
