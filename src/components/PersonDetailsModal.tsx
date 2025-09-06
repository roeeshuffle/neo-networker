import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Person } from "@/pages/Dashboard";
import { ExternalLink, User, Building, Calendar, Globe } from "lucide-react";

interface PersonDetailsModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonDetailsModal = ({ person, isOpen, onClose }: PersonDetailsModalProps) => {
  if (!person) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{person.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.company && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{person.company}</span>
                    </div>
                  </div>
                )}
                
                {person.gender && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="mt-1">{person.gender}</p>
                  </div>
                )}
                
                {person.age && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Age</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{person.age} years old</span>
                    </div>
                  </div>
                )}
                
                {person.linkedin_profile && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">LinkedIn</label>
                    <div className="mt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(person.linkedin_profile!, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Career History */}
          {person.career_history && (
            <Card>
              <CardHeader>
                <CardTitle>Career History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{person.career_history}</p>
              </CardContent>
            </Card>
          )}

          {/* Professional Specialties */}
          {person.professional_specialties && person.professional_specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {person.professional_specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hashtags */}
          {person.hashtags && person.hashtags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hashtags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {person.hashtags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {person.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{person.notes}</p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDate(person.created_at)}</p>
            <p>Updated: {formatDate(person.updated_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};