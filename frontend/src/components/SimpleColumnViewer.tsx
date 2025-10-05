import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Plus, CheckCircle, XCircle } from 'lucide-react';

interface SimpleColumnViewerProps {
  onDataLoaded: () => void;
}

export const SimpleColumnViewer = ({ onDataLoaded }: SimpleColumnViewerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: Array<{ row: number; error: string; data: any }>;
  } | null>(null);
  const { toast } = useToast();

  // Available Person table columns
  const personColumns = [
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: false },
    { key: 'full_name', label: 'Full Name (Special)', required: false }, // Special field
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
      
      // Parse all CSV data (not just headers)
      const allData: string[][] = [];
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header row
        
        const row: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(currentCell.trim());
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        
        // Add the last cell
        if (currentCell.trim()) {
          row.push(currentCell.trim());
        }
        
        allData.push(row);
      });
      
      console.log('📄 CSV data rows:', allData.length);
      setCsvData(allData);
      
      // Auto-map common columns
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        
        // Auto-mapping logic
        if (lowerHeader.includes('first name') || lowerHeader === 'firstname') {
          autoMapping[header] = 'first_name';
        } else if (lowerHeader.includes('last name') || lowerHeader === 'lastname') {
          autoMapping[header] = 'last_name';
        } else if (lowerHeader.includes('full name') || lowerHeader === 'fullname' || lowerHeader === 'name') {
          autoMapping[header] = 'full_name'; // Special field
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
    if (personField === 'add_new_field') {
      setShowNewFieldDialog(true);
      return;
    }
    
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: personField
    }));
  };

  const handleAddNewField = () => {
    if (!newFieldName.trim()) return;
    
    const fieldKey = newFieldName.toLowerCase().replace(/\s+/g, '_');
    setCustomFields(prev => [...prev, fieldKey]);
    setNewFieldName('');
    setShowNewFieldDialog(false);
    
    toast({
      title: "New Field Added",
      description: `Added "${newFieldName}" as a custom field`,
    });
  };

  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { first_name: parts[0], last_name: '' };
    } else {
      const last_name = parts[parts.length - 1];
      const first_name = parts.slice(0, -1).join(' ');
      return { first_name, last_name };
    }
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;
    
    setImporting(true);
    setImportProgress(0);
    setImportResults(null);
    
    const results = {
      successful: 0,
      failed: [] as Array<{ row: number; error: string; data: any }>
    };
    
    const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed
      
      try {
        // Build person data from mapping
        const personData: any = {};
        const customFieldsData: any = {};
        
        columns.forEach((header, colIndex) => {
          const mappedField = columnMapping[header];
          const value = row[colIndex]?.trim();
          
          if (!value || mappedField === 'skip') return;
          
          if (mappedField === 'full_name') {
            // Special handling for full name
            const { first_name, last_name } = splitFullName(value);
            personData.first_name = first_name;
            personData.last_name = last_name;
          } else if (customFields.includes(mappedField)) {
            // Custom field
            customFieldsData[mappedField] = value;
          } else {
            // Standard field
            personData[mappedField] = value;
          }
        });
        
        // Add custom fields
        if (Object.keys(customFieldsData).length > 0) {
          personData.custom_fields = customFieldsData;
        }
        
        // Ensure at least first_name or last_name
        if (!personData.first_name && !personData.last_name) {
          throw new Error('Missing required name field');
        }
        
        // Send to API
        const response = await fetch(`${apiUrl}/api/people`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        results.successful++;
        
      } catch (error: any) {
        results.failed.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: row
        });
      }
      
      // Update progress
      setImportProgress(Math.round(((i + 1) / csvData.length) * 100));
    }
    
    setImportResults(results);
    setImporting(false);
    
    toast({
      title: "Import Complete",
      description: `Successfully imported ${results.successful} contacts, ${results.failed.length} failed`,
    });
    
    if (results.successful > 0) {
      onDataLoaded(); // Refresh the contacts list
    }
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
                          {customFields.map(field => (
                            <SelectItem key={field} value={field}>
                              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Custom)
                            </SelectItem>
                          ))}
                          <SelectItem value="add_new_field">
                            <div className="flex items-center gap-2">
                              <Plus className="h-3 w-3" />
                              Add New Field...
                            </div>
                          </SelectItem>
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
                <Button 
                  onClick={handleImport}
                  disabled={importing || csvData.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? `Importing... ${importProgress}%` : `Continue Import (${csvData.length} rows)`}
                </Button>
              </div>
              
              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing contacts...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {importResults && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Import Results
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                      <div className="text-sm text-green-700">Successfully Imported</div>
                    </div>
                    <div className="text-center p-3 bg-red-100 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{importResults.failed.length}</div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                  </div>
                  
                  {importResults.failed.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-700">Failed Rows:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResults.failed.map((failure, index) => (
                          <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium">Row {failure.row}: {failure.error}</div>
                            <div className="text-gray-600 mt-1">
                              Data: {failure.data.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* New Field Dialog */}
      <Dialog open={showNewFieldDialog} onOpenChange={setShowNewFieldDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-name">Field Name</Label>
              <Input
                id="new-field-name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Enter field name (e.g., Department)"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNewField} disabled={!newFieldName.trim()}>
                Add Field
              </Button>
              <Button variant="outline" onClick={() => setShowNewFieldDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
