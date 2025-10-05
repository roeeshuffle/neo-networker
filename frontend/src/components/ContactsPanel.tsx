import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeopleTable } from "@/components/PeopleTable";
import { SimpleColumnViewer } from "@/components/SimpleColumnViewer";
import { SearchBar } from "@/components/SearchBar";
import { Plus } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface ContactsPanelProps {
  filteredPeople: Person[];
  onDelete: (id: string) => void;
  onView: (person: Person) => void;
  onRefresh: () => void;
  onShowForm: () => void;
  onSearch: (query: string, field?: string) => void;
}

export const ContactsPanel = ({ filteredPeople, onDelete, onView, onRefresh, onShowForm, onSearch }: ContactsPanelProps) => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact Directory</h2>
          <p className="text-muted-foreground">Manage your professional network</p>
        </div>
        <div className="flex gap-2">
          <SimpleColumnViewer onDataLoaded={onRefresh} />
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
            
            {/* Search Bar */}
            <div className="flex justify-center">
              <SearchBar 
                onSearch={onSearch} 
                placeholder="Search contacts..."
                activeTab="contacts"
              />
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