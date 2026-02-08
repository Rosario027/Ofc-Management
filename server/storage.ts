import { db } from "./db";
import { 
  tasks, attendance, leaves, expenses, organizations, users, monthlySummaries,
  type InsertTask, type Task, 
  type InsertAttendance, type Attendance, 
  type InsertLeave, type Leave,
  type InsertExpense, type Expense,
  type InsertOrganization, type Organization,
  type InsertUser, type User,
  type InsertMonthlySummary, type MonthlySummary,
  type TaskWithAssignee, type LeaveWithUser, type ExpenseWithUser, type AttendanceWithUser
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

// Password hashing
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getUsers(): Promise<User[]>;
  getUsersByOrganization(orgId: number): Promise<User[]>;

  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization>;

  // Tasks
  getTasks(): Promise<TaskWithAssignee[]>;
  getTasksByUserId(userId: number): Promise<TaskWithAssignee[]>;
  getTasksByOrganization(orgId: number): Promise<TaskWithAssignee[]>;
  getTask(id: number): Promise<TaskWithAssignee | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Attendance
  getAttendance(): Promise<AttendanceWithUser[]>;
  getAttendanceByUserId(userId: number): Promise<Attendance[]>;
  getAttendanceByOrganization(orgId: number): Promise<AttendanceWithUser[]>;
  getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceWithUser[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<Attendance>;
  getTodayAttendance(userId: number): Promise<Attendance | undefined>;

  // Leaves
  getLeaves(): Promise<LeaveWithUser[]>;
  getLeavesByUserId(userId: number): Promise<Leave[]>;
  getLeavesByOrganization(orgId: number): Promise<LeaveWithUser[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeaveStatus(id: number, status: Leave["status"], approvedById?: number): Promise<Leave>;
  getPendingLeaves(): Promise<LeaveWithUser[]>;

  // Expenses
  getExpenses(): Promise<ExpenseWithUser[]>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByOrganization(orgId: number): Promise<ExpenseWithUser[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, status: Expense["status"], approvedById?: number): Promise<Expense>;
  getPendingExpenses(): Promise<ExpenseWithUser[]>;

  // Monthly Summaries
  getMonthlySummaries(): Promise<MonthlySummary[]>;
  getMonthlySummariesByUser(userId: number): Promise<MonthlySummary[]>;
  getMonthlySummary(userId: number, month: number, year: number): Promise<MonthlySummary | undefined>;
  createMonthlySummary(summary: InsertMonthlySummary): Promise<MonthlySummary>;
  updateMonthlySummary(id: number, updates: Partial<InsertMonthlySummary>): Promise<MonthlySummary>;
}

export class DatabaseStorage implements IStorage {
  // Auth & Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, orgId));
  }

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [updated] = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
    return updated;
  }

  // Tasks
  async getTasks(): Promise<TaskWithAssignee[]> {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return this.enrichTasks(allTasks);
  }

  async getTasksByUserId(userId: number): Promise<TaskWithAssignee[]> {
    const userTasks = await db.select().from(tasks)
      .where(eq(tasks.assignedToId, userId))
      .orderBy(desc(tasks.dueDate));
    return this.enrichTasks(userTasks);
  }

  async getTasksByOrganization(orgId: number): Promise<TaskWithAssignee[]> {
    const orgTasks = await db.select().from(tasks)
      .where(eq(tasks.organizationId, orgId))
      .orderBy(desc(tasks.createdAt));
    return this.enrichTasks(orgTasks);
  }

  async getTask(id: number): Promise<TaskWithAssignee | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    const enriched = await this.enrichTasks([task]);
    return enriched[0];
  }

  private async enrichTasks(taskList: Task[]): Promise<TaskWithAssignee[]> {
    const enrichedTasks: TaskWithAssignee[] = [];
    for (const task of taskList) {
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedToId));
      const [assigner] = await db.select().from(users).where(eq(users.id, task.assignedById));
      enrichedTasks.push({ ...task, assignee, assigner });
    }
    return enrichedTasks;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks).set({ ...updates, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Attendance
  async getAttendance(): Promise<AttendanceWithUser[]> {
    const allAttendance = await db.select().from(attendance).orderBy(desc(attendance.date));
    return this.enrichAttendance(allAttendance);
  }

  async getAttendanceByUserId(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByOrganization(orgId: number): Promise<AttendanceWithUser[]> {
    const orgAttendance = await db.select().from(attendance)
      .where(eq(attendance.organizationId, orgId))
      .orderBy(desc(attendance.date));
    return this.enrichAttendance(orgAttendance);
  }

  async getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceWithUser[]> {
    const rangeAttendance = await db.select().from(attendance)
      .where(and(
        gte(attendance.date, startDate.toISOString().split('T')[0]),
        lte(attendance.date, endDate.toISOString().split('T')[0])
      ))
      .orderBy(desc(attendance.date));
    return this.enrichAttendance(rangeAttendance);
  }

  private async enrichAttendance(attendanceList: Attendance[]): Promise<AttendanceWithUser[]> {
    const enriched: AttendanceWithUser[] = [];
    for (const record of attendanceList) {
      const [user] = await db.select().from(users).where(eq(users.id, record.userId));
      enriched.push({ ...record, user });
    }
    return enriched;
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(data).returning();
    return record;
  }

  async updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<Attendance> {
    const [updated] = await db.update(attendance).set(updates).where(eq(attendance.id, id)).returning();
    return updated;
  }

  async getTodayAttendance(userId: number): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, today)));
    return record;
  }

  // Leaves
  async getLeaves(): Promise<LeaveWithUser[]> {
    const allLeaves = await db.select().from(leaves).orderBy(desc(leaves.createdAt));
    return this.enrichLeaves(allLeaves);
  }

  async getLeavesByUserId(userId: number): Promise<Leave[]> {
    return await db.select().from(leaves)
      .where(eq(leaves.userId, userId))
      .orderBy(desc(leaves.createdAt));
  }

  async getLeavesByOrganization(orgId: number): Promise<LeaveWithUser[]> {
    const orgLeaves = await db.select().from(leaves)
      .where(eq(leaves.organizationId, orgId))
      .orderBy(desc(leaves.createdAt));
    return this.enrichLeaves(orgLeaves);
  }

  private async enrichLeaves(leaveList: Leave[]): Promise<LeaveWithUser[]> {
    const enriched: LeaveWithUser[] = [];
    for (const leave of leaveList) {
      const [user] = await db.select().from(users).where(eq(users.id, leave.userId));
      let approvedBy = null;
      if (leave.approvedById) {
        [approvedBy] = await db.select().from(users).where(eq(users.id, leave.approvedById));
      }
      enriched.push({ ...leave, user, approvedBy });
    }
    return enriched;
  }

  async createLeave(data: InsertLeave): Promise<Leave> {
    const [record] = await db.insert(leaves).values(data).returning();
    return record;
  }

  async updateLeaveStatus(id: number, status: Leave["status"], approvedById?: number): Promise<Leave> {
    const updates: any = { status };
    if (approvedById) {
      updates.approvedById = approvedById;
      updates.approvedAt = new Date();
    }
    const [updated] = await db.update(leaves).set(updates).where(eq(leaves.id, id)).returning();
    return updated;
  }

  async getPendingLeaves(): Promise<LeaveWithUser[]> {
    const pending = await db.select().from(leaves).where(eq(leaves.status, "pending"));
    return this.enrichLeaves(pending);
  }

  // Expenses
  async getExpenses(): Promise<ExpenseWithUser[]> {
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    return this.enrichExpenses(allExpenses);
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.createdAt));
  }

  async getExpensesByOrganization(orgId: number): Promise<ExpenseWithUser[]> {
    const orgExpenses = await db.select().from(expenses)
      .where(eq(expenses.organizationId, orgId))
      .orderBy(desc(expenses.createdAt));
    return this.enrichExpenses(orgExpenses);
  }

  private async enrichExpenses(expenseList: Expense[]): Promise<ExpenseWithUser[]> {
    const enriched: ExpenseWithUser[] = [];
    for (const expense of expenseList) {
      const [user] = await db.select().from(users).where(eq(users.id, expense.userId));
      let approvedBy = null;
      if (expense.approvedById) {
        [approvedBy] = await db.select().from(users).where(eq(users.id, expense.approvedById));
      }
      enriched.push({ ...expense, user, approvedBy });
    }
    return enriched;
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [record] = await db.insert(expenses).values(data).returning();
    return record;
  }

  async updateExpenseStatus(id: number, status: Expense["status"], approvedById?: number): Promise<Expense> {
    const updates: any = { status };
    if (approvedById) {
      updates.approvedById = approvedById;
      updates.approvedAt = new Date();
    }
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async getPendingExpenses(): Promise<ExpenseWithUser[]> {
    const pending = await db.select().from(expenses).where(eq(expenses.status, "pending"));
    return this.enrichExpenses(pending);
  }

  // Monthly Summaries
  async getMonthlySummaries(): Promise<MonthlySummary[]> {
    return await db.select().from(monthlySummaries).orderBy(desc(monthlySummaries.year), desc(monthlySummaries.month));
  }

  async getMonthlySummariesByUser(userId: number): Promise<MonthlySummary[]> {
    return await db.select().from(monthlySummaries)
      .where(eq(monthlySummaries.userId, userId))
      .orderBy(desc(monthlySummaries.year), desc(monthlySummaries.month));
  }

  async getMonthlySummary(userId: number, month: number, year: number): Promise<MonthlySummary | undefined> {
    const [summary] = await db.select().from(monthlySummaries)
      .where(and(
        eq(monthlySummaries.userId, userId),
        eq(monthlySummaries.month, month),
        eq(monthlySummaries.year, year)
      ));
    return summary;
  }

  async createMonthlySummary(summary: InsertMonthlySummary): Promise<MonthlySummary> {
    const [created] = await db.insert(monthlySummaries).values(summary).returning();
    return created;
  }

  async updateMonthlySummary(id: number, updates: Partial<InsertMonthlySummary>): Promise<MonthlySummary> {
    const [updated] = await db.update(monthlySummaries).set({ ...updates, updatedAt: new Date() }).where(eq(monthlySummaries.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
