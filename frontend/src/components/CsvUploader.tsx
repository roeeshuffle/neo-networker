import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { Upload, FileText } from "lucide-react";
import { ColumnMappingDialog } from "./ColumnMappingDialog";

interface CsvUploaderProps {
  onDataLoaded: () => void;
}

export const CsvUploader = ({ onDataLoaded }: CsvUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>("");
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
      const fileText = await file.text();
      const headers = parseCSVHeaders(fileText);
      const unknownColumns = checkForUnknownColumns(headers);

      if (unknownColumns.length > 0) {
        // Show column mapping dialog
        setCsvHeaders(unknownColumns);
        setCsvData(fileText);
        setShowMapping(true);
        setLoading(false);
        return;
      }

      // Proceed with direct upload if all columns are recognized
      await processUpload(fileText, {});
    } catch (error: any) {
      toast({
        title: "Error processing file",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
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

  const processUpload = async (fileText: string, columnMapping: { [key: string]: string }) => {
    const { data, error } = await apiClient.request('/csv-processor', {
      method: 'POST',
      body: JSON.stringify({ 
        csvData: fileText,
        customMapping: columnMapping 
      })
    });

    if (error) throw error;

    toast({
      title: "Success",
      description: `Imported ${data.imported} records successfully`,
    });

    setOpen(false);
    setFile(null);
    setCsvData("");
    setCsvHeaders([]);
    onDataLoaded();
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
    </Dialog>
  );
};