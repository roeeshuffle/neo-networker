import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { SearchBar } from "@/components/SearchBar";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyForm } from "@/components/CompanyForm";
import { EditableCompanyModal } from "@/components/EditableCompanyModal";
import { LogOut, Plus, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompaniesPanel } from "@/components/CompaniesPanel";
import vcrmLogo from "@/assets/vcrm-logo.png";

export interface Company {
  id: string;
  record: string;
  tags?: string[];
  categories?: string;
  linkedin_profile?: string;
  last_interaction?: string;
  connection_strength?: string;
  twitter_follower_count?: number;
  twitter?: string;
  domains?: string[];
  description?: string;
  notion_id?: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

const Companies = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          // Check if user is approved when they sign in
          setTimeout(() => {
            checkUserApproval(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkUserApproval(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserApproval = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        navigate("/auth");
        toast({
          title: "Account Not Approved",
          description: "Your account is pending admin approval.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error checking user approval:', error);
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCompanies(data || []);
      setFilteredCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = companies.filter(company => 
      company.record.toLowerCase().includes(searchTerm) ||
      company.categories?.toLowerCase().includes(searchTerm) ||
      company.description?.toLowerCase().includes(searchTerm) ||
      company.twitter?.toLowerCase().includes(searchTerm) ||
      company.domains?.some(domain => domain.toLowerCase().includes(searchTerm)) ||
      company.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    setFilteredCompanies(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company deleted successfully",
      });

      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error deleting company",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCompany(null);
    fetchCompanies();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft/30 to-secondary-soft/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="mt-6 text-muted-foreground font-medium">Loading your companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft/20 via-background to-secondary-soft/20">
      {/* Modern header with glass effect */}
      <header className="border-b border-border-soft bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <img 
                  src={vcrmLogo} 
                  alt="VCrm Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">VCrm - Companies</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline" 
                size="sm"
                className="bg-card/80"
              >
                Back to Dashboard
              </Button>
              {user?.email && ['guy@wershuffle.com', 'roee2912@gmail.com'].includes(user.email) && (
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="outline" 
                  size="sm"
                  className="bg-card/80"
                >
                  Admin Panel
                </Button>
              )}
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="bg-card/80 hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-8">
        {/* Search section */}
        <div className="flex justify-start mb-8">
          <SearchBar onSearch={handleSearch} placeholder="Search companies..." />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary-soft/30 to-primary-soft/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground/80">Total Companies</p>
                  <p className="text-2xl font-bold text-foreground">{filteredCompanies.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary-soft/30 to-secondary-soft/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground/80">Active Companies</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredCompanies.filter(c => c.connection_strength === 'strong').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main content */}
        <CompaniesPanel 
          filteredCompanies={filteredCompanies}
          onDelete={handleDelete}
          onView={handleView}
          onRefresh={fetchCompanies}
          onShowForm={() => setShowForm(true)}
        />

        {showForm && (
          <CompanyForm
            company={editingCompany}
            onClose={handleFormClose}
          />
        )}

        <EditableCompanyModal
          company={viewingCompany}
          isOpen={!!viewingCompany}
          onClose={() => setViewingCompany(null)}
          onSave={fetchCompanies}
        />
      </main>
    </div>
  );
};

export default Companies;