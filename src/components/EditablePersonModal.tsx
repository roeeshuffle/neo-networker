import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Calendar, User, Briefcase, Mail, FileText, Users, Target, Edit, Plus, Save } from "lucide-react";
import { Person } from "@/pages/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditablePersonModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const EditablePersonModal = ({ person, isOpen, onClose, onSave }: EditablePersonModalProps) => {
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();

  // Initialize form data when person changes
  useEffect(() => {
    if (person) {
      setFormData({ ...person });
    }
  }, [person]);

  if (!person) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const currentCategories = formData.categories ? formData.categories.split(',').map(c => c.trim()) : [];
      if (!currentCategories.includes(newCategory.trim())) {
        const updatedCategories = [...currentCategories, newCategory.trim()].join(', ');
        setFormData(prev => ({ ...prev, categories: updatedCategories }));
      }
      setNewCategory("");
      setAddingCategory(false);
    }
  };

  const handleSaveAll = async () => {
    if (!person) return;
    
    try {
      const { error } = await supabase
        .from('people')
        .update(formData)
        .eq('id', person.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All changes saved successfully",
      });

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData(person ? { ...person } : {});
    setAddingCategory(false);
    setNewCategory("");
  };

  const renderEditableField = (field: string, label: string, type: 'text' | 'email' | 'textarea' | 'checkbox' = 'text') => {
    const value = formData[field as keyof Person];

    if (type === 'checkbox') {
      return (
        <div>
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleInputChange(field, !!checked)}
            />
            <span className="text-sm">{value ? 'Yes' : 'No'}</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="mt-1">
          {type === 'textarea' ? (
          <Textarea
            value={String(value || '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          ) : (
            <Input
              type={type}
              value={String(value || '')}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {person.full_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderEditableField('full_name', 'Full Name')}
              {renderEditableField('email', 'Email', 'email')}
              {renderEditableField('company', 'Company')}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.categories ? (
                    formData.categories.split(',').map((category, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                        {category.trim()}
                      </Badge>
                    ))
                  ) : null}
                  {addingCategory ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category name"
                        className="w-32"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddCategory}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingCategory(true)}
                      className="text-muted-foreground"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      add category
                    </Button>
                  )}
                </div>
              </div>

              {renderEditableField('status', 'Status')}
              {renderEditableField('newsletter', 'Newsletter', 'checkbox')}
              {renderEditableField('linkedin_profile', 'LinkedIn Profile')}

              {person.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(person.created_at)}</p>
                </div>
              )}
              {person.updated_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{formatDate(person.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderEditableField('poc_in_apex', 'POC in APEX')}
              {renderEditableField('who_warm_intro', 'Who Warm Intro')}
              {renderEditableField('should_avishag_meet', 'Should Avishag Meet?', 'checkbox')}
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditableField('agenda', 'Agenda', 'textarea')}
            </CardContent>
          </Card>

          {/* Meeting Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditableField('meeting_notes', 'Meeting Notes', 'textarea')}
            </CardContent>
          </Card>

          {/* More Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                More Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditableField('more_info', 'More Information', 'textarea')}
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};