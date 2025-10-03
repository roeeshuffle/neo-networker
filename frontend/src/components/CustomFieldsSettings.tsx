import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CustomField {
  id: number;
  name: string;
  key: string;
  type: string;
  options: string[];
  created_at?: string;
  updated_at?: string;
}

interface CustomFieldsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomFieldsSettings: React.FC<CustomFieldsSettingsProps> = ({ isOpen, onClose }) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    type: 'text',
    options: [] as string[]
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'date', label: 'Date' },
    { value: 'datetime-local', label: 'Date & Time' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'number', label: 'Number' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCustomFields();
    }
  }, [isOpen]);

  const fetchCustomFields = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/custom-fields', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomFields(data.custom_fields || []);
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

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      key: generateKey(name)
    }));
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.key) {
      toast({
        title: "Error",
        description: "Name and key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingField) {
        // Update existing field
        const response = await fetch(`/api/custom-fields/${editingField.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Custom field updated successfully",
          });
          fetchCustomFields();
          setEditingField(null);
          setShowAddForm(false);
          resetForm();
        } else {
          throw new Error('Failed to update custom field');
        }
      } else {
        // Create new field
        const response = await fetch('/api/custom-fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Custom field created successfully",
          });
          fetchCustomFields();
          setShowAddForm(false);
          resetForm();
        } else {
          throw new Error('Failed to create custom field');
        }
      }
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast({
        title: "Error",
        description: "Failed to save custom field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      key: field.key,
      type: field.type,
      options: field.options || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (fieldId: number) => {
    if (!confirm('Are you sure you want to delete this custom field? This will remove it from all contacts.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom field deleted successfully",
        });
        fetchCustomFields();
      } else {
        throw new Error('Failed to delete custom field');
      }
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      type: 'text',
      options: []
    });
    setEditingField(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingField(null);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Create custom fields to store additional information about your contacts
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</CardTitle>
            <CardDescription>
              Define a new custom field that will be available for all contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Field Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Should schedule a meeting?"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="key">Field Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g., should_schedule_meeting"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used internally. Must be unique and contain only letters, numbers, and underscores.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="type">Field Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'select' && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {editingField ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Field
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Field
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {customFields.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No custom fields created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first custom field to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          customFields.map(field => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{field.name}</h4>
                      <Badge variant="secondary">{field.type}</Badge>
                      <span className="text-sm text-muted-foreground">({field.key})</span>
                    </div>
                    {field.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Options:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {field.options.map((option, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomFieldsSettings;
