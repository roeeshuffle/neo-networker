import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Upload, Merge } from "lucide-react";
import { CompaniesTable } from "./CompaniesTable";
import { CompanyDuplicateManager } from "./CompanyDuplicateManager";
import { Company } from "@/pages/Companies";

interface CompaniesPanelProps {
  filteredCompanies: Company[];
  onDelete: (id: string) => void;
  onView: (company: Company) => void;
  onRefresh: () => void;
  onShowForm: () => void;
}

export const CompaniesPanel = ({
  filteredCompanies,
  onDelete,
  onView,
  onRefresh,
  onShowForm,
}: CompaniesPanelProps) => {
  const [showDuplicates, setShowDuplicates] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllCompanies = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs

      if (error) throw error;

      toast({
        title: "Success",
        description: "All companies have been deleted.",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error deleting companies",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (showDuplicates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowDuplicates(false)}
          >
            ← Back to Companies
          </Button>
        </div>
        <CompanyDuplicateManager 
          onDuplicatesRemoved={() => {
            onRefresh();
            setShowDuplicates(false);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Directory</h2>
          <p className="text-muted-foreground">Manage your business relationships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onShowForm} className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
         <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {filteredCompanies.length} entries
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowDuplicates(true)}
                className="flex items-center gap-2"
              >
                <Merge className="w-4 h-4" />
                Remove Duplicates
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete All Companies
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {filteredCompanies.length} companies. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllCompanies}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CompaniesTable 
            companies={filteredCompanies}
            onDelete={onDelete}
            onView={onView}
          />
        </CardContent>
      </Card>
    </div>
  );
};