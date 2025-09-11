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
  { value: 'full_name', label: 'Full Name' },
  { value: 'categories', label: 'Categories' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'company', label: 'Company' },
  { value: 'status', label: 'Status' },
  { value: 'linkedin_profile', label: 'LinkedIn' },
  { value: 'poc_in_apex', label: 'POC in APEX' },
  { value: 'who_warm_intro', label: 'Who Warm Intro' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'should_avishag_meet', label: 'Should Avishag Meet' },
  { value: 'more_info', label: 'More Info' },
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