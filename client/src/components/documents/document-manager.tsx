import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { File, Trash2, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DocumentUpload } from './document-upload';
import { Document } from '@/types/chat';

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast({
          title: "Document deleted",
          description: "The document has been removed from your library.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileTypeColor = (mimeType: string) => {
    switch (mimeType) {
      case 'application/pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'text/plain':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getFileTypeLabel = (mimeType: string) => {
    switch (mimeType) {
      case 'application/pdf':
        return 'PDF';
      case 'text/plain':
        return 'TXT';
      default:
        return 'FILE';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl" aria-describedby="document-manager-description">
          <DialogHeader>
            <DialogTitle>Document Library</DialogTitle>
            <p id="document-manager-description" className="text-sm text-muted-foreground">
              Manage your uploaded documents for RAG functionality
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Upload */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* Documents List */}
            <ScrollArea className="h-96 border rounded-lg">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading documents...
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {document.originalName}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getFileTypeColor(document.mimeType)}`}
                          >
                            {getFileTypeLabel(document.mimeType)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatFileSize(document.filesize)}</span>
                          <span>•</span>
                          <span>{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <span>
                {documents.length} document{documents.length !== 1 ? 's' : ''} total
              </span>
              <span>
                {formatFileSize(documents.reduce((total, doc) => total + doc.filesize, 0))} used
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <DocumentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={() => {
          fetchDocuments();
          setShowUpload(false);
        }}
      />
    </>
  );
}