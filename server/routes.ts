import type { Express } from "express";
import type { Server } from "http";
import { storage, verifyPassword } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Extend express session
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const pgStore = connectPg(session);

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup session
  app.use(session({
    store: new pgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Helper to ensure auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session?.userId) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper to check admin/proprietor role
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== "admin" && user.role !== "proprietor")) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session!.userId!);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      department: user.department,
      title: user.title,
      organizationId: user.organizationId,
      isActive: user.isActive,
    });
  });

  app.patch(api.auth.updateProfile.path, requireAuth, async (req, res) => {
    try {
      const input = api.auth.updateProfile.input.parse(req.body);
      const userId = req.session!.userId!;
      
      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      const user = await storage.updateUser(userId, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        department: input.department,
        title: input.title,
        profileImageUrl: input.profileImageUrl,
      });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        department: user.department,
        title: user.title,
        organizationId: user.organizationId,
        isActive: user.isActive,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.auth.changePassword.path, requireAuth, async (req, res) => {
    try {
      const input = api.auth.changePassword.input.parse(req.body);
      const userId = req.session!.userId!;
      
      // Get current user with password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await verifyPassword(input.currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password
      await storage.updateUser(userId, { password: input.newPassword });

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ORGANIZATION ROUTES ===
  app.get(api.organizations.list.path, requireAuth, async (req, res) => {
    const orgs = await storage.getOrganizations();
    res.json(orgs);
  });

  app.post(api.organizations.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.organizations.create.input.parse(req.body);
      const org = await storage.createOrganization(input);
      res.status(201).json(org);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.organizations.get.path, requireAuth, async (req, res) => {
    const org = await storage.getOrganization(Number(req.params.id));
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  });

  app.patch(api.organizations.update.path, requireAdmin, async (req, res) => {
    try {
      const org = await storage.updateOrganization(Number(req.params.id), req.body);
      res.json(org);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === TASK ROUTES ===
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    const userId = req.session!.userId!;
    const user = await storage.getUser(userId);
    
    let tasks;
    if (user?.role === "admin" || user?.role === "proprietor") {
      tasks = user.organizationId 
        ? await storage.getTasksByOrganization(user.organizationId)
        : await storage.getTasks();
    } else {
      tasks = await storage.getTasksByUserId(userId);
    }
    
    res.json(tasks);
  });

  app.get(api.tasks.get.path, requireAuth, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post(api.tasks.create.path, requireAdmin, async (req, res) => {
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
      const userId = req.session!.userId!;
      const taskId = Number(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const user = await storage.getUser(userId);
      // Staff can only update their own tasks, admins can update any
      if (user?.role === "staff" && existingTask.assignedToId !== userId) {
        return res.status(403).json({ message: "Can only update your own tasks" });
      }

      const task = await storage.updateTask(taskId, req.body);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.tasks.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // === ATTENDANCE ROUTES ===
  app.get(api.attendance.list.path, requireAuth, async (req, res) => {
    const userId = req.session!.userId!;
    const user = await storage.getUser(userId);
    
    let attendance;
    if (user?.role === "admin" || user?.role === "proprietor") {
      attendance = user.organizationId
        ? await storage.getAttendanceByOrganization(user.organizationId)
        : await storage.getAttendance();
    } else {
      const userAttendance = await storage.getAttendanceByUserId(userId);
      attendance = userAttendance.map(a => ({ ...a, user }));
    }
    
    res.json(attendance);
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

  app.patch(api.attendance.update.path, requireAdmin, async (req, res) => {
    try {
      const record = await storage.updateAttendance(Number(req.params.id), req.body);
      res.json(record);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === LEAVES ROUTES ===
  app.get(api.leaves.list.path, requireAuth, async (req, res) => {
    const userId = req.session!.userId!;
    const user = await storage.getUser(userId);
    
    let leaves;
    if (user?.role === "admin" || user?.role === "proprietor") {
      leaves = user.organizationId
        ? await storage.getLeavesByOrganization(user.organizationId)
        : await storage.getLeaves();
    } else {
      const userLeaves = await storage.getLeavesByUserId(userId);
      leaves = userLeaves.map(l => ({ ...l, user }));
    }
    
    res.json(leaves);
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

  app.patch(api.leaves.updateStatus.path, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const approvedById = req.session!.userId;
      const leave = await storage.updateLeaveStatus(Number(req.params.id), status, approvedById);
      res.json(leave);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === EXPENSES ROUTES ===
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    const userId = req.session!.userId!;
    const user = await storage.getUser(userId);
    
    let expenses;
    if (user?.role === "admin" || user?.role === "proprietor") {
      expenses = user.organizationId
        ? await storage.getExpensesByOrganization(user.organizationId)
        : await storage.getExpenses();
    } else {
      const userExpenses = await storage.getExpensesByUserId(userId);
      expenses = userExpenses.map(e => ({ ...e, user }));
    }
    
    res.json(expenses);
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

  app.patch(api.expenses.updateStatus.path, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const approvedById = req.session!.userId;
      const expense = await storage.updateExpenseStatus(Number(req.params.id), status, approvedById);
      res.json(expense);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === USERS ROUTES ===
  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    const usersWithOrgs = await Promise.all(users.map(async (user) => {
      const org = user.organizationId ? await storage.getOrganization(user.organizationId) : null;
      return { ...user, password: undefined, organization: org };
    }));
    res.json(usersWithOrgs);
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json({ ...user, password: undefined });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.users.update.path, requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(Number(req.params.id), req.body);
      res.json({ ...user, password: undefined });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.users.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).send();
  });

  // === SUMMARIES ROUTES ===
  app.get(api.summaries.get.path, requireAuth, async (req, res) => {
    const userId = req.session!.userId!;
    const user = await storage.getUser(userId);
    
    let summaries;
    if (user?.role === "admin" || user?.role === "proprietor") {
      summaries = await storage.getMonthlySummaries();
    } else {
      summaries = await storage.getMonthlySummariesByUser(userId);
    }
    
    // Enrich with user data
    const enrichedSummaries = await Promise.all(summaries.map(async (summary) => {
      const summaryUser = await storage.getUser(summary.userId);
      return { ...summary, user: summaryUser ? { ...summaryUser, password: undefined } : null };
    }));
    
    res.json(enrichedSummaries);
  });

  app.get(api.summaries.getByUser.path, requireAuth, async (req, res) => {
    const summaries = await storage.getMonthlySummariesByUser(Number(req.params.userId));
    res.json(summaries);
  });

  app.post(api.summaries.generate.path, requireAdmin, async (req, res) => {
    try {
      const { month, year } = req.body;
      const allUsers = await storage.getUsers();
      
      for (const user of allUsers) {
        // Calculate task stats
        const userTasks = await storage.getTasksByUserId(user.id);
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(t => t.status === "completed").length;
        const inProgressTasks = userTasks.filter(t => t.status === "in_progress").length;
        const pendingTasks = userTasks.filter(t => t.status === "pending").length;

        // Calculate attendance stats
        const userAttendance = await storage.getAttendanceByUserId(user.id);
        const monthAttendance = userAttendance.filter(a => {
          const date = new Date(a.date);
          return date.getMonth() + 1 === month && date.getFullYear() === year;
        });
        const attendanceDays = monthAttendance.filter(a => a.status === "present").length;
        const leaveDays = monthAttendance.filter(a => a.status === "leave").length;

        // Calculate expenses
        const userExpenses = await storage.getExpensesByUserId(user.id);
        const monthExpenses = userExpenses.filter(e => {
          const date = new Date(e.date);
          return date.getMonth() + 1 === month && date.getFullYear() === year && e.status === "approved";
        });
        const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Check if summary exists
        const existingSummary = await storage.getMonthlySummary(user.id, month, year);
        
        const summaryData = {
          userId: user.id,
          month,
          year,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          attendanceDays,
          leaveDays,
          totalExpenses: totalExpenses.toString(),
          organizationId: user.organizationId,
        };

        if (existingSummary) {
          await storage.updateMonthlySummary(existingSummary.id, summaryData);
        } else {
          await storage.createMonthlySummary(summaryData);
        }
      }

      res.status(201).json({ message: "Monthly summaries generated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === SEED DATA ===
  // Create default users if no users exist
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    console.log("Creating default users...");
    
    // Create default admin user
    await storage.createUser({
      email: "admin",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      department: "Management",
      title: "Administrator",
      isActive: true,
    });
    console.log("Default admin created: admin / admin123");
    
    // Create default regular user
    await storage.createUser({
      email: "user",
      password: "user123",
      firstName: "Regular",
      lastName: "User",
      role: "staff",
      department: "General",
      title: "Staff Member",
      isActive: true,
    });
    console.log("Default user created: user / user123");
  }

  return httpServer;
}
