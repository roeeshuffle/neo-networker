import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  task_id: number;
  text: string;
  assign_to?: string;
  due_date?: string;
  status: string;
  label?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface NewTask {
  text: string;
  assign_to: string;
  due_date: string;
  status: string;
  label: string;
  priority: string;
}

interface TasksTabProps {
  onTasksChange?: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ onTasksChange }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    text: '',
    assign_to: '',
    due_date: '',
    status: 'pending',
    label: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient.getTasks();

      if (error) throw error;
      setTasks((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.text.trim()) {
      toast({
        title: "Validation Error",
        description: "Task text is required",
        variant: "destructive"
      });
      return;
    }

    setIsAddingTask(true);
    try {
      const { data: user } = await apiClient.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      // Handle timezone properly - store datetime-local as-is (local time)
      let dueDateISO = null;
      if (newTask.due_date) {
        // The datetime-local input gives us a string like "2025-09-20T21:00"
        // Store it as-is without timezone conversion to avoid confusion
        dueDateISO = newTask.due_date + ':00'; // Add seconds to make it a valid ISO string
      }

      const taskData = {
        text: newTask.text,
        assign_to: newTask.assign_to || null,
        due_date: dueDateISO,
        status: newTask.status,
        label: newTask.label || null,
        priority: newTask.priority,
        owner_id: user.id
      };

      const { error } = await apiClient.createTask(taskData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task added successfully"
      });

      setNewTask({
        text: '',
        assign_to: '',
        due_date: '',
        status: 'pending',
        label: '',
        priority: 'medium'
      });
      setIsAddDialogOpen(false);
      fetchTasks();
      onTasksChange?.();
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    } finally {
      setIsAddingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await apiClient.deleteTask(taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
      fetchTasks();
      onTasksChange?.();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await apiClient.updateTask(taskId, { status: newStatus });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task status updated"
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'outline';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks Management</h2>
          <p className="text-muted-foreground">Manage and track your tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-text">Task Description *</Label>
                <Textarea
                  id="task-text"
                  placeholder="Enter task description..."
                  value={newTask.text}
                  onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assign-to">Assign To</Label>
                  <Input
                    id="assign-to"
                    placeholder="Person name"
                    value={newTask.assign_to}
                    onChange={(e) => setNewTask({ ...newTask, assign_to: e.target.value })}
                  />
                </div>
                
                 <div className="space-y-2">
                   <Label htmlFor="due-date">Due Date</Label>
                   <Input
                     id="due-date"
                     type="datetime-local"
                     value={newTask.due_date}
                     onChange={(e) => {
                       // Store the datetime-local value as-is (local time)
                       const localDate = e.target.value;
                       setNewTask({ ...newTask, due_date: localDate });
                     }}
                   />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Optional label"
                  value={newTask.label}
                  onChange={(e) => setNewTask({ ...newTask, label: e.target.value })}
                />
              </div>
              
              <Button onClick={addTask} className="w-full" disabled={isAddingTask}>
                {isAddingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary mr-2"></div>
                    Adding Task...
                  </>
                ) : (
                  "Add Task"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-32">Assigned To</TableHead>
                <TableHead className="w-32">Due Date</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Label</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.task_id}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={task.text}>
                      {task.text}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.assign_to && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        {task.assign_to}
                      </div>
                    )}
                  </TableCell>
                   <TableCell>
                     {task.due_date && (
                       <div className="flex items-center gap-1 text-sm">
                         <Calendar className="w-3 h-3" />
                         {format(new Date(task.due_date), 'dd-MM-yyyy HH:mm')}
                       </div>
                     )}
                   </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(value) => updateTaskStatus(task.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {task.label && (
                      <div className="flex items-center gap-1 text-sm">
                        <Tag className="w-3 h-3" />
                        {task.label}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="w-8 h-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tasks found. Add your first task to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};