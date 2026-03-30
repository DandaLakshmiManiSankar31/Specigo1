import { z } from 'zod';
import { insertUserSchema, insertRecordSchema, insertReportSchema, users, medicalRecords, medicalReports } from './schema';

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
      path: '/api/users/:phoneNumber',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    listByPhone: {
      method: 'GET' as const,
      path: '/api/users/family/:phoneNumber',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    createFamilyMember: {
      method: 'POST' as const,
      path: '/api/users/family',
      input: z.object({
        phoneNumber: z.string(),
        name: z.string(),
        age: z.number().optional(),
        gender: z.string().optional(),
        bloodGroup: z.string().optional(),
        height: z.string().optional(),
        weight: z.string().optional(),
        place: z.string().optional(),
        occupation: z.string().optional(),
        qualification: z.string().optional(),
        parentUserId: z.number(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
      },
    },
    getById: {
      method: 'GET' as const,
      path: '/api/users/id/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  ai: {
    chat: {
      method: 'POST' as const,
      path: '/api/ai/chat',
      input: z.object({
        message: z.string(),
        context: z.string().optional(),
        reportContext: z.string().optional(),
        userId: z.number(),
        isFirstMessage: z.boolean().optional(),
        mode: z.enum(['symptomatic', 'report-analysis', 'symptom-followup', 'diet-planner', 'meal-edit']).optional(),
        turnCount: z.number().optional(),
      }),
      responses: {
        200: z.object({ response: z.string(), followUpQuestions: z.array(z.string()).optional() }),
      },
    },
    symptomCheck: {
      method: 'POST' as const,
      path: '/api/ai/symptom-check',
      input: z.object({
        userId: z.number(),
        symptom: z.string(),
        relatedSymptoms: z.array(z.string()),
        onset: z.string(),
        severity: z.string(),
        context: z.string().optional(),
      }),
      responses: {
        200: z.object({ response: z.string() }),
      },
    },
    suggestSymptoms: {
      method: 'POST' as const,
      path: '/api/ai/suggest-symptoms',
      input: z.object({
        symptom: z.string(),
      }),
      responses: {
        200: z.object({ suggestions: z.array(z.string()) }),
      },
    },
    warmSession: {
      method: 'POST' as const,
      path: '/api/ai/warm-session',
      input: z.object({
        userId: z.number(),
        mode: z.enum(['symptomatic', 'report-analysis', 'symptom-followup', 'diet-planner', 'meal-edit']).optional(),
        context: z.string().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), sessionId: z.string().optional() }),
      },
    },
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
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/records/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    deleteByDate: {
      method: 'DELETE' as const,
      path: '/api/records/user/:userId/date/:date',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    }
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: z.object({
        userId: z.number(),
        reportType: z.string(),
        fileName: z.string().optional(),
        reportText: z.string(),
      }),
      responses: {
        201: z.custom<typeof medicalReports.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/reports/user/:userId',
      responses: {
        200: z.array(z.custom<typeof medicalReports.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reports/:id',
      responses: {
        200: z.custom<typeof medicalReports.$inferSelect>(),
      },
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/reports/:id/analyze',
      input: z.object({
        userId: z.number(),
      }),
      responses: {
        200: z.object({
          analysis: z.string(),
          riskLevel: z.string(),
          parameters: z.array(z.object({
            name: z.string(),
            value: z.string(),
            normalRange: z.string().optional(),
            status: z.string(),
            explanation: z.string(),
          })).optional(),
        }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reports/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
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
