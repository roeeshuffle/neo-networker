import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface SimpleCsvUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ContactField {
  key: string;
  label: string;
  required: boolean;
  isCustom?: boolean;
}

interface CsvColumnMapping {
  [csvColumn: string]: string;
}

const SimpleCsvUploader: React.FC<SimpleCsvUploaderProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [contactFields, setContactFields] = useState<ContactField[]>([]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [totalRows, setTotalRows] = useState(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  // Fetch custom fields when component mounts
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (!token) return;

        const response = await fetch(`${apiUrl}/user-preferences`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 CSV UPLOADER - Full API response:', data);
          const customFieldsList = data.preferences?.custom_fields || data.custom_fields || [];
          setCustomFields(customFieldsList);
          console.log('🔍 CSV UPLOADER - Fetched custom fields:', customFieldsList);
        } else {
          console.error('🔍 CSV UPLOADER - Failed to fetch custom fields:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching custom fields:', error);
      }
    };

    if (isOpen) {
      fetchCustomFields();
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleGetColumns = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
      const response = await fetch(`${apiUrl}/csv/get-columns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCsvColumns(data.csv_columns);
        setContactFields(data.contact_fields);
        setTotalRows(data.total_rows);
        setStep('mapping');
        
        // Auto-map some common columns
        const autoMapping: CsvColumnMapping = {};
        data.csv_columns.forEach((column: string) => {
          const lowerColumn = column.toLowerCase();
          if (lowerColumn.includes('first') || lowerColumn.includes('name')) {
            autoMapping[column] = 'first_name';
          } else if (lowerColumn.includes('email') || lowerColumn.includes('e-mail')) {
            autoMapping[column] = 'email';
          } else if (lowerColumn.includes('phone') || lowerColumn.includes('tel')) {
            autoMapping[column] = 'phone';
          } else if (lowerColumn.includes('company') || lowerColumn.includes('org')) {
            autoMapping[column] = 'organization';
          }
        });
        setMapping(autoMapping);
        
        toast({
          title: "Columns loaded",
          description: `Found ${data.csv_columns.length} columns in ${data.total_rows} rows`,
        });
      } else {
        throw new Error(data.error || 'Failed to get columns');
      }
    } catch (error: any) {
      console.error('Error getting columns:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to read CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (csvColumn: string, contactField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: contactField
    }));
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setStep('importing');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
      const response = await fetch(`${apiUrl}/csv/import-with-mapping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setImportResult(data);
        toast({
          title: "Import successful",
          description: `Imported ${data.imported_count} contacts`,
        });
        onImportComplete();
      } else {
        throw new Error(data.error || 'Failed to import CSV');
      }
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
      setStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvColumns([]);
    setMapping({});
    setStep('upload');
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Simple CSV Import
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-2 hidden"
              />
              <label 
                htmlFor="csv-file" 
                className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Choose CSV File
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGetColumns} 
                disabled={!file || loading}
              >
                {loading ? 'Loading...' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Map CSV Columns to Contact Fields</h3>
              <p className="text-sm text-blue-700 mt-1">
                Map each CSV column to a contact field, or select "Skip" to ignore it.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {csvColumns.map((csvColumn) => (
                <div key={csvColumn} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">{csvColumn}</Label>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={mapping[csvColumn] || 'skip'}
                      onValueChange={(value) => handleMappingChange(csvColumn, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip this column</SelectItem>
                        <SelectItem value="full_name">Full Name (splits to first & last)</SelectItem>
                        {contactFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                        {customFields.map((field) => (
                          <SelectItem key={`custom_${field}`} value={`custom_${field}`}>
                            {field} (Custom)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Total rows to import:</strong> {totalRows}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={loading}
              >
                {loading ? 'Importing...' : `Import ${totalRows} Contacts`}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-lg font-medium">Importing contacts...</p>
            <p className="text-sm text-gray-600">Please wait while we process your CSV file</p>
          </div>
        )}

        {importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Import Complete!</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p><strong>Imported:</strong> {importResult.imported_count} contacts</p>
              {importResult.skipped_count > 0 && (
                <p><strong>Skipped:</strong> {importResult.skipped_count} contacts (duplicates)</p>
              )}
              <p><strong>Total rows:</strong> {importResult.total_rows}</p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-600"><strong>Errors:</strong></p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimpleCsvUploader;
