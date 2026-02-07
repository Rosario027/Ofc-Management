import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Navigation";
import { useCurrentUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffTasks from "@/pages/staff/StaffTasks";
import StaffAttendance from "@/pages/staff/StaffAttendance";
import StaffLeaves from "@/pages/staff/StaffLeaves";
import StaffExpenses from "@/pages/staff/StaffExpenses";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTasks from "@/pages/admin/AdminTasks";
import AdminEmployees from "@/pages/admin/AdminEmployees";
import AdminApprovals from "@/pages/admin/AdminApprovals";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminOrganizations from "@/pages/admin/AdminOrganizations";
import NotFound from "@/pages/not-found";

// Components for handling auth redirects
function PrivateRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType, 
  allowedRoles?: string[] 
}) {
  const { data: user, isLoading } = useCurrentUser();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard if role doesn't match
    const isAdmin = user.role === "admin" || user.role === "proprietor";
    return <Redirect to={isAdmin ? "/admin" : "/dashboard"} />;
  }

  // Layout wrapper for authenticated pages
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="flex-1 md:pl-64 h-full overflow-y-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Component />
        </div>
      </main>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      
      {/* Staff Routes */}
      <Route path="/dashboard">
        <PrivateRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>
      <Route path="/tasks">
        <PrivateRoute component={StaffTasks} allowedRoles={["staff"]} />
      </Route>
      <Route path="/attendance">
        <PrivateRoute component={StaffAttendance} allowedRoles={["staff"]} />
      </Route>
      <Route path="/leaves">
        <PrivateRoute component={StaffLeaves} allowedRoles={["staff"]} />
      </Route>
      <Route path="/expenses">
        <PrivateRoute component={StaffExpenses} allowedRoles={["staff"]} />
      </Route>
      <Route path="/profile">
        <PrivateRoute component={Profile} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/tasks">
        <PrivateRoute component={AdminTasks} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/employees">
        <PrivateRoute component={AdminEmployees} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/approvals">
        <PrivateRoute component={AdminApprovals} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/attendance">
        <PrivateRoute component={AdminAttendance} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/organizations">
        <PrivateRoute component={AdminOrganizations} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/profile">
        <PrivateRoute component={Profile} allowedRoles={["admin", "proprietor"]} />
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
