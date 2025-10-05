import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Available Person table columns
  const personColumns = [
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'mobile', label: 'Mobile', required: false },
    { key: 'organization', label: 'Organization', required: false },
    { key: 'job_title', label: 'Job Title', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
    { key: 'github_url', label: 'GitHub URL', required: false },
    { key: 'facebook_url', label: 'Facebook URL', required: false },
    { key: 'twitter_url', label: 'Twitter URL', required: false },
    { key: 'website_url', label: 'Website URL', required: false },
    { key: 'notes', label: 'Notes', required: false },
    { key: 'tags', label: 'Tags', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'last_contact_date', label: 'Last Contact Date', required: false },
    { key: 'next_follow_up_date', label: 'Next Follow-up Date', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'priority', label: 'Priority', required: false },
    { key: 'group', label: 'Group', required: false },
    { key: 'gender', label: 'Gender', required: false },
    { key: 'birthday', label: 'Birthday', required: false },
    { key: 'job_status', label: 'Job Status', required: false },
  ];

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
      
      // Auto-map common columns
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        
        // Auto-mapping logic
        if (lowerHeader.includes('first name') || lowerHeader === 'firstname' || lowerHeader === 'name') {
          autoMapping[header] = 'first_name';
        } else if (lowerHeader.includes('last name') || lowerHeader === 'lastname') {
          autoMapping[header] = 'last_name';
        } else if (lowerHeader.includes('email')) {
          autoMapping[header] = 'email';
        } else if (lowerHeader.includes('phone') || lowerHeader === 'tel') {
          autoMapping[header] = 'phone';
        } else if (lowerHeader.includes('mobile') || lowerHeader === 'cell') {
          autoMapping[header] = 'mobile';
        } else if (lowerHeader.includes('organization') || lowerHeader.includes('company')) {
          autoMapping[header] = 'organization';
        } else if (lowerHeader.includes('job title') || lowerHeader === 'title' || lowerHeader === 'position') {
          autoMapping[header] = 'job_title';
        } else if (lowerHeader.includes('address') || lowerHeader.includes('location')) {
          autoMapping[header] = 'address';
        } else if (lowerHeader.includes('linkedin')) {
          autoMapping[header] = 'linkedin_url';
        } else if (lowerHeader.includes('github')) {
          autoMapping[header] = 'github_url';
        } else if (lowerHeader.includes('facebook')) {
          autoMapping[header] = 'facebook_url';
        } else if (lowerHeader.includes('twitter')) {
          autoMapping[header] = 'twitter_url';
        } else if (lowerHeader.includes('website')) {
          autoMapping[header] = 'website_url';
        } else if (lowerHeader.includes('notes') || lowerHeader.includes('description') || lowerHeader.includes('comments')) {
          autoMapping[header] = 'notes';
        } else if (lowerHeader.includes('tags') || lowerHeader.includes('categories')) {
          autoMapping[header] = 'tags';
        } else if (lowerHeader.includes('source') || lowerHeader.includes('origin')) {
          autoMapping[header] = 'source';
        } else if (lowerHeader.includes('last contact date')) {
          autoMapping[header] = 'last_contact_date';
        } else if (lowerHeader.includes('next follow-up date')) {
          autoMapping[header] = 'next_follow_up_date';
        } else if (lowerHeader.includes('status') || lowerHeader === 'state') {
          autoMapping[header] = 'status';
        } else if (lowerHeader.includes('priority')) {
          autoMapping[header] = 'priority';
        } else if (lowerHeader.includes('group') || lowerHeader === 'type') {
          autoMapping[header] = 'group';
        } else if (lowerHeader.includes('gender')) {
          autoMapping[header] = 'gender';
        } else if (lowerHeader.includes('birthday') || lowerHeader.includes('birth date')) {
          autoMapping[header] = 'birthday';
        } else if (lowerHeader.includes('job status')) {
          autoMapping[header] = 'job_status';
        } else {
          autoMapping[header] = 'skip'; // Default to skip
        }
      });
      
      setColumnMapping(autoMapping);
      
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

  const handleMappingChange = (csvColumn: string, personField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: personField
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <Upload className="h-4 w-4 mr-2" />
          Map CSV Columns
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
            {loading ? 'Reading...' : 'Map Columns'}
          </Button>
          
          {columns.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Column Mapping ({columns.length} columns):</h3>
              <p className="text-sm text-muted-foreground">
                Map each CSV column to a contact field. Select "Skip Column" for columns you don't want to import.
              </p>
              <div className="max-h-80 overflow-y-auto border rounded p-4 bg-gray-50 space-y-3">
                {columns.map((column, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-mono bg-blue-100 px-2 py-1 rounded whitespace-nowrap">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate" title={column}>
                        {column}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Select
                        value={columnMapping[column] || 'skip'}
                        onValueChange={(value) => handleMappingChange(column, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip Column</SelectItem>
                          {personColumns.map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && '(Required)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    console.log('📋 Column Mapping:', columnMapping);
                    toast({
                      title: "Mapping Saved",
                      description: "Column mapping has been saved to console",
                    });
                  }}
                  variant="outline"
                >
                  Save Mapping
                </Button>
                <Button 
                  onClick={() => {
                    const mappedCount = Object.values(columnMapping).filter(v => v !== 'skip').length;
                    toast({
                      title: "Mapping Summary",
                      description: `${mappedCount} columns mapped, ${columns.length - mappedCount} skipped`,
                    });
                  }}
                >
                  Show Summary
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
