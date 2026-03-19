import { useMutation, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("Schema validation failed:", result.error);
    throw new Error("Invalid API response");
  }
  return result.data;
}

// === AI CHAT HOOK ===

export function useAiChat() {
  return useMutation({
    mutationFn: async ({ message, context, userId }: { message: string; context?: string; userId: number }) => {
      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context, userId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("AI service error");
      return parseData(api.ai.chat.responses[200], await res.json());
    },
  });
}

// === MEDICAL RECORDS HOOKS ===

export function useCreateRecord() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.records.create.input>) => {
      const res = await fetch(api.records.create.path, {
        method: api.records.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save record");
      return parseData(api.records.create.responses[201], await res.json());
    },
  });
}

export function useMedicalRecords(userId: number | undefined) {
  return useQuery({
    queryKey: [api.records.list.path, userId],
    queryFn: async () => {
      if (!userId) return [];
      const url = buildUrl(api.records.list.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch records");
      return parseData(api.records.list.responses[200], await res.json());
    },
    enabled: !!userId,
  });
}
