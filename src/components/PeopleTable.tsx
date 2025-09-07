import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface PeopleTableProps {
  people: Person[];
  onDelete: (id: string) => void;
  onView: (person: Person) => void;
}

export const PeopleTable = ({ people, onDelete, onView }: PeopleTableProps) => {
  if (people.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No people found. Add some entries to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-medium">Name</th>
            <th className="text-left p-4 font-medium">Email</th>
            <th className="text-left p-4 font-medium">Company</th>
            <th className="text-left p-4 font-medium">Categories</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium">Newsletter</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <div className="font-medium">{person.full_name}</div>
                {person.linkedin_profile && (
                  <a 
                    href={person.linkedin_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </td>
              <td className="p-4">
                {person.email ? (
                  <a 
                    href={`mailto:${person.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {person.email}
                  </a>
                ) : (
                  <span className="text-sm"></span>
                )}
              </td>
              <td className="p-4">
                <span className="text-sm">{person.company || ""}</span>
              </td>
              <td className="p-4">
                {person.categories ? (
                  person.categories.split(',').map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800 mr-1">
                      {category.trim()}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm"></span>
                )}
              </td>
              <td className="p-4">
                <span className="text-sm">{person.status || ""}</span>
              </td>
              <td className="p-4">
                <span className={`text-sm ${person.newsletter ? 'text-green-600' : 'text-red-600'}`}>
                  {person.newsletter ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView(person)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(person.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};