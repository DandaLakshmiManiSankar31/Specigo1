import { 
  type User, type InsertUser, type MedicalRecord, type InsertMedicalRecord,
  users, medicalRecords 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecords(userId: number): Promise<MedicalRecord[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [savedRecord] = await db.insert(medicalRecords).values(record).returning();
    return savedRecord;
  }

  async getMedicalRecords(userId: number): Promise<MedicalRecord[]> {
    return await db.select()
      .from(medicalRecords)
      .where(eq(medicalRecords.userId, userId))
      .orderBy(desc(medicalRecords.createdAt));
  }
}

export const storage = new DatabaseStorage();
