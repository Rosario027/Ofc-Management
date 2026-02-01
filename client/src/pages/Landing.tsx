import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { Redirect } from "wouter";
import { useCurrentUser } from "@/hooks/use-users";

export default function Landing() {
  const { data: user, isLoading } = useCurrentUser();

  // If already logged in, redirect to dashboard based on role
  if (!isLoading && user) {
    const isAdmin = user.role === "admin" || user.role === "proprietor";
    return <Redirect to={isAdmin ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold font-display text-gray-900">
              Office<span className="text-primary">Sync</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="font-semibold shadow-lg shadow-primary/20"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl fade-in">
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-gray-900 leading-[1.1] mb-6">
                Manage your office <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  with total clarity
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The all-in-one platform for task delegation, attendance tracking, leave management, and expense approvals. Simplify your workflow today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = "/api/login"}
                  className="text-lg px-8 py-6 rounded-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-gray-50"
                >
                  View Demo
                </Button>
              </div>
              
              <div className="mt-12 flex items-center gap-8 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Free setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Secure data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Abstract Visual */}
            <div className="relative lg:h-[600px] w-full hidden lg:block">
              <div className="absolute top-0 right-0 w-4/5 h-4/5 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative z-10 grid grid-cols-2 gap-4 p-4">
                 <div className="space-y-4 pt-12">
                   <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:-translate-y-2 transition-transform duration-300">
                     <Users className="w-8 h-8 text-primary mb-3" />
                     <h3 className="font-bold text-lg">Employee Profiles</h3>
                     <p className="text-gray-500 text-sm">Comprehensive data management for all staff members.</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:-translate-y-2 transition-transform duration-300">
                     <ShieldCheck className="w-8 h-8 text-accent mb-3" />
                     <h3 className="font-bold text-lg">Secure Access</h3>
                     <p className="text-gray-500 text-sm">Role-based permissions ensure data security.</p>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform hover:-translate-y-2 transition-transform duration-300">
                     <CheckSquare className="w-8 h-8 text-emerald-500 mb-3" />
                     <h3 className="font-bold text-lg">Task Tracking</h3>
                     <p className="text-gray-500 text-sm">Real-time updates on project progress and deadlines.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
