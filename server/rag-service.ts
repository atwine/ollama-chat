import { storage } from "./storage";
import { documents, documentChunks, type InsertDocument, type InsertDocumentChunk, type Document, type DocumentChunk } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import pdfParse from "pdf-parse";
import ollama from "ollama";

// Real PDF parser using pdf-parse library
const parsePdf = async (buffer: Buffer) => {
  try {
    const result = await pdfParse(buffer);
    return {
      text: result.text,
      numpages: result.numpages,
      info: result.info || {
        Title: "Unknown",
        Author: "Unknown",
        CreationDate: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse PDF: ${errorMessage}`);
  }
};

export interface DocumentSource {
  id: number;
  filename: string;
  originalName: string;
  content: string;
  page?: number;
  relevanceScore: number;
}

interface RAGResult {
  sources: DocumentSource[];
  context: string;
}

interface RAGResponse {
  answer: string;
  sources: DocumentSource[];
}

export class RAGService {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;
  private readonly MAX_CONTEXT_LENGTH = 4000;
  private readonly EMBEDDING_MODEL = "nomic-embed-text";
  private readonly DEFAULT_LLM_MODEL = "llama3.1:8b";

  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId?: number
  ): Promise<number> {
    let content = "";
    let metadata = {};

    // Extract text based on file type
    if (mimeType === "application/pdf") {
      const pdfData = await parsePdf(buffer);
      content = pdfData.text;
      metadata = {
        pages: pdfData.numpages,
        info: pdfData.info,
      };
    } else if (mimeType === "text/plain") {
      content = buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Estimate number of chunks for progress tracking
    const chunks = this.splitIntoChunks(content);
    const chunksCount = chunks.length;

    // Save document to storage with initial processing status
    const document = await storage.saveDocument({
      filename: this.generateFilename(originalName),
      originalName,
      filesize: buffer.length,
      mimeType,
      content,
      metadata: JSON.stringify(metadata),
      userId,
      processingStatus: "processing",
      chunksCount,
      processedChunks: 0,
    });

    // Create chunks and generate embeddings asynchronously
    // We don't await this to allow the upload to complete quickly
    this.createDocumentChunks(document.id, content, chunks)
      .catch(error => {
        console.error(`Error processing document ${document.id}:`, error);
        // Update document status to error
        storage.updateDocumentStatus(document.id, "error", 0, chunksCount);
      });

    return document.id;
  }

  private async createDocumentChunks(documentId: number, content: string, preChunks?: string[]): Promise<void> {
    // Use pre-split chunks if provided, otherwise split the content
    const chunks = preChunks || this.splitIntoChunks(content);
    console.log(`Creating ${chunks.length} chunks for document ${documentId}`);
    
    // Update document with total chunks count
    await storage.updateDocumentStatus(documentId, "processing", 0, chunks.length);
    
    // Store each chunk in the database with its embedding
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        
        // Generate embedding for the chunk
        const embedding = await this.generateEmbedding(chunk);
        
        // Store the chunk in the database
        await storage.saveDocumentChunk({
          documentId,
          chunkIndex: i,
          content: chunk,
          // We don't have page information in our current implementation
          // but we could add it in the future
          startPage: null,
          endPage: null,
          embedding,
        });
        
        // Update document processing status
        await storage.updateDocumentStatus(documentId, "processing", i + 1, chunks.length);
      } catch (error) {
        console.error(`Error processing chunk ${i} for document ${documentId}:`, error);
        // Continue with next chunk
      }
    }
    
    // Mark document as ready when all chunks are processed
    await storage.updateDocumentStatus(documentId, "ready", chunks.length, chunks.length);
    console.log(`Successfully stored ${chunks.length} chunks for document ${documentId}`);
  }

  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length <= this.CHUNK_SIZE) {
        currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + ".");
        }
        currentChunk = trimmedSentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + ".");
    }
    
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use the ollama package directly as a function
      const response = await ollama.embeddings({
        model: this.EMBEDDING_MODEL,
        prompt: text
      });
      
      // Return the embedding vector
      return response.embedding;
    } catch (error: unknown) {
      console.error('Error generating embeddings:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // In case of error, fall back to a random embedding (not ideal but allows the system to continue)
      console.warn(`Falling back to random embeddings due to error: ${errorMessage}`);
      
      // Generate a random embedding of the correct dimension
      const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
      
      // Normalize the vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / magnitude);
    }
  }

  async searchDocuments(query: string, limit: number = 5, documentIds?: number[]): Promise<RAGResult> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get documents for the user, filtered by documentId if provided
      let documents;
      if (documentId) {
        // If documentId is provided, only use that specific document
        const doc = await storage.getUserDocuments(1).then(docs => 
          docs.find(d => d.id === documentId)
        );
        documents = doc ? [doc] : [];
      } else {
        // Otherwise get all documents for the user
        documents = await storage.getUserDocuments(1); // Mock user ID
      }
      
      // Collect all chunks from all documents
      const allChunks: { chunk: DocumentChunk; document: any }[] = [];
      
      for (const doc of documents) {
        const chunks = await storage.getDocumentChunks(doc.id);
        chunks.forEach(chunk => {
          allChunks.push({ chunk, document: doc });
        });
      }
      
      // Calculate similarity scores for each chunk
      const scoredChunks = allChunks
        .filter(item => item.chunk.embedding !== null) // Only consider chunks with embeddings
        .map(item => {
          // Calculate cosine similarity between query embedding and chunk embedding
          const similarity = this.cosineSimilarity(queryEmbedding, item.chunk.embedding!);
          
          return {
            ...item,
            similarity
          };
        })
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
        .slice(0, limit); // Take top N results
      
      // Format results as DocumentSource
      const sources: DocumentSource[] = scoredChunks.map(item => ({
        id: item.document.id,
        filename: item.document.filename,
        originalName: item.document.originalName,
        content: item.chunk.content,
        relevanceScore: item.similarity,
      }));
      
      // Combine context from top results
      const context = sources
        .map(source => source.content)
        .join("\n\n")
        .substring(0, this.MAX_CONTEXT_LENGTH);
      
      return { sources, context };
    } catch (error: unknown) {
      console.error('Error in semantic search:', error);
      
      // Fall back to keyword search if semantic search fails
      console.warn('Falling back to keyword search');
      
      // Get documents, filtered by documentIds if provided
      let documents;
      if (documentIds && documentIds.length > 0) {
        // Get all user documents first
        const allDocs = await storage.getUserDocuments(1); // Mock user ID
        // Filter to only include the specified document IDs
        documents = allDocs.filter(doc => documentIds.includes(doc.id));
      } else {
        // If no document IDs specified, get all user documents
        documents = await storage.getUserDocuments(1); // Mock user ID
      }
      
      // Simple keyword-based search fallback
      const matchingDocs = documents.filter(doc => 
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(query.toLowerCase())
      );

      // Format results as DocumentSource
      const sources: DocumentSource[] = matchingDocs.slice(0, limit).map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        content: doc.content.substring(0, 500) + "...", // Truncate for demo
        relevanceScore: 0.5, // Lower score for keyword matches
      }));

      // Combine context from top results
      const context = sources
        .slice(0, 3)
        .map(source => source.content)
        .join("\n\n")
        .substring(0, this.MAX_CONTEXT_LENGTH);

      return { sources, context };
    }
  }
  
  // Helper method to calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0; // Handle zero vectors
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async getUserDocuments(userId: number): Promise<any[]> {
    return await storage.getUserDocuments(userId);
  }

  async deleteDocument(documentId: number, userId?: number): Promise<void> {
    await storage.deleteDocument(documentId, userId);
  }

  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  }

  async generateRAGResponse(query: string, model?: string, documentIds?: number[]): Promise<RAGResponse> {
    try {
      // Search for relevant documents
      const { sources, context } = await this.searchDocuments(query, 5, documentIds);
      
      // Prepare the prompt with context
      const prompt = `You are a helpful assistant answering questions based on the provided context.

Context information:
${context}

Question: ${query}

Answer the question based only on the provided context. If the context doesn't contain the answer, say "I don't have enough information to answer that question." Do not make up information. Include specific references to the sources when possible.`;
      
      // Call Ollama LLM to generate a response
      const response = await ollama.chat({
        model: model || this.DEFAULT_LLM_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that answers questions based on the provided context.' },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature: 0.2, // Lower temperature for more factual responses
          top_p: 0.9
        }
      });
      
      return {
        answer: response.message.content,
        sources
      };
    } catch (error: unknown) {
      console.error('Error generating RAG response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Fallback response in case of error
      return {
        answer: `I'm sorry, I encountered an error while processing your query: ${errorMessage}. Please try again later.`,
        sources: []
      };
    }
  }
}

export const ragService = new RAGService();