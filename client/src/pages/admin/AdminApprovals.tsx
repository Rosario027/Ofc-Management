import { useLeaves, useUpdateLeaveStatus } from "@/hooks/use-leaves";
import { useExpenses, useUpdateExpenseStatus } from "@/hooks/use-expenses";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, differenceInDays } from "date-fns";
import { Loader2, CheckCircle, XCircle, Calendar, DollarSign, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminApprovals() {
  const { data: user } = useCurrentUser();
  const { data: leaves, isLoading: leavesLoading } = useLeaves();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const updateExpenseStatus = useUpdateExpenseStatus();
  const { toast } = useToast();

  const orgLeaves = leaves?.filter(l => !user?.organizationId || l.organizationId === user.organizationId) || [];
  const orgExpenses = expenses?.filter(e => !user?.organizationId || e.organizationId === user.organizationId) || [];

  const pendingLeaves = orgLeaves.filter(l => l.status === "pending");
  const pendingExpenses = orgExpenses.filter(e => e.status === "pending");

  const handleApproveLeave = async (id: number) => {
    try {
      await updateLeaveStatus.mutateAsync({ id, status: "approved" });
      toast({ title: "Leave Approved", description: "The leave request has been approved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve leave.", variant: "destructive" });
    }
  };

  const handleRejectLeave = async (id: number) => {
    try {
      await updateLeaveStatus.mutateAsync({ id, status: "rejected" });
      toast({ title: "Leave Rejected", description: "The leave request has been rejected." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject leave.", variant: "destructive" });
    }
  };

  const handleApproveExpense = async (id: number) => {
    try {
      await updateExpenseStatus.mutateAsync({ id, status: "approved" });
      toast({ title: "Expense Approved", description: "The expense has been approved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve expense.", variant: "destructive" });
    }
  };

  const handleRejectExpense = async (id: number) => {
    try {
      await updateExpenseStatus.mutateAsync({ id, status: "rejected" });
      toast({ title: "Expense Rejected", description: "The expense has been rejected." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject expense.", variant: "destructive" });
    }
  };

  const isLoading = leavesLoading || expensesLoading;

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
        <h2 className="text-3xl font-bold font-display">Approvals</h2>
        <p className="text-muted-foreground">Review and approve leave requests and expense claims.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={pendingLeaves.length > 0 ? "border-amber-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card className={pendingExpenses.length > 0 ? "border-amber-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaves" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="w-4 h-4" />
            Leave Requests
            {pendingLeaves.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingLeaves.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Expenses
            {pendingExpenses.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingExpenses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Review employee leave applications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orgLeaves.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leave requests found.
                  </div>
                ) : (
                  orgLeaves
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((leave) => (
                      <div key={leave.id} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={leave.user?.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {leave.user?.firstName[0]}{leave.user?.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{leave.user?.firstName} {leave.user?.lastName}</p>
                                <StatusBadge status={leave.status} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave • {leave.days} days
                              </p>
                              <p className="text-sm font-medium mt-1">
                                {format(parseISO(leave.startDate), "MMM d")} - {format(parseISO(leave.endDate), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">{leave.reason}</p>
                            </div>
                          </div>
                          
                          {leave.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectLeave(leave.id)}
                                disabled={updateLeaveStatus.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => handleApproveLeave(leave.id)}
                                disabled={updateLeaveStatus.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Expense Claims</CardTitle>
              <CardDescription>Review employee expense submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orgExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense claims found.
                  </div>
                ) : (
                  orgExpenses
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((expense) => (
                      <div key={expense.id} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={expense.user?.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {expense.user?.firstName[0]}{expense.user?.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{expense.user?.firstName} {expense.user?.lastName}</p>
                                <StatusBadge status={expense.status} />
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {expense.category.replace("_", " ")} • {format(parseISO(expense.date), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm font-medium mt-1">${Number(expense.amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground mt-2">{expense.description}</p>
                            </div>
                          </div>
                          
                          {expense.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectExpense(expense.id)}
                                disabled={updateExpenseStatus.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => handleApproveExpense(expense.id)}
                                disabled={updateExpenseStatus.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
