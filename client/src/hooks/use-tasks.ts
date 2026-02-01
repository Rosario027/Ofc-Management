import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTask } from "@shared/schema";

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  assignedToId: number;
  assignedById: number;
  organizationId?: number | null;
  status: "pending" | "in_progress" | "completed" | "reassigned";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string | null;
  completionLevel: number;
  notes?: string | null;
  createdAt: string;
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assigner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json() as Promise<Task[]>;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await fetch(api.tasks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertTask> & { id: number }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}
