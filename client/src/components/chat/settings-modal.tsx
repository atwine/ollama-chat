import { useState } from 'react';
import { ChatSettings } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [formData, setFormData] = useState<ChatSettings>(settings);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: ChatSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      apiEndpoint: 'http://localhost:11434',
      useRAG: false,
    };
    setFormData(defaultSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Temperature */}
          <div>
            <Label className="text-sm font-medium">Temperature</Label>
            <div className="flex items-center gap-3 mt-2">
              <Slider
                value={[formData.temperature]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, temperature: value[0] }))}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">
                {formData.temperature.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Controls randomness in responses
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <Label htmlFor="maxTokens" className="text-sm font-medium">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={formData.maxTokens}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxTokens: parseInt(e.target.value) || 2048 
              }))}
              min={1}
              max={4096}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum length of AI responses
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <Label htmlFor="systemPrompt" className="text-sm font-medium">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                systemPrompt: e.target.value 
              }))}
              placeholder="You are a helpful AI assistant..."
              className="mt-2 h-20 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Instructions for the AI's behavior
            </p>
          </div>

          {/* API Endpoint */}
          <div>
            <Label htmlFor="apiEndpoint" className="text-sm font-medium">API Endpoint</Label>
            <Input
              id="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                apiEndpoint: e.target.value 
              }))}
              placeholder="http://localhost:11434"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ollama server address
            </p>
          </div>

          {/* RAG Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable RAG</Label>
              <p className="text-xs text-muted-foreground">
                Use uploaded documents to provide context for responses
              </p>
            </div>
            <Switch
              checked={formData.useRAG}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                useRAG: checked 
              }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
