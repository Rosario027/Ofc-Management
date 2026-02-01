import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface MonthlySummary {
  id: number;
  userId: number;
  month: number;
  year: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  attendanceDays: number;
  leaveDays: number;
  totalExpenses: string;
  organizationId?: number | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function useSummaries() {
  return useQuery({
    queryKey: [api.summaries.get.path],
    queryFn: async () => {
      const res = await fetch(api.summaries.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summaries");
      return res.json() as Promise<MonthlySummary[]>;
    },
  });
}

export function useUserSummaries(userId: number | null) {
  return useQuery({
    queryKey: [api.summaries.getByUser.path, userId],
    queryFn: async () => {
      if (!userId) return [];
      const url = api.summaries.getByUser.path.replace(":userId", String(userId));
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user summaries");
      return res.json() as Promise<MonthlySummary[]>;
    },
    enabled: !!userId,
  });
}

export function useGenerateSummaries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const res = await fetch(api.summaries.generate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate summaries");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.summaries.get.path] });
    },
  });
}
