import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Filter, Share2, Check, X, Edit } from "lucide-react";
import { Person } from "@/pages/Dashboard";
import { apiClient } from "@/integrations/api/client";
import { useState, useEffect } from "react";
import { ShareDataDialog } from "@/components/ShareDataDialog";
import { OwnerInfo } from "@/components/OwnerInfo";

interface PeopleTableProps {
  people: Person[];
  onDelete: (id: string, name: string) => void;
  onView: (person: Person) => void;
  onShare: (person: Person, filteredContacts?: Person[]) => void; // Add filtered contacts parameter
  onRefresh?: () => void; // Add refresh callback
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

// Generate consistent color from group text
const getColorFromGroup = (group: string): string => {
  if (!group) return 'hsl(0, 0%, 85%)'; // Default gray for empty groups
  
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = group.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 85%)`;
};

const getTextColorFromBg = (bgColor: string): string => {
  const hue = parseInt(bgColor.match(/\d+/)?.[0] || '0');
  // Use darker text for better contrast
  return `hsl(${hue}, 70%, 25%)`;
};

// Helper function to get cell value for a given column and person
const getCellValue = (person: Person, columnKey: string): string => {
  if (columnKey === 'full_name') {
    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  } else if (columnKey.startsWith('custom_')) {
    const customFieldKey = columnKey.replace('custom_', '');
    return person.custom_fields?.[customFieldKey] || '';
  } else {
    const value = person[columnKey as keyof Person];
    if (value === null || value === undefined) return '';
    
    // Format dates
    if (columnKey.includes('_date') || columnKey === 'created_at') {
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          return date.toLocaleDateString();
        } catch {
          return value;
        }
      }
    }
    
    return String(value);
  }
};

// Helper function to format cell content with proper styling
const formatCellContent = (person: Person, columnKey: string): JSX.Element => {
  const value = getCellValue(person, columnKey);
  
  if (columnKey === 'email' && value) {
    return (
      <a 
        href={`mailto:${value}`} 
        className="text-blue-600 hover:text-blue-800 underline"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    );
  }
  
  if (columnKey === 'phone' || columnKey === 'mobile') {
    return (
      <a 
        href={`tel:${value}`} 
        className="text-blue-600 hover:text-blue-800 underline"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    );
  }
  
  if (columnKey === 'linkedin_url' || columnKey === 'github_url' || columnKey === 'website_url') {
    if (value) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {columnKey === 'linkedin_url' ? 'LinkedIn' : 
           columnKey === 'github_url' ? 'GitHub' : 'Website'}
        </a>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  }
  
  if (columnKey === 'status' && value) {
    const statusColors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    const colorClass = statusColors[value.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <Badge className={colorClass}>{value}</Badge>;
  }
  
  if (columnKey === 'priority' && value) {
    const priorityColors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    const colorClass = priorityColors[value.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <Badge className={colorClass}>{value}</Badge>;
  }
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return <span>{value}</span>;
};

// Render editable cell content
const renderEditableCell = (person: Person, columnKey: string, editingPerson: string | null, editingData: Person | null, onFieldChange: (field: string, value: string) => void): JSX.Element => {
  const isEditing = editingPerson === person.id;
  
  if (isEditing && editingData) {
    const currentValue = getCellValue(editingData, columnKey);
    
    return (
      <Input
        value={currentValue}
        onChange={(e) => onFieldChange(columnKey, e.target.value)}
        className="h-8 text-sm border-orange-400 focus:border-orange-500 focus:ring-orange-500/20"
        placeholder={`Enter ${columnKey.replace('_', ' ')}`}
      />
    );
  }
  
  return formatCellContent(person, columnKey);
};

// Dynamic filter component for any column
const ColumnFilter = ({ 
  column, 
  filters, 
  onFilter 
}: { 
  column: ColumnConfig; 
  filters: Record<string, string>; 
  onFilter: (column: string, value: string) => void;
}) => {
  const filterValue = filters[column.key] || '';
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${filterValue ? 'text-green-600' : ''}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by {column.label.toLowerCase()}</label>
          <Input
            placeholder={`Enter ${column.label.toLowerCase()}...`}
            value={filterValue}
            onChange={(e) => onFilter(column.key, e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const PeopleTable = ({ people, onDelete, onView, onShare, onRefresh }: PeopleTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>('first_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 50;
  
  // Fetch user preferences for column configuration
  useEffect(() => {
    const fetchColumnPreferences = async () => {
      try {
        
        // First, try to load from localStorage (most reliable)
        const localColumns = localStorage.getItem('contact_columns');
        if (localColumns) {
          try {
            const savedColumns = JSON.parse(localColumns);
            
            if (Array.isArray(savedColumns)) {
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
              return; // Successfully loaded from localStorage
            }
          } catch (error) {
            console.error('❌ PEOPLE TABLE: Error parsing localStorage columns:', error);
          }
        }

        // If no localStorage data, try backend
        
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
        
        // Try to fetch from backend first
        try {
          const response = await fetch(`${apiUrl}/user-preferences`, {
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
              return; // Successfully loaded from backend
            }
          }
        } catch (error) {
        }
        
        // Use defaults if nothing else works
        setColumns(defaultColumns);
      } catch (error) {
        console.error('❌ PEOPLE TABLE: Error fetching column preferences:', error);
        // Use defaults if fetch fails
        setColumns(defaultColumns);
      }
    };

    fetchColumnPreferences();
  }, []);
  
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
        personValue = getFullName(person);
      } else if (column.startsWith('custom_')) {
        const customFieldKey = column.replace('custom_', '');
        personValue = person.custom_fields?.[customFieldKey] || '';
      } else {
        personValue = getCellValue(person, column);
      }
      
      return String(personValue).toLowerCase().includes(filterValue.toLowerCase());
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

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person.id);
    setEditingData({ ...person });
  };

  const handleSaveEdit = async () => {
    if (!editingPerson || !editingData) return;
    
    setSaving(true);
    try {
      // Prepare update data
      const updateData: any = {};
      
      // Update all fields that have changed
      const originalPerson = people.find(p => p.id === editingPerson);
      if (!originalPerson) return;

      // Check each field for changes
      Object.keys(editingData).forEach(key => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          const originalValue = originalPerson[key as keyof Person];
          const newValue = editingData[key as keyof Person];
          
          if (originalValue !== newValue) {
            if (key === 'custom_fields') {
              updateData[key] = newValue;
            } else {
              updateData[key] = newValue || null;
            }
          }
        }
      });

      // Update the contact
      await apiClient.updatePerson(editingPerson, updateData);
      
      // Close editing mode
      setEditingPerson(null);
      setEditingData(null);
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error saving contact:', error);
      // Show error message to user
      alert('Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setEditingData(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!editingData) return;
    
    if (field === 'first_name' || field === 'last_name') {
      // Handle name fields
      setEditingData({
        ...editingData,
        [field]: value
      });
    } else if (field.startsWith('custom_')) {
      // Handle custom fields
      const customFieldKey = field.replace('custom_', '');
      const customFields = { ...editingData.custom_fields };
      if (value.trim()) {
        customFields[customFieldKey] = value.trim();
      } else {
        delete customFields[customFieldKey];
      }
      setEditingData({
        ...editingData,
        custom_fields: customFields
      });
    } else {
      // Handle regular fields
      setEditingData({
        ...editingData,
        [field]: value
      });
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Get enabled columns sorted by order
  const enabledColumns = columns
    .filter(col => col.enabled)
    .sort((a, b) => a.order - b.order);

  if (people.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">No contacts found</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="overflow-x-auto resize-x min-w-full max-w-full" style={{ resize: 'horizontal' }}>
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border-soft bg-muted/30">
              {/* Photo column - always shown */}
              <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground tracking-wider w-16">
                Photo
              </th>
              
              {/* Dynamic columns based on user preferences */}
              {enabledColumns.map((column) => (
                <th key={column.key} className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground tracking-wider">
                  <div className="flex items-center gap-2">
                    {column.label}
                    {/* Sort button for first_name column */}
                    {column.key === 'first_name' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('first_name')}
                        className="h-6 w-6 p-0"
                      >
                        {getSortIcon('first_name')}
                      </Button>
                    )}
                    {/* Filter button for all columns */}
                    <ColumnFilter 
                      column={column} 
                      filters={filters} 
                      onFilter={handleFilter} 
                    />
                  </div>
                </th>
              ))}
              
              {/* Actions column - always shown */}
              <th className="text-left px-6 py-4 font-semibold text-sm text-muted-foreground tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPeople.map((person) => (
              <tr 
                key={person.id} 
                className="border-b border-border-soft hover:bg-muted/50 transition-colors"
              >
                {/* Photo column - always shown */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={profileImages[person.id] || person.avatar_url || undefined} 
                        alt={getFullName(person)}
                      />
                      <AvatarFallback 
                        style={{ 
                          backgroundColor: getColorFromGroup(person.group || ''),
                          color: getTextColorFromBg(getColorFromGroup(person.group || ''))
                        }}
                      >
                        {getFullName(person).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </td>
                
                {/* Dynamic columns based on user preferences */}
                {enabledColumns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {renderEditableCell(
                      person, 
                      column.key, 
                      editingPerson, 
                      editingData, 
                      handleFieldChange
                    )}
                  </td>
                ))}
                
                {/* Actions column - always shown */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {editingPerson === person.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          disabled={saving}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Save changes"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          disabled={saving}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPerson(person);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit contact"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(person);
                          }}
                          className="h-8 w-8 p-0"
                          title="View contact"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShare(person, filteredPeople);
                          }}
                          className="h-8 w-8 p-0"
                          title="Share contact"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown';
                            onDelete(person.id, fullName);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            
            {/* Page numbers */}
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
  );
};