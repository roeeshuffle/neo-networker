import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/pages/Companies";

interface EditableCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EditableCompanyModal = ({ company, isOpen, onClose, onSave }: EditableCompanyModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Company>>({});

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleInputChange = (field: keyof Company, value: string | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async () => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData(company);
    }
    onClose();
  };

  const renderEditableField = (
    label: string, 
    field: keyof Company, 
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'array' = 'text',
    options?: string[]
  ) => {
    const value = formData[field];
    
    switch (type) {
      case 'textarea':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Textarea
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Input
              type="number"
              value={(value as number) || 0}
              onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
            />
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Input
              type="date"
              value={value ? new Date(value as string).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange(field, e.target.value ? new Date(e.target.value).toISOString() : '')}
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Select 
              value={(value as string) || ''} 
              onValueChange={(newValue) => handleInputChange(field, newValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Input
              value={Array.isArray(value) ? value.join(', ') : ''}
              onChange={(e) => handleInputChange(field, e.target.value.split(',').map(item => item.trim()).filter(item => item))}
              placeholder="Separate items with commas"
            />
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Input
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
          </div>
        );
    }
  };

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Company Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableField("Company Name", "record")}
              {renderEditableField("Categories", "categories")}
              {renderEditableField("Tags", "tags", "array")}
              {renderEditableField("Description", "description", "textarea")}
            </CardContent>
          </Card>

          {/* Contact & Social */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableField("LinkedIn Profile", "linkedin_profile")}
              {renderEditableField("Twitter", "twitter")}
              {renderEditableField("Twitter Followers", "twitter_follower_count", "number")}
              {renderEditableField("Domains", "domains", "array")}
            </CardContent>
          </Card>

          {/* Relationship */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableField("Connection Strength", "connection_strength", "select", ["weak", "medium", "strong"])}
              {renderEditableField("Last Interaction", "last_interaction", "date")}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableField("Notion ID", "notion_id")}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {formatDate(company.created_at)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {formatDate(company.updated_at)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Company ID</label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                  {company.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll}>
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};