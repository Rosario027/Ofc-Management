import { useState } from "react";
import { useLeaves, useCreateLeave } from "@/hooks/use-leaves";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO, differenceInDays } from "date-fns";
import { Loader2, Plus, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaffLeaves() {
  const { data: user } = useCurrentUser();
  const { data: leaves, isLoading } = useLeaves();
  const createLeave = useCreateLeave();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const myLeaves = leaves?.filter(l => l.userId === user?.id) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const days = differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;

    try {
      await createLeave.mutateAsync({
        userId: user.id,
        type: formData.type as "sick" | "casual" | "vacation" | "emergency" | "other",
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        organizationId: user.organizationId,
      });
      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been submitted for approval.",
      });
      setIsOpen(false);
      setFormData({ type: "casual", startDate: "", endDate: "", reason: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
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
          <h2 className="text-3xl font-bold font-display">Leave Requests</h2>
          <p className="text-muted-foreground">Request and track your leave applications.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request..."
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createLeave.isPending}
              >
                {createLeave.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myLeaves.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myLeaves.filter(l => l.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myLeaves.filter(l => l.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myLeaves
                .filter(l => l.status === "approved")
                .reduce((sum, l) => sum + l.days, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Your leave request history and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myLeaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found. Create your first request above.
              </div>
            ) : (
              myLeaves
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((leave) => (
                  <div 
                    key={leave.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        leave.type === "sick" ? "bg-red-100 text-red-600" :
                        leave.type === "vacation" ? "bg-blue-100 text-blue-600" :
                        leave.type === "emergency" ? "bg-orange-100 text-orange-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{leave.type} Leave</p>
                          <StatusBadge status={leave.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(parseISO(leave.startDate), "MMM d")} - {format(parseISO(leave.endDate), "MMM d, yyyy")}</span>
                          <span>•</span>
                          <span>{leave.days} days</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Requested on</p>
                      <p>{format(parseISO(leave.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
