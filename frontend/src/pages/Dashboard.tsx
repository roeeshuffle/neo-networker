import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/SearchBar";
import { PeopleTable } from "@/components/PeopleTable";
import { PersonForm } from "@/components/PersonForm";
import { EditablePersonModal } from "@/components/EditablePersonModal";
import { CsvUploader } from "@/components/CsvUploader";
import { LogOut, Plus, CheckSquare, Calendar, Settings, User, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TasksTab from "@/components/TasksTab";
import EventsTab from "@/components/EventsTab";
import { ContactsPanel } from "@/components/ContactsPanel";
import { SettingsTab } from "@/components/SettingsTab";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import alistLogo from "@/assets/alist-logo-new.svg";

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


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredPeople(people);
      return;
    }

    const searchTerm = query.toLowerCase();
    
    if (activeTab === 'contacts') {
      const filtered = people.filter(person => 
        person.full_name.toLowerCase().includes(searchTerm) ||
        person.company?.toLowerCase().includes(searchTerm) ||
        person.categories?.toLowerCase().includes(searchTerm) ||
        person.email?.toLowerCase().includes(searchTerm) ||
        person.status?.toLowerCase().includes(searchTerm) ||
        person.more_info?.toLowerCase().includes(searchTerm)
      );
      setFilteredPeople(filtered);
    } else if (activeTab === 'events') {
      // For events, we'll need to pass the search query to EventsTab
      // This will be handled by the EventsTab component itself
      // For now, just clear the people filter
      setFilteredPeople(people);
    } else if (activeTab === 'tasks') {
      // For tasks, we'll need to pass the search query to TasksTab
      // This will be handled by the TasksTab component itself
      // For now, just clear the people filter
      setFilteredPeople(people);
    } else {
      setFilteredPeople(people);
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <img 
                  src={alistLogo} 
                  alt="Alist Logo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-fit grid-cols-4 bg-muted">
                  <TabsTrigger value="contacts" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Contacts
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Right: Search Bar, Refresh Button, Settings, and User */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="w-64">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder={`Search ${activeTab === "contacts" ? "contacts" : activeTab === "tasks" ? "tasks" : "items"}...`}
                />
              </div>
              
              {/* Refresh Button */}
              <Button 
                onClick={handleManualRefresh}
                variant="ghost" 
                size="sm"
                className="w-10 h-10 p-0"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Settings Button */}
              {user?.email && ['guy@wershuffle.com', 'roee2912@gmail.com'].includes(user.email) && (
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="ghost" 
                  size="sm"
                  className="w-10 h-10 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-8">

        {/* Main content based on active tab */}
        {activeTab === "contacts" && (
          <ContactsPanel 
            filteredPeople={filteredPeople}
            onDelete={handleDelete}
            onView={handleView}
            onRefresh={fetchPeople}
            onShowForm={() => setShowForm(true)}
          />
        )}
        
        {activeTab === "tasks" && (
          <TasksTab onTasksChange={fetchTasksCount} searchQuery={searchQuery} />
        )}
        
        {activeTab === "events" && (
          <EventsTab onEventsChange={fetchEventsCount} searchQuery={searchQuery} />
        )}
        
        {activeTab === "settings" && (
          <SettingsTab currentUser={user} />
        )}

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