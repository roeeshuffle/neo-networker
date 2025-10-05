import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { apiClient } from "@/integrations/api/client";

interface SearchBarProps {
  onSearch: (query: string, field?: string) => void;
  placeholder?: string;
  activeTab?: string;
}

interface SuggestionItem {
  type: 'name' | 'company' | 'specialty' | 'hashtag';
  value: string;
  count: number;
}

interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date';
}

export const SearchBar = ({ onSearch, placeholder = "Search contacts...", activeTab = "contacts" }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string>("full_name");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allData, setAllData] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<SearchField[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define standard search fields
  const standardFields: SearchField[] = [
    { key: 'full_name', label: 'Full Name', type: 'text' },
    { key: 'first_name', label: 'First Name', type: 'text' },
    { key: 'last_name', label: 'Last Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'mobile', label: 'Mobile', type: 'phone' },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'job_title', label: 'Job Title', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'linkedin_url', label: 'LinkedIn', type: 'text' },
    { key: 'github_url', label: 'GitHub', type: 'text' },
    { key: 'facebook_url', label: 'Facebook', type: 'text' },
    { key: 'twitter_url', label: 'Twitter', type: 'text' },
    { key: 'website_url', label: 'Website', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'text' },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'text' },
    { key: 'group', label: 'Group', type: 'text' },
    { key: 'gender', label: 'Gender', type: 'text' },
    { key: 'birthday', label: 'Birthday', type: 'date' },
    { key: 'job_status', label: 'Job Status', type: 'text' },
    { key: 'last_contact_date', label: 'Last Contact Date', type: 'date' },
    { key: 'next_follow_up_date', label: 'Next Follow-up Date', type: 'date' }
  ];

  useEffect(() => {
    fetchAllData();
    fetchCustomFields();
  }, []);

  const fetchAllData = async () => {
    try {
      const { data, error } = await apiClient.getPeople();
      
      if (error) throw error;
      setAllData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
      
      
      const response = await fetch(`${apiUrl}/api/custom-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      
      if (response.ok) {
        const data = await response.json();
        
        const customFieldsData: SearchField[] = (data.custom_fields || []).map((cf: any) => ({
          key: `custom_${cf.key}`, // Prefix with 'custom_' to distinguish from standard fields
          label: cf.name,
          type: 'text'
        }));
        
        setCustomFields(customFieldsData);
      } else {
        console.error('🔍 SEARCH BAR: Failed to fetch custom fields:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🔍 SEARCH BAR: Error response:', errorText);
      }
    } catch (error) {
      console.error('🔍 SEARCH BAR: Error fetching custom fields:', error);
    }
  };

  const getAllSearchFields = (): SearchField[] => {
    const allFields = [...standardFields, ...customFields];
    return allFields;
  };

  const generateSuggestions = (searchTerm: string): SuggestionItem[] => {
    if (!searchTerm.trim() || !allData.length) return [];

    const term = searchTerm.toLowerCase();
    const suggestions: SuggestionItem[] = [];
    const seen = new Set<string>();

    // Names
    allData.forEach(person => {
      const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim();
      if (fullName.toLowerCase().includes(term)) {
        const key = `name:${fullName}`;
        if (!seen.has(key)) {
          suggestions.push({ type: 'name', value: fullName, count: 1 });
          seen.add(key);
        }
      }
    });

    // Organizations
    const companyCount: Record<string, number> = {};
    allData.forEach(person => {
      if (person.organization?.toLowerCase().includes(term)) {
        companyCount[person.organization] = (companyCount[person.organization] || 0) + 1;
      }
    });
    
    Object.entries(companyCount).forEach(([company, count]) => {
      suggestions.push({ type: 'company', value: company, count });
    });

    // Tags
    const tagCount: Record<string, number> = {};
    allData.forEach(person => {
      if (person.tags && Array.isArray(person.tags)) {
        person.tags.forEach(tag => {
          if (tag.toLowerCase().includes(term)) {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      }
    });

    Object.entries(tagCount).forEach(([tag, count]) => {
      suggestions.push({ type: 'specialty', value: tag, count });
    });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value, selectedField);
    
    if (value.trim()) {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    // Re-trigger search with new field
    if (query.trim()) {
      onSearch(query, field);
    }
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setQuery(suggestion.value);
    onSearch(suggestion.value, selectedField);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("", selectedField);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name': return '👤';
      case 'company': return '🏢';
      case 'specialty': return '💼';
      case 'hashtag': return '🏷️';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'name': return 'Person';
      case 'company': return 'Company';
      case 'specialty': return 'Specialty';
      case 'hashtag': return 'Hashtag';
      default: return '';
    }
  };

  const getPlaceholderText = () => {
    if (activeTab === "contacts") {
      const field = getAllSearchFields().find(f => f.key === selectedField);
      return field ? `Search by ${field.label.toLowerCase()}...` : "Search contacts...";
    }
    return placeholder;
  };

  return (
    <div className="relative max-w-md">
      <div className="flex items-center gap-2">
        {/* Field Selector */}
        <Select value={selectedField} onValueChange={handleFieldChange}>
          <SelectTrigger className="w-40 h-11">
            <SelectValue placeholder="Search by..." />
          </SelectTrigger>
          <SelectContent>
            {getAllSearchFields().map((field) => (
              <SelectItem key={field.key} value={field.key}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={getPlaceholderText()}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-11 pr-11 h-11 rounded-lg border-border-soft bg-muted/30 focus:bg-card transition-colors shadow-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto backdrop-blur-md">
          <div className="p-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                className="flex items-center justify-between p-3 hover:bg-primary-soft/30 cursor-pointer rounded-lg transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-soft/50 flex items-center justify-center">
                    <span className="text-sm">{getTypeIcon(suggestion.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate text-foreground">{suggestion.value}</div>
                    <div className="text-xs text-muted-foreground font-medium">{getTypeLabel(suggestion.type)}</div>
                  </div>
                </div>
                {suggestion.count > 1 && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full ml-2 font-medium">
                    {suggestion.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};