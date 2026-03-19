import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Helper to handle Zod parsing of API responses
function parseData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("Schema validation failed:", result.error);
    throw new Error("Invalid API response");
  }
  return result.data;
}

// === AUTH / USER HOOKS ===

export function useLoginUser() {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await fetch(api.users.login.path, {
        method: api.users.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      // Handle both 200 (existing) and 201 (created)
      const schema = res.status === 201 
        ? api.users.login.responses[201] 
        : api.users.login.responses[200];
      return parseData(schema, await res.json());
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, phoneNumber }: { id: number; updates: Record<string, any>; phoneNumber?: string }) => {
      // Clean up empty strings to null/undefined if necessary, or just send partial
      const validated = api.users.update.input.parse(updates);
      const url = buildUrl(api.users.update.path, { id });
      
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update user");
      const data = parseData(api.users.update.responses[200], await res.json());
      return { data, phoneNumber };
    },
    onSuccess: ({ data, phoneNumber }) => {
      if (phoneNumber) {
        queryClient.invalidateQueries({ 
          queryKey: [api.users.get.path, phoneNumber] 
        });
      }
      queryClient.invalidateQueries({
        queryKey: [api.users.getById.path, data.id]
      });
    },
  });
}

export function useUser(phoneNumber: string | null) {
  return useQuery({
    queryKey: [api.users.get.path, phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return null;
      const url = buildUrl(api.users.get.path, { phoneNumber });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return parseData(api.users.get.responses[200], await res.json());
    },
    enabled: !!phoneNumber,
  });
}

export function useUserById(userId: number | null) {
  return useQuery({
    queryKey: [api.users.getById.path, userId],
    queryFn: async () => {
      if (!userId) return null;
      const url = buildUrl(api.users.getById.path, { id: userId });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return parseData(api.users.getById.responses[200], await res.json());
    },
    enabled: !!userId,
  });
}

export function useFamilyMembers(phoneNumber: string | null) {
  return useQuery({
    queryKey: [api.users.listByPhone.path, phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return [];
      const url = buildUrl(api.users.listByPhone.path, { phoneNumber });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch family members");
      return await res.json() as any[];
    },
    enabled: !!phoneNumber,
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { phoneNumber: string; name: string; age?: number; gender?: string; bloodGroup?: string; height?: string; weight?: string; place?: string; occupation?: string; qualification?: string; parentUserId: number }) => {
      const res = await fetch(api.users.createFamilyMember.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create family member");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.users.listByPhone.path, variables.phoneNumber] });
    },
  });
}
