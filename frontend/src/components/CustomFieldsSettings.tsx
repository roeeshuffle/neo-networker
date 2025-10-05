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
      setIsLoading(true);
      
      // First, try to load from localStorage (most reliable)
      const localCustomFields = localStorage.getItem('custom_fields');
      if (localCustomFields) {
        try {
          const savedFields = JSON.parse(localCustomFields);
          if (Array.isArray(savedFields)) {
            setCustomFields(savedFields);
            setIsLoading(false);
            return; // Exit early if localStorage data is available
          }
        } catch (e) {
          console.error('Error parsing localStorage custom fields:', e);
        }
      }
      
      // If no localStorage data, try backend
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        console.warn('No auth token found, skipping backend fetch');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/custom-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const fields = data.custom_fields || [];
        setCustomFields(fields);
        
        // Save to localStorage for future use
        localStorage.setItem('custom_fields', JSON.stringify(fields));
      } else {
        console.warn('Backend fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to fetch custom fields",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      
      const response = await fetch(`${apiUrl}/api/custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFieldName.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom field created successfully",
        });
        
        // Update localStorage immediately
        const updatedFields = [...customFields, newFieldName.trim()];
        localStorage.setItem('custom_fields', JSON.stringify(updatedFields));
        
        fetchCustomFields();
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
      
      const response = await fetch(`${apiUrl}/api/custom-fields/${encodeURIComponent(fieldName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom field deleted successfully",
        });
        
        // Update localStorage immediately
        const updatedFields = customFields.filter(field => field !== fieldName);
        localStorage.setItem('custom_fields', JSON.stringify(updatedFields));
        
        fetchCustomFields();
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