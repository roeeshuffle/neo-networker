import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Trash2, ExternalLink, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { Company } from "@/pages/Companies";

interface CompaniesTableProps {
  companies: Company[];
  onDelete: (id: string) => void;
  onView: (company: Company) => void;
}

type SortField = keyof Company;
type SortOrder = 'asc' | 'desc';

// Utility functions
const getColorFromText = (text: string): string => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-gray-100 text-gray-800',
  ];
  const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const CompaniesTable = ({ companies, onDelete, onView }: CompaniesTableProps) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState({
    record: '',
    categories: '',
    connection_strength: '',
    domains: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting logic
  const sortedCompanies = [...companies].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtering logic
  const filteredCompanies = sortedCompanies.filter(company => {
    return (
      company.record.toLowerCase().includes(filters.record.toLowerCase()) &&
      (company.categories?.toLowerCase().includes(filters.categories.toLowerCase()) ?? true) &&
      (company.connection_strength?.toLowerCase().includes(filters.connection_strength.toLowerCase()) ?? true) &&
      (company.domains?.some(domain => domain.toLowerCase().includes(filters.domains.toLowerCase())) ?? (filters.domains === ''))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilter = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">No companies found</div>
        <p className="text-sm text-muted-foreground mt-2">Add your first company to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter inputs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
        <Input
          placeholder="Filter by company name..."
          value={filters.record}
          onChange={(e) => handleFilter('record', e.target.value)}
        />
        <Input
          placeholder="Filter by categories..."
          value={filters.categories}
          onChange={(e) => handleFilter('categories', e.target.value)}
        />
        <Input
          placeholder="Filter by connection strength..."
          value={filters.connection_strength}
          onChange={(e) => handleFilter('connection_strength', e.target.value)}
        />
        <Input
          placeholder="Filter by domains..."
          value={filters.domains}
          onChange={(e) => handleFilter('domains', e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-2">
                  Record ID
                  {getSortIcon('id')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('record')}
              >
                <div className="flex items-center gap-2">
                  Record
                  {getSortIcon('record')}
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('categories')}
              >
                <div className="flex items-center gap-2">
                  Categories
                  {getSortIcon('categories')}
                </div>
              </TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('last_interaction')}
              >
                <div className="flex items-center gap-2">
                  Last Interaction
                  {getSortIcon('last_interaction')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('connection_strength')}
              >
                <div className="flex items-center gap-2">
                  Connection Strength
                  {getSortIcon('connection_strength')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('twitter_follower_count')}
              >
                <div className="flex items-center gap-2">
                  Twitter Followers
                  {getSortIcon('twitter_follower_count')}
                </div>
              </TableHead>
              <TableHead>Twitter</TableHead>
              <TableHead>Domains</TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Created At
                  {getSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead>Notion ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCompanies.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-xs">
                  {company.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-medium">
                  {company.record}
                </TableCell>
                <TableCell>
                  {company.tags && company.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {company.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className={`text-xs ${getColorFromText(tag)}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {company.categories && (
                    <Badge variant="outline" className={getColorFromText(company.categories)}>
                      {company.categories}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {company.linkedin_profile && (
                    <a 
                      href={company.linkedin_profile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      LinkedIn
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {company.last_interaction && formatDate(company.last_interaction)}
                </TableCell>
                <TableCell>
                  {company.connection_strength && (
                    <Badge 
                      variant={company.connection_strength === 'strong' ? 'default' : 'secondary'}
                      className={company.connection_strength === 'strong' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {company.connection_strength}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {company.twitter_follower_count && company.twitter_follower_count.toLocaleString()}
                </TableCell>
                <TableCell>
                  {company.twitter && (
                    <a 
                      href={company.twitter.startsWith('http') ? company.twitter : `https://twitter.com/${company.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Twitter
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {company.domains && company.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {company.domains.slice(0, 2).map((domain, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {company.domains.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{company.domains.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {company.description}
                </TableCell>
                <TableCell>{formatDate(company.created_at)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {company.notion_id}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(company)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the company "{company.record}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDelete(company.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {filteredCompanies.length === 0 && companies.length > 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">No companies match your filters</div>
          <Button 
            variant="ghost" 
            onClick={() => {
              setFilters({ record: '', categories: '', connection_strength: '', domains: '' });
              setCurrentPage(1);
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};