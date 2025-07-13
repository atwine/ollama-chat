import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: number;
  filename: string;
  originalName: string;
  processingStatus: string;
  chunksCount: number;
  processedChunks: number;
}

interface DocumentDropdownProps {
  onDocumentSelect?: (documentId: number | null) => void;
  selectedDocumentId?: number | null;
  className?: string;
}

export function DocumentDropdown({
  onDocumentSelect,
  selectedDocumentId,
  className,
}: DocumentDropdownProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch documents from the server
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
    
    // Set up polling for document status updates
    const intervalId = setInterval(fetchDocuments, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [toast]);

  // Find the selected document
  const selectedDocument = selectedDocumentId
    ? documents.find((doc) => doc.id === selectedDocumentId)
    : null;

  // Handle document selection
  const handleDocumentSelect = (documentId: number) => {
    onDocumentSelect?.(documentId);
    setOpen(false);
  };

  // Clear document selection
  const clearSelection = () => {
    onDocumentSelect?.(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading documents...</span>
            </div>
          ) : selectedDocument ? (
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span className="truncate">{selectedDocument.originalName}</span>
              {selectedDocument.processingStatus === 'processing' && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </div>
          ) : (
            <span>Select a document</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-1">
            {documents.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No documents found
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={clearSelection}
                >
                  <span>No document (use all)</span>
                </Button>
                {documents.map((document) => (
                  <div key={document.id} className="p-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleDocumentSelect(document.id)}
                    >
                      <div className="flex w-full flex-col">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span className="truncate flex-1">{document.originalName}</span>
                          {selectedDocumentId === document.id && (
                            <Check className="ml-2 h-4 w-4" />
                          )}
                        </div>
                        {document.processingStatus === 'processing' && (
                          <div className="mt-1 w-full">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Processing...</span>
                              <span>
                                {document.processedChunks}/{document.chunksCount} chunks
                              </span>
                            </div>
                            <Progress
                              value={(document.processedChunks / document.chunksCount) * 100}
                              className="h-1"
                            />
                          </div>
                        )}
                        {document.processingStatus === 'error' && (
                          <div className="text-xs text-red-500 mt-1">
                            Error processing document
                          </div>
                        )}
                      </div>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
