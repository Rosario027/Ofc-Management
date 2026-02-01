import { useCurrentUser } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarClock, 
  Wallet, 
  FileText, 
  Users, 
  Briefcase,
  LogOut,
  Building2,
  ClipboardCheck,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  
  const isAdmin = user?.role === "admin" || user?.role === "proprietor";

  const staffLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/tasks", label: "My Tasks", icon: CheckSquare },
    { href: "/attendance", label: "Attendance", icon: CalendarClock },
    { href: "/leaves", label: "Leave Requests", icon: FileText },
    { href: "/expenses", label: "Expenses", icon: Wallet },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/tasks", label: "All Tasks", icon: Briefcase },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
    { href: "/admin/attendance", label: "Attendance Log", icon: CalendarClock },
    { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  ];

  const links = isAdmin ? adminLinks : staffLinks;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
            Office<span className="text-primary">Sync</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {isAdmin ? "Admin Menu" : "Menu"}
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 mb-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Staff"}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
