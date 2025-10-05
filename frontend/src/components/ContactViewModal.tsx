import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, X, Plus } from 'lucide-react';

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  gender?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  organization?: string;
  job_title?: string;
  job_status?: string;
  linkedin_url?: string;
  github_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  website_url?: string;
  notes?: string;
  source?: string;
  tags?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  status?: string;
  priority?: string;
  group?: string;
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

interface ContactViewModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: any) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  { id: 'general', name: 'General Info', description: 'Basic contact information' },
  { id: 'professional', name: 'Professional Info', description: 'Work and career information' },
  { id: 'social', name: 'Social & Online', description: 'Social media and web presence' },
  { id: 'connection', name: 'Connection', description: 'Relationship management data' },
  { id: 'custom', name: 'Custom Fields', description: 'User-defined fields' },
];

const ContactViewModal: React.FC<ContactViewModalProps> = ({
  person,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [userCustomFieldDefinitions, setUserCustomFieldDefinitions] = useState<any[]>([]);

  useEffect(() => {
    // Load user custom field definitions
    loadUserCustomFields();
  }, []);

  useEffect(() => {
    if (person) {
      const personData = { ...person };
      setFormData(personData);
      
      // Parse custom fields from contact with their definitions
      if (person.custom_fields && typeof person.custom_fields === 'object') {
        const contactCustomFields = Object.entries(person.custom_fields).map(([key, value]) => {
          const definition = userCustomFieldDefinitions.find(def => def.key === key);
          return {
            field: key,
            display_name: definition?.name || key,
            value: value,
            type: definition?.type || 'text',
            category: 'custom'
          };
        });
        setCustomFields(contactCustomFields);
      } else {
        setCustomFields([]);
      }
    }
  }, [person, userCustomFieldDefinitions]);

  const loadUserCustomFields = async () => {
    try {
      // First, try to load from localStorage (most reliable)
      const localCustomFields = localStorage.getItem('custom_fields');
      if (localCustomFields) {
        try {
          const savedFields = JSON.parse(localCustomFields);
          if (Array.isArray(savedFields)) {
            setUserCustomFieldDefinitions(savedFields);
            return; // Exit early if localStorage data is available
          }
        } catch (e) {
          console.error('Error parsing localStorage custom fields:', e);
        }
      }
      
      // If no localStorage data, try backend
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const response = await fetch(`${apiUrl}/api/custom-fields`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const fields = data.custom_fields || [];
        setUserCustomFieldDefinitions(fields);
        
        // Save to localStorage for future use
        localStorage.setItem('custom_fields', JSON.stringify(fields));
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Prepare custom fields object (save all custom fields, even empty ones)
    const customFieldsData = {};
    customFields.forEach(field => {
      if (field.category === 'custom') {
        // Save the field even if it's empty/null to preserve the field structure
        customFieldsData[field.field] = field.value || null;
      }
    });


    const dataToSave = {
      ...formData,
      custom_fields: customFieldsData
    };

    console.log('🔍 FULL DATA TO SAVE:', dataToSave);
    onSave(dataToSave);
  };

  const handleAddCustomField = async () => {
    if (!newFieldName.trim()) return;

    try {
      // Create field definition in user settings
      const fieldKey = newFieldName.toLowerCase().replace(/\s+/g, '_');
      
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      const response = await fetch(`${apiUrl}/api/custom-fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFieldName,
          key: fieldKey,
          type: newFieldType
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add the field to the form data
        setFormData(prev => ({
          ...prev,
          [`custom_${fieldKey}`]: ''
        }));

        // Add to custom fields list
        const newField = {
          field: fieldKey,
          display_name: newFieldName,
          value: '',
          type: newFieldType,
          category: 'custom'
        };

        setCustomFields(prev => [...prev, newField]);
        
        // Reload custom field definitions
        await loadUserCustomFields();
        
        setNewFieldName('');
        setNewFieldType('text');
      } else {
        const errorText = await response.text();
        console.error('Error creating custom field:', errorText);
        
        // Temporarily fallback: create field locally without backend persistence
        console.warn('Backend custom fields API not ready, creating field locally...');
        
        const newField = {
          field: fieldKey,
          display_name: newFieldName,
          value: '',
          type: newFieldType,
          category: 'custom'
        };

        setCustomFields(prev => [...prev, newField]);
        setNewFieldName('');
        setNewFieldType('text');
      }
    } catch (error) {
      console.error('Error creating custom field:', error);
    }
  };

  const handleRemoveCustomField = (fieldName: string) => {
    setCustomFields(prev => prev.filter(field => field.field !== fieldName));
  };

  const getFullName = () => {
    return `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Unknown Contact';
  };

  const getInitials = () => {
    const firstName = formData.first_name || '';
    const lastName = formData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderFieldsForCategory = (categoryId: string) => {
    const categoryFields: Record<string, any[]> = {
      general: [
        { field: 'first_name', display_name: 'First Name' },
        { field: 'last_name', display_name: 'Last Name' },
        { field: 'gender', display_name: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { field: 'birthday', display_name: 'Birthday', type: 'date' },
        { field: 'email', display_name: 'Email' },
        { field: 'phone', display_name: 'Phone' },
        { field: 'mobile', display_name: 'Mobile' },
        { field: 'address', display_name: 'Address', type: 'textarea' }
      ],
      professional: [
        { field: 'organization', display_name: 'Organization' },
        { field: 'job_title', display_name: 'Job Title' },
        { field: 'job_status', display_name: 'Job Status', type: 'select', options: ['Employed', 'Unemployed', 'Student', 'Retired', 'Other'] }
      ],
      social: [
        { field: 'linkedin_url', display_name: 'LinkedIn' },
        { field: 'github_url', display_name: 'GitHub' },
        { field: 'facebook_url', display_name: 'Facebook' },
        { field: 'twitter_url', display_name: 'Twitter' },
        { field: 'website_url', display_name: 'Website' }
      ],
      connection: [
        { field: 'status', display_name: 'Status', type: 'select', options: ['Active', 'Inactive', 'Prospect', 'Client', 'Partner'] },
        { field: 'priority', display_name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
        { field: 'group', display_name: 'Group' },
        { field: 'source', display_name: 'Source' },
        { field: 'tags', display_name: 'Tags' },
        { field: 'notes', display_name: 'Notes', type: 'textarea' },
        { field: 'last_contact_date', display_name: 'Last Contact Date', type: 'date' },
        { field: 'next_follow_up_date', display_name: 'Next Follow-up Date', type: 'date' }
      ],
      custom: isEditing ? [...customFields, ...userCustomFieldDefinitions.filter(def => !customFields.find(cf => cf.field === def.key)).map(def => ({
        field: def.key,
        display_name: def.name,
        value: '',
        type: def.type,
        category: 'custom'
      }))] : customFields
    };

    const fields = categoryFields[categoryId] || [];

    return (
      <>
        {fields.map((field) => (
          <div key={field.field} className="space-y-2">
            <Label htmlFor={field.field} className="text-sm font-medium">
              {field.display_name}
            </Label>
            {isEditing ? (
              <>
                {field.type === 'select' ? (
                  <Select
                    value={formData[field.field] || ''}
                    onValueChange={(value) => handleFieldChange(field.field, value)}
                  >
                    <SelectTrigger className="border-gray-400 focus:border-gray-500 focus:ring-gray-500/20">
                      <SelectValue placeholder={`Select ${field.display_name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option.toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.field] || ''}
                    onChange={(e) => handleFieldChange(field.field, e.target.value)}
                    placeholder={`Enter ${field.display_name}`}
                    rows={3}
                    className="border-gray-400 focus:border-gray-500 focus:ring-gray-500/20"
                  />
                ) : field.type === 'date' ? (
                  <Input
                    type="date"
                    value={formData[field.field] || ''}
                    onChange={(e) => handleFieldChange(field.field, e.target.value)}
                    placeholder={`Enter ${field.display_name}`}
                    className="border-gray-400 focus:border-gray-500 focus:ring-gray-500/20"
                  />
                ) : (
                  <Input
                    type={field.type === 'phone' || field.type === 'mobile' ? 'tel' : field.type}
                    value={formData[field.field] || ''}
                    onChange={(e) => handleFieldChange(field.field, e.target.value)}
                    placeholder={`Enter ${field.display_name}`}
                    className="border-gray-400 focus:border-gray-500 focus:ring-gray-500/20"
                  />
                )}
              </>
            ) : (
              <div className="text-sm text-gray-600 min-h-[38px] flex items-center">
                {formData[field.field] || '—'}
              </div>
            )}
          </div>
        ))}
        
        {categoryId === 'custom' && isEditing && (
          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-4">Add Custom Field</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="border-gray-400 focus:border-gray-500 focus:ring-gray-500/20" />
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger className="w-32 border-gray-400 focus:border-gray-500 focus:ring-gray-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddCustomField}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogDescription>
          View and edit contact information with custom fields support
        </DialogDescription>
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
                <DialogTitle className="text-2xl font-bold">{getFullName()}</DialogTitle>
                {formData.organization && (
                  <p className="text-sm text-muted-foreground">
                    {formData.job_title ? `${formData.job_title} at ${formData.organization}` : formData.organization}
                  </p>
                )}
              </div>
            </div>
            {!isLoading && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-1 overflow-auto mt-4 px-6 pb-6" style={{ maxHeight: '60vh' }}>
            {CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6 h-full pt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFieldsForCategory(category.id)}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
        
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactViewModal;