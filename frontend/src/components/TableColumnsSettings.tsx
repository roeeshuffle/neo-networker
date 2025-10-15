import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Save, RotateCcw } from "lucide-react";
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

interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
}

const TableColumnsSettings: React.FC<TableColumnsSettingsProps> = ({ isOpen, onClose }) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Default column configuration
  const defaultColumns: ColumnConfig[] = [
    { key: 'first_name', label: 'First Name', enabled: true, order: 1 },
    { key: 'last_name', label: 'Last Name', enabled: true, order: 2 },
    { key: 'organization', label: 'Organization', enabled: true, order: 3 },
    { key: 'job_title', label: 'Job Title', enabled: true, order: 4 },
    { key: 'email', label: 'Email', enabled: true, order: 5 },
    { key: 'phone', label: 'Phone', enabled: false, order: 6 },
    { key: 'mobile', label: 'Mobile', enabled: false, order: 7 },
    { key: 'status', label: 'Status', enabled: false, order: 8 },
    { key: 'priority', label: 'Priority', enabled: false, order: 9 },
    { key: 'group', label: 'Group', enabled: false, order: 10 },
    { key: 'source', label: 'Source', enabled: false, order: 11 },
    { key: 'linkedin_url', label: 'LinkedIn', enabled: false, order: 12 },
    { key: 'github_url', label: 'GitHub', enabled: false, order: 13 },
    { key: 'website_url', label: 'Website', enabled: false, order: 14 },
    { key: 'address', label: 'Address', enabled: false, order: 15 },
    { key: 'notes', label: 'Notes', enabled: false, order: 16 },
    { key: 'last_contact_date', label: 'Last Contact', enabled: false, order: 17 },
    { key: 'next_follow_up_date', label: 'Next Follow-up', enabled: false, order: 18 },
    { key: 'created_at', label: 'Created At', enabled: false, order: 19 }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 FETCHING COLUMN DATA...');
      
      // First, try to load from localStorage (most reliable)
      const localColumns = localStorage.getItem('contact_columns');
      if (localColumns) {
        try {
          const savedColumns = JSON.parse(localColumns);
          console.log('📱 Found localStorage columns:', savedColumns);
          
          if (Array.isArray(savedColumns)) {
            const mergedColumns = [...defaultColumns];
            
            savedColumns.forEach((savedCol: ColumnConfig) => {
              const existingIndex = mergedColumns.findIndex(col => col.key === savedCol.key);
              if (existingIndex !== -1) {
                mergedColumns[existingIndex] = { ...mergedColumns[existingIndex], ...savedCol };
              } else {
                mergedColumns.push(savedCol);
              }
            });
            
            setColumns(mergedColumns.sort((a, b) => a.order - b.order));
            console.log('✅ Loaded from localStorage:', mergedColumns);
            
            // Still try to fetch custom fields from backend
            try {
              const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
              const customFieldsResponse = await fetch(`${apiUrl}/custom-fields`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
                }
              });
              
              if (customFieldsResponse.ok) {
                const customFieldsData = await customFieldsResponse.json();
                setCustomFields(customFieldsData.custom_fields || []);
                console.log('✅ Loaded custom fields from backend:', customFieldsData.custom_fields);
                
                // Add custom fields to columns if they're not already there
                const updatedColumns = [...mergedColumns];
                customFieldsData.custom_fields?.forEach((field: CustomField) => {
                  const customColKey = `custom_${field.key}`;
                  const existingIndex = updatedColumns.findIndex(col => col.key === customColKey);
                  if (existingIndex === -1) {
                    updatedColumns.push({
                      key: customColKey,
                      label: field.name,
                      enabled: false,
                      order: updatedColumns.length + 1
                    });
                    console.log('➕ Added custom field to columns:', field.name);
                  }
                });
                
                setColumns(updatedColumns.sort((a, b) => a.order - b.order));
              }
            } catch (error) {
              console.log('⚠️ Could not load custom fields from backend');
            }
            
            return; // Successfully loaded from localStorage
          }
        } catch (error) {
          console.error('❌ Error parsing localStorage columns:', error);
        }
      }

      // If no localStorage data, try backend
      console.log('📡 No localStorage data, trying backend...');
      
      // Fetch custom fields
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
      const customFieldsResponse = await fetch(`${apiUrl}/custom-fields`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      
      if (customFieldsResponse.ok) {
        const customFieldsData = await customFieldsResponse.json();
        setCustomFields(customFieldsData.custom_fields || []);
      }

      // Try to fetch user preferences from backend
      try {
        const userPrefsResponse = await fetch(`${apiUrl}/user-preferences`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
          }
        });

        if (userPrefsResponse.ok) {
          const userPrefs = await userPrefsResponse.json();
          const savedColumns = userPrefs.preferences?.contact_columns;
          
          if (savedColumns && Array.isArray(savedColumns)) {
            // Merge saved columns with defaults
            const mergedColumns = [...defaultColumns];
            
            savedColumns.forEach((savedCol: ColumnConfig) => {
              const existingIndex = mergedColumns.findIndex(col => col.key === savedCol.key);
              if (existingIndex !== -1) {
                mergedColumns[existingIndex] = { ...mergedColumns[existingIndex], ...savedCol };
              } else {
                mergedColumns.push(savedCol);
              }
            });
            
            // Add custom fields
            customFieldsData.custom_fields?.forEach((field: CustomField) => {
              const customColKey = `custom_${field.key}`;
              const existingIndex = mergedColumns.findIndex(col => col.key === customColKey);
              if (existingIndex === -1) {
                mergedColumns.push({
                  key: customColKey,
                  label: field.name,
                  enabled: false,
                  order: mergedColumns.length + 1
                });
              }
            });
            
            setColumns(mergedColumns.sort((a, b) => a.order - b.order));
            console.log('✅ Loaded from backend:', mergedColumns);
            return; // Successfully loaded from backend
          }
        }
      } catch (error) {
        console.log('⚠️ Backend user-preferences not available');
      }
      
      // Use defaults if nothing else works
      console.log('🔄 Using default columns');
      setColumns([...defaultColumns]);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setColumns([...defaultColumns]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnToggle = (key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const moveColumn = (key: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const newColumns = [...prev];
      const index = newColumns.findIndex(col => col.key === key);
      
      if (direction === 'up' && index > 0) {
        [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
      } else if (direction === 'down' && index < newColumns.length - 1) {
        [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      }
      
      // Update order numbers
      return newColumns.map((col, idx) => ({ ...col, order: idx + 1 }));
    });
  };

  const resetToDefaults = () => {
    setColumns([...defaultColumns]);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
      
      // Prepare the columns data to save
      const columnsToSave = columns.map(col => ({
        key: col.key,
        label: col.label,
        enabled: col.enabled,
        order: col.order
      }));

      console.log('🔍 SAVING COLUMNS:', columnsToSave);

      // Always save to localStorage first (immediate persistence)
      localStorage.setItem('contact_columns', JSON.stringify(columnsToSave));
      console.log('✅ Saved to localStorage:', columnsToSave);

      // Try to save to backend as well
      try {
        const response = await fetch(`${apiUrl}/user-preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            contact_columns: columnsToSave
          })
        });

        if (response.ok) {
          console.log('✅ Also saved to backend');
          toast({
            title: "Success",
            description: "Table column settings saved successfully",
          });
        } else {
          console.log('⚠️ Backend save failed, but localStorage saved');
          toast({
            title: "Success",
            description: "Table column settings saved locally",
          });
        }
      } catch (error) {
        console.log('⚠️ Backend save failed, but localStorage saved:', error);
        toast({
          title: "Success",
          description: "Table column settings saved locally",
        });
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save table column settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Table Columns</CardTitle>
        <CardDescription>
          Choose which columns to display and their order in the contacts table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {columns.filter(col => col.enabled).length} of {columns.length} columns enabled
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={saveSettings} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {columns.map((column, index) => (
                <div key={column.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={column.key}
                      checked={column.enabled}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                    />
                    <Label htmlFor={column.key} className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.key.startsWith('custom_') && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveColumn(column.key, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveColumn(column.key, 'down')}
                      disabled={index === columns.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <div className="text-xs text-muted-foreground ml-2">
                      #{column.order}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Drag columns up/down to change their order</p>
              <p>• Check/uncheck columns to show/hide them</p>
              <p>• Custom fields will appear automatically when created</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TableColumnsSettings;