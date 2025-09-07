import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Calendar, User, Briefcase, Mail, FileText, Users, Target } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface PersonDetailsModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const PersonDetailsModal = ({ person, isOpen, onClose }: PersonDetailsModalProps) => {
  if (!person) return null;

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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{person.full_name}</p>
              </div>
              {person.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => window.open(`mailto:${person.email}`, '_self')}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {person.email}
                  </Button>
                </div>
              )}
              {person.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="text-sm">{person.company}</p>
                </div>
              )}
              {person.categories && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 mt-1">
                    {person.categories}
                  </Badge>
                </div>
              )}
              {person.status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{person.status}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Newsletter</label>
                <p className={`text-sm ${person.newsletter ? 'text-green-600' : 'text-red-600'}`}>
                  {person.newsletter ? 'Subscribed' : 'Not Subscribed'}
                </p>
              </div>
              {person.linkedin_profile && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LinkedIn Profile</label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => window.open(person.linkedin_profile, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </div>
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
              {person.poc_in_apex && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">POC in APEX</label>
                  <p className="text-sm">{person.poc_in_apex}</p>
                </div>
              )}
              {person.who_warm_intro && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Who Warm Intro</label>
                  <p className="text-sm">{person.who_warm_intro}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Should Avishag Meet?</label>
                <p className={`text-sm ${person.should_avishag_meet ? 'text-green-600' : 'text-red-600'}`}>
                  {person.should_avishag_meet ? 'Yes' : 'No'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          {person.agenda && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{person.agenda}</p>
              </CardContent>
            </Card>
          )}

          {/* Meeting Notes */}
          {person.meeting_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Meeting Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{person.meeting_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* More Info */}
          {person.more_info && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  More Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{person.more_info}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};