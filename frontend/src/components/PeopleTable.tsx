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

interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
}

type SortField = 'first_name' | 'last_name' | 'organization' | 'job_title' | 'status' | 'email' | 'phone' | 'mobile' | 'priority' | 'group' | 'source' | 'created_at';
type SortOrder = 'asc' | 'desc';

// Default column configuration
const defaultColumns: ColumnConfig[] = [
  { key: 'first_name', label: 'First Name', enabled: true, order: 1 },
  { key: 'last_name', label: 'Last Name', enabled: true, order: 2 },
  { key: 'organization', label: 'Organization', enabled: true, order: 3 },
  { key: 'job_title', label: 'Job Title', enabled: true, order: 4 },
  { key: 'email', label: 'Email', enabled: true, order: 5 },
  { key: 'phone', label: 'Phone', enabled: false, order: 6 },
  { key: 'mobile', label: 'Mobile', enabled: false, order: 7 },
  { key: 'status', label: 'Status', enabled: false, order: 8 },
  { key: 'priority', label: 'Priority', enabled: false, order: 9 },
  { key: 'group', label: 'Group', enabled: false, order: 10 },
  { key: 'source', label: 'Source', enabled: false, order: 11 },
  { key: 'linkedin_url', label: 'LinkedIn', enabled: false, order: 12 },
  { key: 'github_url', label: 'GitHub', enabled: false, order: 13 },
  { key: 'website_url', label: 'Website', enabled: false, order: 14 },
  { key: 'address', label: 'Address', enabled: false, order: 15 },
  { key: 'notes', label: 'Notes', enabled: false, order: 16 },
  { key: 'last_contact_date', label: 'Last Contact', enabled: false, order: 17 },
  { key: 'next_follow_up_date', label: 'Next Follow-up', enabled: false, order: 18 },
  { key: 'created_at', label: 'Created At', enabled: false, order: 19 }
];

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
  const [sortField, setSortField] = useState<SortField | null>('first_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const itemsPerPage = 50;
  
  // Fetch user preferences for column configuration
  useEffect(() => {
    const fetchColumnPreferences = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
        const response = await fetch(`${apiUrl}/api/user-preferences`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const savedColumns = data.preferences?.contact_columns;
          
          if (savedColumns && Array.isArray(savedColumns)) {
            // Merge saved columns with defaults
            const mergedColumns = [...defaultColumns];
            
            savedColumns.forEach((savedCol: ColumnConfig) => {
              const existingIndex = mergedColumns.findIndex(col => col.key === savedCol.key);
              if (existingIndex !== -1) {
                mergedColumns[existingIndex] = { ...mergedColumns[existingIndex], ...savedCol };
              } else {
                mergedColumns.push(savedCol);
              }
            });
            
            setColumns(mergedColumns.sort((a, b) => a.order - b.order));
          }
        }
      } catch (error) {
        console.error('Error fetching column preferences:', error);
        // Use defaults if fetch fails
        setColumns(defaultColumns);
      }
    };

    fetchColumnPreferences();
  }, []);
  
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
  
  const getFullName = (person: Person) => {
    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Unknown';
  };
  
  // Apply sorting
  const sortedPeople = [...people].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'first_name' || sortField === 'last_name') {
      // For name sorting, use the full name
      aValue = getFullName(a);
      bValue = getFullName(b);
    } else {
      aValue = a[sortField] || '';
      bValue = b[sortField] || '';
    }
    
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
      
      let personValue;
      if (column === 'full_name') {
        personValue = getFullName(person).toLowerCase();
      } else {
        personValue = person[column as keyof Person]?.toString()?.toLowerCase() || '';
      }
      
      return personValue.includes(filterValue.toLowerCase());
    });
  });
  
  // Apply pagination
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeople = filteredPeople.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
                  onClick={() => handleSort('first_name')}
                  className="h-6 w-6 p-0"
                >
                  {getSortIcon('first_name')}
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
           {paginatedPeople.map((person, index) => (
            <tr key={person.id} className={`border-b border-border-soft transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
              <td className="px-6 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={profileImages[person.id] || ""} 
                    alt={getFullName(person)}
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
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-soft">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPeople.length)} of {filteredPeople.length} contacts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};