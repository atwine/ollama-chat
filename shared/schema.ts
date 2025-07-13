import { pgTable, text, serial, integer, boolean, timestamp, vector, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  model: text("model").notNull(),
  created: timestamp("created").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  model: text("model"),
  tokens: integer("tokens"),
  sourceDocuments: text("source_documents").array(), // Array of document IDs used for this response
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filesize: integer("filesize").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for additional metadata
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  processingStatus: text("processing_status").default("processing").notNull(), // 'processing', 'ready', 'error'
  chunksCount: integer("chunks_count").default(0), // Total number of chunks for this document
  processedChunks: integer("processed_chunks").default(0), // Number of chunks that have been processed
});

export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  startPage: integer("start_page"),
  endPage: integer("end_page"),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI embeddings are 1536 dimensions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  title: true,
  model: true,
  userId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  role: true,
  content: true,
  model: true,
  tokens: true,
  sourceDocuments: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  originalName: true,
  filesize: true,
  mimeType: true,
  content: true,
  metadata: true,
  userId: true,
  processingStatus: true,
  chunksCount: true,
  processedChunks: true,
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).pick({
  documentId: true,
  chunkIndex: true,
  content: true,
  startPage: true,
  endPage: true,
  embedding: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type DocumentChunk = typeof documentChunks.$inferSelect;
