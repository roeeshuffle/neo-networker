import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Calendar, Clock, CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight, Minus, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { UserSelector } from './UserSelector';

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  status: string;
  priority: string;
  scheduled_date?: string;
  due_date?: string;
  is_scheduled: boolean;
  is_active: boolean;
  participants: string[];
  owner_id: string;
  assign_to?: string;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  project: string;
  status: string;
  priority: string;
  scheduled_date: string;
  due_date: string;
  assign_to: string;
}

interface TasksTabProps {
  onTasksChange?: () => void;
  searchQuery?: string;
}

const TasksTab: React.FC<TasksTabProps> = ({ onTasksChange, searchQuery }) => {
  const [projects, setProjects] = useState<Record<string, Task[]>>({});
  const [filteredProjects, setFilteredProjects] = useState<Record<string, Task[]>>({});
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isManagingParticipants, setIsManagingParticipants] = useState(false);
  const [currentProjectParticipants, setCurrentProjectParticipants] = useState<string[]>([]);
  const [managingProject, setManagingProject] = useState<string>('');
  const [currentProjectAssignableUsers, setCurrentProjectAssignableUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project: '',
    status: 'todo',
    priority: 'medium',
    scheduled_date: '',
    due_date: '',
    assign_to: ''
  });

  // Get current user email
  const getCurrentUserEmail = async () => {
    try {
      const { data: currentUser } = await apiClient.getCurrentUser() as { data: { email: string } };
      if (currentUser && currentUser.email) {
        setCurrentUserEmail(currentUser.email);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Fetch available projects from tasks data (workaround for /projects endpoint issue)
  const fetchProjects = async () => {
    try {
      console.log('🚀 FRONTEND VERSION: 13.1 - WORKAROUND PROJECTS FROM TASKS');
      console.log('Extracting projects from tasks data instead of calling /projects endpoint...');
      
      // Get tasks data to extract projects
      const { data: tasksData, error } = await apiClient.getTasks(undefined, undefined, true) as { data: { projects: Record<string, Task[]> }, error: any };
      
      if (error) {
        console.error('❌ Error fetching tasks for projects:', error);
        return;
      }
      
      console.log('✅ Tasks data received for project extraction:', tasksData);
      
      // Extract unique projects from tasks data
      const projectsSet = new Set<string>();
      
      if (tasksData?.projects) {
        Object.keys(tasksData.projects).forEach(projectName => {
          if (projectName && projectName.trim() !== '') {
            projectsSet.add(projectName);
          }
        });
      }
      
      const projects = Array.from(projectsSet).sort();
      console.log('📊 Extracted projects from tasks:', projects);
      console.log('📊 Projects count:', projects.length);
      
      setAvailableProjects(projects);
      console.log('✅ Set availableProjects state to:', projects);
    } catch (error) {
      console.error('❌ Error extracting projects from tasks:', error);
    }
  };

  // Get projects list for dropdown (ONLY from tasks table, no defaults)
  const getProjectsList = () => {
    // Only return projects that actually exist in the user's tasks
    return availableProjects.sort();
  };

  const handleCreateNewProject = () => {
    if (newProjectName.trim()) {
      const projectName = newProjectName.trim();
      
      // Add the new project to available projects list
      setAvailableProjects(prev => {
        if (!prev.includes(projectName)) {
          return [...prev, projectName].sort();
        }
        return prev;
      });
      
      // Set the form data with the new project selected
      setFormData(prev => ({
        ...prev,
        project: projectName
      }));
      
      setIsCreatingNewProject(false);
      setNewProjectName('');
      
      toast({
        title: "Success",
        description: `Project "${projectName}" added and selected`,
      });
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: Circle },
    { value: 'in_progress', label: 'In Progress', icon: Clock },
    { value: 'completed', label: 'Completed', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', icon: AlertCircle }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    { value: 'high', label: 'High', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchProjects(); // Fetch available projects
    getCurrentUserEmail(); // Get current user email for filtering
  }, []); // Only fetch once on mount

  useEffect(() => {
    console.log('🔄 Client-side filtering based on showDone:', showDone);
    console.log('Current projects:', projects);
    
    if (!searchQuery || searchQuery.trim() === '') {
      // Apply status filter based on showDone
      const filtered: Record<string, Task[]> = {};
      
      Object.keys(projects).forEach(project => {
        let filteredTasks = projects[project];
        
        // Apply status filter
        if (!showDone) {
          // Show only active tasks (todo, in_progress)
          filteredTasks = projects[project].filter(task => 
            task.status === 'todo' || task.status === 'in_progress'
          );
        }
        // If showDone is true, show all tasks (no filter)
        
        // Apply "My Tasks" filter
        if (showMyTasks && currentUserEmail) {
          filteredTasks = filteredTasks.filter(task => 
            task.owner_id === currentUserEmail || 
            task.assign_to === currentUserEmail ||
            (task.owner_id === currentUserEmail && !task.assign_to)
          );
        }
        
        // Always include project if it has tasks OR if showDone is true (to show empty projects for deletion)
        if (filteredTasks.length > 0 || showDone) {
          filtered[project] = filteredTasks;
        }
      });
      
      console.log('Client-side filtered projects:', filtered);
      setFilteredProjects(filtered);
    } else {
      // Apply both search and status filter
      const searchTerm = searchQuery.toLowerCase();
      const filtered: Record<string, Task[]> = {};
      
      Object.keys(projects).forEach(project => {
        let filteredTasks = projects[project].filter(task =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm) ||
          task.project.toLowerCase().includes(searchTerm)
        );
        
        // Apply status filter
        if (!showDone) {
          filteredTasks = filteredTasks.filter(task => 
            task.status === 'todo' || task.status === 'in_progress'
          );
        }
        
        // Apply "My Tasks" filter
        if (showMyTasks && currentUserEmail) {
          filteredTasks = filteredTasks.filter(task => 
            task.owner_id === currentUserEmail || 
            task.assign_to === currentUserEmail ||
            (task.owner_id === currentUserEmail && !task.assign_to)
          );
        }
        
        // Always include project if it has tasks OR if showDone is true (to show empty projects for deletion)
        if (filteredTasks.length > 0 || showDone) {
          filtered[project] = filteredTasks;
        }
      });
      
      console.log('Search + status filtered projects:', filtered);
      setFilteredProjects(filtered);
    }
  }, [projects, searchQuery, showDone, showMyTasks, currentUserEmail]);

  // Load project participants when project changes
  useEffect(() => {
    if (formData.project) {
      loadProjectParticipants(formData.project);
    } else {
      setCurrentProjectAssignableUsers([]);
    }
  }, [formData.project]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Always fetch ALL tasks, filter on client-side
      console.log('🚀 FRONTEND VERSION: 9.0 - CLIENT-SIDE FILTER & TASK UPDATE FIX');
      console.log('Fetching ALL tasks (no backend filter)');
      
      const { data, error } = await apiClient.getTasks(undefined, undefined, true) as { data: { projects: Record<string, Task[]> }, error: any };
      
      if (error) {
        console.error('API Error:', error);
        throw error;
      }
      
      console.log('Tasks data received:', data);
      console.log('Projects data:', data?.projects);
      
      const projectsData = data?.projects || {};
      console.log('Setting projects to:', projectsData);
      console.log('Projects keys:', Object.keys(projectsData));
      
      // Log each project's tasks
      Object.entries(projectsData).forEach(([projectName, tasks]) => {
        console.log(`Project "${projectName}" has ${tasks.length} tasks:`, tasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
      });
      
      setProjects(projectsData);
      
      // Initialize collapsed state for new projects
      const newCollapsedState: Record<string, boolean> = {};
      Object.keys(projectsData).forEach(project => {
        if (!(project in collapsedProjects)) {
          newCollapsedState[project] = false; // Default to expanded
        }
      });
      if (Object.keys(newCollapsedState).length > 0) {
        setCollapsedProjects(prev => ({ ...prev, ...newCollapsedState }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      // Prepare task data for backend
      const taskData = {
        ...formData,
        assign_to: formData.assign_to || null
      };
      
      const { data, error } = await apiClient.createTask(taskData) as { data: any, error: any };
      
      if (error) throw error;
      
      console.log('Task created successfully:', data);
      
      // Refresh both tasks and projects after creation
      await Promise.all([
        fetchTasks(),
        fetchProjects()
      ]);
      
      setIsAddDialogOpen(false);
      resetForm();
      // onTasksChange?.(); // Removed to prevent infinite loop
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      // Prepare task data for backend
      const taskData = {
        ...formData,
        assign_to: formData.assign_to || null
      };
      
      console.log('Updating task:', editingTask.id, 'with data:', taskData);
      const { data, error } = await apiClient.updateTask(editingTask.id, taskData) as { data: any, error: any };
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Task updated successfully:', data);
      
      // Refresh both tasks and projects after update
      await Promise.all([
        fetchTasks(),
        fetchProjects()
      ]);
      
      setIsEditDialogOpen(false);
      setEditingTask(null);
      resetForm();
      // onTasksChange?.(); // Removed to prevent infinite loop
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleQuickDone = async (taskId: string) => {
    try {
      // Find the current task to get its current status
      let currentTask = null;
      Object.values(projects).forEach(projectTasks => {
        const task = projectTasks.find(t => t.id === taskId);
        if (task) currentTask = task;
      });
      
      if (!currentTask) return;
      
      // Toggle between 'completed' and 'todo'
      const newStatus = currentTask.status === 'completed' ? 'todo' : 'completed';
      
      const { error } = await apiClient.updateTask(taskId, { status: newStatus }) as { error: any };
      
      if (error) throw error;
      
      // Update local state
      setProjects(prev => {
        const newProjects = { ...prev };
        Object.keys(newProjects).forEach(project => {
          newProjects[project] = newProjects[project].map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          );
        });
        return newProjects;
      });
      
      // onTasksChange?.(); // Removed to prevent infinite loop
      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Load project participants for assign to field
  const loadProjectParticipants = async (projectName: string) => {
    if (!projectName) {
      setCurrentProjectAssignableUsers([]);
      return;
    }
    
    try {
      const { data, error } = await apiClient.getProjectParticipants(projectName) as { data: { participants: string[] }, error: any };
      if (error) throw error;
      setCurrentProjectAssignableUsers(data.participants || []);
    } catch (error) {
      console.error('Error loading project participants:', error);
      setCurrentProjectAssignableUsers([]);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await apiClient.deleteTask(taskId) as { error: any };
      
      if (error) throw error;
      
      // Update local state
      setProjects(prev => {
        const newProjects = { ...prev };
        Object.keys(newProjects).forEach(project => {
          newProjects[project] = newProjects[project].filter(task => task.id !== taskId);
        });
        return newProjects;
      });
      
      // onTasksChange?.(); // Removed to prevent infinite loop
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project: '',
      status: 'todo',
      priority: 'medium',
      scheduled_date: '',
      due_date: '',
      assign_to: ''
    });
  };

  const openParticipantsDialog = async (projectName: string) => {
    setManagingProject(projectName);
    try {
      // Get current participants for this project
      const { data, error } = await apiClient.getProjectParticipants(projectName) as { data: { participants: string[] }, error: any };
      if (error) throw error;
      setCurrentProjectParticipants(data.participants || []);
      setIsManagingParticipants(true);
    } catch (error) {
      console.error('Error loading project participants:', error);
      toast({
        title: "Error",
        description: "Failed to load project participants",
        variant: "destructive",
      });
    }
  };

  const saveProjectParticipants = async () => {
    try {
      const { data, error } = await apiClient.updateProjectParticipants(managingProject, {
        participants: currentProjectParticipants
      }) as { data: { message: string }, error: any };
      if (error) throw error;
      
      toast({
        title: "Success",
        description: data.message,
      });
      
      // Refresh tasks to show updated participants
      await fetchTasks();
      setIsManagingParticipants(false);
      setManagingProject('');
    } catch (error) {
      console.error('Error saving project participants:', error);
      toast({
        title: "Error",
        description: "Failed to save project participants",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      project: task.project || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      scheduled_date: task.scheduled_date || '',
      due_date: task.due_date || '',
      assign_to: task.assign_to || ''
    });
    setIsEditDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.icon : Circle;
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getPriorityColor = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption ? priorityOption.color : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const getPriorityLabel = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption ? priorityOption.label : priority;
  };

  const isTaskDisabled = (task: Task) => {
    // Always enable buttons - just change visual styling for future tasks
    return false;
  };

  const isTaskFutureScheduled = (task: Task) => {
    if (!task.is_scheduled || !task.scheduled_date) return false;
    return isAfter(parseISO(task.scheduled_date), new Date());
  };

  const toggleProjectCollapse = (projectName: string) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  const toggleAllProjectsCollapse = () => {
    const allCollapsed = Object.values(collapsedProjects).every(collapsed => collapsed);
    const allExpanded = Object.values(collapsedProjects).every(collapsed => !collapsed);
    
    if (allCollapsed || (!allCollapsed && !allExpanded)) {
      // Expand all
      const allExpanded: Record<string, boolean> = {};
      Object.keys(filteredProjects).forEach(project => {
        allExpanded[project] = false;
      });
      setCollapsedProjects(allExpanded);
    } else {
      // Collapse all
      const allCollapsed: Record<string, boolean> = {};
      Object.keys(filteredProjects).forEach(project => {
        allCollapsed[project] = true;
      });
      setCollapsedProjects(allCollapsed);
    }
  };

  const getCollapseButtonText = () => {
    const allCollapsed = Object.values(collapsedProjects).every(collapsed => collapsed);
    const allExpanded = Object.values(collapsedProjects).every(collapsed => !collapsed);
    
    if (allCollapsed) return "Expand All";
    if (allExpanded) return "Collapse All";
    return "Collapse All"; // Default when mixed state
  };

  const getProjectStatusCounts = (tasks: Task[]) => {
    const counts = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
    
    tasks.forEach(task => {
      if (task.status in counts) {
        counts[task.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Page Header */}
            <div className="enterprise-header mb-16">
              <div className="flex items-center justify-between">
                <div>
                  {/* Removed titles as requested */}
                </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant={showMyTasks ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyTasks(!showMyTasks)}
                className="h-9 px-4"
              >
                {showMyTasks ? "All Tasks" : "My Tasks"}
              </Button>
              
              <Button
                variant={showDone ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDone(!showDone)}
                className="h-9 px-4"
              >
                {showDone ? "Show Active" : "Show Done"}
              </Button>
              
              {Object.keys(filteredProjects).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllProjectsCollapse}
                  className="h-9 px-4"
                >
                  {getCollapseButtonText()}
                </Button>
              )}
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="h-9 w-9 p-0"
                    title="Add new task"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <Label htmlFor="project">Project</Label>
                  {isCreatingNewProject ? (
                    <div className="flex gap-2">
                      <Input
                        id="project"
                        placeholder="Enter new project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateNewProject()}
                      />
                      <Button onClick={handleCreateNewProject} size="sm">
                        Create
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreatingNewProject(false);
                          setNewProjectName('');
                        }} 
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={formData.project}
                      onValueChange={(value) => {
                        if (value === 'new_project') {
                          setIsCreatingNewProject(true);
                        } else {
                          setFormData({ ...formData, project: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProjectsList().map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                        <SelectItem value="new_project">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Project...
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assign_to">Assign To (optional)</Label>
                  <UserSelector
                    selectedUsers={formData.assign_to ? [{ id: formData.assign_to, email: formData.assign_to, full_name: formData.assign_to, added_at: new Date().toISOString() }] : []}
                    onUsersChange={(users) => setFormData({ ...formData, assign_to: users.length > 0 ? users[0].email : '' })}
                    placeholder="Select user to assign this task to..."
                    className="mt-1"
                    filterUsers={(users) => users.filter(user => currentProjectAssignableUsers.includes(user.email))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Assign this specific task to a user. They must be a project participant.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">Schedule Date (optional)</Label>
                    <Input
                      id="scheduled_date"
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date (optional)</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

            {/* Projects */}
            {Object.keys(filteredProjects).length === 0 ? (
              <div className="enterprise-card">
                <div className="p-8 text-center">
                  <div className="text-lg text-muted-foreground">No tasks yet</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Create your first task to get started
                  </div>
                </div>
              </div>
            ) : (
          <div className="space-y-8 mt-6">
            {Object.entries(filteredProjects).map(([projectName, tasks]) => {
              const isCollapsed = collapsedProjects[projectName];
              const statusCounts = getProjectStatusCounts(tasks);
              const totalTasks = tasks.length;
              
              return (
                <div key={projectName} className="enterprise-table">
                  {/* Project Header */}
                  <div className="enterprise-table-header px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProjectCollapse(projectName)}
                          className="h-8 w-8 p-0 hover:bg-muted/50"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <h3 className="text-lg font-semibold text-foreground">{projectName}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openParticipantsDialog(projectName)}
                          className="h-8 px-2 text-xs"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Manage Participants
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground"></div>
                          <span className="text-sm font-medium text-muted-foreground">{totalTasks} tasks</span>
                        </div>
                        {statusCounts.todo > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium text-muted-foreground">{statusCounts.todo} open</span>
                          </div>
                        )}
                        {statusCounts.in_progress > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-warning"></div>
                            <span className="text-sm font-medium text-muted-foreground">{statusCounts.in_progress} in process</span>
                          </div>
                        )}
                        {statusCounts.completed > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium text-muted-foreground">{statusCounts.completed} done</span>
                          </div>
                        )}
                        {statusCounts.cancelled > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-destructive"></div>
                            <span className="text-sm font-medium text-muted-foreground">{statusCounts.cancelled} cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                      {/* Tasks Table */}
                      {!isCollapsed && (
                        <div className="divide-y divide-border">
                          {tasks.map((task, index) => {
                            const StatusIcon = getStatusIcon(task.status);
                            const isDisabled = isTaskDisabled(task);
                            const isFutureScheduled = isTaskFutureScheduled(task);
                            
                            return (
                              <div
                                key={task.id}
                                className={`enterprise-table-row px-6 ${
                                  isFutureScheduled ? 'bg-primary-soft/50' : ''
                                }`}
                                style={{
                                  animation: `fade-in 0.3s ease-out ${index * 0.05}s both`
                                }}
                              >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 pr-4">
                                <StatusIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-foreground mb-1 ${
                                    isFutureScheduled ? 'text-primary' : ''
                                  }`}>
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className={`text-sm text-muted-foreground ${
                                      isFutureScheduled ? 'text-primary/70' : ''
                                    }`}>
                                      {task.description}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`status-badge ${getPriorityColor(task.priority)}`}>
                                      {getPriorityLabel(task.priority)}
                                    </Badge>
                                    <Badge variant="outline" className="status-badge">
                                      {getStatusLabel(task.status)}
                                    </Badge>
                                    {task.scheduled_date && (
                                      <Badge variant="outline" className={`text-xs ${
                                        isFutureScheduled ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : ''
                                      }`}>
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {format(parseISO(task.scheduled_date), 'MMM d, yyyy')}
                                      </Badge>
                                    )}
                                    {task.due_date && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                      </Badge>
                                    )}
                                    {task.assign_to && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                                        <Users className="w-3 h-3 mr-1" />
                                        Assign to: {task.assign_to}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                                  <div className="flex items-center gap-2 pl-4">
                                    {task.status !== 'completed' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickDone(task.id)}
                                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(task)}
                                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>

            <div>
              <Label htmlFor="edit-project">Project</Label>
              {isCreatingNewProject ? (
                <div className="flex gap-2">
                  <Input
                    id="edit-project"
                    placeholder="Enter new project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNewProject()}
                  />
                  <Button onClick={handleCreateNewProject} size="sm">
                    Create
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreatingNewProject(false);
                      setNewProjectName('');
                    }} 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.project}
                  onValueChange={(value) => {
                    if (value === 'new_project') {
                      setIsCreatingNewProject(true);
                    } else {
                      setFormData({ ...formData, project: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProjectsList().map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                    <SelectItem value="new_project">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Project...
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-assign_to">Assign To (optional)</Label>
              <UserSelector
                selectedUsers={formData.assign_to ? [{ id: formData.assign_to, email: formData.assign_to, full_name: formData.assign_to, added_at: new Date().toISOString() }] : []}
                onUsersChange={(users) => setFormData({ ...formData, assign_to: users.length > 0 ? users[0].email : '' })}
                placeholder="Select user to assign this task to..."
                className="mt-1"
                filterUsers={(users) => users.filter(user => currentProjectAssignableUsers.includes(user.email))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Assign this specific task to a user. They must be a project participant.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-scheduled_date">Schedule Date (optional)</Label>
                <Input
                  id="edit-scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-due_date">Due Date (optional)</Label>
                <Input
                  id="edit-due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => editingTask && handleDeleteTask(editingTask.id)}>
                Delete
              </Button>
              <Button onClick={handleUpdateTask}>
                Update Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Participants Management Dialog */}
      <Dialog open={isManagingParticipants} onOpenChange={setIsManagingParticipants}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Project Participants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project: {managingProject}</Label>
            </div>
            <div>
              <Label htmlFor="project-participants">Participants</Label>
              <UserSelector
                selectedUsers={currentProjectParticipants.map(email => ({ id: email, email, full_name: email, added_at: new Date().toISOString() }))}
                onUsersChange={(users) => setCurrentProjectParticipants(users.map(u => u.email))}
                placeholder="Select users to add to this project..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsManagingParticipants(false)}>
                Cancel
              </Button>
              <Button onClick={saveProjectParticipants}>
                Save Participants
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;