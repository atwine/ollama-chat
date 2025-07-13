# Ollama Local AI Chat Application

A modern, responsive chat application interface designed to communicate with local Ollama AI models. The application features a polished, professional UI similar to ChatGPT or Claude, with a full-stack architecture using React, TypeScript, Express, and PostgreSQL.

## Features

![alt text](image.png)

### 🎨 **Modern UI Design**
- Dark/light theme toggle with system preference detection
- Professional chat interface with message bubbles
- Responsive design that works on desktop, tablet, and mobile
- Smooth animations and transitions
- Custom scrollbar styling

### 💬 **Chat Interface**
- Real-time message display with user and AI message bubbles
- Typing indicators during AI response generation
- Message timestamps and copy-to-clipboard functionality
- Multi-line input with character counter (2000 char limit)
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### 🔧 **AI Configuration**
- Model selector with popular Ollama models (Llama 3.1, CodeLlama, Mistral, etc.)
- Settings modal for AI parameters:
  - Temperature control (0-1)
  - Max tokens (1-4096)
  - System prompt customization
  - API endpoint configuration

### 📱 **Session Management**
- Persistent chat history using localStorage
- Create new chat sessions
- Switch between existing conversations
- Delete unwanted chat sessions
- Automatic session titles based on first message

### 🚀 **Getting Started**
- Welcome page with 4 sample questions covering:
  - Learning about complex topics
  - Getting coding help
  - Exploring current topics
  - Getting personal advice

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** components built on Radix UI primitives
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Session management** with connect-pg-simple

### Development Tools
- **ESLint** and **Prettier** for code quality
- **Hot reload** with Vite middleware integration
- **Type safety** with end-to-end TypeScript

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn** package manager
3. **PostgreSQL** database (optional - uses in-memory storage by default)
4. **Ollama** installed locally (for actual AI functionality)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ollama-chat-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/ollama_chat
   NODE_ENV=development
   ```

4. **Database setup (optional):**
   If using PostgreSQL, run migrations:
   ```bash
   npm run db:migrate
   ```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

This will:
- Start the Express server on port 5000
- Start the Vite development server with hot reload
- Open the application in your browser

### Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## Application Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── chat/       # Chat-specific components
│   │   │   └── ui/         # Shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── index.ts            # Main server file
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage interface
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── package.json            # Dependencies and scripts
```

## Key Components

### Chat Interface Components
- **`ChatInput`** - Message input with file upload and voice input placeholders
- **`Message`** - Individual message display with formatting and copy functionality
- **`Sidebar`** - Chat history and session management
- **`SettingsModal`** - AI configuration and preferences
- **`TypingIndicator`** - Visual feedback during AI responses

### Hooks
- **`useChat`** - Main chat functionality and state management
- **`useTheme`** - Theme switching and persistence
- **`useIsMobile`** - Responsive design helpers

### Storage
- **`chatStorage`** - LocalStorage interface for chat persistence
- **`MemStorage`** - In-memory storage for development

## Configuration

### AI Models
The application supports these Ollama models out of the box:
- Llama 3.1 (8B, 70B)
- CodeLlama 13B
- Mistral 7B
- Phi-3 Mini
- Qwen2 7B

### Default Settings
- **Temperature:** 0.7
- **Max Tokens:** 2048
- **API Endpoint:** http://localhost:11434
- **Theme:** Dark mode

## Mock AI Responses

The application includes intelligent mock responses for development:
- Context-aware responses based on message content
- Code examples for programming questions
- Structured explanations for "how" and "explain" queries
- Realistic response delays (1-3 seconds)
- Token count simulation

## Connecting to Ollama

To connect to a real Ollama instance:

1. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Pull desired models:**
   ```bash
   ollama pull llama3.1:8b
   ollama pull codellama:13b
   ```

4. **Update API endpoint** in settings to point to your Ollama instance (default: http://localhost:11434)

## API Integration Points

The application is designed for easy Ollama integration:

### Chat API Endpoint
```javascript
// Located in: server/routes.ts
app.post('/api/chat', async (req, res) => {
  // Replace mock response with Ollama API call
  const response = await fetch(`${ollamaEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: req.body.model,
      prompt: req.body.prompt,
      temperature: req.body.temperature,
      max_tokens: req.body.max_tokens
    })
  });
  // Process and return response
});
```

### WebSocket Integration
For real-time streaming responses:
```javascript
// Add WebSocket support for streaming responses
import { WebSocket } from 'ws';

// Stream responses from Ollama
const ws = new WebSocket('ws://localhost:11434/api/generate');
```

## Deployment

### Replit Deployment
1. Push your code to the Replit project
2. The application will automatically build and deploy
3. Environment variables are configured through Replit secrets

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Development Workflow

### Adding New Features
1. Update shared schema in `shared/schema.ts`
2. Implement storage interface in `server/storage.ts`
3. Add API routes in `server/routes.ts`
4. Create frontend components in `client/src/components/`
5. Add pages and routing in `client/src/pages/`

### Testing
- Manual testing through the UI
- API testing with curl or Postman
- Component testing with React Testing Library (to be added)

## Troubleshooting

### Common Issues

1. **Port 5000 already in use:**
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **Database connection errors:**
   - Check PostgreSQL service is running
   - Verify DATABASE_URL environment variable
   - Ensure database exists and is accessible

3. **Build failures:**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

4. **Ollama connection issues:**
   - Verify Ollama is running: `ollama list`
   - Check API endpoint in settings
   - Ensure model is pulled: `ollama pull <model-name>`

### Performance Optimization
- Use React DevTools for component profiling
- Monitor network requests in browser DevTools
- Check bundle size with `npm run build --analyze`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes following the existing code style
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [Shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by ChatGPT and Claude interfaces