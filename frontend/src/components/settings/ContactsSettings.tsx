import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Merge, Download, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DuplicateManager from '@/components/DuplicateManager';
import CustomFieldsSettings from '@/components/CustomFieldsSettings';
import TableColumnsSettings from '@/components/TableColumnsSettings';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContactsSettingsProps {
  onDeleteAllPeople?: () => Promise<void>;
}

export const ContactsSettings: React.FC<ContactsSettingsProps> = ({ onDeleteAllPeople }) => {
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showCustomFieldsDialog, setShowCustomFieldsDialog] = useState(false);
  const [showTableColumnsDialog, setShowTableColumnsDialog] = useState(false);
  const [refreshTableColumns, setRefreshTableColumns] = useState(0);

  const handleCustomFieldsUpdated = () => {
    // Trigger refresh of table columns when custom fields are updated
    setRefreshTableColumns(prev => prev + 1);
  };

  const handleDuplicatesRemoved = () => {
    setShowDuplicates(false);
    toast({
      title: "Success",
      description: "Duplicates have been removed successfully!",
    });
  };

  const handleExportContacts = async () => {
    try {
      // This would typically call an API endpoint to export contacts
      toast({
        title: "Export Started",
        description: "Your contacts export has been initiated. You'll receive an email when ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export contacts",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllContacts = async () => {
    if (onDeleteAllPeople) {
      try {
        await onDeleteAllPeople();
        toast({
          title: "Success",
          description: "All contacts have been deleted successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete all contacts",
          variant: "destructive"
        });
      }
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Contact Management</h3>
      </div>

      {/* Contact Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contact Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setShowDuplicates(true)}
              className="h-auto p-4 flex flex-col items-start gap-2 btn-outline-darker"
            >
              <div className="flex items-center gap-2">
                <Merge className="w-4 h-4" />
                <span className="font-medium">Find Duplicates</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Identify and merge duplicate contacts
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={handleExportContacts}
              className="h-auto p-4 flex flex-col items-start gap-2 btn-outline-darker"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="font-medium">Export Contacts</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Download all contacts as CSV
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage custom fields for your contacts to store additional information.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowCustomFieldsDialog(true)}
              className="btn-outline-darker"
            >
              Manage Custom Fields
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Columns */}
      <Card>
        <CardHeader>
          <CardTitle>Table Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customize which columns are visible in your contacts table.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowTableColumnsDialog(true)}
              className="btn-outline-darker"
            >
              Manage Table Columns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These actions cannot be undone. Please be careful.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete All Contacts
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your contacts
                    and remove them from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllContacts}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All Contacts
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Find Duplicates</DialogTitle>
          </DialogHeader>
          <DuplicateManager 
            onDuplicatesRemoved={handleDuplicatesRemoved} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomFieldsDialog} onOpenChange={setShowCustomFieldsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Custom Fields</DialogTitle>
          </DialogHeader>
          <CustomFieldsSettings 
            isOpen={showCustomFieldsDialog}
            onClose={() => setShowCustomFieldsDialog(false)}
            onUpdate={handleCustomFieldsUpdated}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTableColumnsDialog} onOpenChange={setShowTableColumnsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Table Columns</DialogTitle>
          </DialogHeader>
          <TableColumnsSettings 
            isOpen={showTableColumnsDialog}
            onClose={() => setShowTableColumnsDialog(false)}
            refreshTrigger={refreshTableColumns}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
