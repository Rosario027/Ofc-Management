import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertLeave, Leave } from "@shared/schema";

export interface LeaveWithUser extends Leave {
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export function useLeaves() {
  return useQuery({
    queryKey: [api.leaves.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaves.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json() as Promise<LeaveWithUser[]>;
    },
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLeave) => {
      const res = await fetch(api.leaves.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create leave request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "approved" | "rejected" }) => {
      const url = buildUrl(api.leaves.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to update leave status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
    },
  });
}
