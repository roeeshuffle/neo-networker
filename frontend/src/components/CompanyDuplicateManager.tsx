import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Merge, Trash2 } from "lucide-react";
import { Company } from "@/pages/Companies";

interface CompanyDuplicate {
  record: string;
  companies: Company[];
}

interface CompanyDuplicateManagerProps {
  onDuplicatesRemoved: () => void;
}

export const CompanyDuplicateManager = ({ onDuplicatesRemoved }: CompanyDuplicateManagerProps) => {
  const [duplicates, setDuplicates] = useState<CompanyDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<CompanyDuplicate | null>(null);
  const { toast } = useToast();

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      
      const { data: companies, error } = await apiClient.getCompanies();

      if (error) throw error;

      // Group by record name to find duplicates
      const groupedByRecord: { [key: string]: Company[] } = {};
      
      companies?.forEach((company) => {
        const record = company.record.trim().toLowerCase();
        if (!groupedByRecord[record]) {
          groupedByRecord[record] = [];
        }
        groupedByRecord[record].push(company);
      });

      // Filter groups with more than one record
      const duplicateGroups = Object.entries(groupedByRecord)
        .filter(([_, companies]) => companies.length > 1)
        .map(([record, companies]) => ({
          record: companies[0].record, // Use original case
          companies
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

  const areRecordsIdentical = (companies: Company[]): boolean => {
    if (companies.length <= 1) return true;
    
    const firstCompany = companies[0];
    const fieldsToCompare = ['categories', 'linkedin_profile', 'connection_strength', 'twitter', 'description', 'notion_id'];
    
    return companies.every(company => 
      fieldsToCompare.every(field => 
        (company[field as keyof Company] || '') === (firstCompany[field as keyof Company] || '')
      ) &&
      // Compare arrays (tags, domains)
      JSON.stringify(company.tags || []) === JSON.stringify(firstCompany.tags || []) &&
      JSON.stringify(company.domains || []) === JSON.stringify(firstCompany.domains || [])
    );
  };

  const autoMergeAll = async () => {
    try {
      setMergeLoading(true);
      let mergedCount = 0;

      for (const duplicate of duplicates) {
        if (areRecordsIdentical(duplicate.companies)) {
          // Keep the oldest record (first in array since we sorted by created_at ascending)
          const companiesToDelete = duplicate.companies.slice(1);
          
          if (companiesToDelete.length > 0) {
            // Delete companies one by one
            for (const company of companiesToDelete) {
              const { error } = await apiClient.deleteCompany(company.id);
              if (error) throw error;
            }
            mergedCount += companiesToDelete.length;
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

  const mergeDuplicate = async (duplicate: CompanyDuplicate, companyToKeep: Company) => {
    try {
      setMergeLoading(true);
      const companiesToDelete = duplicate.companies.filter(c => c.id !== companyToKeep.id);
      
      if (companiesToDelete.length > 0) {
        // Delete companies one by one
        for (const company of companiesToDelete) {
          const { error } = await apiClient.deleteCompany(company.id);
          if (error) throw error;
        }

        toast({
          title: "Success",
          description: `Kept record for ${companyToKeep.record} and deleted ${companiesToDelete.length} duplicates.`,
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

  const deleteAllDuplicates = async (duplicate: CompanyDuplicate) => {
    try {
      setMergeLoading(true);
      // Delete all companies in the duplicate group
      for (const company of duplicate.companies) {
        const { error } = await apiClient.deleteCompany(company.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Deleted all ${duplicate.companies.length} records for ${duplicate.record}.`,
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

  const autoMergeableDuplicates = duplicates.filter(d => areRecordsIdentical(d.companies));
  const manualReviewDuplicates = duplicates.filter(d => !areRecordsIdentical(d.companies));

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
                    <p className="font-medium">{duplicate.record}</p>
                    <p className="text-sm text-muted-foreground">{duplicate.companies.length} identical records</p>
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
                    <p className="font-medium">{duplicate.record}</p>
                    <p className="text-sm text-muted-foreground">
                      {duplicate.companies.length} records with different information
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
            <DialogTitle>Review Duplicates: {selectedDuplicate?.record}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDuplicate?.companies.map((company, index) => (
              <Card key={company.id} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    Record {index + 1}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => mergeDuplicate(selectedDuplicate, company)}
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
                    <div><strong>Categories:</strong> {company.categories || 'N/A'}</div>
                    <div><strong>LinkedIn:</strong> {company.linkedin_profile || 'N/A'}</div>
                    <div><strong>Connection Strength:</strong> {company.connection_strength || 'N/A'}</div>
                    <div><strong>Twitter:</strong> {company.twitter || 'N/A'}</div>
                    <div><strong>Twitter Followers:</strong> {company.twitter_follower_count || 'N/A'}</div>
                    <div><strong>Notion ID:</strong> {company.notion_id || 'N/A'}</div>
                    <div className="col-span-2"><strong>Tags:</strong> {Array.isArray(company.tags) ? company.tags.join(', ') : 'N/A'}</div>
                    <div className="col-span-2"><strong>Domains:</strong> {Array.isArray(company.domains) ? company.domains.join(', ') : 'N/A'}</div>
                  </div>
                  {company.description && (
                    <div className="mt-4">
                      <strong>Description:</strong>
                      <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(company.created_at).toLocaleDateString()}
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
                      This will permanently delete all {selectedDuplicate?.companies.length} records for "{selectedDuplicate?.record}". This action cannot be undone.
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
