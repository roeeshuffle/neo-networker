import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { SearchBar } from "@/components/SearchBar";
import { PeopleTable } from "@/components/PeopleTable";
import { PersonForm } from "@/components/PersonForm";
import { EditablePersonModal } from "@/components/EditablePersonModal";
import { LogOut, Plus } from "lucide-react";

export interface Person {
  id: string;
  full_name: string;
  categories?: string;
  email?: string;
  newsletter?: boolean;
  company?: string;
  status?: string;
  linkedin_profile?: string;
  poc_in_apex?: string;
  who_warm_intro?: string;
  agenda?: string;
  meeting_notes?: string;
  should_avishag_meet?: boolean;
  more_info?: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
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
      fetchPeople();
    }
  }, [user]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPeople(data || []);
      setFilteredPeople(data || []);
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
      setFilteredPeople(people);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = people.filter(person => 
      person.full_name.toLowerCase().includes(searchTerm) ||
      person.company?.toLowerCase().includes(searchTerm) ||
      person.categories?.toLowerCase().includes(searchTerm) ||
      person.email?.toLowerCase().includes(searchTerm) ||
      person.status?.toLowerCase().includes(searchTerm) ||
      person.more_info?.toLowerCase().includes(searchTerm)
    );

    setFilteredPeople(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };


  const handleView = (person: Person) => {
    setViewingPerson(person);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Person deleted successfully",
      });

      fetchPeople();
    } catch (error: any) {
      toast({
        title: "Error deleting person",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
    fetchPeople();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft/30 to-secondary-soft/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="mt-6 text-muted-foreground font-medium">Loading your workspace...</p>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <img 
                  src="/lovable-uploads/756c1423-2a04-4806-8117-719d07336118.png" 
                  alt="VCrm Logo" 
                  className="h-8 w-8 brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">VCrm</h1>
                <p className="text-muted-foreground text-sm font-medium">Beautiful contact management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              {user?.email === 'guy@wershuffle.com' && (
                <Button variant="secondary" onClick={() => navigate("/admin")} className="shadow-sm">
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} className="shadow-sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-8">
        {/* Hero section with actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Your Contacts</h2>
            <p className="text-muted-foreground font-medium">
              Manage and organize your professional network with ease
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar onSearch={handleSearch} />
            <Button onClick={() => setShowForm(true)} className="shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary-soft/30 to-primary-soft/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/80">Total Contacts</p>
                  <p className="text-2xl font-bold text-primary-foreground">{filteredPeople.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary-soft/30 to-secondary-soft/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-foreground/80">This Month</p>
                  <p className="text-2xl font-bold text-secondary-foreground">
                    {people.filter(p => new Date(p.created_at) >= new Date(new Date().setDate(1))).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent-soft/30 to-accent-soft/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-accent-foreground/80">With Notes</p>
                  <p className="text-2xl font-bold text-accent-foreground">
                    {people.filter(p => p.meeting_notes?.trim()).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main data table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Contact Directory
              <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {filteredPeople.length} entries
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PeopleTable 
              people={filteredPeople}
              onDelete={handleDelete}
              onView={handleView}
            />
          </CardContent>
        </Card>

        {showForm && (
          <PersonForm
            person={editingPerson}
            onClose={handleFormClose}
          />
        )}

        <EditablePersonModal
          person={viewingPerson}
          isOpen={!!viewingPerson}
          onClose={() => setViewingPerson(null)}
          onSave={fetchPeople}
        />
      </main>
    </div>
  );
};

export default Dashboard;