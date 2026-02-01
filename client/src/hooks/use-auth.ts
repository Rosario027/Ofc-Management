import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { LoginInput } from "@shared/schema";

export interface AuthUser {
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
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(api.auth.me.path, {
    credentials: "include",
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }

  return res.json();
}

async function loginUser(data: LoginInput): Promise<AuthUser> {
  const res = await fetch(api.auth.login.path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }

  return res.json();
}

async function logoutUser(): Promise<void> {
  const res = await fetch(api.auth.logout.path, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
