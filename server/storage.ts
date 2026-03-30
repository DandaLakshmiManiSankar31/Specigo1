import { 
  type User, type InsertUser, type MedicalRecord, type InsertMedicalRecord,
  type MedicalReport, type InsertMedicalReport,
  users, medicalRecords, medicalReports
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUsersByPhone(phoneNumber: string): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecords(userId: number): Promise<MedicalRecord[]>;
  deleteMedicalRecord(id: number): Promise<void>;
  deleteMedicalRecordsByDate(userId: number, date: string): Promise<void>;
  
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;
  getMedicalReports(userId: number): Promise<MedicalReport[]>;
  getMedicalReport(id: number): Promise<MedicalReport | undefined>;
  updateMedicalReport(id: number, updates: Partial<InsertMedicalReport>): Promise<MedicalReport>;
  deleteMedicalReport(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async getUsersByPhone(phoneNumber: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).orderBy(users.id);
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

  async deleteMedicalRecord(id: number): Promise<void> {
    await db.delete(medicalRecords).where(eq(medicalRecords.id, id));
  }

  async deleteMedicalRecordsByDate(userId: number, date: string): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await db.delete(medicalRecords)
      .where(
        and(
          eq(medicalRecords.userId, userId),
          gte(medicalRecords.createdAt, startOfDay),
          lte(medicalRecords.createdAt, endOfDay)
        )
      );
  }

  async createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport> {
    const [savedReport] = await db.insert(medicalReports).values(report).returning();
    return savedReport;
  }

  async getMedicalReports(userId: number): Promise<MedicalReport[]> {
    return await db.select()
      .from(medicalReports)
      .where(eq(medicalReports.userId, userId))
      .orderBy(desc(medicalReports.createdAt));
  }

  async getMedicalReport(id: number): Promise<MedicalReport | undefined> {
    const [report] = await db.select().from(medicalReports).where(eq(medicalReports.id, id));
    return report;
  }

  async updateMedicalReport(id: number, updates: Partial<InsertMedicalReport>): Promise<MedicalReport> {
    const [report] = await db.update(medicalReports).set(updates).where(eq(medicalReports.id, id)).returning();
    return report;
  }

  async deleteMedicalReport(id: number): Promise<void> {
    await db.delete(medicalReports).where(eq(medicalReports.id, id));
  }
}

export const storage = new DatabaseStorage();
