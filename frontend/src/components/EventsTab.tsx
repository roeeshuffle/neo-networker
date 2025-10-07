import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, CalendarDays } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfMonth, isToday } from 'date-fns';
import { UserSelector } from './UserSelector';

// Generate consistent color from project name
const getColorFromProject = (project: string): string => {
  if (!project) return 'hsl(0, 0%, 85%)'; // Default gray for empty projects
  
  let hash = 0;
  for (let i = 0; i < project.length; i++) {
    hash = project.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 85%)`;
};

const getTextColorFromBg = (bgColor: string): string => {
  const hue = parseInt(bgColor.match(/\d+/)?.[0] || '0');
  // Use darker text for better contrast
  return `hsl(${hue}, 65%, 25%)`;
};

interface Event {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  event_type: 'meeting' | 'event';
  project: string;
  participants: Array<{ name: string; email: string }>;
  alert_minutes: number;
  repeat_pattern: string;
  repeat_interval: number;
  repeat_days: number[];
  repeat_end_date: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  owner_id: string;
}

interface EventFormData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  event_type: 'meeting' | 'event';
  project: string;
  participants: Array<{ name: string; email: string }>;
  alert_minutes: number;
  repeat_pattern: string;
  repeat_interval: number;
  repeat_days: number[];
  repeat_end_date: string | null;
  notes: string;
}

interface EventsTabProps {
  onEventsChange?: () => void;
  searchQuery?: string;
}

const EventsTab: React.FC<EventsTabProps> = ({ onEventsChange, searchQuery }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

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

  // Calendar settings from user preferences
  const [calendarSettings, setCalendarSettings] = useState({
    defaultView: 'monthly',
    startWeekday: 'sunday'
  });
  
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'monthly'>(calendarSettings.defaultView as 'weekly' | 'daily' | 'monthly');

  const handleViewModeChange = (value: 'weekly' | 'daily' | 'monthly') => {
    console.log('Changing view mode to:', value);
    setViewMode(value);
    
    // Reset to current day/week/month when switching views
    const now = new Date();
    setCurrentDay(now);
    setCurrentWeek(now);
    setCurrentMonth(now);
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    event_type: 'event',
    project: '',
    participants: [],
    alert_minutes: 15,
    repeat_pattern: 'none',
    repeat_interval: 1,
    repeat_days: [],
    repeat_end_date: null,
    notes: ''
  });

  // Load user calendar preferences
  useEffect(() => {
    const loadCalendarSettings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com";
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (!token) return;

        const response = await fetch(`${apiUrl}/user-preferences`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const preferences = data.preferences || {};
          const calendarPrefs = preferences.calendar_settings || {};
          
          // Handle both field name formats (defaultView/default_view, startWeekday/start_weekday)
          const newSettings = {
            defaultView: calendarPrefs.defaultView || calendarPrefs.default_view || 'monthly',
            startWeekday: calendarPrefs.startWeekday || calendarPrefs.start_weekday || 'sunday'
          };
          
          setCalendarSettings(newSettings);
          
          // Set view mode based on user preference
          setViewMode(newSettings.defaultView as 'weekly' | 'daily' | 'monthly');
          
          console.log('🔍 EVENTS TAB: Loaded calendar settings:', calendarPrefs);
          console.log('🔍 EVENTS TAB: Set view mode to:', newSettings.defaultView);
        }
      } catch (error) {
        console.error('Error loading calendar settings:', error);
      }
    };

    loadCalendarSettings();
  }, []);

  // Update view mode when calendar settings change
  useEffect(() => {
    setViewMode(calendarSettings.defaultView as 'weekly' | 'daily' | 'monthly');
    console.log('🔍 EVENTS TAB: View mode updated to:', calendarSettings.defaultView);
  }, [calendarSettings.defaultView]);

  // Dynamic week days based on user preference
  const weekDays = calendarSettings.startWeekday === 'sunday' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const weekStartsOn = calendarSettings.startWeekday === 'sunday' ? 0 : 1;
  const weekStart = startOfWeek(currentWeek, { weekStartsOn });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn });
  const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        start_datetime: editingEvent.start_datetime,
        end_datetime: editingEvent.end_datetime,
        location: editingEvent.location,
        event_type: editingEvent.event_type,
        participants: editingEvent.participants,
        alert_minutes: editingEvent.alert_minutes,
        repeat_pattern: editingEvent.repeat_pattern,
        repeat_interval: editingEvent.repeat_interval,
        repeat_days: editingEvent.repeat_days,
        repeat_end_date: editingEvent.repeat_end_date,
        notes: editingEvent.notes
      });
    }
  }, [editingEvent]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const searchTerm = searchQuery.toLowerCase();
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.notes.toLowerCase().includes(searchTerm)
      );
      setFilteredEvents(filtered);
    }
  }, [events, searchQuery]);

  useEffect(() => {
    console.log('🚀 FRONTEND VERSION: 14.1 - FIX MONTHLY CALENDAR DATE ALIGNMENT');
    console.log('📅 EventsTab loaded with fixed monthly calendar date alignment!');
    fetchEvents();
    getCurrentUserEmail(); // Get current user email for owner checks
  }, [currentWeek, currentDay, currentMonth, viewMode]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let startDate: string;
      let endDate: string;
      
      switch (viewMode) {
        case 'daily':
          startDate = startOfDay(currentDay).toISOString();
          endDate = endOfDay(currentDay).toISOString();
          break;
        case 'monthly':
          startDate = startOfMonth(currentMonth).toISOString();
          endDate = endOfMonth(currentMonth).toISOString();
          break;
        case 'weekly':
        default:
          startDate = weekStart.toISOString();
          endDate = weekEnd.toISOString();
          break;
      }
      
      const { data, error } = await apiClient.getEvents(startDate, endDate);
      
      if (error) throw error;
      setEvents(data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { data, error } = await apiClient.createEvent(formData);
      
      if (error) throw error;
      setEvents([...events, data.event]);
      setIsAddDialogOpen(false);
      resetForm();
      onEventsChange?.(); // Trigger count update
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    
    try {
      const response = await apiClient.put(`/events/${editingEvent.id}`, formData);
      setEvents(events.map(event => 
        event.id === editingEvent.id ? response.data.event : event
      ));
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      onEventsChange?.(); // Trigger count update
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await apiClient.deleteEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      onEventsChange?.(); // Trigger count update
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_datetime: '',
      end_datetime: '',
      location: '',
      event_type: 'event',
      project: '',
      participants: [],
      alert_minutes: 15,
      repeat_pattern: 'none',
      repeat_interval: 1,
      repeat_days: [],
      repeat_end_date: null,
      notes: ''
    });
  };

  const openEditDialog = (event: Event) => {
    // Check if current user is the event owner
    if (currentUserEmail !== event.owner_email) {
      // If not owner, open view-only dialog
      openViewDialog(event);
      return;
    }
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      location: event.location,
      event_type: event.event_type,
      project: event.project,
      participants: event.participants,
      alert_minutes: event.alert_minutes,
      repeat_pattern: event.repeat_pattern,
      repeat_interval: event.repeat_interval,
      repeat_days: event.repeat_days,
      repeat_end_date: event.repeat_end_date,
      notes: event.notes
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (event: Event) => {
    setEditingEvent(event);
    setIsViewDialogOpen(true);
  };

  const addParticipant = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, { name: '', email: '' }]
    });
  };

  const updateParticipant = (index: number, field: 'name' | 'email', value: string) => {
    const updatedParticipants = [...formData.participants];
    updatedParticipants[index][field] = value;
    setFormData({ ...formData, participants: updatedParticipants });
  };

  const removeParticipant = (index: number) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter((_, i) => i !== index)
    });
  };

  const toggleRepeatDay = (day: number) => {
    const updatedDays = formData.repeat_days.includes(day)
      ? formData.repeat_days.filter(d => d !== day)
      : [...formData.repeat_days, day];
    setFormData({ ...formData, repeat_days: updatedDays });
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.start_datetime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date) => {
    // Show events for the clicked date
    const dateStr = format(date, 'yyyy-MM-dd');
    const eventsForDate = events.filter(event => {
      const eventDate = format(parseISO(event.start_datetime), 'yyyy-MM-dd');
      return eventDate === dateStr;
    });
    
    setSelectedDate(date);
    setSelectedDateEvents(eventsForDate);
    setIsEventDetailsOpen(true);
  };

  const handleDateRightClick = (date: Date, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent context menu
    
    // Set the form data with the clicked date and default values
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0); // Default to 10:00 AM
    
    setFormData({
      title: '',
      description: '',
      start_datetime: startDate.toISOString().slice(0, 16), // Format for datetime-local input
      end_datetime: endDate.toISOString().slice(0, 16),
      location: '',
      event_type: 'event',
      participants: [],
      alert_minutes: 15,
      repeat_pattern: 'none',
      repeat_interval: 1,
      repeat_days: [],
      repeat_end_date: null,
      notes: ''
    });
    
    setIsAddDialogOpen(true);
  };

  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const expandAllEvents = () => {
    setExpandedEvents(new Set(selectedDateEvents.map(event => event.id)));
  };

  const collapseAllEvents = () => {
    setExpandedEvents(new Set());
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' 
        ? subDays(prev, 7)
        : addDays(prev, 7)
    );
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDay(prev => 
      direction === 'prev' 
        ? subDays(prev, 1)
        : addDays(prev, 1)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-[5%]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Empty space for consistency with other tabs */}
        </div>
        
        <div className="flex items-center gap-3">
          {/* + button removed as requested */}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => {
          if (viewMode === 'daily') navigateDay('prev');
          else if (viewMode === 'weekly') navigateWeek('prev');
          else if (viewMode === 'monthly') navigateMonth('prev');
        }}>
          &lt;
        </Button>
        <h3 className="text-lg font-semibold">
          {viewMode === 'daily' && format(currentDay, 'EEEE, MMM d, yyyy')}
          {viewMode === 'weekly' && `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
          {viewMode === 'monthly' && format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button variant="outline" onClick={() => {
          if (viewMode === 'daily') navigateDay('next');
          else if (viewMode === 'weekly') navigateWeek('next');
          else if (viewMode === 'monthly') navigateMonth('next');
        }}>
          &gt;
        </Button>
      </div>

      {/* Calendar Views */}
      {console.log('Current viewMode:', viewMode)}
      {viewMode === 'daily' && (
        <div className="space-y-4 min-h-[600px]">
          <Card className={`border-2 border-gray-300 dark:border-gray-600 ${isToday(currentDay) ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${isToday(currentDay) ? 'text-primary font-bold' : ''}`}>
                {format(currentDay, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent 
              className="space-y-3 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => handleDateClick(currentDay)}
              onContextMenu={(e) => handleDateRightClick(currentDay, e)}
            >
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events scheduled for this day. Right-click to add an event.</p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:opacity-80 transition-all"
                    style={{
                      backgroundColor: getColorFromProject(event.project),
                      color: getTextColorFromBg(getColorFromProject(event.project))
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(event);
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      // Right-click on event does nothing - prevents opening add dialog
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{event.title}</h4>
                        <div className="text-sm font-medium text-primary">
                          {format(parseISO(event.start_datetime), 'HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                      )}
                      
                      {event.location && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                      )}
                      
                      {event.participants && event.participants.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Participants:</span> {event.participants.map(p => p.name || p.email).join(', ')}
                        </div>
                      )}
                      
                      {event.owner_email && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Owner:</span> {event.owner_email}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            return (
              <Card key={index} className={`min-h-[400px] border-2 border-gray-300 dark:border-gray-600 ${isToday(date) ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                    {weekDays[index]}
                  </CardTitle>
                  <div className={`text-xs ${isToday(date) ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {format(date, 'MMM d')}
                  </div>
                </CardHeader>
                <CardContent 
                  className="space-y-2 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleDateClick(date)}
                  onContextMenu={(e) => handleDateRightClick(date, e)}
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg text-xs cursor-pointer hover:opacity-80 mb-2 transition-all"
                      style={{
                        backgroundColor: getColorFromEventType(event.event_type),
                        color: getTextColorFromBg(getColorFromEventType(event.event_type))
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(event);
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        // Right-click on event does nothing - prevents opening add dialog
                      }}
                    >
                      <div className="font-medium text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(parseISO(event.start_datetime), 'HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground flex items-center mb-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  // Calculate the first day of the week that contains the first day of the month
                  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                  const firstDayOfWeek = new Date(firstDayOfMonth);
                  firstDayOfWeek.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
                  
                  const date = new Date(firstDayOfWeek);
                  date.setDate(firstDayOfWeek.getDate() + i);
                  
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  
                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] p-2 border-2 border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-muted/20 transition-colors ${
                        isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                      } ${isToday(date) ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleDateClick(date)}
                      onContextMenu={(e) => handleDateRightClick(date, e)}
                    >
                      <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs rounded px-1 truncate cursor-pointer hover:opacity-80 transition-all"
                            style={{
                              backgroundColor: getColorFromEventType(event.event_type),
                              color: getTextColorFromBg(getColorFromEventType(event.event_type))
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
                            }}
                            onContextMenu={(e) => {
                              e.stopPropagation();
                              // Right-click on event does nothing - prevents opening add dialog
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate">{event.title}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <p className="font-medium">{event.title}</p>
                                    <p className="text-sm">{event.description}</p>
                                    <p className="text-sm">{event.location && `📍 ${event.location}`}</p>
                                    <p className="text-sm">{format(parseISO(event.start_datetime), 'MMM dd, yyyy HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="flex justify-center">
        <Select value={viewMode} onValueChange={handleViewModeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start_datetime">Start Date & Time</Label>
                <Input
                  id="edit-start_datetime"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-end_datetime">End Date & Time</Label>
                <Input
                  id="edit-end_datetime"
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>

            <div>
              <Label htmlFor="edit-event-type">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(value: 'meeting' | 'event') => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-project">Project</Label>
              <Input
                id="edit-project"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label>Participants</Label>
              <UserSelector
                selectedUsers={formData.participants.map(p => ({ 
                  id: p.email, 
                  email: p.email, 
                  full_name: p.name || p.email 
                }))}
                onUsersChange={(users) => setFormData({ 
                  ...formData, 
                  participants: users.map(u => ({ name: u.full_name || u.email, email: u.email }))
                })}
                placeholder="Select participants for this event..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-alert_minutes">Alert (minutes before)</Label>
                <Select
                  value={formData.alert_minutes.toString()}
                  onValueChange={(value) => setFormData({ ...formData, alert_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-repeat_pattern">Repeat Pattern</Label>
                <Select
                  value={formData.repeat_pattern}
                  onValueChange={(value) => setFormData({ ...formData, repeat_pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.repeat_pattern === 'weekly' && (
              <div>
                <Label>Repeat on days</Label>
                <div className="flex gap-2 mt-2">
                  {weekDays.map((day, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={formData.repeat_days.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRepeatDay(index)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter additional notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => editingEvent && handleDeleteEvent(editingEvent.id)}>
                Delete
              </Button>
              <Button onClick={handleUpdateEvent}>
                Update Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-title">Event Title</Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            
            <div>
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-start-datetime">Start Date & Time</Label>
                <Input
                  id="add-start-datetime"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="add-end-datetime">End Date & Time</Label>
                <Input
                  id="add-end-datetime"
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="add-location">Location</Label>
              <Input
                id="add-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>

            <div>
              <Label htmlFor="add-event-type">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(value: 'meeting' | 'event') => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="add-project">Project</Label>
              <Input
                id="add-project"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label htmlFor="add-participants">Participants</Label>
              <UserSelector
                selectedUsers={formData.participants}
                onUsersChange={(users) => setFormData({ ...formData, participants: users })}
                placeholder="Select participants..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-alert-minutes">Alert (minutes before)</Label>
              <Input
                id="add-alert-minutes"
                type="number"
                value={formData.alert_minutes}
                onChange={(e) => setFormData({ ...formData, alert_minutes: parseInt(e.target.value) || 0 })}
                placeholder="15"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog (Read-only for non-owners) */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Event Title</Label>
                <p className="text-sm text-muted-foreground mt-1">{editingEvent.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Event Type</Label>
                <div className="mt-1">
                  <Badge 
                    variant={editingEvent.event_type === 'meeting' ? 'default' : 'secondary'}
                    style={{
                      backgroundColor: getColorFromProject(editingEvent.project),
                      color: getTextColorFromBg(getColorFromProject(editingEvent.project))
                    }}
                  >
                    {editingEvent.event_type}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{editingEvent.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date & Time</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(editingEvent.start_datetime), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date & Time</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(editingEvent.end_datetime), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {editingEvent.location && (
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {editingEvent.location}
                  </p>
                </div>
              )}
              
              {editingEvent.participants && editingEvent.participants.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Participants</Label>
                  <div className="mt-1 space-y-1">
                    {editingEvent.participants.map((participant, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {participant.name || participant.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {editingEvent.owner_email && (
                <div>
                  <Label className="text-sm font-medium">Event Owner</Label>
                  <p className="text-sm text-muted-foreground mt-1">{editingEvent.owner_email}</p>
                </div>
              )}
              
              {editingEvent.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{editingEvent.notes}</p>
                </div>
              )}
              
              {editingEvent.repeat_pattern && editingEvent.repeat_pattern !== 'none' && (
                <div>
                  <Label className="text-sm font-medium">Repeat Pattern</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingEvent.repeat_pattern} (every {editingEvent.repeat_interval} {editingEvent.repeat_pattern})
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Events for {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedDateEvents.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No events scheduled for this date</p>
                  <p className="text-sm">Right-click on any date to add a new event</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedDateEvents.map((event) => {
                    const isExpanded = expandedEvents.has(event.id);
                    const startTime = parseISO(event.start_datetime);
                    const endTime = parseISO(event.end_datetime);
                    
                    return (
                      <Card key={event.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <CardTitle className="text-base">{event.title}</CardTitle>
                              <Badge variant={event.event_type === 'meeting' ? 'default' : 'secondary'}>
                                {event.event_type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                              {event.description && (
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                </div>
                              )}
                              
                              {event.location && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <Label className="text-sm font-medium">Location</Label>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Event Owner */}
                              <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <Label className="text-sm font-medium">Event Owner</Label>
                                  <p className="text-sm text-muted-foreground">{event.owner_email || event.owner_id}</p>
                                </div>
                              </div>
                              
                              {/* Participants (excluding owner) */}
                              {event.participants && event.participants.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <Label className="text-sm font-medium">Participants</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {event.participants
                                        .filter(participant => participant.email !== event.owner_id)
                                        .map((participant, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {participant.name || participant.email}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {event.alert_minutes > 0 && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Alert {event.alert_minutes} minutes before
                                  </span>
                                </div>
                              )}
                              
                              {event.notes && (
                                <div>
                                  <Label className="text-sm font-medium">Notes</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-2">
                                {/* Only show Edit/Delete buttons if current user is the event owner */}
                                {currentUserEmail === event.owner_id && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingEvent(event);
                                        setIsEditDialogOpen(true);
                                        setIsEventDetailsOpen(false);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this event?')) {
                                          handleDeleteEvent(event.id);
                                          setIsEventDetailsOpen(false);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsTab;
