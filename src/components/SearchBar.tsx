import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

interface SuggestionItem {
  type: 'name' | 'company' | 'specialty' | 'hashtag';
  value: string;
  count: number;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allData, setAllData] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('full_name, company, categories');
      
      if (error) throw error;
      setAllData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateSuggestions = (searchTerm: string): SuggestionItem[] => {
    if (!searchTerm.trim() || !allData.length) return [];

    const term = searchTerm.toLowerCase();
    const suggestions: SuggestionItem[] = [];
    const seen = new Set<string>();

    // Names
    allData.forEach(person => {
      if (person.full_name?.toLowerCase().includes(term)) {
        const key = `name:${person.full_name}`;
        if (!seen.has(key)) {
          suggestions.push({ type: 'name', value: person.full_name, count: 1 });
          seen.add(key);
        }
      }
    });

    // Companies
    const companyCount: Record<string, number> = {};
    allData.forEach(person => {
      if (person.company?.toLowerCase().includes(term)) {
        companyCount[person.company] = (companyCount[person.company] || 0) + 1;
      }
    });
    
    Object.entries(companyCount).forEach(([company, count]) => {
      suggestions.push({ type: 'company', value: company, count });
    });

    // Categories
    const categoryCount: Record<string, number> = {};
    allData.forEach(person => {
      if (person.categories) {
        const categories = person.categories.split(',').map(c => c.trim());
        categories.forEach(category => {
          if (category.toLowerCase().includes(term)) {
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          }
        });
      }
    });

    Object.entries(categoryCount).forEach(([category, count]) => {
      suggestions.push({ type: 'specialty', value: category, count });
    });


    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
    
    if (value.trim()) {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setQuery(suggestion.value);
    onSearch(suggestion.value);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
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

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search by name, company, hashtags, or specialties..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="pl-10 pr-10 w-full"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer rounded-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">{getTypeIcon(suggestion.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{suggestion.value}</div>
                    <div className="text-xs text-muted-foreground">{getTypeLabel(suggestion.type)}</div>
                  </div>
                </div>
                {suggestion.count > 1 && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full ml-2">
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