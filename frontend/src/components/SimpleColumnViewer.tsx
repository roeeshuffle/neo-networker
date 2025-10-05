import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

interface SimpleColumnViewerProps {
  onDataLoaded: () => void;
}

export const SimpleColumnViewer = ({ onDataLoaded }: SimpleColumnViewerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const readFileColumns = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      console.log('📄 File content preview:', text.substring(0, 500));
      
      // Split by lines and get first line
      const lines = text.split('\n');
      console.log('📄 Total lines:', lines.length);
      console.log('📄 First line:', lines[0]);
      
      if (lines.length === 0) {
        throw new Error('File is empty');
      }

      // Parse CSV headers - handle quoted values
      const firstLine = lines[0];
      const headers: string[] = [];
      let currentHeader = '';
      let inQuotes = false;
      
      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim());
          currentHeader = '';
        } else {
          currentHeader += char;
        }
      }
      
      // Add the last header
      if (currentHeader.trim()) {
        headers.push(currentHeader.trim());
      }
      
      console.log('📄 Parsed headers:', headers);
      setColumns(headers);
      
      toast({
        title: "Columns Found",
        description: `Found ${headers.length} columns in the file`,
      });
      
    } catch (error: any) {
      console.error('❌ Error reading file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to read file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <Upload className="h-4 w-4 mr-2" />
          Show Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>File Column Viewer</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File (CSV, XLS, etc.)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xls,.xlsx,.txt"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({file.size} bytes)
              </p>
            )}
          </div>
          
          <Button 
            onClick={readFileColumns} 
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? 'Reading...' : 'Show Column Names'}
          </Button>
          
          {columns.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Column Names ({columns.length}):</h3>
              <div className="max-h-60 overflow-y-auto border rounded p-3 bg-gray-50">
                {columns.map((column, index) => (
                  <div key={index} className="flex items-center gap-2 py-1">
                    <span className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <span className="text-sm">{column}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
