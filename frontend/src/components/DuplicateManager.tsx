import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Merge, Trash2 } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface Duplicate {
  full_name: string;
  records: Person[];
}

interface DuplicateManagerProps {
  onDuplicatesRemoved: () => void;
}

const DuplicateManager = ({ onDuplicatesRemoved }: DuplicateManagerProps) => {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);
  const { toast } = useToast();

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      
      const { data: people, error } = await apiClient.getPeople();

      if (error) throw error;

      // Group by full_name to find duplicates
      const groupedByName: { [key: string]: Person[] } = {};
      
      people?.forEach((person) => {
        const name = person.full_name.trim().toLowerCase();
        if (!groupedByName[name]) {
          groupedByName[name] = [];
        }
        groupedByName[name].push(person);
      });

      // Filter groups with more than one record
      const duplicateGroups = Object.entries(groupedByName)
        .filter(([_, records]) => records.length > 1)
        .map(([name, records]) => ({
          full_name: records[0].full_name, // Use original case
          records
        }));

      setDuplicates(duplicateGroups);
    } catch (error: any) {
      toast({
        title: "Error fetching duplicates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const areRecordsIdentical = (records: Person[]): boolean => {
    if (records.length <= 1) return true;
    
    const firstRecord = records[0];
    const fieldsToCompare = ['email', 'company', 'categories', 'status', 'linkedin_profile', 'poc_in_apex', 'who_warm_intro', 'agenda', 'meeting_notes', 'more_info'];
    
    return records.every(record => 
      fieldsToCompare.every(field => 
        (record[field as keyof Person] || '') === (firstRecord[field as keyof Person] || '')
      )
    );
  };

  const autoMergeAll = async () => {
    try {
      setMergeLoading(true);
      let mergedCount = 0;

      for (const duplicate of duplicates) {
        if (areRecordsIdentical(duplicate.records)) {
          // Keep the oldest record (first in array since we sorted by created_at ascending)
          const recordsToDelete = duplicate.records.slice(1);
          
          if (recordsToDelete.length > 0) {
            // Delete records one by one
            for (const record of recordsToDelete) {
              const { error } = await apiClient.deletePerson(record.id);
              if (error) throw error;
            }
            mergedCount += recordsToDelete.length;
          }
        }
      }

      toast({
        title: "Auto-merge completed",
        description: `Successfully merged ${mergedCount} duplicate records.`,
      });

      fetchDuplicates();
      onDuplicatesRemoved();
    } catch (error: any) {
      toast({
        title: "Error during auto-merge",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const mergeDuplicate = async (duplicate: Duplicate, recordToKeep: Person) => {
    try {
      setMergeLoading(true);
      const recordsToDelete = duplicate.records.filter(r => r.id !== recordToKeep.id);
      
      if (recordsToDelete.length > 0) {
        // Delete records one by one
        for (const record of recordsToDelete) {
          const { error } = await apiClient.deletePerson(record.id);
          if (error) throw error;
        }

        toast({
          title: "Success",
          description: `Kept record for ${recordToKeep.full_name} and deleted ${recordsToDelete.length} duplicates.`,
        });

        setSelectedDuplicate(null);
        fetchDuplicates();
        onDuplicatesRemoved();
      }
    } catch (error: any) {
      toast({
        title: "Error merging records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const deleteAllDuplicates = async (duplicate: Duplicate) => {
    try {
      setMergeLoading(true);
      // Delete all records in the duplicate group
      for (const record of duplicate.records) {
        const { error } = await apiClient.deletePerson(record.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Deleted all ${duplicate.records.length} records for ${duplicate.full_name}.`,
      });

      setSelectedDuplicate(null);
      fetchDuplicates();
      onDuplicatesRemoved();
    } catch (error: any) {
      toast({
        title: "Error deleting records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMergeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Scanning for duplicates...</p>
      </div>
    );
  }

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No duplicate records found.</p>
        </CardContent>
      </Card>
    );
  }

  const autoMergeableDuplicates = duplicates.filter(d => areRecordsIdentical(d.records));
  const manualReviewDuplicates = duplicates.filter(d => !areRecordsIdentical(d.records));

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
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Duplicates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Auto-Mergeable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{autoMergeableDuplicates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Manual Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{manualReviewDuplicates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-merge section */}
      {autoMergeableDuplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Auto-Mergeable Duplicates
              <Button
                onClick={autoMergeAll}
                disabled={mergeLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Merge className="w-4 h-4 mr-2" />
                Auto-Merge All ({autoMergeableDuplicates.length})
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {autoMergeableDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{duplicate.full_name}</p>
                    <p className="text-sm text-muted-foreground">{duplicate.records.length} identical records</p>
                  </div>
                  <Badge variant="secondary">Identical</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual review section */}
      {manualReviewDuplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Review Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {manualReviewDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{duplicate.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {duplicate.records.length} records with different information
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Different Info</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDuplicate(duplicate)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review dialog */}
      <Dialog open={!!selectedDuplicate} onOpenChange={(open) => !open && !mergeLoading && setSelectedDuplicate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Duplicates: {selectedDuplicate?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDuplicate?.records.map((record, index) => (
              <Card key={record.id} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    Record {index + 1}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => mergeDuplicate(selectedDuplicate, record)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={mergeLoading}
                      >
                        Keep This
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Email:</strong> {record.email || 'N/A'}</div>
                    <div><strong>Company:</strong> {record.company || 'N/A'}</div>
                    <div><strong>Categories:</strong> {record.categories || 'N/A'}</div>
                    <div><strong>Status:</strong> {record.status || 'N/A'}</div>
                    <div><strong>LinkedIn:</strong> {record.linkedin_profile || 'N/A'}</div>
                    <div><strong>POC:</strong> {record.poc_in_apex || 'N/A'}</div>
                  </div>
                  {record.meeting_notes && (
                    <div className="mt-4">
                      <strong>Meeting Notes:</strong>
                      <p className="text-sm text-muted-foreground mt-1">{record.meeting_notes}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(record.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Records
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Records?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {selectedDuplicate?.records.length} records for "{selectedDuplicate?.full_name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedDuplicate && deleteAllDuplicates(selectedDuplicate)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuplicateManager;
