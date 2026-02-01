import { useTasks } from "@/hooks/use-tasks";
import { useAttendance } from "@/hooks/use-attendance";
import { useLeaves } from "@/hooks/use-leaves";
import { useExpenses } from "@/hooks/use-expenses";
import { useSummaries } from "@/hooks/use-summaries";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle, Clock, Calendar, AlertCircle, TrendingUp, FileText, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function StaffDashboard() {
  const { data: user } = useCurrentUser();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: attendance } = useAttendance();
  const { data: leaves } = useLeaves();
  const { data: expenses } = useExpenses();
  const { data: summaries } = useSummaries();

  // Filter tasks assigned to current user
  const myTasks = tasks?.filter(t => t.assignedToId === user?.id) || [];
  const pendingTasks = myTasks.filter(t => t.status !== "completed");
  const upcomingTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date()).slice(0, 3);
  
  // Stats
  const completedCount = myTasks.filter(t => t.status === "completed").length;
  const inProgressCount = myTasks.filter(t => t.status === "in_progress").length;
  const pendingCount = myTasks.filter(t => t.status === "pending").length;

  // Leaves stats
  const pendingLeaves = leaves?.filter(l => l.userId === user?.id && l.status === "pending").length || 0;

  // Expenses stats
  const pendingExpenses = expenses?.filter(e => e.userId === user?.id && e.status === "pending").length || 0;

  // Monthly summary
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentSummary = summaries?.find(s => s.userId === user?.id && s.month === currentMonth && s.year === currentYear);

  const isLoading = tasksLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves + pendingExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Leaves & Expenses</p>
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
                          <span>Due {format(parseISO(task.dueDate!), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
              <Link href="/tasks">
                <Button variant="outline" className="w-full mt-4">View All Tasks</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Your performance overview for {format(new Date(), "MMMM yyyy")}.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-primary">{currentSummary.totalTasks}</p>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-500">{currentSummary.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-500">{currentSummary.attendanceDays}</p>
                    <p className="text-xs text-muted-foreground">Present Days</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-violet-500">${Number(currentSummary.totalExpenses).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No summary data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="h-full border-none shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Clock className="w-4 h-4" />
                  View My Tasks
                </Button>
              </Link>
              <Link href="/attendance">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Mark Attendance
                </Button>
              </Link>
              <Link href="/leaves">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Request Leave
                </Button>
              </Link>
              <Link href="/expenses">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="w-4 h-4" />
                  Submit Expense
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
