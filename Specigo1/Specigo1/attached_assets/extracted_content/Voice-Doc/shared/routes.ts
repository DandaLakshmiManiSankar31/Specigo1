import { z } from 'zod';
import { insertUserSchema, insertRecordSchema, users, medicalRecords } from './schema';

export const api = {
  users: {
    login: {
      method: 'POST' as const,
      path: '/api/users/login',
      input: z.object({ phoneNumber: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        201: z.custom<typeof users.$inferSelect>(), // Created new user
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:phoneNumber', // Fetch by phone for simplicity in this flow
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    }
  },
  ai: {
    chat: {
      method: 'POST' as const,
      path: '/api/ai/chat',
      input: z.object({
        message: z.string(),
        context: z.string().optional(), // Medical history context
        userId: z.number(), // User ID for session management
      }),
      responses: {
        200: z.object({ response: z.string() }),
      },
    }
  },
  records: {
    create: {
      method: 'POST' as const,
      path: '/api/records',
      input: insertRecordSchema,
      responses: {
        201: z.custom<typeof medicalRecords.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/records/user/:userId',
      responses: {
        200: z.array(z.custom<typeof medicalRecords.$inferSelect>()),
      },
    }
  }
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

export const errorSchemas = {
  common: z.object({ message: z.string() })
};
