# Ollama Local AI Chat Application

## Overview

This is a modern, responsive chat application interface designed to communicate with local Ollama models. The application features a polished, professional UI similar to ChatGPT or Claude, with a full-stack architecture using React, TypeScript, Express, and PostgreSQL with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks and context for local state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (with pgvector for embeddings)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development**: Hot reloading with Vite middleware integration
- **RAG Service**: Document processing, chunking, and retrieval system

### Database Schema
The application uses five main tables:
- **users**: User authentication and management
- **chatSessions**: Chat conversation metadata
- **messages**: Individual chat messages with role-based organization
- **documents**: Uploaded PDF and text files for RAG functionality
- **documentChunks**: Text chunks with embeddings for vector search

## Key Components

### Chat Interface
- **Chat Layout**: Main chat interface with sidebar for session management
- **Message Components**: User and AI message display with formatting support and source attribution
- **Chat Input**: Multi-line input with character counting and keyboard shortcuts
- **Typing Indicator**: Visual feedback during AI response generation

### RAG System
- **Document Upload**: PDF and text file upload with validation and progress tracking
- **Document Manager**: File library with search, preview, and deletion capabilities
- **RAG Service**: Document processing, chunking, and retrieval functionality
- **Vector Search**: Mock implementation ready for pgvector integration

### UI Components
- **Theme System**: Dark/light mode toggle with CSS variable-based theming
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Settings Modal**: Configuration for AI parameters and RAG toggle
- **Component Library**: Comprehensive UI components from Shadcn/ui

### Storage Layer
- **Chat Storage**: Local storage interface for chat sessions and settings
- **Memory Storage**: In-memory storage implementation for development
- **Database Integration**: Drizzle ORM with PostgreSQL for production data

## Data Flow

1. **User Interaction**: User types message in chat input
2. **Message Processing**: Message is added to current session and displayed
3. **AI Communication**: Application simulates AI response (placeholder for Ollama integration)
4. **Response Handling**: AI response is processed and displayed with typing animation
5. **Session Management**: Chat sessions are saved to local storage and optionally to database
6. **Theme Persistence**: User preferences are saved to local storage

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Mode
- Vite development server with hot module replacement
- TypeScript compilation on-the-fly
- Express server with middleware integration
- Local PostgreSQL database connection

### Production Build
- Vite builds optimized client bundle to `dist/public`
- ESBuild compiles server code to `dist/index.js`
- Static file serving from Express
- Environment-based configuration for database and external services

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)
- Drizzle migrations in `migrations` directory
- Database schema defined in `shared/schema.ts`

### Key Architectural Decisions

1. **Monorepo Structure**: Client and server code in the same repository with shared types
2. **Type Safety**: End-to-end TypeScript with shared schema definitions
3. **Modern React**: Functional components with hooks, no class components
4. **Database-First**: Schema-driven development with Drizzle ORM
5. **Component Architecture**: Modular UI components with consistent styling
6. **Development Experience**: Fast refresh, type checking, and integrated tooling

The application is designed to be easily extensible for actual Ollama integration while maintaining a clean separation of concerns between the UI, business logic, and data layers.