import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface PersonFormProps {
  person?: Person | null;
  onClose: () => void;
}

export const PersonForm = ({ person, onClose }: PersonFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    career_history: "",
    professional_specialties: "",
    hashtags: "",
    notes: "",
    gender: "",
    age: "",
    linkedin_profile: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (person) {
      setFormData({
        full_name: person.full_name,
        company: person.company || "",
        career_history: person.career_history || "",
        professional_specialties: person.professional_specialties?.join(", ") || "",
        hashtags: person.hashtags?.join(", ") || "",
        notes: person.notes || "",
        gender: person.gender || "",
        age: person.age?.toString() || "",
        linkedin_profile: person.linkedin_profile || "",
      });
    }
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const processedData = {
        full_name: formData.full_name.trim(),
        company: formData.company.trim() || null,
        career_history: formData.career_history.trim() || null,
        professional_specialties: formData.professional_specialties
          ? formData.professional_specialties.split(",").map(s => s.trim()).filter(s => s)
          : null,
        hashtags: formData.hashtags
          ? formData.hashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(h => h)
          : null,
        notes: formData.notes.trim() || null,
        gender: formData.gender.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
        linkedin_profile: formData.linkedin_profile.trim() || null,
      };

      if (person) {
        // Update existing person
        const { error } = await supabase
          .from('people')
          .update(processedData)
          .eq('id', person.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Person updated successfully",
        });
      } else {
        // Create new person
        const { error } = await supabase
          .from('people')
          .insert([{
            ...processedData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Person added successfully",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {person ? "Edit Person" : "Add New Person"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
              <Input
                id="linkedin_profile"
                type="url"
                value={formData.linkedin_profile}
                onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="career_history">Career History</Label>
              <Textarea
                id="career_history"
                value={formData.career_history}
                onChange={(e) => setFormData({ ...formData, career_history: e.target.value })}
                placeholder="Previous roles, achievements, and career progression..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professional_specialties">Professional Specialties</Label>
              <Input
                id="professional_specialties"
                type="text"
                value={formData.professional_specialties}
                onChange={(e) => setFormData({ ...formData, professional_specialties: e.target.value })}
                placeholder="Software Engineering, Data Science, Product Management (comma-separated)"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple specialties with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="tech, startup, ai, fintech (comma-separated, # optional)"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple hashtags with commas. The # symbol is optional.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes, contacts, or relevant information..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : (person ? "Update Person" : "Add Person")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};