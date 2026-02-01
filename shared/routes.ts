import { z } from 'zod';
import { 
  insertTaskSchema, 
  insertAttendanceSchema, 
  insertLeaveSchema, 
  insertExpenseSchema,
  insertOrganizationSchema,
  insertUserSchema,
  loginSchema,
  tasks, 
  attendance, 
  leaves, 
  expenses,
  organizations,
  users,
  monthlySummaries
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.object({
          id: z.number(),
          email: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          role: z.string(),
          organizationId: z.number().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({
          id: z.number(),
          email: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          profileImageUrl: z.string().nullable(),
          role: z.string(),
          department: z.string().nullable(),
          title: z.string().nullable(),
          organizationId: z.number().nullable(),
          isActive: z.boolean(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  organizations: {
    list: {
      method: 'GET' as const,
      path: '/api/organizations',
      responses: {
        200: z.array(z.custom<typeof organizations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/organizations',
      input: insertOrganizationSchema,
      responses: {
        201: z.custom<typeof organizations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/organizations/:id',
      responses: {
        200: z.custom<typeof organizations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/organizations/:id',
      input: insertOrganizationSchema.partial(),
      responses: {
        200: z.custom<typeof organizations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect & { assignee?: any, assigner?: any }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tasks/:id',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  attendance: {
    list: {
      method: 'GET' as const,
      path: '/api/attendance',
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect & { user?: any }>()),
      },
    },
    mark: {
      method: 'POST' as const,
      path: '/api/attendance',
      input: insertAttendanceSchema,
      responses: {
        201: z.custom<typeof attendance.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/attendance/:id',
      input: insertAttendanceSchema.partial(),
      responses: {
        200: z.custom<typeof attendance.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  leaves: {
    list: {
      method: 'GET' as const,
      path: '/api/leaves',
      responses: {
        200: z.array(z.custom<typeof leaves.$inferSelect & { user?: any, approvedBy?: any }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leaves',
      input: insertLeaveSchema,
      responses: {
        201: z.custom<typeof leaves.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/leaves/:id/status',
      input: z.object({ status: z.enum(["pending", "approved", "rejected"]), approvedById: z.number().optional() }),
      responses: {
        200: z.custom<typeof leaves.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect & { user?: any, approvedBy?: any }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses',
      input: insertExpenseSchema,
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/expenses/:id/status',
      input: z.object({ status: z.enum(["pending", "approved", "rejected"]), approvedById: z.number().optional() }),
      responses: {
        200: z.custom<typeof expenses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect & { organization?: any }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  summaries: {
    get: {
      method: 'GET' as const,
      path: '/api/summaries',
      responses: {
        200: z.array(z.custom<typeof monthlySummaries.$inferSelect & { user?: any }>()),
      },
    },
    getByUser: {
      method: 'GET' as const,
      path: '/api/summaries/user/:userId',
      responses: {
        200: z.array(z.custom<typeof monthlySummaries.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/summaries/generate',
      input: z.object({ month: z.number(), year: z.number() }),
      responses: {
        201: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
