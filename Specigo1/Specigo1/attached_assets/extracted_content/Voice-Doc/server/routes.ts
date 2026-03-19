import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertRecordSchema } from "@shared/schema";

// In-memory session storage: userId -> sessionId
const medgemmaSessions: Map<number, string> = new Map();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // User Routes
  app.post(api.users.login.path, async (req, res) => {
    try {
      const { phoneNumber } = api.users.login.input.parse(req.body);
      let user = await storage.getUserByPhone(phoneNumber);
      
      if (!user) {
        // Create new user if not exists
        user = await storage.createUser({ phoneNumber });
        res.status(201).json(user);
      } else {
        res.status(200).json(user);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.update.path.replace(':id', ':id'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByPhone(req.params.phoneNumber);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Medical Records Routes
  app.post(api.records.create.path, async (req, res) => {
    try {
      const record = insertRecordSchema.parse(req.body);
      const saved = await storage.createMedicalRecord(record);
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: "Invalid record data" });
    }
  });

  app.get(api.records.list.path, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const records = await storage.getMedicalRecords(userId);
    res.json(records);
  });

  // AI Chat Route - Proxy to MedGemma
  app.post(api.ai.chat.path, async (req, res) => {
    try {
      const { message, context, userId } = api.ai.chat.input.parse(req.body);
      
      const MODEL_BASE_URL = "https://pura-reasonable-ali.ngrok-free.dev";
      
      try {
        // Get or create a session for this user
        let sessionId = medgemmaSessions.get(userId);
        
        if (!sessionId) {
          console.log(`[MedGemma] Starting new session for user ${userId}`);
          const startResponse = await fetch(`${MODEL_BASE_URL}/start_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          
          if (!startResponse.ok) {
            throw new Error(`Failed to start session: ${startResponse.status}`);
          }
          
          const startData = await startResponse.json();
          sessionId = startData.session_id || startData.sessionId || startData.id;
          
          if (!sessionId) {
            throw new Error("No session ID in response");
          }
          
          medgemmaSessions.set(userId, sessionId);
          console.log(`[MedGemma] Session created: ${sessionId}`);
        }
        
        // Send message to the chat endpoint
        console.log(`[MedGemma] Sending message with session ${sessionId}`);
        const chatResponse = await fetch(`${MODEL_BASE_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message: message,
            context: context || undefined,
          }),
        });
        
        if (!chatResponse.ok) {
          console.error(`[MedGemma] Chat endpoint error: ${chatResponse.status}`);
          // If session is invalid, clear it and retry
          if (chatResponse.status === 400 || chatResponse.status === 401) {
            medgemmaSessions.delete(userId);
            throw new Error("Session invalid, will retry");
          }
          throw new Error(`Chat failed: ${chatResponse.status}`);
        }
        
        const chatData = await chatResponse.json();
        const reply = chatData.response || chatData.message || chatData.text || "I understood your symptoms.";
        
        console.log(`[MedGemma] Response received: ${reply.substring(0, 50)}...`);
        res.json({ response: reply });
        
      } catch (fetchError) {
        console.error("[MedGemma] Error:", fetchError);
        res.json({
          response: "I'm having difficulty reaching the medical AI right now, but I'm listening carefully. Tell me more about your symptoms."
        });
      }

    } catch (err) {
      console.error("[MedGemma] Request parsing error:", err);
      res.status(400).json({ message: "Invalid chat request" });
    }
  });

  return httpServer;
}
