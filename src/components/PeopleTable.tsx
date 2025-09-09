import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium mb-2">No contacts found</p>
        <p className="text-sm text-muted-foreground">Add some entries to get started with your CRM</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="overflow-x-auto resize-x min-w-full max-w-full" style={{ resize: 'horizontal' }}>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border-soft bg-muted/30">
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider w-16">
              Photo
            </th>
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Newsletter</th>
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
           {filteredPeople.map((person, index) => (
            <tr key={person.id} className={`border-b border-border-soft transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
              <td className="px-6 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={person.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {person.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </td>
              <td className="px-6 py-4">
                <div className="font-semibold text-foreground" title={person.full_name}>
                  {person.full_name.length > 20 ? `${person.full_name.substring(0, 20)}...` : person.full_name}
                </div>
                {person.linkedin_profile && (
                  <a 
                    href={person.linkedin_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
                  >
                    LinkedIn Profile →
                  </a>
                )}
              </td>
              <td className="px-6 py-4">
                {person.email ? (
                  <a 
                    href={`mailto:${person.email}`}
                    className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
                  >
                    {person.email}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-foreground">{person.company || "—"}</span>
              </td>
               <td className="px-6 py-4">
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
                         className="text-xs mr-1 mb-1 rounded-full font-medium px-3 py-1 shadow-sm"
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
                   <span className="text-sm text-muted-foreground">—</span>
                 )}
               </td>
               <td className="px-6 py-4">
                 <span className="text-sm font-medium text-foreground">{person.status || "—"}</span>
               </td>
               <td className="px-6 py-4">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${person.newsletter ? 'bg-secondary' : 'bg-muted-foreground/30'}`}></div>
                   <span className={`text-sm font-medium ${person.newsletter ? 'text-secondary-foreground' : 'text-muted-foreground'}`}>
                     {person.newsletter ? 'Subscribed' : 'Not subscribed'}
                   </span>
                 </div>
               </td>
               <td className="px-6 py-4">
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
    </div>
  );
};