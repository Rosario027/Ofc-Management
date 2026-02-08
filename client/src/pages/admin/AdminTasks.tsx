import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminTasks() {
  const { data: user } = useCurrentUser();
  const { data: users } = useUsers();
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "medium",
    dueDate: "",
  });

  const staffUsers = users?.filter(u => u.role === "staff") || [];
  const orgTasks = tasks?.filter(t => !user?.organizationId || t.organizationId === user.organizationId) || [];

  const filteredTasks = orgTasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assignee?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    t.assignee?.lastName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description,
        assignedToId: parseInt(formData.assignedToId),
        assignedById: user.id,
        priority: formData.priority as any,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        status: "pending",
        completionLevel: 0,
        organizationId: user.organizationId,
      });
      toast({ title: "Task Created", description: "The task has been assigned successfully." });
      setIsCreateOpen(false);
      setFormData({ title: "", description: "", assignedToId: "", priority: "medium", dueDate: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask.mutateAsync(id);
      toast({ title: "Task Deleted", description: "The task has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
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
          <h2 className="text-3xl font-bold font-display">Task Management</h2>
          <p className="text-muted-foreground">Create, assign and manage tasks for your team.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  required
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the task..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select 
                    value={formData.assignedToId} 
                    onValueChange={(val) => setFormData({ ...formData, assignedToId: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffUsers.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(val) => setFormData({ ...formData, priority: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createTask.isPending}>
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search tasks by title or assignee..." 
          className="pl-10 max-w-sm rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredTasks
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((task) => (
          <Card key={task.id} className="overflow-hidden">
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
                    <span>Assigned to: <span className="font-medium">{task.assignee?.firstName} {task.assignee?.lastName}</span></span>
                    {task.dueDate && (
                      <span>Due: {format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
                    )}
                  </div>

                  <div className="w-full max-w-md pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{task.completionLevel}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${task.completionLevel}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this task? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-destructive">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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
