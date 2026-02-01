import { db } from "./db";
import { 
  tasks, attendance, leaves, expenses, userRoles,
  type InsertTask, type Task, 
  type InsertAttendance, type Attendance, 
  type InsertLeave, type Leave, 
  type InsertExpense, type Expense,
  type InsertUserRole, type UserRole,
  type UpdateTaskRequest, type UpdateAttendanceRequest
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Attendance
  getAttendance(): Promise<Attendance[]>;
  getAttendanceByUserId(userId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  // Leaves
  getLeaves(): Promise<Leave[]>;
  getLeavesByUserId(userId: string): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeaveStatus(id: number, status: Leave["status"]): Promise<Leave>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByUserId(userId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, status: Expense["status"]): Promise<Expense>;

  // User Roles
  getUserRole(userId: string): Promise<UserRole | undefined>;
  assignUserRole(role: InsertUserRole): Promise<UserRole>;
  getAllUserRoles(): Promise<UserRole[]>;
}

export class DatabaseStorage implements IStorage {
  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedToId, userId)).orderBy(desc(tasks.dueDate));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Attendance
  async getAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  async getAttendanceByUserId(userId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.date));
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(data).returning();
    return record;
  }

  // Leaves
  async getLeaves(): Promise<Leave[]> {
    return await db.select().from(leaves).orderBy(desc(leaves.createdAt));
  }

  async getLeavesByUserId(userId: string): Promise<Leave[]> {
    return await db.select().from(leaves).where(eq(leaves.userId, userId)).orderBy(desc(leaves.createdAt));
  }

  async createLeave(data: InsertLeave): Promise<Leave> {
    const [record] = await db.insert(leaves).values(data).returning();
    return record;
  }

  async updateLeaveStatus(id: number, status: Leave["status"]): Promise<Leave> {
    const [updated] = await db.update(leaves).set({ status }).where(eq(leaves.id, id)).returning();
    return updated;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.createdAt));
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [record] = await db.insert(expenses).values(data).returning();
    return record;
  }

  async updateExpenseStatus(id: number, status: Expense["status"]): Promise<Expense> {
    const [updated] = await db.update(expenses).set({ status }).where(eq(expenses.id, id)).returning();
    return updated;
  }

  // User Roles
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role;
  }

  async assignUserRole(data: InsertUserRole): Promise<UserRole> {
    const [role] = await db
      .insert(userRoles)
      .values(data)
      .onConflictDoUpdate({
        target: userRoles.userId,
        set: data
      })
      .returning();
    return role;
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles);
  }
}

export const storage = new DatabaseStorage();
