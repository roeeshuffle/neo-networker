import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, XCircle, Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

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

interface CsvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: CsvPreviewData[];
  allWarnings: any[];
  onImport: (correctedData: CsvPreviewData[]) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'client', label: 'Client' },
  { value: 'partner', label: 'Partner' }
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const JOB_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export default function CsvPreviewModal({ 
  isOpen, 
  onClose, 
  previewData, 
  allWarnings, 
  onImport, 
  isLoading = false 
}: CsvPreviewModalProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [correctedData, setCorrectedData] = useState<CsvPreviewData[]>(previewData);
  const { toast } = useToast();

  const handleEditRow = (rowNumber: number) => {
    const row = correctedData.find(r => r.row_number === rowNumber);
    if (row) {
      setEditingRow(rowNumber);
      setEditedData({ ...row.data });
    }
  };

  const handleSaveRow = (rowNumber: number) => {
    setCorrectedData(prev => 
      prev.map(row => 
        row.row_number === rowNumber 
          ? { ...row, data: editedData }
          : row
      )
    );
    setEditingRow(null);
    setEditedData({});
    toast({
      title: "Row updated",
      description: `Row ${rowNumber} has been corrected`,
    });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleMoveToNotes = (rowNumber: number, field: string, originalValue: string) => {
    const currentNotes = editedData.notes || '';
    const newNotes = currentNotes ? `${currentNotes}\n\n${field}: ${originalValue}` : `${field}: ${originalValue}`;
    handleFieldChange('notes', newNotes);
    handleFieldChange(field, ''); // Clear the original field
  };

  const handleImport = () => {
    onImport(correctedData);
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'truncation':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'validation':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'missing_data':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'truncation':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'validation':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'missing_data':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderFieldEditor = (field: string, value: any) => {
    switch (field) {
      case 'status':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'gender':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'job_status':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select job status" />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'priority':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'notes':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={3}
            placeholder="Enter notes"
          />
        );
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={`Enter ${field}`}
            className="border-orange-400 focus:border-orange-500 focus:ring-orange-500/20"
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            CSV Import Preview
            <Badge variant="outline" className="ml-2">
              {allWarnings.length} warnings
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {correctedData.map((row) => (
                <div key={row.row_number} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Row {row.row_number}: {row.full_name}</h3>
                      {row.warnings.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {row.warnings.length} issues
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingRow === row.row_number ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveRow(row.row_number)}
                            className="h-8"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-8"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRow(row.row_number)}
                          className="h-8"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Warnings */}
                  {row.warnings.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {row.warnings.map((warning, index) => (
                        <div key={index} className={`p-3 rounded border ${getWarningColor(warning.type)}`}>
                          <div className="flex items-start gap-2">
                            {getWarningIcon(warning.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{warning.message}</p>
                              {warning.type === 'truncation' && (
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveToNotes(row.row_number, warning.field, warning.original_value)}
                                    className="h-6 text-xs"
                                  >
                                    Move to Notes
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Data Fields */}
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(row.data).map(([field, value]) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">
                            {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                          {editingRow === row.row_number ? (
                            renderFieldEditor(field, editedData[field])
                          ) : (
                            <div className="p-2 bg-gray-50 rounded text-sm min-h-[40px] flex items-center">
                              {value || <span className="text-gray-400">Empty</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? 'Importing...' : `Import ${correctedData.length} Contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
