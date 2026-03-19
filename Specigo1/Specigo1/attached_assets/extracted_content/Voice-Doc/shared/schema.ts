import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  age: integer("age"),
  bloodGroup: text("blood_group"),
  height: text("height"), // Text to allow "5'11" or "180cm"
  weight: text("weight"),
  medicalHistory: text("medical_history"), // Summary of past history
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symptom: text("symptom").notNull(),
  diagnosis: text("diagnosis"), // Response from AI
  fullConversation: jsonb("full_conversation"), // Store the chat context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertRecordSchema = createInsertSchema(medicalRecords).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertRecordSchema>;
