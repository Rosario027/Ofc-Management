import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertUser } from "@shared/schema";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  role: string;
  department?: string | null;
  title?: string | null;
  organizationId?: number | null;
  isActive: boolean;
  organization?: {
    id: number;
    name: string;
  } | null;
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch current user");
      return res.json() as Promise<User>;
    },
    retry: false,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.users.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertUser> & { id: number }) => {
      const url = api.users.update.path.replace(":id", String(id));
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.users.delete.path.replace(":id", String(id));
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
