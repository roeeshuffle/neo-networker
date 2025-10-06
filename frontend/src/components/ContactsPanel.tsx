import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeopleTable } from "@/components/PeopleTable";
import SimpleCsvUploader from "@/components/SimpleCsvUploader";
import { SearchBar } from "@/components/SearchBar";
import { Plus, Upload } from "lucide-react";
import { Person } from "@/pages/Dashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactsPanelProps {
  filteredPeople: Person[];
  onDelete: (id: string) => void;
  onView: (person: Person) => void;
  onRefresh: () => void;
  onShowForm: () => void;
  onSearch: (query: string, field?: string) => void;
}

export const ContactsPanel = ({ filteredPeople, onDelete, onView, onRefresh, onShowForm, onSearch }: ContactsPanelProps) => {
  const [showCsvUploader, setShowCsvUploader] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; personId: string | null; personName: string }>({
    isOpen: false,
    personId: null,
    personName: ""
  });

  const handleDeleteClick = (personId: string, personName: string) => {
    setDeleteConfirm({
      isOpen: true,
      personId,
      personName
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.personId) {
      onDelete(deleteConfirm.personId);
      setDeleteConfirm({
        isOpen: false,
        personId: null,
        personName: ""
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      personId: null,
      personName: ""
    });
  };

  return (
    <div className="space-y-6 px-[5%]">
      {/* Professional Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[48rem]">
            <SearchBar 
              onSearch={onSearch} 
              placeholder="Search contacts..."
              activeTab="contacts"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowCsvUploader(true)} 
            variant="outline"
            size="sm"
            className="w-9 h-9 p-0"
            title="Import contacts"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onShowForm} 
            size="sm"
            className="w-9 h-9 p-0"
            title="Add new contact"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="enterprise-card">
        <div className="p-0">
          <PeopleTable 
            people={filteredPeople}
            onDelete={handleDeleteClick}
            onView={onView}
          />
        </div>
      </div>
        
        {/* CSV Uploader Dialog */}
        <SimpleCsvUploader 
          isOpen={showCsvUploader}
          onClose={() => setShowCsvUploader(false)}
          onImportComplete={() => {
            setShowCsvUploader(false);
            onRefresh();
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.isOpen} onOpenChange={handleDeleteCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm.personName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };