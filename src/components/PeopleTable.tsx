import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Person } from "@/pages/Dashboard";

interface PeopleTableProps {
  people: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

export const PeopleTable = ({ people, onEdit, onDelete }: PeopleTableProps) => {
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
            <th className="text-left p-4 font-medium">Company</th>
            <th className="text-left p-4 font-medium">Specialties</th>
            <th className="text-left p-4 font-medium">Hashtags</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <div>
                  <div className="font-medium">{person.full_name}</div>
                  {person.career_history && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {person.career_history.substring(0, 100)}
                      {person.career_history.length > 100 && "..."}
                    </div>
                  )}
                </div>
              </td>
              <td className="p-4">
                <span className="text-sm">{person.company || "N/A"}</span>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {person.professional_specialties?.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {person.professional_specialties && person.professional_specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{person.professional_specialties.length - 3}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {person.hashtags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {person.hashtags && person.hashtags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{person.hashtags.length - 3}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(person)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(person.id)}
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