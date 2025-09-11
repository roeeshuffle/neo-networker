import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Merge, Trash2, Eye, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Person {
  id: string;
  full_name: string;
  email?: string;
  company?: string;
  linkedin_profile?: string;
  categories?: string;
  status?: string;
  created_at: string;
}

interface Duplicate {
  full_name: string;
  people: Person[];
}

interface SettingsTabProps {
  onDeleteAllTelegramUsers?: () => Promise<void>;
  onDeleteAllPeople?: () => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  onDeleteAllTelegramUsers, 
  onDeleteAllPeople 
}) => {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('full_name');

      if (error) throw error;

      // Group by full_name and find duplicates
      const grouped: { [key: string]: Person[] } = {};
      data?.forEach((person) => {
        const key = person.full_name.toLowerCase().trim();
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(person);
      });

      // Filter only groups with more than one person
      const duplicateGroups = Object.entries(grouped)
        .filter(([_, people]) => people.length > 1)
        .map(([name, people]) => ({
          full_name: people[0].full_name, // Use original case
          people: people.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }));

      setDuplicates(duplicateGroups);
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch duplicate records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoMergeAll = async () => {
    setMergeLoading(true);
    let mergedCount = 0;
    let errorCount = 0;

    try {
      for (const duplicate of duplicates) {
        // Check if all people in this group have identical field values
        const people = duplicate.people;
        const firstPerson = people[0];
        
        const allIdentical = people.every(person => 
          person.email === firstPerson.email &&
          person.company === firstPerson.company &&
          person.linkedin_profile === firstPerson.linkedin_profile &&
          person.categories === firstPerson.categories &&
          person.status === firstPerson.status
        );

        if (allIdentical && people.length > 1) {
          try {
            // Keep the oldest record, delete the rest
            const toDelete = people.slice(1).map(p => p.id);
            
            const { error } = await supabase
              .from('people')
              .delete()
              .in('id', toDelete);

            if (error) throw error;
            
            mergedCount++;
          } catch (error) {
            console.error(`Error merging ${duplicate.full_name}:`, error);
            errorCount++;
          }
        }
      }

      toast({
        title: "Auto-merge Complete",
        description: `Merged ${mergedCount} duplicate groups${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      });

      // Refresh the duplicates list
      fetchDuplicates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete auto-merge",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const mergeDuplicate = async (duplicate: Duplicate, keepIndex: number) => {
    try {
      setMergeLoading(true);
      const toKeep = duplicate.people[keepIndex];
      const toDelete = duplicate.people.filter((_, i) => i !== keepIndex);

      const { error } = await supabase
        .from('people')
        .delete()
        .in('id', toDelete.map(p => p.id));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Merged ${duplicate.full_name} records, kept record from ${new Date(toKeep.created_at).toLocaleDateString()}`,
      });

      setSelectedDuplicate(null);
      fetchDuplicates();
    } catch (error) {
      console.error('Error merging duplicate:', error);
      toast({
        title: "Error",
        description: "Failed to merge duplicate records",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const deleteAllDuplicates = async (duplicate: Duplicate) => {
    try {
      setMergeLoading(true);
      const { error } = await supabase
        .from('people')
        .delete()
        .in('id', duplicate.people.map(p => p.id));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted all records for ${duplicate.full_name}`,
      });

      setSelectedDuplicate(null);
      fetchDuplicates();
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to delete duplicate records",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const areRecordsIdentical = (people: Person[]): boolean => {
    if (people.length <= 1) return true;
    
    const first = people[0];
    return people.every(person => 
      person.email === first.email &&
      person.company === first.company &&
      person.linkedin_profile === first.linkedin_profile &&
      person.categories === first.categories &&
      person.status === first.status
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-lg">Loading duplicate records...</div>
        </CardContent>
      </Card>
    );
  }

  const identicalDuplicates = duplicates.filter(d => areRecordsIdentical(d.people));
  const nonIdenticalDuplicates = duplicates.filter(d => !areRecordsIdentical(d.people));

  return (
    <div className="space-y-6 relative">
      {/* Processing Overlay */}
      {mergeLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Processing duplicates...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicates Management</h2>
          <p className="text-muted-foreground">Manage duplicate people records</p>
        </div>
        
        <div className="flex gap-2">
          {identicalDuplicates.length > 0 && (
            <Button 
              onClick={autoMergeAll}
              disabled={mergeLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Merge className="w-4 h-4 mr-2" />
              Auto-Merge Identical ({identicalDuplicates.length})
            </Button>
          )}
          <Button 
            onClick={autoMergeAll}
            disabled={mergeLoading || duplicates.length === 0}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Merge className="w-4 h-4 mr-2" />
            Merge All Equals Records
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duplicates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{duplicates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Mergeable</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{identicalDuplicates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{nonIdenticalDuplicates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Identical Duplicates */}
        {identicalDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Auto-Mergeable Duplicates ({identicalDuplicates.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These records have identical field values and can be automatically merged
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {identicalDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium">{duplicate.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {duplicate.people.length} identical records
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Auto-mergeable
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Non-identical Duplicates */}
        {nonIdenticalDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Manual Review Required ({nonIdenticalDuplicates.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These records have different field values and require manual review
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {nonIdenticalDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{duplicate.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {duplicate.people.length} records with different data
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDuplicate(duplicate)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Duplicates: {duplicate.full_name}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedDuplicate && (
                          <div className="space-y-4">
                            {selectedDuplicate.people.map((person, personIndex) => (
                              <Card key={person.id}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                      Record {personIndex + 1}
                                      <Badge variant="outline" className="ml-2">
                                        Added {new Date(person.created_at).toLocaleDateString()}
                                      </Badge>
                                    </CardTitle>
                                    <div className="flex gap-2">
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => mergeDuplicate(selectedDuplicate, personIndex)}
                                         disabled={mergeLoading}
                                       >
                                        <Merge className="w-4 h-4 mr-1" />
                                        Keep This
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Email:</span> {person.email || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Company:</span> {person.company || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Categories:</span> {person.categories || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Status:</span> {person.status || 'Not provided'}
                                    </div>
                                    <div className="col-span-2">
                                      <span className="font-medium">LinkedIn:</span> {person.linkedin_profile || 'Not provided'}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            
                            <Separator />
                            
                            <div className="flex justify-center">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete All Records
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete All Records</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete all {selectedDuplicate.people.length} records for {selectedDuplicate.full_name}. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteAllDuplicates(selectedDuplicate)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete All
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {duplicates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Duplicates Found</h3>
              <p className="text-muted-foreground text-center">
                Great! Your database doesn't have any duplicate people records.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Admin Actions */}
        {(onDeleteAllTelegramUsers || onDeleteAllPeople) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These actions are irreversible. Please proceed with caution.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {onDeleteAllTelegramUsers && (
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <div className="font-medium">Delete All Telegram Users</div>
                    <div className="text-sm text-muted-foreground">
                      Permanently remove all telegram user data from the system
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Telegram Users
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Telegram Users</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL telegram users from the system. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onDeleteAllTelegramUsers}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {onDeleteAllPeople && (
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <div className="font-medium">Delete All People Data</div>
                    <div className="text-sm text-muted-foreground">
                      Permanently remove all contact data from the system
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All People Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL people data from the system. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onDeleteAllPeople}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
