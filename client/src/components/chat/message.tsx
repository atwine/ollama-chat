import { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code>$2</code></pre>');
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-2xl">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-2xl">
        <div className="bg-muted text-foreground p-4 rounded-2xl rounded-tl-sm">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => copyToClipboard(message.content)}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {message.model && (
            <div className="text-xs text-muted-foreground">
              {message.model}
            </div>
          )}
        </div>
        
        {/* Source Documents */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sources</span>
            </div>
            <div className="space-y-2">
              {message.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {source.originalName}
                    </span>
                    {source.page && (
                      <Badge variant="secondary" className="text-xs">
                        Page {source.page}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(source.relevanceScore * 100)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(source.content)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
