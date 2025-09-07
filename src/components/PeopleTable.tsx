import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Person } from "@/pages/Dashboard";
import { useState } from "react";

interface PeopleTableProps {
  people: Person[];
  onDelete: (id: string) => void;
  onView: (person: Person) => void;
}

type SortField = 'full_name' | 'status';
type SortOrder = 'asc' | 'desc';

// Generate consistent color from text
const getColorFromText = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 85%)`;
};

const getTextColorFromBg = (bgColor: string): string => {
  const hue = parseInt(bgColor.match(/\d+/)?.[0] || '0');
  // Use darker text for better contrast
  return `hsl(${hue}, 70%, 25%)`;
};

export const PeopleTable = ({ people, onDelete, onView }: PeopleTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Apply sorting
  const sortedPeople = [...people].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
  
  // Apply filters
  const filteredPeople = sortedPeople.filter(person => {
    return Object.entries(filters).every(([column, filterValue]) => {
      if (!filterValue) return true;
      
      const personValue = person[column as keyof Person]?.toString()?.toLowerCase() || '';
      return personValue.includes(filterValue.toLowerCase());
    });
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

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
            <th className="text-left p-4 font-medium">
              <div className="flex items-center gap-2">
                Name
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('full_name')}
                  className="h-6 w-6 p-0"
                >
                  {getSortIcon('full_name')}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.full_name ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by name</label>
                      <Input
                        placeholder="Enter name..."
                        value={filters.full_name || ''}
                        onChange={(e) => handleFilter('full_name', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left p-4 font-medium">
              <div className="flex items-center gap-2">
                Email
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.email ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by email</label>
                      <Input
                        placeholder="Enter email..."
                        value={filters.email || ''}
                        onChange={(e) => handleFilter('email', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left p-4 font-medium">
              <div className="flex items-center gap-2">
                Company
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.company ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by company</label>
                      <Input
                        placeholder="Enter company..."
                        value={filters.company || ''}
                        onChange={(e) => handleFilter('company', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left p-4 font-medium">
              <div className="flex items-center gap-2">
                Categories
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.categories ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by categories</label>
                      <Input
                        placeholder="Enter category..."
                        value={filters.categories || ''}
                        onChange={(e) => handleFilter('categories', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left p-4 font-medium">
              <div className="flex items-center gap-2">
                Status
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-6 w-6 p-0"
                >
                  {getSortIcon('status')}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.status ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by status</label>
                      <Input
                        placeholder="Enter status..."
                        value={filters.status || ''}
                        onChange={(e) => handleFilter('status', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left p-4 font-medium">Newsletter</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPeople.map((person) => (
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
                  person.categories.split(',').map((category, index) => {
                    const trimmedCategory = category.trim();
                    const firstWord = trimmedCategory.split(' ')[0];
                    const bgColor = getColorFromText(trimmedCategory);
                    const textColor = getTextColorFromBg(bgColor);
                    return (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs mr-1"
                        style={{ 
                          backgroundColor: bgColor, 
                          color: textColor,
                          border: 'none'
                        }}
                        title={trimmedCategory}
                      >
                        {firstWord}
                      </Badge>
                    );
                  })
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