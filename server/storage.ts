import { users, documents, type User, type InsertUser, type Document, type InsertDocument } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  currentId: number;
  currentDocId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.currentId = 1;
    this.currentDocId = 1;
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
    }
  }
}

export const storage = new MemStorage();
