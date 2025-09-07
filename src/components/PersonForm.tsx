import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Person } from "@/pages/Dashboard";

interface PersonFormProps {
  person?: Person | null;
  onClose: () => void;
}

export const PersonForm = ({ person, onClose }: PersonFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: person?.full_name || "",
    categories: person?.categories || "",
    email: person?.email || "",
    newsletter: person?.newsletter || false,
    company: person?.company || "",
    status: person?.status || "",
    linkedin_profile: person?.linkedin_profile || "",
    poc_in_apex: person?.poc_in_apex || "",
    who_warm_intro: person?.who_warm_intro || "",
    agenda: person?.agenda || "",
    meeting_notes: person?.meeting_notes || "",
    should_avishag_meet: person?.should_avishag_meet || false,
    more_info: person?.more_info || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (person) {
        const { error } = await supabase
          .from("people")
          .update(formData)
          .eq("id", person.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Person updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("people")
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Person added successfully",
        });
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save person",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{person ? "Edit Person" : "Add New Person"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categories</label>
                <Input
                  value={formData.categories}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Input
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn Profile</label>
                <Input
                  type="url"
                  value={formData.linkedin_profile}
                  onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">POC in APEX</label>
                <Input
                  value={formData.poc_in_apex}
                  onChange={(e) => setFormData({ ...formData, poc_in_apex: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Who Warm Intro</label>
                <Input
                  value={formData.who_warm_intro}
                  onChange={(e) => setFormData({ ...formData, who_warm_intro: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Agenda</label>
              <Textarea
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meeting Notes</label>
              <Textarea
                value={formData.meeting_notes}
                onChange={(e) => setFormData({ ...formData, meeting_notes: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">More Information</label>
              <Textarea
                value={formData.more_info}
                onChange={(e) => setFormData({ ...formData, more_info: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked as boolean })}
                />
                <label htmlFor="newsletter" className="text-sm font-medium">
                  Newsletter Subscription
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="should_avishag_meet"
                  checked={formData.should_avishag_meet}
                  onCheckedChange={(checked) => setFormData({ ...formData, should_avishag_meet: checked as boolean })}
                />
                <label htmlFor="should_avishag_meet" className="text-sm font-medium">
                  Should Avishag Meet?
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="submit">
                {person ? "Update Person" : "Add Person"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};