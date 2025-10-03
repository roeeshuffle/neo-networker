import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Trash2 } from 'lucide-react';

interface ContactField {
  field: string;
  display_name: string;
  value: any;
  type: string;
  category: string;
  required?: boolean;
  options?: string[];
}

interface DynamicContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: any;
  onSave: (data: any) => void;
  isLoading?: boolean;
  customFields?: any[];
}

const FIELD_OPTIONS = [
  // Core Identifiers
  { field: 'first_name', display_name: 'First Name', type: 'text', required: true, category: 'general' },
  { field: 'last_name', display_name: 'Last Name', type: 'text', required: true, category: 'general' },
  { field: 'gender', display_name: 'Gender', type: 'select', options: ['male', 'female', 'other'], category: 'general' },
  { field: 'birthday', display_name: 'Birthday', type: 'date', category: 'general' },
  
  // Communication Info
  { field: 'email', display_name: 'Email', type: 'email', category: 'general' },
  { field: 'phone', display_name: 'Phone', type: 'tel', category: 'general' },
  { field: 'mobile', display_name: 'Mobile', type: 'tel', category: 'general' },
  { field: 'address', display_name: 'Address', type: 'textarea', category: 'general' },
  
  // Professional Info
  { field: 'organization', display_name: 'Organization', type: 'text', category: 'professional' },
  { field: 'job_title', display_name: 'Job Title', type: 'text', category: 'professional' },
  { field: 'job_status', display_name: 'Job Status', type: 'select', options: ['employed', 'unemployed', 'student', 'retired', 'other'], category: 'professional' },
  
  // Social & Online Profiles
  { field: 'linkedin_url', display_name: 'LinkedIn', type: 'url', category: 'social' },
  { field: 'github_url', display_name: 'GitHub', type: 'url', category: 'social' },
  { field: 'facebook_url', display_name: 'Facebook', type: 'url', category: 'social' },
  { field: 'twitter_url', display_name: 'Twitter', type: 'url', category: 'social' },
  { field: 'website_url', display_name: 'Website', type: 'url', category: 'social' },
  
  // Connection Management
  { field: 'notes', display_name: 'Notes', type: 'textarea', category: 'connection' },
  { field: 'source', display_name: 'Source', type: 'text', category: 'connection' },
  { field: 'tags', display_name: 'Tags', type: 'text', category: 'connection' },
  { field: 'last_contact_date', display_name: 'Last Contact Date', type: 'datetime-local', category: 'connection' },
  { field: 'next_follow_up_date', display_name: 'Next Follow-up Date', type: 'datetime-local', category: 'connection' },
  { field: 'status', display_name: 'Status', type: 'select', options: ['active', 'inactive', 'prospect', 'client', 'partner'], category: 'connection' },
  { field: 'priority', display_name: 'Priority', type: 'select', options: ['low', 'medium', 'high'], category: 'connection' },
  { field: 'group', display_name: 'Group', type: 'text', category: 'connection' }
];

const CATEGORIES = [
  { id: 'general', name: 'General Info', description: 'Basic contact information' },
  { id: 'professional', name: 'Professional Info', description: 'Work and career details' },
  { id: 'social', name: 'Social & Online Profiles', description: 'Social media and online presence' },
  { id: 'connection', name: 'Connection Management', description: 'Relationship and interaction data' },
  { id: 'custom', name: 'Custom Fields', description: 'User-defined fields' }
];

