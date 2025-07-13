import { ChatSession, ChatSettings } from '@/types/chat';

const STORAGE_KEYS = {
  CHATS: 'ollama-chats',
  SETTINGS: 'ollama-settings',
  THEME: 'ollama-theme',
} as const;

export const chatStorage = {
  // Chat sessions
  getChatSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChatSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  },

  saveChatSession(session: ChatSession): void {
    const sessions = this.getChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    
    this.saveChatSessions(sessions);
  },

  deleteChatSession(sessionId: string): void {
    const sessions = this.getChatSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    this.saveChatSessions(filtered);
  },

  // Settings
  getSettings(): ChatSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  },

  saveSettings(settings: ChatSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  getDefaultSettings(): ChatSettings {
    return {
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      apiEndpoint: 'http://localhost:11434',
      useRAG: true, // Enable RAG by default to use document-grounded answers
    };
  },

  // Theme
  getTheme(): 'light' | 'dark' {
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';
    } catch {
      return 'dark';
    }
  },

  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },
};
