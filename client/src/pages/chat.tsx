import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useTheme } from '@/hooks/use-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/chat/sidebar';
import { Message } from '@/components/chat/message';
import { ChatInput } from '@/components/chat/chat-input';
import { SettingsModal } from '@/components/chat/settings-modal';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { DocumentManager } from '@/components/documents/document-manager';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Menu, Settings, Sun, Moon, FileText } from 'lucide-react';
// import { OLLAMA_MODELS } from '@/types/chat'; // We'll use dynamic models from API instead
import { cn } from '@/lib/utils';

export default function Chat() {
  const {
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
  } = useChat();
  
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isTyping]);

  const handleNewChat = () => {
    createNewSession();
    setIsSidebarOpen(false);
  };

  const handleSessionSelect = (session: any) => {
    loadSession(session);
    setIsSidebarOpen(false);
  };

  const sidebarContent = (
    <Sidebar
      sessions={sessions}
      currentSession={currentSession}
      onSessionSelect={handleSessionSelect}
      onNewChat={handleNewChat}
      onDeleteSession={deleteSession}
    />
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      {!isMobile && sidebarContent}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            )}
            <h1 className="text-xl font-semibold">Ollama Chat</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40">
                {isLoadingModels ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex justify-between items-center w-full">
                        <span>{model.displayName}</span>
                        {model.size && <span className="text-xs text-muted-foreground">{model.size}</span>}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    <p>No models found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => fetchAvailableModels()}
                    >
                      Refresh
                    </Button>
                  </div>
                )}
              </SelectContent>
            </Select>
            
            {/* Document Manager */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDocumentManagerOpen(true)}
              className="p-2"
            >
              <FileText className="w-5 h-5" />
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            
            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {!currentSession?.messages.length ? (
              /* Welcome Message */
              <div className="flex justify-center mb-8">
                <div className="text-center max-w-2xl">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Welcome to Ollama Chat</h2>
                  <p className="text-muted-foreground mb-8">
                    Your local AI assistant powered by Ollama. Start a conversation by typing a message below or try one of these examples:
                  </p>
                  
                  {/* Sample Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left justify-start hover:bg-muted/50"
                      onClick={() => sendMessage("Explain quantum computing in simple terms")}
                    >
                      <div>
                        <div className="font-medium text-sm mb-1">Explain quantum computing in simple terms</div>
                        <div className="text-xs text-muted-foreground">Learn about complex topics</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left justify-start hover:bg-muted/50"
                      onClick={() => sendMessage("Write a Python function to sort a list")}
                    >
                      <div>
                        <div className="font-medium text-sm mb-1">Write a Python function to sort a list</div>
                        <div className="text-xs text-muted-foreground">Get coding help</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left justify-start hover:bg-muted/50"
                      onClick={() => sendMessage("What are the benefits of renewable energy?")}
                    >
                      <div>
                        <div className="font-medium text-sm mb-1">What are the benefits of renewable energy?</div>
                        <div className="text-xs text-muted-foreground">Explore current topics</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left justify-start hover:bg-muted/50"
                      onClick={() => sendMessage("Help me plan a productive daily routine")}
                    >
                      <div>
                        <div className="font-medium text-sm mb-1">Help me plan a productive daily routine</div>
                        <div className="text-xs text-muted-foreground">Get personal advice</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="space-y-4">
                {currentSession.messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                
                {isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        
        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          disabled={isTyping}
          placeholder={currentSession ? "Send a message..." : "Start a new conversation..."}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

      {/* Document Manager Modal */}
      <DocumentManager
        isOpen={isDocumentManagerOpen}
        onClose={() => setIsDocumentManagerOpen(false)}
      />
    </div>
  );
}
