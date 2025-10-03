import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CustomField {
  id: number;
  name: string;
  key: string;
  type: string;
  options: string[];
}

interface TableColumnsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TableColumnsSettings: React.FC<TableColumnsSettingsProps> = ({ isOpen, onClose }) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [tableColumns, setTableColumns] = useState({
    standard: ['first_name', 'last_name', 'organization', 'job_title', 'status'],
    custom: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const standardColumns = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'organization', label: 'Organization' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'status', label: 'Status' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'group', label: 'Group' },
    { key: 'priority', label: 'Priority' },
    { key: 'source', label: 'Source' },
    { key: 'created_at', label: 'Created At' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch custom fields
      const customFieldsResponse = await fetch('/api/custom-fields', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (customFieldsResponse.ok) {
        const customFieldsData = await customFieldsResponse.json();
        setCustomFields(customFieldsData.custom_fields || []);
      }

      // Fetch table columns
      const columnsResponse = await fetch('/api/table-columns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (columnsResponse.ok) {
        const columnsData = await columnsResponse.json();
        setTableColumns(columnsData.table_columns || {
          standard: ['first_name', 'last_name', 'organization', 'job_title', 'status'],
          custom: []
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStandardColumnToggle = (columnKey: string) => {
    setTableColumns(prev => {
      const isSelected = prev.standard.includes(columnKey);
      if (isSelected) {
        return {
          ...prev,
          standard: prev.standard.filter(key => key !== columnKey)
        };
      } else {
        return {
          ...prev,
          standard: [...prev.standard, columnKey]
        };
      }
    });
  };

  const handleCustomColumnToggle = (fieldKey: string) => {
    setTableColumns(prev => {
      const isSelected = prev.custom.includes(fieldKey);
      if (isSelected) {
        return {
          ...prev,
          custom: prev.custom.filter(key => key !== fieldKey)
        };
      } else {
        return {
          ...prev,
          custom: [...prev.custom, fieldKey]
        };
      }
    });
  };

  const moveColumn = (type: 'standard' | 'custom', fromIndex: number, toIndex: number) => {
    setTableColumns(prev => {
      const columns = [...prev[type]];
      const [movedColumn] = columns.splice(fromIndex, 1);
      columns.splice(toIndex, 0, movedColumn);
      
      return {
        ...prev,
        [type]: columns
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/table-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(tableColumns)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Table columns updated successfully",
        });
        onClose();
      } else {
        throw new Error('Failed to update table columns');
      }
    } catch (error) {
      console.error('Error saving table columns:', error);
      toast({
        title: "Error",
        description: "Failed to save table columns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Table Columns</h3>
        <p className="text-sm text-muted-foreground">
          Choose which columns to display in the contacts table and their order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard Columns */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Columns</CardTitle>
            <CardDescription>
              Built-in contact fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tableColumns.standard.map((columnKey, index) => {
              const column = standardColumns.find(c => c.key === columnKey);
              return column ? (
                <div key={columnKey} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleStandardColumnToggle(columnKey)}
                    />
                    <Label className="font-medium">{column.label}</Label>
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColumn('standard', index, index - 1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < tableColumns.standard.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColumn('standard', index, index + 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : null;
            })}
            
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Available columns:</p>
              {standardColumns
                .filter(col => !tableColumns.standard.includes(col.key))
                .map(column => (
                  <div key={column.key} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleStandardColumnToggle(column.key)}
                    />
                    <Label className="text-muted-foreground">{column.label}</Label>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Columns */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Columns</CardTitle>
            <CardDescription>
              Your custom fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom fields available. Create some custom fields first.
              </p>
            ) : (
              <>
                {tableColumns.custom.map((fieldKey, index) => {
                  const field = customFields.find(f => f.key === fieldKey);
                  return field ? (
                    <div key={fieldKey} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleCustomColumnToggle(fieldKey)}
                        />
                        <Label className="font-medium">{field.name}</Label>
                        <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                      </div>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveColumn('custom', index, index - 1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < tableColumns.custom.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveColumn('custom', index, index + 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Available custom fields:</p>
                  {customFields
                    .filter(field => !tableColumns.custom.includes(field.key))
                    .map(field => (
                      <div key={field.key} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleCustomColumnToggle(field.key)}
                        />
                        <Label className="text-muted-foreground">{field.name}</Label>
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                      </div>
                    ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default TableColumnsSettings;
