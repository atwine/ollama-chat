import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

export interface Document {
  id: number;
  filename: string;
  originalName: string;
  processingStatus: string;
  chunksCount: number;
  processedChunks: number;
}

interface DocumentDropdownProps {
  onDocumentSelect?: (documentIds: number[]) => void;
  selectedDocumentIds?: number[];
  className?: string;
}

export function DocumentDropdown({
  onDocumentSelect,
  selectedDocumentIds = [],
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

  // Handle document selection toggle
  const toggleDocumentSelection = (documentId: number) => {
    const newSelection = selectedDocumentIds.includes(documentId)
      ? selectedDocumentIds.filter(id => id !== documentId)
      : [...selectedDocumentIds, documentId];
    
    onDocumentSelect?.(newSelection);
  };

  // Clear document selection
  const clearSelection = () => {
    onDocumentSelect?.([]);
  };
  
  // Count selected documents
  const selectedCount = selectedDocumentIds.length;

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
          ) : selectedCount > 0 ? (
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span className="truncate">
                {selectedCount === 1 
                  ? documents.find(doc => selectedDocumentIds.includes(doc.id))?.originalName 
                  : `${selectedCount} documents selected`}
              </span>
              {documents.some(doc => 
                selectedDocumentIds.includes(doc.id) && 
                doc.processingStatus === 'processing'
              ) && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </div>
          ) : (
            <span>Select documents</span>
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
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectedCount > 0 && selectedCount === documents.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Select all documents
                        onDocumentSelect?.(documents.map(doc => doc.id));
                      } else {
                        // Clear selection
                        clearSelection();
                      }
                    }}
                  />
                  <label 
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {selectedCount === documents.length ? "Deselect all" : "Select all"}
                  </label>
                </div>
                <div className="h-px bg-muted my-1" />
                {documents.map((document) => (
                  <div key={document.id} className="p-1">
                    <div className="flex w-full items-center space-x-2 p-2 hover:bg-accent rounded-md">
                      <Checkbox
                        id={`document-${document.id}`}
                        checked={selectedDocumentIds.includes(document.id)}
                        onCheckedChange={() => toggleDocumentSelection(document.id)}
                      />
                      <div className="flex w-full flex-col">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span className="truncate flex-1">{document.originalName}</span>
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
                    </div>
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
