import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  onMappingComplete: (mapping: { [key: string]: string }) => void;
}

const DATABASE_COLUMNS = [
  // Core Identifiers
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'gender', label: 'Gender' },
  { value: 'birthday', label: 'Birthday' },
  
  // Communication Info
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'address', label: 'Address' },
  
  // Professional Info
  { value: 'organization', label: 'Organization' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'job_status', label: 'Job Status' },
  
  // Social & Online Profiles
  { value: 'linkedin_url', label: 'LinkedIn URL' },
  { value: 'github_url', label: 'GitHub URL' },
  { value: 'facebook_url', label: 'Facebook URL' },
  { value: 'twitter_url', label: 'Twitter URL' },
  { value: 'website_url', label: 'Website URL' },
  
  // Connection Management
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
  { value: 'tags', label: 'Tags' },
  { value: 'last_contact_date', label: 'Last Contact Date' },
  { value: 'next_follow_up_date', label: 'Next Follow-up Date' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'group', label: 'Group' },
  
  // Legacy field mappings
  { value: 'full_name_legacy', label: 'Full Name (Legacy - will split to First/Last)' },
  { value: 'company_legacy', label: 'Company (Legacy - maps to Organization)' },
  { value: 'categories_legacy', label: 'Categories (Legacy - maps to Tags)' },
  { value: 'newsletter_legacy', label: 'Newsletter (Legacy - custom field)' },
  { value: 'poc_in_apex_legacy', label: 'POC in APEX (Legacy - custom field)' },
  { value: 'who_warm_intro_legacy', label: 'Who Warm Intro (Legacy - custom field)' },
  { value: 'agenda_legacy', label: 'Agenda (Legacy - custom field)' },
  { value: 'meeting_notes_legacy', label: 'Meeting Notes (Legacy - custom field)' },
  { value: 'should_avishag_meet_legacy', label: 'Should Avishag Meet (Legacy - custom field)' },
  { value: 'more_info_legacy', label: 'More Info (Legacy - custom field)' },
];

export const ColumnMappingDialog = ({ open, onOpenChange, csvHeaders, onMappingComplete }: ColumnMappingDialogProps) => {
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});

  const handleMappingChange = (csvHeader: string, dbColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: dbColumn
    }));
  };

  const handleIgnoreColumn = (csvHeader: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[csvHeader];
      return newMapping;
    });
  };

  const handleComplete = () => {
    onMappingComplete(mapping);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Map your CSV columns to database fields, or ignore columns you don't need.
          </p>
          
          <div className="space-y-3">
            {csvHeaders.map((header) => (
              <div key={header} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{header}</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={mapping[header] || ""}
                    onValueChange={(value) => handleMappingChange(header, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select field or ignore" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATABASE_COLUMNS.map((col) => (
                        <SelectItem key={col.value} value={col.value}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIgnoreColumn(header)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>
              <Check className="h-4 w-4 mr-2" />
              Continue Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};