export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-2xl">
        <div className="bg-muted text-foreground p-4 rounded-2xl rounded-tl-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
