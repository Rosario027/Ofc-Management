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
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffTasks from "@/pages/staff/StaffTasks";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/not-found";

// Components for handling auth redirects
function PrivateRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { data: user, isLoading } = useCurrentUser();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    window.location.href = "/api/login";
    return null;
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
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      {/* Staff Routes */}
      <Route path="/dashboard">
        <PrivateRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>
      <Route path="/tasks">
        <PrivateRoute component={StaffTasks} allowedRoles={["staff"]} />
      </Route>
      <Route path="/attendance">
         {/* Placeholder for now - normally would be StaffAttendance page */}
         <PrivateRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>
      <Route path="/leaves">
         {/* Placeholder for now */}
         <PrivateRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>
      <Route path="/expenses">
         {/* Placeholder for now */}
         <PrivateRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} allowedRoles={["admin", "proprietor"]} />
      </Route>
      <Route path="/admin/tasks">
         <PrivateRoute component={AdminDashboard} allowedRoles={["admin", "proprietor"]} />
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
