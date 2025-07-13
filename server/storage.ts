import { users, documents, documentChunks, type User, type InsertUser, type Document, type InsertDocument, type InsertDocumentChunk, type DocumentChunk } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  saveDocument(document: InsertDocument): Promise<Document>;
  getUserDocuments(userId: number): Promise<Document[]>;
  deleteDocument(documentId: number, userId?: number): Promise<void>;
  
  // Document chunk methods
  saveDocumentChunk(chunk: InsertDocumentChunk): Promise<DocumentChunk>;
  getDocumentChunks(documentId: number): Promise<DocumentChunk[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private documentChunks: Map<number, DocumentChunk>;
  currentId: number;
  currentDocId: number;
  currentChunkId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentChunks = new Map();
    this.currentId = 1;
    this.currentDocId = 1;
    this.currentChunkId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadedAt: new Date(),
      metadata: insertDocument.metadata || null,
      userId: insertDocument.userId || null
    };
    this.documents.set(id, document);
    return document;
  }

  async getUserDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      doc => doc.userId === userId
    );
  }

  async deleteDocument(documentId: number, userId?: number): Promise<void> {
    const document = this.documents.get(documentId);
    if (document && (!userId || document.userId === userId)) {
      this.documents.delete(documentId);
      
      // Also delete all chunks associated with this document
      const chunksToDelete = Array.from(this.documentChunks.values())
        .filter(chunk => chunk.documentId === documentId);
      
      for (const chunk of chunksToDelete) {
        this.documentChunks.delete(chunk.id);
      }
    }
  }
  
  async saveDocumentChunk(insertChunk: InsertDocumentChunk): Promise<DocumentChunk> {
    const id = this.currentChunkId++;
    const chunk: DocumentChunk = {
      ...insertChunk,
      id,
      startPage: insertChunk.startPage || null,
      endPage: insertChunk.endPage || null,
      embedding: insertChunk.embedding || null,
      createdAt: new Date()
    };
    this.documentChunks.set(id, chunk);
    return chunk;
  }
  
  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values())
      .filter(chunk => chunk.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
}

export const storage = new MemStorage();
