import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomFieldsSettingsProps {
  isOpen: boolean;
  onClose?: () => void;
}

const CustomFieldsSettings: React.FC<CustomFieldsSettingsProps> = ({ isOpen, onClose }) => {
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomFields();
    }
  }, [isOpen]);

  const fetchCustomFields = async () => {
    try {
      console.log('🔍 CUSTOM FIELDS: Starting fetchCustomFields');
      setIsLoading(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      console.log('🔍 CUSTOM FIELDS: API URL:', apiUrl);
      console.log('🔍 CUSTOM FIELDS: Token exists?', !!token);
      
      if (!token) {
        console.warn('🔍 CUSTOM FIELDS: No auth token found, skipping backend fetch');
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 CUSTOM FIELDS: Fetching from new user preferences API...');
      const response = await fetch(`${apiUrl}/custom-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 CUSTOM FIELDS: Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 CUSTOM FIELDS: Backend response data:', data);
        const fields = data.custom_fields || [];
        console.log('🔍 CUSTOM FIELDS: Extracted fields:', fields);
        console.log('🔍 CUSTOM FIELDS: Field types:', fields.map(f => typeof f));
        
        setCustomFields(fields);
        console.log('🔍 CUSTOM FIELDS: Set custom fields from backend');
      } else {
        console.warn('🔍 CUSTOM FIELDS: Backend fetch failed:', response.status);
        setCustomFields([]);
      }
    } catch (error) {
      console.error('🔍 CUSTOM FIELDS: Error fetching custom fields:', error);
      setCustomFields([]);
      
      toast({
        title: "Error",
        description: "Failed to fetch custom fields",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('🔍 CUSTOM FIELDS: fetchCustomFields completed');
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Field name is required",
        variant: "destructive",
      });
      return;
    }

    if (customFields.includes(newFieldName.trim())) {
      toast({
        title: "Error",
        description: "Field name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }
      
      // Add new field to current list
      const updatedFields = [...customFields, newFieldName.trim()];

      const response = await fetch(`${apiUrl}/custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          custom_fields: updatedFields
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Custom field "${newFieldName.trim()}" added successfully`,
        });
        
        setCustomFields(updatedFields);
        setNewFieldName('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create custom field');
      }
    } catch (error) {
      console.error('Error creating custom field:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create custom field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteField = async (fieldName: string) => {
    if (!confirm(`Are you sure you want to delete the custom field "${fieldName}"? This will remove it from all contacts.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }
      
      // Remove field from current list
      const updatedFields = customFields.filter(field => field !== fieldName);
      
      const response = await fetch(`${apiUrl}/custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          custom_fields: updatedFields
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Custom field "${fieldName}" deleted successfully`,
        });
        
        setCustomFields(updatedFields);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete custom field');
      }
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete custom field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Custom Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new field */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="fieldName">Field Name</Label>
            <Input
              id="fieldName"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Enter field name (e.g., 'Agenda', 'Notes')"
              onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleAddField} 
              disabled={isLoading || !newFieldName.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* List existing fields */}
        <div>
          <Label className="text-sm font-medium">Current Custom Fields</Label>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : customFields.length === 0 ? (
            <div className="text-sm text-muted-foreground">No custom fields created yet</div>
          ) : (
            <div className="space-y-2 mt-2">
              {customFields.map((fieldName, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{fieldName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(fieldName)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomFieldsSettings;