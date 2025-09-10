import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Merge, Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Person } from "@/pages/Dashboard";

interface DuplicateGroup {
  name: string;
  people: Person[];
}

interface MergeData {
  full_name: string;
  categories?: string;
  email?: string;
  newsletter?: boolean;
  company?: string;
  status?: string;
  linkedin_profile?: string;
  poc_in_apex?: string;
  who_warm_intro?: string;
  agenda?: string;
  meeting_notes?: string;
  should_avishag_meet?: boolean;
  more_info?: string;
}

export const SettingsTab = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<DuplicateGroup | null>(null);
  const [mergeData, setMergeData] = useState<MergeData>({
    full_name: '',
    categories: '',
    email: '',
    newsletter: false,
    company: '',
    status: '',
    linkedin_profile: '',
    poc_in_apex: '',
    who_warm_intro: '',
    agenda: '',
    meeting_notes: '',
    should_avishag_meet: false,
    more_info: ''
  });
  const { toast } = useToast();

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('full_name');

      if (error) throw error;

      // Group by full_name (case insensitive)
      const grouped = data.reduce((acc: Record<string, Person[]>, person) => {
        const name = person.full_name.toLowerCase().trim();
        if (!acc[name]) acc[name] = [];
        acc[name].push(person);
        return acc;
      }, {});

      // Filter groups with more than one person
      const duplicateGroups = Object.entries(grouped)
        .filter(([_, people]) => people.length > 1)
        .map(([name, people]) => ({
          name: people[0].full_name, // Use original case from first entry
          people
        }));

      setDuplicates(duplicateGroups);
    } catch (error: any) {
      toast({
        title: "Error fetching duplicates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const startMerge = (group: DuplicateGroup) => {
    const firstPerson = group.people[0];
    setMergeData({
      full_name: firstPerson.full_name,
      categories: firstPerson.categories || '',
      email: firstPerson.email || '',
      newsletter: firstPerson.newsletter || false,
      company: firstPerson.company || '',
      status: firstPerson.status || '',
      linkedin_profile: firstPerson.linkedin_profile || '',
      poc_in_apex: firstPerson.poc_in_apex || '',
      who_warm_intro: firstPerson.who_warm_intro || '',
      agenda: firstPerson.agenda || '',
      meeting_notes: firstPerson.meeting_notes || '',
      should_avishag_meet: firstPerson.should_avishag_meet || false,
      more_info: firstPerson.more_info || ''
    });
    setMerging(group);
  };

  const handleFieldChange = (field: string, value: any, personId: string) => {
    if (field === 'full_name' || field === 'newsletter' || field === 'should_avishag_meet') {
      setMergeData(prev => ({ ...prev, [field]: value }));
    } else {
      const person = merging?.people.find(p => p.id === personId);
      if (person) {
        setMergeData(prev => ({ ...prev, [field]: person[field as keyof Person] || '' }));
      }
    }
  };

  const executeMerge = async () => {
    if (!merging) return;

    try {
      const keepPerson = merging.people[0];
      const deleteIds = merging.people.slice(1).map(p => p.id);

      // Update the first person with merged data
      const { error: updateError } = await supabase
        .from('people')
        .update(mergeData)
        .eq('id', keepPerson.id);

      if (updateError) throw updateError;

      // Delete the other duplicates
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .in('id', deleteIds);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: `Merged ${merging.people.length} records successfully`
      });

      setMerging(null);
      fetchDuplicates();
    } catch (error: any) {
      toast({
        title: "Error merging records",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteGroup = async (group: DuplicateGroup) => {
    if (!confirm(`Are you sure you want to delete all ${group.people.length} records for "${group.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .in('id', group.people.map(p => p.id));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${group.people.length} records`
      });

      fetchDuplicates();
    } catch (error: any) {
      toast({
        title: "Error deleting records",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const areAllFieldsIdentical = (group: DuplicateGroup): boolean => {
    const firstPerson = group.people[0];
    const fieldsToCheck = [
      'categories', 'email', 'newsletter', 'company', 'status', 
      'linkedin_profile', 'poc_in_apex', 'who_warm_intro', 'agenda',
      'meeting_notes', 'should_avishag_meet', 'more_info'
    ];

    return group.people.every(person => 
      fieldsToCheck.every(field => 
        person[field as keyof Person] === firstPerson[field as keyof Person]
      )
    );
  };

  const autoMergeGroup = async (group: DuplicateGroup) => {
    try {
      const keepPerson = group.people[0];
      const deleteIds = group.people.slice(1).map(p => p.id);

      // Delete the duplicate records (keep the first one)
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .in('id', deleteIds);

      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      console.error('Error auto-merging group:', error);
      return false;
    }
  };

  const mergeAllIdentical = async () => {
    const identicalGroups = duplicates.filter(areAllFieldsIdentical);
    
    if (identicalGroups.length === 0) {
      toast({
        title: "No identical duplicates",
        description: "No groups with identical fields found"
      });
      return;
    }

    if (!confirm(`Are you sure you want to auto-merge ${identicalGroups.length} groups with identical fields?`)) {
      return;
    }

    try {
      let successCount = 0;
      let totalRecordsMerged = 0;

      for (const group of identicalGroups) {
        const success = await autoMergeGroup(group);
        if (success) {
          successCount++;
          totalRecordsMerged += group.people.length - 1; // -1 because we keep one record
        }
      }

      toast({
        title: "Success",
        description: `Auto-merged ${successCount} groups, removed ${totalRecordsMerged} duplicate records`
      });

      fetchDuplicates();
    } catch (error: any) {
      toast({
        title: "Error auto-merging",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary mx-auto"></div>
        <p className="mt-6 text-muted-foreground font-medium">Loading duplicates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Settings</h3>
          <p className="text-muted-foreground">Manage duplicate records and data cleanup</p>
        </div>
        <div className="flex gap-2">
          {duplicates.length > 0 && duplicates.some(areAllFieldsIdentical) && (
            <Button onClick={mergeAllIdentical} className="bg-green-600 hover:bg-green-700">
              <Merge className="h-4 w-4 mr-2" />
              Merge All Identical
            </Button>
          )}
          <Button onClick={fetchDuplicates} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">No duplicates found</p>
            <p className="text-sm text-muted-foreground">Your contact database is clean!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Duplicate Records
              <Badge variant="destructive" className="text-xs">
                {duplicates.length} groups
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {duplicates.map((group, index) => (
              <div key={index} className="border border-border-soft rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {group.name}
                      {areAllFieldsIdentical(group) && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Identical
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {group.people.length} duplicate records found
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {areAllFieldsIdentical(group) ? (
                      <Button
                        size="sm"
                        onClick={() => autoMergeGroup(group).then(success => {
                          if (success) {
                            toast({
                              title: "Success",
                              description: `Auto-merged ${group.people.length} identical records`
                            });
                            fetchDuplicates();
                          } else {
                            toast({
                              title: "Error",
                              description: "Failed to auto-merge records",
                              variant: "destructive"
                            });
                          }
                        })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        Auto Merge
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => startMerge(group)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        Merge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteGroup(group)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {group.people.map((person) => (
                    <div key={person.id} className="text-sm bg-white p-3 rounded border">
                      <div className="font-medium">{person.full_name}</div>
                      <div className="text-muted-foreground space-y-1">
                        <div>Email: {person.email || 'Not provided'}</div>
                        <div>Company: {person.company || 'Not provided'}</div>
                        <div>Categories: {person.categories || 'None'}</div>
                        <div>Status: {person.status || 'Not set'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Merge Dialog */}
      <Dialog open={!!merging} onOpenChange={() => setMerging(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Merge Records for "{merging?.name}"</DialogTitle>
          </DialogHeader>
          
          {merging && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Select the values you want to keep for the merged record:
              </div>

              {Object.entries(mergeData).map(([field, currentValue]) => (
                <div key={field} className="space-y-2">
                  <label className="font-medium capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <div className="space-y-2">
                    {merging.people.map((person) => {
                      const personValue = person[field as keyof Person];
                      const isSelected = currentValue === personValue;
                      
                      return (
                        <div key={person.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleFieldChange(field, personValue, person.id);
                              }
                            }}
                          />
                          <span className={`text-sm ${isSelected ? 'font-medium' : 'text-muted-foreground'}`}>
                            {typeof personValue === 'boolean' 
                              ? (personValue ? 'Yes' : 'No')
                              : (personValue?.toString() || 'Empty')
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={executeMerge} className="flex-1">
                  Merge Records
                </Button>
                <Button variant="outline" onClick={() => setMerging(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};