export default function DynamicContactForm({ isOpen, onClose, contact, onSave, isLoading = false, customFields = [] }: DynamicContactFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [availableFields, setAvailableFields] = useState<ContactField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [newCustomField, setNewCustomField] = useState({ name: '', type: 'text' });

  useEffect(() => {
    const contactData: Record<string, any> = {};
    const fields: ContactField[] = [];
    
    // Always include all standard fields
    FIELD_OPTIONS.forEach(fieldOption => {
      const value = contact ? contact[fieldOption.field] : '';
      contactData[fieldOption.field] = value || '';
      fields.push({
        field: fieldOption.field,
        display_name: fieldOption.display_name,
        value: value || '',
        type: fieldOption.type,
        category: fieldOption.category,
        required: fieldOption.required,
        options: fieldOption.options
      });
    });
    
    // Add custom fields if editing existing contact
    if (contact && contact.custom_fields) {
      Object.keys(contact.custom_fields).forEach(key => {
        const customField = customFields.find(cf => cf.key === key);
        if (customField && contact.custom_fields[key] !== null && contact.custom_fields[key] !== undefined && contact.custom_fields[key] !== '') {
          contactData[`custom_${key}`] = contact.custom_fields[key];
          fields.push({
            field: `custom_${key}`,
            display_name: customField.name,
            value: contact.custom_fields[key],
            type: customField.type,
            category: 'custom'
          });
        }
      });
    }
    
    setFormData(contactData);
    setAvailableFields(fields);
  }, [contact]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Also update the availableFields to keep them in sync
    setAvailableFields(prev => 
      prev.map(f => 
        f.field === field ? { ...f, value } : f
      )
    );
  };

  const handleAddField = () => {
    if (selectedFieldToAdd) {
      // Check if it's a standard field
      const fieldOption = FIELD_OPTIONS.find(f => f.field === selectedFieldToAdd);
      
      if (fieldOption && !availableFields.find(f => f.field === selectedFieldToAdd)) {
        const newField: ContactField = {
          field: selectedFieldToAdd,
          display_name: fieldOption.display_name,
          value: '',
          type: fieldOption.type,
          category: fieldOption.category,
          required: fieldOption.required,
          options: fieldOption.options
        };
        setAvailableFields(prev => [...prev, newField]);
        setFormData(prev => ({ ...prev, [selectedFieldToAdd]: '' }));
      } else {
        // Check if it's a custom field
        const customField = customFields.find(cf => cf.key === selectedFieldToAdd);
        
        if (customField && !availableFields.find(f => f.field === `custom_${selectedFieldToAdd}`)) {
          const newField: ContactField = {
            field: `custom_${selectedFieldToAdd}`,
            display_name: customField.name,
            value: '',
            type: customField.type,
            category: 'custom'
          };
          setAvailableFields(prev => [...prev, newField]);
          setFormData(prev => ({ ...prev, [`custom_${selectedFieldToAdd}`]: '' }));
        }
      }
      setSelectedFieldToAdd('');
      setShowAddField(false);
    }
  };

  const handleAddCustomField = () => {
    if (newCustomField.name.trim()) {
      const fieldKey = newCustomField.name.toLowerCase().replace(/\s+/g, '_');
      const newField: ContactField = {
        field: `custom_${fieldKey}`,
        display_name: newCustomField.name,
        value: '',
        type: newCustomField.type,
        category: 'custom'
      };
      setAvailableFields(prev => [...prev, newField]);
      setFormData(prev => ({ ...prev, [`custom_${fieldKey}`]: '' }));
      setNewCustomField({ name: '', type: 'text' });
    }
  };

  const handleRemoveField = (fieldToRemove: string) => {
    if (fieldToRemove === 'first_name' || fieldToRemove === 'last_name') {
      return; // Can't remove required fields
    }

    setAvailableFields(prev => prev.filter(f => f.field !== fieldToRemove));
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[fieldToRemove];
      return newData;
    });
  };

  const handleSave = () => {
    // Separate standard fields from custom fields
    const standardFields: Record<string, any> = {};
    const customFieldsData: Record<string, any> = {};

    Object.keys(formData).forEach(key => {
      if (key.startsWith('custom_')) {
        const customKey = key.replace('custom_', '');
        customFieldsData[customKey] = formData[key];
      } else {
        standardFields[key] = formData[key];
      }
    });

    // Add custom fields to the data
    if (Object.keys(customFieldsData).length > 0) {
      standardFields.custom_fields = customFieldsData;
    }

    onSave(standardFields);
  };

  const renderField = (field: ContactField) => {
    const { field: fieldName, display_name, value, type, options } = field;
    
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={(value) => handleFieldChange(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${display_name}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
          />
        );

      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
          />
        );
      
      default:
        return (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
            disabled={false}
            autoComplete="off"
            style={{ opacity: 1, cursor: 'text' }}
          />
        );
    }
  };

  const getFieldsByCategory = (category: string) => {
    return availableFields.filter(field => field.category === category);
  };

  const getAvailableFieldsToAdd = () => {
    const standardFields = FIELD_OPTIONS.filter(field => 
      !availableFields.find(af => af.field === field.field)
    );
    
    const customFieldsToAdd = customFields
      .filter(cf => !availableFields.find(af => af.field === `custom_${cf.key}`))
      .map(cf => ({
        field: cf.key,
        display_name: cf.name,
        type: cf.type
      }));
    
    return [...standardFields, ...customFieldsToAdd];
  };

  const renderFieldsForCategory = (category: string) => {
    const fields = getFieldsByCategory(category);
    
    if (fields.length === 0 && category === 'custom') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No custom fields added yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.field} className="space-y-2">
            <Label htmlFor={field.field} className="text-sm font-medium">
              {field.display_name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              {renderField(field)}
              {category === 'custom' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(field.field)}
                  className="absolute -top-1 -right-1 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4">
              {CATEGORIES.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4 h-full">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              {renderFieldsForCategory(category.id)}
              
              {category.id === 'custom' && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium mb-4">Add Custom Field</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Field name"
                      value={newCustomField.name}
                      onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                    <Select
                      value={newCustomField.type}
                      onValueChange={(value) => setNewCustomField(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleAddCustomField}
                      disabled={!newCustomField.name.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}