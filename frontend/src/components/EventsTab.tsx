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

interface Event {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  event_type: 'meeting' | 'event';
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
}

interface EventFormData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  event_type: 'meeting' | 'event';
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
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
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
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      location: event.location,
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
    // Set the form data with the clicked date
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0); // Default to 10:00 AM
    
    setFormData({
      ...formData,
      start_datetime: startDate.toISOString().slice(0, 16), // Format for datetime-local input
      end_datetime: endDate.toISOString().slice(0, 16),
    });
    
    setIsAddDialogOpen(true);
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
        <div className="space-y-4">
          <Card className={`border-2 border-gray-300 dark:border-gray-600 ${isToday(currentDay) ? 'ring-2 ring-primary bg-primary-soft' : ''}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${isToday(currentDay) ? 'text-primary font-bold' : ''}`}>
                {format(currentDay, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent 
              className="space-y-3 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => handleDateClick(currentDay)}
            >
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events scheduled for this day. Click to add an event.</p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(event);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h4 className="font-medium">{event.title}</h4>
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
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {format(parseISO(event.start_datetime), 'HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}
                        </div>
                        {event.location && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
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
              <Card key={index} className={`min-h-[200px] border-2 border-gray-300 dark:border-gray-600 ${isToday(date) ? 'ring-2 ring-primary bg-primary-soft' : ''}`}>
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
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 bg-blue-50 rounded text-xs cursor-pointer hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(event);
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-medium truncate">{event.title}</div>
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
                      <div className="text-muted-foreground">
                        {format(parseISO(event.start_datetime), 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-muted-foreground truncate">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {event.location}
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
                      } ${isToday(date) ? 'ring-2 ring-primary bg-primary-soft' : ''}`}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs bg-blue-100 text-blue-800 rounded px-1 truncate cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
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
    </div>
  );
};

export default EventsTab;
