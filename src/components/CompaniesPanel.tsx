import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Upload } from "lucide-react";
import { CompaniesTable } from "./CompaniesTable";
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
  const { toast } = useToast();

  const handleDeleteAllCompanies = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) throw error;

      toast({
        title: "Success",
        description: "All companies deleted successfully",
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

  return (
    <Card className="border-border-soft bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Company Directory
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredCompanies.length} companies)
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={onShowForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all companies
                    and remove their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllCompanies}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete All Companies
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CompaniesTable 
          companies={filteredCompanies}
          onDelete={onDelete}
          onView={onView}
        />
      </CardContent>
    </Card>
  );
};