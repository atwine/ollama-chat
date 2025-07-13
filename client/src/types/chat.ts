export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created: string;
  model: string;
  messages: ChatMessage[];
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  apiEndpoint: string;
}

export interface OllamaModel {
  name: string;
  displayName: string;
  size?: string;
}

export const OLLAMA_MODELS: OllamaModel[] = [
  { name: 'llama3.1:8b', displayName: 'Llama 3.1 8B' },
  { name: 'llama3.1:70b', displayName: 'Llama 3.1 70B' },
  { name: 'codellama:13b', displayName: 'CodeLlama 13B' },
  { name: 'mistral:7b', displayName: 'Mistral 7B' },
  { name: 'phi3:mini', displayName: 'Phi-3 Mini' },
  { name: 'qwen2:7b', displayName: 'Qwen2 7B' },
];
