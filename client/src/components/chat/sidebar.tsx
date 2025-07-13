import { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ChevronLeft, Trash2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  className?: string;
}

export function Sidebar({ 
  sessions, 
  currentSession, 
  onSessionSelect, 
  onNewChat, 
  onDeleteSession,
  className 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn(
      "bg-muted/30 border-r border-border transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-80",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        {!isCollapsed && (
          <Button
            onClick={onNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        )}
        {isCollapsed && (
          <Button
            onClick={onNewChat}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="group relative">
              <Button
                variant="ghost"
                onClick={() => onSessionSelect(session)}
                className={cn(
                  "w-full justify-start p-3 h-auto text-left hover:bg-muted/50 transition-colors",
                  currentSession?.id === session.id && "bg-muted/50 border border-border/50",
                  isCollapsed && "px-2"
                )}
              >
                <div className={cn("flex flex-col gap-1 min-w-0", isCollapsed && "hidden")}>
                  <div className="font-medium text-sm truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(session.created)}
                  </div>
                </div>
                {isCollapsed && (
                  <Menu className="w-4 h-4" />
                )}
              </Button>
              
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform", 
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>
      </div>
    </div>
  );
}
