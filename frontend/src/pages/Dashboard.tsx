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
import { LogOut, Plus, CheckSquare, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TasksTab from "@/components/TasksTab";
import EventsTab from "@/components/EventsTab";
import { ContactsPanel } from "@/components/ContactsPanel";
import { SettingsTab } from "@/components/SettingsTab";
import Sidebar from "@/components/Sidebar";

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

  // Periodic refresh of counts every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchTasksCount();
      fetchEventsCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (user) {
      await fetchPeople();
      await fetchTasksCount();
      await fetchEventsCount();
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
    <div className="min-h-screen bg-gradient-to-br from-primary-soft/20 via-background to-secondary-soft/20 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-6 py-12 space-y-8">
          {/* Search section */}
          <div className="flex justify-start mb-8">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder={`Search ${activeTab === "contacts" ? "contacts" : activeTab === "tasks" ? "tasks" : "items"}...`}
            />
          </div>

        {/* Main content tabs */}

        {/* Main content with tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              <CheckSquare className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contacts">
            <ContactsPanel 
              filteredPeople={filteredPeople}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={fetchPeople}
              onShowForm={() => setShowForm(true)}
            />
          </TabsContent>
          
          <TabsContent value="tasks">
            <TasksTab onTasksChange={fetchTasksCount} searchQuery={searchQuery} />
          </TabsContent>
          
          <TabsContent value="events">
            <EventsTab onEventsChange={fetchEventsCount} searchQuery={searchQuery} />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab currentUser={user} />
          </TabsContent>
        </Tabs>

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
    </div>
  );
};

export default Dashboard;