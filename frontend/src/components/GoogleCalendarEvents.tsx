import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface CalendarEvent {
  google_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: string[];
  creator: string;
  organizer: string;
}

interface GoogleCalendarEventsProps {
  onEventsSelected: (events: CalendarEvent[]) => void;
  onClose: () => void;
}

export const GoogleCalendarEvents: React.FC<GoogleCalendarEventsProps> = ({
  onEventsSelected,
  onClose
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    startWeekday: 'sunday'
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
          
          setCalendarSettings({
            startWeekday: calendarPrefs.startWeekday || calendarPrefs.start_weekday || 'sunday'
          });
          
          console.log('🔍 GOOGLE CALENDAR: Loaded calendar settings:', calendarPrefs);
        }
      } catch (error) {
        console.error('Error loading calendar settings:', error);
      }
    };

    loadCalendarSettings();
  }, []);
  
  const weekStartsOn = calendarSettings.startWeekday === 'sunday' ? 0 : 1;
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn }));
  const [weekEnd, setWeekEnd] = useState(endOfWeek(new Date(), { weekStartsOn }));

  useEffect(() => {
    fetchCalendarEvents();
  }, [weekStart]);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const timeMin = weekStart.toISOString();
      const timeMax = weekEnd.toISOString();
      
      const response = await fetch(
        `https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/calendar?time_min=${timeMin}&time_max=${timeMax}&max_results=50`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleAddSelectedEvents = () => {
    const selectedEventsList = events.filter(event => selectedEvents.has(event.google_id));
    onEventsSelected(selectedEventsList);
    onClose();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + days);
    setWeekStart(newWeekStart);
    setWeekEnd(endOfWeek(newWeekStart, { weekStartsOn }));
  };

  const getWeekDays = () => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === day.toDateString();
    });
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    // Check if it's an all-day event
    if (startTime.includes('T')) {
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    } else {
      return 'All day';
    }
  };

  const getEventPriority = (event: CalendarEvent) => {
    // Simple priority logic based on event characteristics
    if (event.attendees.length > 5) return 'high';
    if (event.location) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading calendar events...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            ← Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            Next Week →
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {getWeekDays().map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="space-y-2">
              <div className={`text-center text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'EEE')}
                <div className={`text-xs ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'dd')}
                </div>
              </div>
              <div className="space-y-1 min-h-[100px]">
                {dayEvents.map((event) => (
                  <div
                    key={event.google_id}
                    className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                      selectedEvents.has(event.google_id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-muted'
                    }`}
                    onClick={() => handleEventToggle(event.google_id)}
                  >
                    <div className="flex items-start gap-1">
                      <Checkbox
                        checked={selectedEvents.has(event.google_id)}
                        onChange={() => handleEventToggle(event.google_id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" title={event.title}>
                          {event.title}
                        </div>
                        <div className="text-muted-foreground">
                          {formatEventTime(event.start_time, event.end_time)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelectedEvents}
            disabled={selectedEvents.size === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Selected Events as Tasks
          </Button>
        </div>
      </div>
    </div>
  );
};
