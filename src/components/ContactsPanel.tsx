import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PeopleTable } from "@/components/PeopleTable";
import DuplicateManager from "@/components/DuplicateManager";
import { CsvUploader } from "@/components/CsvUploader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Merge, Trash2, Plus } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface ContactsPanelProps {
  filteredPeople: Person[];
  onDelete: (id: string) => void;
  onView: (person: Person) => void;
  onRefresh: () => void;
  onShowForm: () => void;
}

export const ContactsPanel = ({ filteredPeople, onDelete, onView, onRefresh, onShowForm }: ContactsPanelProps) => {
  const [showDuplicates, setShowDuplicates] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllContacts = async () => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs

      if (error) throw error;

      toast({
        title: "Success",
        description: "All contacts have been deleted.",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error deleting contacts",
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
            ← Back to Contacts
          </Button>
        </div>
        <DuplicateManager 
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
          <h2 className="text-2xl font-bold">Contact Directory</h2>
          <p className="text-muted-foreground">Manage your professional network</p>
        </div>
        <div className="flex gap-2">
          <CsvUploader onDataLoaded={onRefresh} />
          <Button onClick={onShowForm} className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
         <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {filteredPeople.length} entries
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
                    Delete All Contacts
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {filteredPeople.length} contacts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllContacts}
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
          <PeopleTable 
            people={filteredPeople}
            onDelete={onDelete}
            onView={onView}
          />
        </CardContent>
      </Card>
    </div>
  );
};