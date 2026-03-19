import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: async ({ message, context, reportContext, userId, isFirstMessage, mode }: { message: string; context?: string; reportContext?: string; userId: number; isFirstMessage?: boolean; mode?: 'symptomatic' | 'report-analysis' }) => {
      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context, reportContext, userId, isFirstMessage, mode }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("AI service error");
      return parseData(api.ai.chat.responses[200], await res.json());
    },
  });
}

// === MEDICAL RECORDS HOOKS ===

export function useCreateRecord() {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.records.list.path] });
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

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.records.delete.path, { id });
      const res = await fetch(url, {
        method: api.records.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      return parseData(api.records.delete.responses[200], await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.records.list.path] });
    },
  });
}

export function useDeleteRecordsByDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, date }: { userId: number; date: string }) => {
      const url = buildUrl(api.records.deleteByDate.path, { userId, date });
      const res = await fetch(url, {
        method: api.records.deleteByDate.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete records for date");
      return parseData(api.records.deleteByDate.responses[200], await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.records.list.path] });
    },
  });
}

export function useMedicalReports(userId: number | undefined) {
  return useQuery({
    queryKey: [api.reports.list.path, userId],
    queryFn: async () => {
      if (!userId) return [];
      const url = api.reports.list.path.replace(':userId', userId.toString());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return parseData(api.reports.list.responses[200], await res.json());
    },
    enabled: !!userId,
  });
}
