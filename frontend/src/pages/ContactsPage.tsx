import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SearchBar } from '@/components/SearchBar';
import { PeopleTable } from '@/components/PeopleTable';
import DynamicContactForm from '@/components/DynamicContactForm';
import ContactViewModal from '@/components/ContactViewModal';
import { LogOut, Plus, CheckSquare, Calendar, Settings, User, RefreshCw, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContactsPanel } from '@/components/ContactsPanel';
import alistLogo from '@/assets/alist-logo-new.svg';

export interface Person {
  id: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  birthday?: string;
  organization?: string;
  job_title?: string;
  job_status?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  linkedin_url?: string;
  github_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  website_url?: string;
  notes?: string;
  source?: string;
  tags?: string[];
  last_contact_date?: string;
  next_follow_up_date?: string;
  status?: string;
  priority?: string;
  group?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

const ContactsPage = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNotifications, setHasNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userPlan, setUserPlan] = useState<string>('Free');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (isAuthenticated && user) {
      // User is authenticated, load data
      loadData();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPeople(),
        fetchUnreadNotificationsCount(),
        fetchUserPlan()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    try {
      const { data, error } = await apiClient.getPeople();
      if (error) throw error;
      setPeople(data || []);
      setFilteredPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const { data } = await apiClient.getUnreadNotificationsCount();
      const count = data?.count || 0;
      setUnreadNotificationsCount(count);
      setHasNotifications(count > 0);
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const { data } = await apiClient.getUserPlan();
      setUserPlan(data?.plan || 'Free');
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const handleManualRefresh = async () => {
    await loadData();
    toast({
      title: "Success",
      description: "Data refreshed successfully!",
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPeople(people);
      return;
    }

    const filtered = people.filter(person => {
      const searchTerm = query.toLowerCase();
      const fullName = `${person.first_name || ''} ${person.last_name || ''}`.toLowerCase();
      const email = (person.email || '').toLowerCase();
      const organization = (person.organization || '').toLowerCase();
      const jobTitle = (person.job_title || '').toLowerCase();
      
      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             organization.includes(searchTerm) ||
             jobTitle.includes(searchTerm);
    });
    
    setFilteredPeople(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await apiClient.deletePerson(id);
      if (error) throw error;
      
      setPeople(prev => prev.filter(person => person.id !== id));
      setFilteredPeople(prev => prev.filter(person => person.id !== id));
      
      toast({
        title: "Success",
        description: "Contact deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
    }
  };

  const handleView = (person: Person) => {
    setViewingPerson(person);
  };

  const handleSavePerson = async (personData: Partial<Person>) => {
    try {
      let savedPerson: Person;
      
      if (editingPerson) {
        // Update existing person
        const { data, error } = await apiClient.updatePerson(editingPerson.id, personData);
        if (error) throw error;
        savedPerson = data;
        
        setPeople(prev => prev.map(p => p.id === editingPerson.id ? savedPerson : p));
        setFilteredPeople(prev => prev.map(p => p.id === editingPerson.id ? savedPerson : p));
      } else {
        // Create new person
        const { data, error } = await apiClient.createPerson(personData);
        if (error) throw error;
        savedPerson = data;
        
        setPeople(prev => [savedPerson, ...prev]);
        setFilteredPeople(prev => [savedPerson, ...prev]);
      }
      
      toast({
        title: "Success",
        description: editingPerson ? "Contact updated successfully!" : "Contact created successfully!",
      });
      
      setShowForm(false);
      setEditingPerson(null);
      setViewingPerson(null);
    } catch (error) {
      console.error('Error saving person:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive"
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="mt-6 text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-soft grid grid-rows-[auto_1fr_auto]">
      {/* Enterprise Header */}
      <header className="enterprise-header">
        <div className="px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
                  <img 
                    src={alistLogo} 
                    alt="Alist Logo" 
                    className="h-6 w-6 object-contain filter brightness-0 invert"
                  />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Alist</h1>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/contacts')}
                  className="nav-item bg-secondary text-secondary-foreground"
                >
                  <User className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/tasks')}
                  className="nav-item"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/events')}
                  className="nav-item"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                  className="nav-item"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
            
            {/* Right: Actions and User */}
            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleManualRefresh}
                  variant="ghost" 
                  size="sm"
                  className="w-9 h-9 p-0"
                  title="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <ThemeToggle />
                
                {/* Notifications Bell */}
                <Button 
                  onClick={() => navigate('/notifications')}
                  variant="ghost" 
                  size="sm"
                  className="w-9 h-9 p-0 relative"
                  title={`Notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
                >
                  <Bell className="h-4 w-4" />
                  {hasNotifications && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </Button>
                
                {user?.email && ['guy@wershuffle.com', 'roee2912@gmail.com'].includes(user.email) && (
                  <Button 
                    onClick={() => navigate('/admin')}
                    variant="ghost" 
                    size="sm"
                    className="w-9 h-9 p-0"
                    title="Admin Panel"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-9">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{user?.email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {userPlan === 'Pro' && <Crown className="w-3 h-3" />}
                        {userPlan === 'Enterprise' && <Building2 className="w-3 h-3" />}
                        {userPlan}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="overflow-auto" style={{ minHeight: 0 }}>
        <div className="px-12 py-8">
          <ContactsPanel 
            filteredPeople={filteredPeople}
            onDelete={handleDelete}
            onView={handleView}
            onRefresh={fetchPeople}
            onShowForm={() => setShowForm(true)}
            onSearch={handleSearch}
          />
        </div>

        {showForm && (
          <DynamicContactForm
            isOpen={showForm}
            contact={editingPerson}
            onClose={handleFormClose}
            onSave={handleSavePerson}
            isLoading={false}
          />
        )}

        <ContactViewModal
          person={viewingPerson}
          isOpen={!!viewingPerson}
          onClose={() => setViewingPerson(null)}
          onSave={handleSavePerson}
          isLoading={false}
        />
      </main>

      {/* Footer with legal links */}
      <footer className="border-t border-border bg-muted/30 py-6">
        <div className="px-12">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <a href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
            <div>
              © 2024 Alist. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactsPage;
