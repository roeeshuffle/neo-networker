import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Plus } from 'lucide-react';

interface ContactField {
  field: string;
  display_name: string;
  value: any;
  type: string;
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
  { field: 'first_name', display_name: 'First Name', type: 'text' },
  { field: 'last_name', display_name: 'Last Name', type: 'text' },
  { field: 'email', display_name: 'Email', type: 'email' },
  { field: 'phone', display_name: 'Phone', type: 'tel' },
  { field: 'mobile', display_name: 'Mobile', type: 'tel' },
  { field: 'organization', display_name: 'Organization', type: 'text' },
  { field: 'job_title', display_name: 'Job Title', type: 'text' },
  { field: 'address', display_name: 'Address', type: 'textarea' },
  { field: 'linkedin_url', display_name: 'LinkedIn URL', type: 'url' },
  { field: 'github_url', display_name: 'GitHub URL', type: 'url' },
  { field: 'website_url', display_name: 'Website URL', type: 'url' },
  { field: 'notes', display_name: 'Notes', type: 'textarea' },
  { field: 'tags', display_name: 'Tags', type: 'text' },
  { field: 'source', display_name: 'Source', type: 'text' },
  { field: 'priority', display_name: 'Priority', type: 'select' },
  { field: 'group', display_name: 'Group', type: 'text' },
  { field: 'gender', display_name: 'Gender', type: 'select' },
  { field: 'job_status', display_name: 'Job Status', type: 'select' },
  { field: 'status', display_name: 'Status', type: 'select' }
];

const SELECT_OPTIONS = {
  priority: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ],
  gender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ],
  job_status: [
    { value: 'employed', label: 'Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'student', label: 'Student' },
    { value: 'retired', label: 'Retired' },
    { value: 'other', label: 'Other' }
  ],
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'client', label: 'Client' },
    { value: 'partner', label: 'Partner' }
  ]
};

export default function DynamicContactForm({ isOpen, onClose, contact, onSave, isLoading = false, customFields = [] }: DynamicContactFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [availableFields, setAvailableFields] = useState<ContactField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');

  useEffect(() => {
    if (contact) {
      // Load existing contact data
      const contactData: Record<string, any> = {};
      const fields: ContactField[] = [];
      
      // Add all non-null standard fields from the contact
      Object.keys(contact).forEach(key => {
        if (key !== 'custom_fields' && contact[key] !== null && contact[key] !== undefined && contact[key] !== '') {
          contactData[key] = contact[key];
          const fieldOption = FIELD_OPTIONS.find(f => f.field === key);
          if (fieldOption) {
            fields.push({
              field: key,
              display_name: fieldOption.display_name,
              value: contact[key],
              type: fieldOption.type
            });
          }
        }
      });
      
      // Add custom fields
      if (contact.custom_fields) {
        Object.keys(contact.custom_fields).forEach(key => {
          const customField = customFields.find(cf => cf.key === key);
          if (customField && contact.custom_fields[key] !== null && contact.custom_fields[key] !== undefined && contact.custom_fields[key] !== '') {
            contactData[`custom_${key}`] = contact.custom_fields[key];
            fields.push({
              field: `custom_${key}`,
              display_name: customField.name,
              value: contact.custom_fields[key],
              type: customField.type
            });
          }
        });
      }
      
      setFormData(contactData);
      setAvailableFields(fields);
    } else {
      // New contact - start with required fields
      const initialFormData = {
        first_name: '',
        last_name: ''
      };
      setFormData(initialFormData);
      setAvailableFields([
        { field: 'first_name', display_name: 'First Name', value: initialFormData.first_name, type: 'text' },
        { field: 'last_name', display_name: 'Last Name', value: initialFormData.last_name, type: 'text' }
      ]);
    }
  }, [contact]); // Remove customFields from dependencies to prevent infinite loop

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    
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
          type: fieldOption.type
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
            type: customField.type
          };
          setAvailableFields(prev => [...prev, newField]);
          setFormData(prev => ({ ...prev, [`custom_${selectedFieldToAdd}`]: '' }));
        }
      }
      setSelectedFieldToAdd('');
      setShowAddField(false);
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
    const { field: fieldName, display_name, value, type } = field;
    
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
        const options = SELECT_OPTIONS[fieldName as keyof typeof SELECT_OPTIONS] || [];
        return (
          <Select value={value || ''} onValueChange={(value) => handleFieldChange(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${display_name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Existing Fields */}
          <div className="space-y-4">
            {availableFields.map((field) => (
              <div key={field.field} className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={field.field}>
                    {field.display_name}
                    {(field.field === 'first_name' || field.field === 'last_name') && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </div>
                {(field.field !== 'first_name' && field.field !== 'last_name') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(field.field)}
                    className="mt-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Field Section */}
          <div className="border-t pt-4">
            {!showAddField ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddField(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedFieldToAdd} onValueChange={setSelectedFieldToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a field to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFieldsToAdd().map(field => (
                        <SelectItem key={field.field} value={field.field}>
                          {field.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddField}
                    disabled={!selectedFieldToAdd}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddField(false);
                      setSelectedFieldToAdd('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
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