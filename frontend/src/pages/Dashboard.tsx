import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/SearchBar";
import { PeopleTable } from "@/components/PeopleTable";
import DynamicContactForm from "@/components/DynamicContactForm";
import ContactViewModal from "@/components/ContactViewModal";
import { LogOut, Plus, CheckSquare, Calendar, Settings, User, RefreshCw, Bell, Star, Zap, Building2, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TasksTab from "@/components/TasksTab";
import EventsTab from "@/components/EventsTab";
import { ContactsPanel } from "@/components/ContactsPanel";
import { SettingsTab } from "@/components/SettingsTab";
import { NotificationsTab } from "@/components/NotificationsTab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import alistLogo from "@/assets/alist-logo-new.svg";

export interface Person {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
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
  tags?: string;
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


const Dashboard = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [todayTasks, setTodayTasks] = useState(0);
  const [todayEvents, setTodayEvents] = useState(0);
  const [totalOpenTasks, setTotalOpenTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState("contacts");
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

  // Refresh counts when switching to tasks or events tabs
  useEffect(() => {
    if (isAuthenticated && user && (activeTab === 'tasks' || activeTab === 'events')) {
      fetchTasksCount();
      fetchEventsCount();
    }
  }, [activeTab, isAuthenticated, user]);

  // Periodic refresh of counts every 5 minutes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchTasksCount();
      fetchEventsCount();
    }, 300000); // Refresh every 5 minutes (300 seconds)

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (user) {
      await fetchPeople();
      await fetchTasksCount();
      await fetchEventsCount();
      await fetchUnreadNotificationsCount();
      await fetchUserPlan();
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const response = await apiClient.getUnreadNotificationsCount();
      if (response.data) {
        setUnreadNotificationsCount(response.data.unread_count || 0);
        setHasNotifications(response.data.has_unread || false);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const response = await apiClient.getUserPlan();
      if (response.data && response.data.success) {
        setUserPlan(response.data.plan);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free':
        return <Star className="w-4 h-4 text-gray-600" />;
      case 'Starter':
        return <Star className="w-4 h-4 text-blue-600" />;
      case 'Pro':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'Business':
        return <Building2 className="w-4 h-4 text-green-600" />;
      default:
        return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleManualRefresh = async () => {
    if (user) {
      await loadData();
      toast({
        title: "Refreshed",
        description: "Data updated successfully",
      });
    }
  };


  const fetchPeople = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getPeople();
      
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

  const fetchTasksCount = async () => {
    try {
      console.log('Fetching tasks count...');
      const { data, error } = await apiClient.getTasks();

      if (error) throw error;
      
      console.log('Tasks data:', data);
      
      // Handle different response formats
      let tasks = [];
      if (Array.isArray(data)) {
        tasks = data;
      } else if (data && Array.isArray(data.tasks)) {
        tasks = data.tasks;
      } else if (data && data.projects) {
        // If data is in projects format, flatten all tasks
        tasks = Object.values(data.projects).flat();
      }
      
      setTotalTasks(tasks.length);
      
      // Calculate today's tasks (Israel timezone)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const todayTasksCount = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= todayStart && taskDate <= todayEnd;
      }).length;
      
      console.log('Today tasks count:', todayTasksCount);
      setTodayTasks(todayTasksCount);
      
      // Calculate total open tasks (not completed or cancelled)
      const openTasksCount = tasks.filter(task => 
        task.status !== 'completed' && task.status !== 'cancelled'
      ).length;
      
      console.log('Open tasks count:', openTasksCount);
      setTotalOpenTasks(openTasksCount);
    } catch (error: any) {
      console.error('Error fetching tasks count:', error);
    }
  };

  const fetchEventsCount = async () => {
    try {
      console.log('Fetching events count...');
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const { data, error } = await apiClient.getEvents(
        todayStart.toISOString(),
        todayEnd.toISOString()
      );

      if (error) throw error;
      
      console.log('Events data:', data);
      
      // Handle different response formats
      let events = [];
      if (Array.isArray(data)) {
        events = data;
      } else if (data && Array.isArray(data.events)) {
        events = data.events;
      }
      
      console.log('Today events count:', events.length);
      setTodayEvents(events.length);
    } catch (error: any) {
      console.error('Error fetching events count:', error);
    }
  };


  const handleSearch = (query: string, field?: string) => {
    if (!query.trim()) {
      setFilteredPeople(people);
      return;
    }

    const searchTerm = query.toLowerCase();
    
    if (activeTab === 'contacts') {
      let filtered = people;
      
      if (field) {
        // Search in specific field
        filtered = people.filter(person => {
          let fieldValue = '';
          
          if (field === 'full_name') {
            fieldValue = `${person.first_name || ''} ${person.last_name || ''}`.trim();
          } else if (field.startsWith('custom_')) {
            // Handle custom fields
            fieldValue = person.custom_fields?.[field.replace('custom_', '')] || '';
          } else {
            fieldValue = person[field as keyof typeof person]?.toString() || '';
          }
          
          console.log(`🔍 SEARCH DEBUG: Field: ${field}, FieldValue: "${fieldValue}", SearchTerm: "${searchTerm}", Match: ${fieldValue.toLowerCase().includes(searchTerm)}`);
          
          return fieldValue.toLowerCase().includes(searchTerm);
        });
      } else {
        // Search in all fields (fallback)
        filtered = people.filter(person => 
          person.full_name.toLowerCase().includes(searchTerm) ||
          person.organization?.toLowerCase().includes(searchTerm) ||
          person.job_title?.toLowerCase().includes(searchTerm) ||
          person.email?.toLowerCase().includes(searchTerm) ||
          person.status?.toLowerCase().includes(searchTerm) ||
          person.notes?.toLowerCase().includes(searchTerm)
        );
      }
      
      setFilteredPeople(filtered);
    }
  };

  const handleLogout = async () => {
    logout(); // Clear authentication state
    navigate("/auth");
  };


  const handleView = (person: Person) => {
    setViewingPerson(person);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await apiClient.deletePerson(id);

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

  const handleSavePerson = async (contactData: any) => {
    try {
      if (editingPerson || viewingPerson) {
        // Update existing person
        const personId = editingPerson?.id || viewingPerson?.id;
        const { error } = await apiClient.updatePerson(personId, contactData);
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
        
        // Close the form/modal and refresh data
        if (editingPerson) {
          handleFormClose();
        } else {
          setViewingPerson(null);
        }
      } else {
        // Create new person
        const { error } = await apiClient.createPerson(contactData);
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Contact created successfully",
        });
        
        handleFormClose();
      }
      
      fetchPeople();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-fit grid-cols-4 bg-muted/50 p-1">
                  <TabsTrigger value="contacts" className="nav-item data-[state=active]:active">
                    <User className="w-4 h-4 mr-2" />
                    Contacts
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="nav-item data-[state=active]:active">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="events" className="nav-item data-[state=active]:active">
                    <Calendar className="w-4 h-4 mr-2" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="nav-item data-[state=active]:active">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
                  onClick={() => {
                    setActiveTab("notifications");
                    fetchUnreadNotificationsCount(); // Refresh count when opening notifications
                  }}
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
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{user?.email?.split('@')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => navigate('/subscription')} 
                    className="flex items-center gap-2"
                  >
                    {getPlanIcon(userPlan)}
                    <span className="text-sm">{userPlan} Plan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="overflow-auto" style={{ minHeight: 0 }}>
        <div className="px-12 py-8">
          {/* Main content based on active tab */}
          {activeTab === "contacts" && (
            <ContactsPanel 
              filteredPeople={filteredPeople}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={fetchPeople}
              onShowForm={() => setShowForm(true)}
              onSearch={handleSearch}
            />
          )}
          
          {activeTab === "tasks" && (
            <TasksTab onTasksChange={fetchTasksCount} />
          )}
          
          {activeTab === "events" && (
            <EventsTab onEventsChange={fetchEventsCount} />
          )}
          
          {activeTab === "notifications" && (
            <NotificationsTab onNotificationRead={fetchUnreadNotificationsCount} />
          )}
          
          {activeTab === "settings" && (
            <SettingsTab currentUser={user} />
          )}
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
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Alist. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm ml-8">
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;