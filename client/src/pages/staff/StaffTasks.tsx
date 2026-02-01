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
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";

export default function StaffTasks() {
  const { data: user } = useCurrentUser();
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const myTasks = tasks?.filter(t => t.assignedToId === user?.id) || [];
  
  const filteredTasks = myTasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = async (id: number, updates: any) => {
    try {
      await updateTask.mutateAsync({ id, ...updates });
      setSelectedTask(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">My Tasks</h2>
          <p className="text-muted-foreground">Manage your assigned work and track progress.</p>
        </div>
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
        {filteredTasks.map((task) => (
          <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <StatusBadge status={task.priority} variant="outline" />
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-muted-foreground">{task.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <span>Due: {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}</span>
                    <span>•</span>
                    <span>Completion: {task.completionLevel}%</span>
                  </div>
                  
                  {/* Progress Bar Visual */}
                  <div className="w-full max-w-md h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${task.completionLevel}%` }}
                    />
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedTask(task)}>Update Status</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Task Progress</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          defaultValue={task.status} 
                          onValueChange={(val) => handleUpdate(task.id, { status: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <Label>Completion Level</Label>
                          <span className="text-sm font-medium text-muted-foreground">{task.completionLevel}%</span>
                        </div>
                        <Slider 
                          defaultValue={[task.completionLevel]} 
                          max={100} 
                          step={5}
                          onValueCommit={(val) => handleUpdate(task.id, { completionLevel: val[0] })}
                        />
                      </div>
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
