import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { Upload, FileText } from "lucide-react";
import { ColumnMappingDialog } from "./ColumnMappingDialog";
import CsvPreviewModal from "./CsvPreviewModal";

interface CsvUploaderProps {
  onDataLoaded: () => void;
}

interface CsvPreviewData {
  row_number: number;
  data: Record<string, any>;
  warnings: Array<{
    type: 'truncation' | 'validation' | 'missing_data';
    field: string;
    original_value: string;
    corrected_value?: string;
    truncated_value?: string;
    message: string;
  }>;
  full_name: string;
}

export const CsvUploader = ({ onDataLoaded }: CsvUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [previewData, setPreviewData] = useState<CsvPreviewData[]>([]);
  const [allWarnings, setAllWarnings] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSVHeaders = (csvText: string): string[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    // Simple CSV header parsing - can be enhanced for quoted values
    return lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  };

  const getKnownColumns = (): string[] => {
    return [
      // New schema fields
      'First Name', 'first name', 'firstname', 'first_name',
      'Last Name', 'last name', 'lastname', 'last_name',
      'Email', 'email', 'e-mail', 'E-mail',
      'Organization', 'organization', 'org', 'company', 'Company',
      'Job Title', 'job title', 'job_title', 'title', 'position',
      'Phone', 'phone', 'telephone', 'tel',
      'Mobile', 'mobile', 'cell', 'cellphone',
      'Address', 'address', 'location',
      'LinkedIn', 'linkedin', 'linkedin_url', 'linkedin_profile',
      'Status', 'status', 'state',
      'Notes', 'notes', 'description', 'comments',
      'Tags', 'tags', 'categories', 'Categories',
      'Source', 'source', 'origin',
      'Priority', 'priority', 'importance',
      'Group', 'group', 'category', 'type',
      
      // Legacy field mappings (for backward compatibility)
      'Full Name', 'full name', 'fullname', 'name',
      'Newsletter', 'newsletter',
      'POC in APEX', 'poc in apex', 'poc_in_apex',
      'Who warm intro', 'who warm intro', 'who_warm_intro',
      'Agenda', 'agenda',
      'Meeting Notes', 'meeting notes', 'meeting_notes',
      'Should Avishag meet?', 'should avishag meet', 'should_avishag_meet',
      'More info', 'more info', 'more_info'
    ];
  };

  const checkForUnknownColumns = (headers: string[]): string[] => {
    const knownColumns = getKnownColumns().map(col => col.toLowerCase());
    return headers.filter(header => 
      !knownColumns.includes(header.toLowerCase())
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // First, preview the CSV to show warnings
      const formData = new FormData();
      formData.append('file', file);
      formData.append('custom_mapping', JSON.stringify({}));

      const response = await apiClient.post('/csv/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setPreviewData(response.data.preview_data);
        setAllWarnings(response.data.all_warnings);
        setShowPreview(true);
        setOpen(false);
        
        toast({
          title: "CSV Preview Ready",
          description: `Found ${response.data.warnings_count} warnings in ${response.data.total_rows} rows`,
        });
      }
    } catch (error: any) {
      console.error('Error previewing CSV:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to preview CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (correctedData: CsvPreviewData[]) => {
    setLoading(true);
    try {
      // Convert corrected data back to CSV format and import
      const formData = new FormData();
      
      // Create a new CSV with corrected data
      const csvContent = createCsvFromData(correctedData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'corrected.csv');
      formData.append('custom_mapping', JSON.stringify({}));

      const response = await apiClient.post('/csv-processor', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${response.data.created_count} contacts`,
        });
        setShowPreview(false);
        onDataLoaded();
      }
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Failed",
        description: error.response?.data?.error || "Failed to import CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCsvFromData = (data: CsvPreviewData[]): string => {
    if (data.length === 0) return '';
    
    // Get all unique field names
    const allFields = new Set<string>();
    data.forEach(row => {
      Object.keys(row.data).forEach(field => allFields.add(field));
    });
    
    const fields = Array.from(allFields);
    
    // Create header row
    const header = fields.join(',');
    
    // Create data rows
    const rows = data.map(row => {
      return fields.map(field => {
        const value = row.data[field] || '';
        // Escape commas and quotes in CSV
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    return [header, ...rows].join('\n');
  };

  const handleMappingComplete = async (mapping: { [key: string]: string }) => {
    setLoading(true);
    try {
      await processUpload(csvData, mapping);
    } catch (error: any) {
      toast({
        title: "Error importing data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        setCsvData(csvText);
        
        // Parse headers
        const headers = parseCSVHeaders(csvText);
        setCsvHeaders(headers);
        
        // Check for unknown columns
        const unknownColumns = checkForUnknownColumns(headers);
        
        if (unknownColumns.length > 0) {
          // Show mapping dialog
          setShowMapping(true);
        } else {
          // Direct preview
          await previewCsv(csvText, {});
        }
      };
      reader.readAsText(file);
    } catch (error: any) {
      toast({
        title: "Error reading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const previewCsv = async (csvText: string, columnMapping: { [key: string]: string }) => {
    try {
      const formData = new FormData();
      const blob = new Blob([csvText], { type: 'text/csv' });
      formData.append('file', blob, 'data.csv');
      formData.append('custom_mapping', JSON.stringify(columnMapping));

      const { data, error } = await apiClient.request('/csv/preview', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (error) throw error;

      setPreviewData(data.preview_data || []);
      setAllWarnings(data.all_warnings || []);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error previewing CSV:', error);
      toast({
        title: "Error previewing CSV",
        description: error.message || 'Failed to preview CSV file',
        variant: "destructive",
      });
    }
  };

  const processUpload = async (fileText: string, columnMapping: { [key: string]: string }) => {
    await previewCsv(fileText, columnMapping);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Load Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Expected columns: First Name, Last Name, Email, Organization, Job Title, Phone, Mobile, Address, LinkedIn, Status, Notes, Tags, Source, Priority, Group
            <br />
            <span className="text-blue-600">Legacy columns will be automatically mapped: Full Name → First Name/Last Name, Company → Organization, etc.</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="min-w-[100px]"
            >
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <ColumnMappingDialog
        open={showMapping}
        onOpenChange={setShowMapping}
        csvHeaders={csvHeaders}
        onMappingComplete={handleMappingComplete}
      />

      <CsvPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        allWarnings={allWarnings}
        onImport={handleImport}
        isLoading={loading}
      />
    </Dialog>
  );
};