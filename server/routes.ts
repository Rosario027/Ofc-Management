import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to ensure auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper to get enriched user data
  async function getEnrichedUser(userId: string) {
    const user = await authStorage.getUser(userId);
    let role = await storage.getUserRole(userId);

    // If no role exists, check if this is the first user
    if (!role) {
      const allRoles = await storage.getAllUserRoles();
      const isFirstUser = allRoles.length === 0;
      
      role = await storage.assignUserRole({
        userId,
        role: isFirstUser ? "admin" : "staff",
        department: "General",
        title: isFirstUser ? "Administrator" : "Staff Member"
      });
    }

    return {
      ...user,
      role: role?.role || "staff", // Default to staff
      department: role?.department,
      title: role?.title
    };
  }

  // API Routes

  // Tasks
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const enrichedUser = await getEnrichedUser(userId);
    
    let tasks;
    if (enrichedUser.role === "admin" || enrichedUser.role === "proprietor") {
      tasks = await storage.getTasks();
    } else {
      tasks = await storage.getTasksByUserId(userId);
    }
    
    // Enrich tasks with assignee names (simplified, ideally join in storage)
    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
      const assignee = await getEnrichedUser(task.assignedToId);
      const assigner = await getEnrichedUser(task.assignedById);
      return { ...task, assignee, assigner };
    }));

    res.json(enrichedTasks);
  });

  app.get(api.tasks.get.path, requireAuth, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post(api.tasks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.tasks.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.tasks.delete.path, requireAuth, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Attendance
  app.get(api.attendance.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const enrichedUser = await getEnrichedUser(userId);
    
    if (enrichedUser.role === "admin" || enrichedUser.role === "proprietor") {
      res.json(await storage.getAttendance());
    } else {
      res.json(await storage.getAttendanceByUserId(userId));
    }
  });

  app.post(api.attendance.mark.path, requireAuth, async (req, res) => {
    try {
      const input = api.attendance.mark.input.parse(req.body);
      const record = await storage.createAttendance(input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Leaves
  app.get(api.leaves.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const enrichedUser = await getEnrichedUser(userId);
    
    let leaves;
    if (enrichedUser.role === "admin" || enrichedUser.role === "proprietor") {
      leaves = await storage.getLeaves();
    } else {
      leaves = await storage.getLeavesByUserId(userId);
    }

    const enrichedLeaves = await Promise.all(leaves.map(async (leave) => {
      const user = await getEnrichedUser(leave.userId);
      return { ...leave, user };
    }));
    
    res.json(enrichedLeaves);
  });

  app.post(api.leaves.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.leaves.create.input.parse(req.body);
      const leave = await storage.createLeave(input);
      res.status(201).json(leave);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.leaves.updateStatus.path, requireAuth, async (req, res) => {
    const status = req.body.status;
    const leave = await storage.updateLeaveStatus(Number(req.params.id), status);
    res.json(leave);
  });

  // Expenses
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const enrichedUser = await getEnrichedUser(userId);
    
    let expenses;
    if (enrichedUser.role === "admin" || enrichedUser.role === "proprietor") {
      expenses = await storage.getExpenses();
    } else {
      expenses = await storage.getExpensesByUserId(userId);
    }

    const enrichedExpenses = await Promise.all(expenses.map(async (expense) => {
      const user = await getEnrichedUser(expense.userId);
      return { ...expense, user };
    }));
    
    res.json(enrichedExpenses);
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense(input);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.expenses.updateStatus.path, requireAuth, async (req, res) => {
    const status = req.body.status;
    const expense = await storage.updateExpenseStatus(Number(req.params.id), status);
    res.json(expense);
  });

  // Users
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    const roles = await storage.getAllUserRoles();
    // In a real app we'd join with auth users table. For now we fetch roles and enrich.
    // Note: We can't list ALL auth users easily without a separate query if they haven't logged in?
    // Actually Replit Auth storage only stores users who have logged in.
    // We can iterate over userRoles or query db directly if needed.
    // For MVP, let's just return the roles which contain userId.
    const enrichedUsers = await Promise.all(roles.map(async (role) => {
      const user = await authStorage.getUser(role.userId);
      return { ...user, ...role };
    }));
    res.json(enrichedUsers);
  });

  app.post(api.users.assignRole.path, requireAuth, async (req, res) => {
    try {
      const input = api.users.assignRole.input.parse(req.body);
      const role = await storage.assignUserRole(input);
      res.json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.users.me.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const enrichedUser = await getEnrichedUser(userId);
    res.json(enrichedUser);
  });

  return httpServer;
}
