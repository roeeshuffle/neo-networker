import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from "@/pages/Companies";

interface CompanyFormProps {
  company?: Company | null;
  onClose: () => void;
}

export const CompanyForm = ({ company, onClose }: CompanyFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    record: company?.record || "",
    tags: company?.tags?.join(', ') || "",
    categories: company?.categories || "",
    linkedin_profile: company?.linkedin_profile || "",
    last_interaction: company?.last_interaction || "",
    connection_strength: company?.connection_strength || "",
    twitter_follower_count: company?.twitter_follower_count || 0,
    twitter: company?.twitter || "",
    domains: company?.domains?.join(', ') || "",
    description: company?.description || "",
    notion_id: company?.notion_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        domains: formData.domains ? formData.domains.split(',').map(domain => domain.trim()).filter(domain => domain) : [],
        twitter_follower_count: Number(formData.twitter_follower_count) || 0,
        last_interaction: formData.last_interaction || null,
      };

      if (company) {
        const { error } = await supabase
          .from("companies")
          .update(submitData)
          .eq("id", company.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("companies")
          .insert([{...submitData, owner_id: (await supabase.auth.getUser()).data.user?.id}]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Company added successfully",
        });
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save company",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{company ? "Edit Company" : "Add New Company"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <Input
                  value={formData.record}
                  onChange={(e) => setFormData({ ...formData, record: e.target.value })}
                  required
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
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tech, startup, ai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Connection Strength</label>
                <Select value={formData.connection_strength} onValueChange={(value) => setFormData({ ...formData, connection_strength: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection strength" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn Profile</label>
                <Input
                  type="url"
                  value={formData.linkedin_profile}
                  onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Twitter</label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="@company or https://twitter.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Twitter Follower Count</label>
                <Input
                  type="number"
                  value={formData.twitter_follower_count}
                  onChange={(e) => setFormData({ ...formData, twitter_follower_count: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Interaction</label>
                <Input
                  type="date"
                  value={formData.last_interaction ? formData.last_interaction.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, last_interaction: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Domains (comma-separated)</label>
                <Input
                  value={formData.domains}
                  onChange={(e) => setFormData({ ...formData, domains: e.target.value })}
                  placeholder="example.com, subdomain.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notion ID</label>
                <Input
                  value={formData.notion_id}
                  onChange={(e) => setFormData({ ...formData, notion_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Company description, notes, or additional information..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {company ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};