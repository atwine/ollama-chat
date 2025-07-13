import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ragService } from "./rag-service";
import multer from "multer";
import ollama from "ollama";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Document upload endpoint
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const documentId = await ragService.uploadDocument(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        1 // Mock user ID - replace with actual user from session
      );

      res.json({ 
        success: true, 
        documentId,
        filename: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error(`Error uploading document: ${error}`);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  // Get user documents
  app.get('/api/documents', async (req, res) => {
    try {
      const documents = await ragService.getUserDocuments(1); // Mock user ID
      res.json(documents);
    } catch (error) {
      console.error(`Error fetching documents: ${error}`);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await ragService.deleteDocument(documentId, 1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting document: ${error}`);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // Get available Ollama models
  app.get('/api/models', async (req, res) => {
    try {
      // Fetch models from Ollama
      const models = await ollama.list();
      res.json(models);
    } catch (error) {
      console.error(`Error fetching models: ${error}`);
      res.status(500).json({ error: 'Failed to fetch models from Ollama' });
    }
  });

  // RAG chat endpoint
  app.post('/api/chat/rag', async (req, res) => {
    try {
      const { query, model = 'llama3.1:8b' } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const result = await ragService.generateRAGResponse(query, model);
      
      res.json({
        answer: result.answer,
        sources: result.sources,
        model,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error in RAG chat: ${error}`);
      res.status(500).json({ error: 'Failed to process RAG request' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
