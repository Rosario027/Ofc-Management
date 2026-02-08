import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertExpense, Expense } from "@shared/schema";

export interface ExpenseWithUser extends Expense {
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

export function useExpenses() {
  return useQuery({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await fetch(api.expenses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json() as Promise<ExpenseWithUser[]>;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await fetch(api.expenses.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create expense request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
    },
  });
}

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "approved" | "rejected" }) => {
      const url = buildUrl(api.expenses.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to update expense status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
    },
  });
}
