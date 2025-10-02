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
import { Plus, Trash2, Edit, Calendar, Clock, CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

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
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project: '',
    status: 'todo',
    priority: 'medium',
    scheduled_date: '',
    due_date: ''
  });

  // Fetch available projects from backend
  const fetchProjects = async () => {
    try {
      console.log('🚀 FRONTEND VERSION: 12.7 - DEBUG PROJECTS DROPDOWN');
      console.log('Fetching distinct projects from backend...');
      
      const { data, error } = await apiClient.getProjects();
      
      if (error) {
        console.error('❌ Error fetching projects:', error);
        return;
      }
      
      console.log('✅ Raw API response:', data);
      
      const projects = data?.projects || [];
      console.log('📊 Available projects received:', projects);
      console.log('📊 Projects count:', projects.length);
      console.log('📊 Total tasks:', data?.total_tasks);
      console.log('📊 Debug info:', data?.debug_info);
      
      setAvailableProjects(projects);
      console.log('✅ Set availableProjects state to:', projects);
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
    }
  };

  // Get projects list for dropdown (ONLY from tasks table, no defaults)
  const getProjectsList = () => {
    // Only return projects that actually exist in the user's tasks
    return availableProjects.sort();
  };

  const handleCreateNewProject = () => {
    if (newProjectName.trim()) {
      // Just set the form data - the project will be created when the task is saved
      setFormData(prev => ({
        ...prev,
        project: newProjectName.trim()
      }));
      
      setIsCreatingNewProject(false);
      setNewProjectName('');
      
      toast({
        title: "Success",
        description: `Project "${newProjectName.trim()}" will be created when you save the task`,
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
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchProjects(); // Fetch available projects
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
        
        // Always include project if it has tasks OR if showDone is true (to show empty projects for deletion)
        if (filteredTasks.length > 0 || showDone) {
          filtered[project] = filteredTasks;
        }
      });
      
      console.log('Search + status filtered projects:', filtered);
      setFilteredProjects(filtered);
    }
  }, [projects, searchQuery, showDone]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Always fetch ALL tasks, filter on client-side
      console.log('🚀 FRONTEND VERSION: 9.0 - CLIENT-SIDE FILTER & TASK UPDATE FIX');
      console.log('Fetching ALL tasks (no backend filter)');
      
      const { data, error } = await apiClient.getTasks(undefined, undefined, true);
      
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
      const { data, error } = await apiClient.createTask(formData);
      
      if (error) throw error;
      
      console.log('Task created successfully:', data);
      
      // Refresh both tasks and projects after creation
      await Promise.all([
        fetchTasks(),
        fetchProjects()
      ]);
      
      setIsAddDialogOpen(false);
      resetForm();
      onTasksChange?.(); // Trigger count update
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
      console.log('Updating task:', editingTask.id, 'with data:', formData);
      const { data, error } = await apiClient.updateTask(editingTask.id, formData);
      
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
      onTasksChange?.(); // Trigger count update
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
      
      const { error } = await apiClient.updateTask(taskId, { status: newStatus });
      
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
      
      onTasksChange?.(); // Trigger count update
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await apiClient.deleteTask(taskId);
      
      if (error) throw error;
      
      // Update local state
      setProjects(prev => {
        const newProjects = { ...prev };
        Object.keys(newProjects).forEach(project => {
          newProjects[project] = newProjects[project].filter(task => task.id !== taskId);
        });
        return newProjects;
      });
      
      onTasksChange?.(); // Trigger count update
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
      due_date: ''
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      project: task.project,
      status: task.status,
      priority: task.priority,
      scheduled_date: task.scheduled_date || '',
      due_date: task.due_date || ''
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
    return priorityOption ? priorityOption.color : 'bg-gray-100 text-gray-800';
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

  const getTotalTasks = () => {
    return Object.values(projects).reduce((total, tasks) => total + tasks.length, 0);
  };

  const getCompletedTasks = () => {
    return Object.values(projects).reduce((total, tasks) => 
      total + tasks.filter(task => task.status === 'completed').length, 0
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks Management</h2>
          <p className="text-muted-foreground">Manage your project-based tasks</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showDone ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2"
          >
            {showDone ? "Show Active" : "Show All"}
          </Button>
          
          {Object.keys(filteredProjects).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllProjectsCollapse}
              className="flex items-center gap-2"
            >
              {getCollapseButtonText()}
            </Button>
          )}
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{getTotalTasks()}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{getCompletedTasks()}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{Object.values(projects).flat().filter(task => task.status !== 'completed' && task.status !== 'cancelled').length}</div>
            <div className="text-sm text-muted-foreground">Open Tasks</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      {Object.keys(filteredProjects).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-lg text-muted-foreground">No tasks yet</div>
            <div className="text-sm text-muted-foreground mt-2">
              Create your first task to get started
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredProjects).map(([projectName, tasks]) => {
            const isCollapsed = collapsedProjects[projectName];
            const statusCounts = getProjectStatusCounts(tasks);
            const totalTasks = tasks.length;
            
            return (
              <Card key={projectName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProjectCollapse(projectName)}
                        className="p-1 h-6 w-6"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <span>{projectName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{totalTasks} tasks</Badge>
                      {statusCounts.todo > 0 && (
                        <Badge variant="outline" className="text-blue-600">
                          {statusCounts.todo} open
                        </Badge>
                      )}
                      {statusCounts.in_progress > 0 && (
                        <Badge variant="outline" className="text-orange-600">
                          {statusCounts.in_progress} in process
                        </Badge>
                      )}
                      {statusCounts.completed > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          {statusCounts.completed} done
                        </Badge>
                      )}
                      {statusCounts.cancelled > 0 && (
                        <Badge variant="outline" className="text-red-600">
                          {statusCounts.cancelled} cancelled
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const StatusIcon = getStatusIcon(task.status);
                        const isDisabled = isTaskDisabled(task);
                        const isFutureScheduled = isTaskFutureScheduled(task);
                        
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isFutureScheduled ? 'bg-blue-50 border-blue-200' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <StatusIcon className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className={`font-medium ${isFutureScheduled ? 'text-blue-700' : ''}`}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className={`text-sm text-muted-foreground ${isFutureScheduled ? 'text-blue-600' : ''}`}>
                                    {task.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {getStatusLabel(task.status)}
                                  </Badge>
                                  {task.scheduled_date && (
                                    <Badge variant="outline" className={`text-xs ${isFutureScheduled ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}>
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
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.status !== 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickDone(task.id)}
                                  className={`text-green-600 hover:text-green-700 ${isFutureScheduled ? 'border-blue-300 hover:bg-blue-50' : ''}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(task)}
                                className={isFutureScheduled ? 'border-blue-300 hover:bg-blue-50' : ''}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className={isFutureScheduled ? 'border-blue-300 hover:bg-blue-50' : ''}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

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
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
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
                </SelectContent>
              </Select>
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
    </div>
  );
};

export default TasksTab;