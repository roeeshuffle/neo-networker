import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Person } from "@/pages/Dashboard";
import { apiClient } from "@/integrations/api/client";
import { useState, useEffect } from "react";
import { ShareDataDialog } from "@/components/ShareDataDialog";
import { OwnerInfo } from "@/components/OwnerInfo";

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

// Function to fetch LinkedIn profile image
const fetchLinkedInProfileImage = async (linkedinUrl: string): Promise<string | null> => {
  try {
    const { data, error } = await apiClient.request('/linkedin-profile-image', {
      method: 'POST',
      body: JSON.stringify({ linkedin_url: linkedinUrl })
    });

    if (error) {
      console.error('Error fetching LinkedIn profile image:', error);
      return null;
    }

    return data?.profile_image_url || null;
  } catch (error) {
    console.error('Error calling LinkedIn profile image function:', error);
    return null;
  }
};

export const PeopleTable = ({ people, onDelete, onView }: PeopleTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  
  // Fetch profile images for people with LinkedIn URLs
  useEffect(() => {
    const fetchImages = async () => {
      const newImages: Record<string, string> = {};
      
      for (const person of people) {
        if (person.linkedin_profile && !profileImages[person.id]) {
          const imageUrl = await fetchLinkedInProfileImage(person.linkedin_profile);
          if (imageUrl) {
            newImages[person.id] = imageUrl;
          }
        }
      }
      
      if (Object.keys(newImages).length > 0) {
        setProfileImages(prev => ({ ...prev, ...newImages }));
      }
    };

    fetchImages();
  }, [people]);
  
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
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border-soft bg-muted/30">
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider w-16">
              Photo
            </th>
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                Full Name
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
                Organization
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.organization ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by organization</label>
                      <Input
                        placeholder="Enter organization..."
                        value={filters.organization || ''}
                        onChange={(e) => handleFilter('organization', e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                Role
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${filters.job_title ? 'text-green-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by role</label>
                      <Input
                        placeholder="Enter role..."
                        value={filters.job_title || ''}
                        onChange={(e) => handleFilter('job_title', e.target.value)}
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
            <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
           {filteredPeople.map((person, index) => (
            <tr key={person.id} className={`border-b border-border-soft transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
              <td className="px-6 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={profileImages[person.id] || ""} 
                    alt={person.full_name}
                    onError={(e) => {
                      // If image fails to load, hide it to show fallback
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : person.first_name || person.last_name || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </td>
              <td className="px-6 py-4">
                <div className="font-semibold text-foreground" title={person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : person.first_name || person.last_name || 'Unknown'}>
                  {person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : person.first_name || person.last_name || 'Unknown'}
                </div>
                {person.email && (
                  <div className="text-xs text-muted-foreground">
                    {person.email}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-foreground">{person.organization || "—"}</span>
              </td>
               <td className="px-6 py-4">
                <span className="text-sm font-medium text-foreground">{person.job_title || "—"}</span>
               </td>
               <td className="px-6 py-4">
                 <span className="text-sm font-medium text-foreground">{person.status || "—"}</span>
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
                   <ShareDataDialog 
                     tableName="people" 
                     recordId={person.id}
                   />
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