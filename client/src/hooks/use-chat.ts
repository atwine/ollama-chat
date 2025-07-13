import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, ChatSettings, OllamaModel } from '@/types/chat';
import { chatStorage } from '@/lib/chat-storage';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(chatStorage.getDefaultSettings());
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3.1:8b');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  // Load initial data
  useEffect(() => {
    const savedSessions = chatStorage.getChatSessions();
    const savedSettings = chatStorage.getSettings();
    
    setSessions(savedSessions);
    setSettings(savedSettings);
    
    // Fetch available models from API
    fetchAvailableModels();
  }, []);
  
  // Fetch available models from Ollama
  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data into OllamaModel format
        const models: OllamaModel[] = data.models.map((model: any) => ({
          name: model.name,
          displayName: formatModelName(model.name),
          size: model.size ? `${Math.round(model.size / (1024 * 1024))}MB` : undefined
        }));
        
        setAvailableModels(models);
        
        // If no models are available, we'll keep the default list
        if (models.length === 0) {
          console.warn('No models found from Ollama API, using default list');
        }
      } else {
        console.error('Failed to fetch models:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);
  
  // Helper function to format model names for display
  const formatModelName = (name: string): string => {
    // Remove tags like :latest, :7b, etc.
    let displayName = name.split(':')[0];
    
    // Capitalize and add spaces
    displayName = displayName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
      
    // Add the tag back if it exists (like 7B, 13B, etc.)
    const tag = name.split(':')[1];
    if (tag) {
      // Clean up common model size tags
      if (tag.includes('b')) {
        displayName += ` ${tag.toUpperCase()}`;
      } else {
        displayName += ` ${tag}`;
      }
    }
    
    return displayName;
  };

  // Mock AI response simulation
  const simulateAIResponse = useCallback((userMessage: string): Promise<string> => {
    return new Promise((resolve) => {
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      
      setTimeout(() => {
        const responses = [
          "I understand your question. Let me provide you with a detailed explanation based on my knowledge and training.",
          "That's a great question! Here's what I can tell you about that topic. Let me break it down for you step by step.",
          "I'd be happy to help you with that. Based on the information you've provided, here's my analysis and recommendations.",
          "This is an interesting topic. Let me explain the key concepts and provide you with some practical insights.",
          "Thank you for asking about this. I can provide you with comprehensive information on this subject.",
          "Let me help you understand this better. Here's a detailed explanation with examples and key points to consider.",
          "I can certainly assist you with that. Let me provide you with accurate information and helpful suggestions.",
          "That's a thoughtful question. Based on my training, here's what I can share about this topic.",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Add some context-aware responses
        if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming')) {
          resolve(`I can help you with coding! Here's a programming solution:\n\n\`\`\`javascript\nfunction example() {\n  console.log("Hello, World!");\n  return "This is a code example";\n}\n\`\`\`\n\nWould you like me to explain this code or help you with something else?`);
        } else if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('how')) {
          resolve(`Let me explain this concept clearly:\n\n1. **First point**: This is the foundational concept\n2. **Second point**: This builds upon the first\n3. **Third point**: This is the practical application\n\nDoes this help clarify things for you?`);
        } else {
          resolve(randomResponse);
        }
      }, delay);
    });
  }, []);

  // Create new chat session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      created: new Date().toISOString(),
      model: selectedModel,
      messages: [],
    };
    
    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    
    return newSession;
  }, [selectedModel]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    let session = currentSession;
    if (!session) {
      session = createNewSession();
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };

    session.messages.push(userMessage);
    
    // Update title if this is the first message
    if (session.messages.length === 1) {
      session.title = content.trim().substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    setCurrentSession({ ...session });
    setIsTyping(true);

    try {
      let aiResponse: string;
      let sources: any[] = [];

      if (settings.useRAG) {
        // Use RAG endpoint
        const response = await fetch('/api/chat/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: content,
            model: selectedModel,
            documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined, // Include selected documents if any
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.answer; // Fixed field name to match server response
          sources = data.sources || [];
        } else {
          aiResponse = "I'm having trouble accessing the documents. Please try again.";
        }
      } else {
        // Use regular simulation
        aiResponse = await simulateAIResponse(content);
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        tokens: Math.floor(Math.random() * 500) + 50, // Mock token count
        sources: sources.length > 0 ? sources : undefined,
      };

      session.messages.push(assistantMessage);
      setCurrentSession({ ...session });
      
      // Save to storage
      chatStorage.saveChatSession(session);
      
      // Update sessions list
      setSessions(prev => {
        const updated = [...prev];
        const index = updated.findIndex(s => s.id === session.id);
        if (index >= 0) {
          updated[index] = session;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  }, [currentSession, selectedModel, isTyping, simulateAIResponse, createNewSession, settings.useRAG]);

  // Load chat session
  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setSelectedModel(session.model);
  }, []);

  // Delete chat session
  const deleteSession = useCallback((sessionId: string) => {
    chatStorage.deleteChatSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [currentSession]);

  // Update settings
  const updateSettings = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
    chatStorage.saveSettings(newSettings);
  }, []);

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    settings,
    isTyping,
    selectedModel,
    setSelectedModel,
    availableModels,
    isLoadingModels,
    fetchAvailableModels,
    sendMessage,
    createNewSession,
    loadSession,
    deleteSession,
    updateSettings,
    clearCurrentSession,
    selectedDocuments,
    setSelectedDocuments,
  };
}
