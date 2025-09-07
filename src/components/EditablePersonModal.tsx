import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();

  if (!person) return null;

  const handleEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const handleSave = async (field: string) => {
    try {
      const updateData: any = {};
      
      if (field === 'categories' && addingCategory) {
        const currentCategories = person.categories ? person.categories.split(',').map(c => c.trim()) : [];
        if (newCategory.trim() && !currentCategories.includes(newCategory.trim())) {
          updateData.categories = [...currentCategories, newCategory.trim()].join(', ');
        }
        setNewCategory("");
        setAddingCategory(false);
      } else {
        updateData[field] = editValue;
      }

      const { error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', person.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field updated successfully",
      });

      setEditingField(null);
      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating field",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setAddingCategory(false);
    setNewCategory("");
  };

  const renderEditableField = (field: string, label: string, value: any, type: 'text' | 'email' | 'textarea' | 'checkbox' = 'text') => {
    const isEditing = editingField === field;

    if (type === 'checkbox') {
      return (
        <div>
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
              {value ? 'Yes' : 'No'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(field, !value)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div>
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
          <div className="flex items-center gap-2 mt-1">
            {type === 'textarea' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
                rows={3}
              />
            ) : (
              <Input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(field)}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {value ? (
            type === 'email' ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600"
                onClick={() => window.open(`mailto:${value}`, '_self')}
              >
                <Mail className="h-3 w-3 mr-1" />
                {value}
              </Button>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{value}</p>
            )
          ) : (
            <span className="text-sm text-muted-foreground">
              {type === 'email' ? 'add email' : `add ${label.toLowerCase()}`}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(field, value)}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
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
              {renderEditableField('full_name', 'Full Name', person.full_name)}
              {renderEditableField('email', 'Email', person.email, 'email')}
              {renderEditableField('company', 'Company', person.company)}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {person.categories ? (
                    person.categories.split(',').map((category, index) => (
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
                        onClick={() => handleSave('categories')}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
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

              {renderEditableField('status', 'Status', person.status)}
              {renderEditableField('newsletter', 'Newsletter', person.newsletter, 'checkbox')}
              
              {person.linkedin_profile ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LinkedIn Profile</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => window.open(person.linkedin_profile, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit('linkedin_profile', person.linkedin_profile)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                renderEditableField('linkedin_profile', 'LinkedIn Profile', person.linkedin_profile)
              )}

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
              {renderEditableField('poc_in_apex', 'POC in APEX', person.poc_in_apex)}
              {renderEditableField('who_warm_intro', 'Who Warm Intro', person.who_warm_intro)}
              {renderEditableField('should_avishag_meet', 'Should Avishag Meet?', person.should_avishag_meet, 'checkbox')}
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
              {renderEditableField('agenda', 'Agenda', person.agenda, 'textarea')}
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
              {renderEditableField('meeting_notes', 'Meeting Notes', person.meeting_notes, 'textarea')}
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
              {renderEditableField('more_info', 'More Information', person.more_info, 'textarea')}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};