import { pgTable, text, serial, integer, boolean, timestamp, varchar, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === ORGANIZATIONS ===
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === USERS (Custom Auth) ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  profileImageUrl: text("profile_image_url"),
  role: text("role", { enum: ["admin", "proprietor", "staff"] }).default("staff").notNull(),
  department: text("department"),
  title: text("title"),
  organizationId: integer("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SESSIONS ===
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === TASKS ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: integer("assigned_to_id").references(() => users.id).notNull(),
  assignedById: integer("assigned_by_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  status: text("status", { enum: ["pending", "in_progress", "completed", "reassigned"] }).default("pending").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  dueDate: timestamp("due_date"),
  completionLevel: integer("completion_level").default(0).notNull(), // 0-100
  notes: text("notes"), // For reassignment notes or progress notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === ATTENDANCE ===
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  status: text("status", { enum: ["present", "absent", "half_day", "leave"] }).default("present").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  workHours: decimal("work_hours", { precision: 4, scale: 2 }),
  notes: text("notes"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === LEAVES ===
export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["sick", "casual", "vacation", "emergency", "other"] }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === EXPENSES ===
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  category: text("category").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  receiptUrl: text("receipt_url"),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === MONTHLY SUMMARIES ===
export const monthlySummaries = pgTable("monthly_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalTasks: integer("total_tasks").default(0),
  completedTasks: integer("completed_tasks").default(0),
  inProgressTasks: integer("in_progress_tasks").default(0),
  pendingTasks: integer("pending_tasks").default(0),
  attendanceDays: integer("attendance_days").default(0),
  leaveDays: integer("leave_days").default(0),
  totalExpenses: decimal("total_expenses", { precision: 10, scale: 2 }).default("0"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
  attendance: many(attendance),
  leaves: many(leaves),
  expenses: many(expenses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  assignedTasks: many(tasks, { relationName: "assignee" }),
  createdTasks: many(tasks, { relationName: "assigner" }),
  attendance: many(attendance),
  leaves: many(leaves),
  expenses: many(expenses),
  monthlySummaries: many(monthlySummaries),
}));

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
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [attendance.organizationId],
    references: [organizations.id],
  }),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  user: one(users, {
    fields: [leaves.userId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [leaves.approvedById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [leaves.organizationId],
    references: [organizations.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [expenses.approvedById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
}));

export const monthlySummariesRelations = relations(monthlySummaries, ({ one }) => ({
  user: one(users, {
    fields: [monthlySummaries.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [monthlySummaries.organizationId],
    references: [organizations.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, createdAt: true, status: true, approvedById: true, approvedAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, status: true, approvedById: true, approvedAt: true });
export const insertMonthlySummarySchema = createInsertSchema(monthlySummaries).omit({ id: true, createdAt: true, updatedAt: true });

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Profile update schema (users can update their own profile)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  department: z.string().max(100).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// === TYPES ===
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type MonthlySummary = typeof monthlySummaries.$inferSelect;
export type InsertMonthlySummary = z.infer<typeof insertMonthlySummarySchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Extended types with relations
export type UserWithOrg = User & { organization?: Organization | null };
export type TaskWithAssignee = Task & { assignee?: User | null; assigner?: User | null };
export type LeaveWithUser = Leave & { user?: User | null; approvedBy?: User | null };
export type ExpenseWithUser = Expense & { user?: User | null; approvedBy?: User | null };
export type AttendanceWithUser = Attendance & { user?: User | null };
export type MonthlySummaryWithUser = MonthlySummary & { user?: User | null };
