import { pgTable, text, serial, integer, boolean, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

// Re-export auth models
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: varchar("assigned_to_id").notNull(), // references users.id
  assignedById: varchar("assigned_by_id").notNull(), // references users.id
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  dueDate: timestamp("due_date"),
  completionLevel: integer("completion_level").default(0).notNull(), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // references users.id
  date: date("date").notNull(),
  status: text("status", { enum: ["present", "absent", "leave"] }).default("present").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // references users.id
  type: text("type", { enum: ["sick", "casual", "vacation", "other"] }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // references users.id
  amount: integer("amount").notNull(), // stored in cents
  description: text("description").notNull(),
  date: date("date").notNull(),
  category: text("category").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Use a simple table to store user roles since we can't easily modify the auth blueprint table
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").unique().notNull(),
  role: text("role", { enum: ["admin", "staff", "proprietor"] }).default("staff").notNull(),
  department: text("department"),
  title: text("title"),
});

// === RELATIONS ===

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "assignee"
  }),
  assigner: one(users, {
    fields: [tasks.assignedById],
    references: [users.id],
    relationName: "assigner"
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  user: one(users, {
    fields: [leaves.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, createdAt: true, status: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, status: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type UserRole = typeof userRoles.$inferSelect;

// Request/Response types
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type UpdateTaskStatusRequest = { status: Task["status"]; completionLevel?: number };

export type CreateAttendanceRequest = InsertAttendance;
export type UpdateAttendanceRequest = Partial<InsertAttendance>;

export type CreateLeaveRequest = InsertLeave;
export type UpdateLeaveStatusRequest = { status: Leave["status"] };

export type CreateExpenseRequest = InsertExpense;
export type UpdateExpenseStatusRequest = { status: Expense["status"] };

export type AssignRoleRequest = { userId: string; role: "admin" | "staff" | "proprietor"; department?: string; title?: string };

export type UserWithRole = typeof users.$inferSelect & { role?: string | null; department?: string | null; title?: string | null };
