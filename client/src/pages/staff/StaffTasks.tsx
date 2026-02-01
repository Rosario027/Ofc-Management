import { useState } from "react";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { Loader2, Search, Edit3, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function StaffTasks() {
  const { data: user } = useCurrentUser();
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    completionLevel: 0,
    notes: "",
  });

  const myTasks = tasks?.filter(t => t.assignedToId === user?.id) || [];
  
  const filteredTasks = myTasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort tasks by status (pending first) and priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { pending: 0, in_progress: 1, reassigned: 2, completed: 3 };
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleOpenUpdate = (task: any) => {
    setSelectedTask(task);
    setUpdateForm({
      status: task.status,
      completionLevel: task.completionLevel,
      notes: task.notes || "",
    });
  };

  const handleUpdate = async () => {
    if (!selectedTask) return;
    
    try {
      await updateTask.mutateAsync({
        id: selectedTask.id,
        status: updateForm.status as any,
        completionLevel: updateForm.completionLevel,
        notes: updateForm.notes,
      });
      toast({
        title: "Task Updated",
        description: "Your progress has been saved.",
      });
      setSelectedTask(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Task counts
  const pendingCount = myTasks.filter(t => t.status === "pending").length;
  const inProgressCount = myTasks.filter(t => t.status === "in_progress").length;
  const completedCount = myTasks.filter(t => t.status === "completed").length;
  const criticalCount = myTasks.filter(t => t.priority === "critical" && t.status !== "completed").length;

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
          <h2 className="text-3xl font-bold font-display">My Tasks</h2>
          <p className="text-muted-foreground">Manage your assigned work and track progress.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? "border-red-200 bg-red-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            {criticalCount > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalCount > 0 ? "text-red-500" : ""}`}>{criticalCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search tasks..." 
          className="pl-10 max-w-sm rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {sortedTasks.map((task) => (
          <Card key={task.id} className={`overflow-hidden hover:shadow-md transition-shadow ${
            task.priority === "critical" && task.status !== "completed" ? "border-l-4 border-l-red-500" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <StatusBadge status={task.priority} variant="outline" />
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-muted-foreground">{task.description || "No description provided."}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    {task.dueDate && (
                      <span>Due: {format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
                    )}
                    <span>Assigned by: {task.assigner?.firstName} {task.assigner?.lastName}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full max-w-md pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{task.completionLevel}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          task.completionLevel === 100 ? "bg-emerald-500" : "bg-primary"
                        }`} 
                        style={{ width: `${task.completionLevel}%` }}
                      />
                    </div>
                  </div>

                  {task.notes && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      Notes: {task.notes}
                    </p>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => handleOpenUpdate(task)} className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Task Progress</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={updateForm.status} 
                          onValueChange={(val) => setUpdateForm({ ...updateForm, status: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="reassigned">Request Reassignment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <Label>Completion Level</Label>
                          <span className="text-sm font-medium text-muted-foreground">{updateForm.completionLevel}%</span>
                        </div>
                        <Slider 
                          value={[updateForm.completionLevel]} 
                          max={100} 
                          step={5}
                          onValueChange={(val) => setUpdateForm({ ...updateForm, completionLevel: val[0] })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes / Update Details</Label>
                        <Textarea
                          placeholder="Add notes about your progress or any issues..."
                          value={updateForm.notes}
                          onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleUpdate} 
                        className="w-full"
                        disabled={updateTask.isPending}
                      >
                        {updateTask.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">No tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
