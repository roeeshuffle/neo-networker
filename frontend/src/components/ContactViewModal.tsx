import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Person } from '@/pages/Dashboard';

interface ContactViewModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: any) => void;
  isLoading?: boolean;
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
  { field: 'group', display_name: 'Group', type: 'select', options: ['favourites', 'job', 'friends', 'family', 'business', 'other'], category: 'connection' },
  
  // System Metadata
  { field: 'owner_id', display_name: 'Owner ID', type: 'text', category: 'system', readonly: true },
  { field: 'created_at', display_name: 'Created At', type: 'datetime-local', category: 'system', readonly: true },
  { field: 'updated_at', display_name: 'Updated At', type: 'datetime-local', category: 'system', readonly: true }
];

const CATEGORIES = {
  general: 'General Info',
  professional: 'Professional Info',
  social: 'Social & Online Profiles',
  connection: 'Connection Management',
  system: 'System Metadata'
};

export default function ContactViewModal({ person, isOpen, onClose, onSave, isLoading = false }: ContactViewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [availableFields, setAvailableFields] = useState<Array<typeof FIELD_OPTIONS[0]>>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');

  useEffect(() => {
    if (person) {
      // Load existing person data
      const personData: Record<string, any> = {};
      const fields: Array<typeof FIELD_OPTIONS[0]> = [];
      
      // Add all non-null fields from the person
      Object.keys(person).forEach(key => {
        if (person[key] !== null && person[key] !== undefined && person[key] !== '') {
          personData[key] = person[key];
          const fieldOption = FIELD_OPTIONS.find(f => f.field === key);
          if (fieldOption) {
            fields.push(fieldOption);
          }
        }
      });
      
      setFormData(personData);
      setAvailableFields(fields);
    } else {
      setFormData({});
      setAvailableFields([]);
    }
  }, [person]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddField = () => {
    if (selectedFieldToAdd) {
      const fieldOption = FIELD_OPTIONS.find(f => f.field === selectedFieldToAdd);
      if (fieldOption && !availableFields.find(f => f.field === selectedFieldToAdd)) {
        setAvailableFields(prev => [...prev, fieldOption]);
        setFormData(prev => ({ ...prev, [selectedFieldToAdd]: '' }));
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
    // Filter out empty values
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );
    
    onSave(filteredData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (person) {
      // Reset to original data
      const personData: Record<string, any> = {};
      const fields: Array<typeof FIELD_OPTIONS[0]> = [];
      
      Object.keys(person).forEach(key => {
        if (person[key] !== null && person[key] !== undefined && person[key] !== '') {
          personData[key] = person[key];
          const fieldOption = FIELD_OPTIONS.find(f => f.field === key);
          if (fieldOption) {
            fields.push(fieldOption);
          }
        }
      });
      
      setFormData(personData);
      setAvailableFields(fields);
    }
    setIsEditing(false);
    setShowAddField(false);
  };

  const renderField = (field: typeof FIELD_OPTIONS[0]) => {
    const { field: fieldName, display_name, type, readonly } = field;
    const value = formData[fieldName] || '';

    if (readonly) {
      return (
        <div className="text-sm text-muted-foreground">
          {value ? (type === 'datetime-local' ? new Date(value).toLocaleString() : value) : '—'}
        </div>
      );
    }

    if (!isEditing) {
      return (
        <div className="text-sm">
          {value ? (type === 'datetime-local' ? new Date(value).toLocaleString() : value) : '—'}
        </div>
      );
    }

    switch (type) {
      case 'select':
        const options = field.options || [];
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(fieldName, val)}>
            <SelectTrigger className="border-orange-400 focus:border-orange-500 focus:ring-orange-500/20">
              <SelectValue placeholder={`Select ${display_name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
            rows={3}
            className="border-orange-400 focus:border-orange-500 focus:ring-orange-500/20"
          />
        );
      
      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="border-orange-400 focus:border-orange-500 focus:ring-orange-500/20"
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        );
      
      default:
        return (
          <Input
            type={type}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${display_name}`}
            className="border-orange-400 focus:border-orange-500 focus:ring-orange-500/20"
          />
        );
    }
  };

  const getFieldsByCategory = (category: string) => {
    return availableFields.filter(field => field.category === category);
  };

  const getAvailableFieldsToAdd = (category: string) => {
    return FIELD_OPTIONS.filter(field => 
      field.category === category && 
      !availableFields.find(af => af.field === field.field)
    );
  };

  const getFullName = () => {
    if (person?.first_name && person?.last_name) {
      return `${person.first_name} ${person.last_name}`;
    }
    return person?.first_name || person?.last_name || 'Unknown';
  };

  const getInitials = () => {
    const name = getFullName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={getFullName()} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{getFullName()}</DialogTitle>
                {person.organization && (
                  <p className="text-muted-foreground">{person.organization}</p>
                )}
                {person.job_title && (
                  <p className="text-sm text-muted-foreground">{person.job_title}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="social">Social & Online</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
              {Object.entries(CATEGORIES).map(([categoryKey, categoryName]) => (
                <TabsContent key={categoryKey} value={categoryKey} className="space-y-6 h-full pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{categoryName}</h3>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddField(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {getFieldsByCategory(categoryKey).map((field) => (
                  <div key={field.field} className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={field.field}>
                        {field.display_name}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {renderField(field)}
                    </div>
                    {isEditing && !field.required && !field.readonly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(field.field)}
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {getFieldsByCategory(categoryKey).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No {categoryName.toLowerCase()} fields available
                  </div>
                )}
              </div>

              {/* Add Field Section */}
              {isEditing && showAddField && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={selectedFieldToAdd} onValueChange={setSelectedFieldToAdd}>
                        <SelectTrigger className="flex-1 border-orange-400 focus:border-orange-500 focus:ring-orange-500/20">
                          <SelectValue placeholder="Select a field to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFieldsToAdd(categoryKey).map(field => (
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
                </div>
              )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
