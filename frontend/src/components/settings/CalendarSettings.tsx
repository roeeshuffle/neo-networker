import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarSettingsProps {
  currentUser?: any;
}

export const CalendarSettings: React.FC<CalendarSettingsProps> = ({ currentUser }) => {
  const [calendarSettings, setCalendarSettings] = useState({
    defaultView: 'monthly',
    startWeekday: 'sunday'
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data } = await apiClient.getUserPreferences();
      if (data?.preferences?.calendar_settings) {
        setCalendarSettings(data.preferences.calendar_settings);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const updateCalendarSettings = async (newSettings: any) => {
    setPreferencesLoading(true);
    try {
      const { error } = await apiClient.updateUserPreferences({
        calendar_settings: newSettings
      });
      if (error) throw error;

      setCalendarSettings(newSettings);
      toast({
        title: "Success",
        description: "Calendar settings updated successfully!",
      });
    } catch (error) {
      console.error('Error updating calendar settings:', error);
      toast({
        title: "Error",
        description: "Failed to update calendar settings",
        variant: "destructive"
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleDefaultViewChange = (value: string) => {
    const newSettings = { ...calendarSettings, defaultView: value };
    updateCalendarSettings(newSettings);
  };

  const handleStartWeekdayChange = (value: string) => {
    const newSettings = { ...calendarSettings, startWeekday: value };
    updateCalendarSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Calendar Settings</h3>
      </div>

      {/* Calendar Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Display Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default View */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Calendar View</label>
            <Select 
              value={calendarSettings.defaultView} 
              onValueChange={handleDefaultViewChange}
              disabled={preferencesLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly View</SelectItem>
                <SelectItem value="weekly">Weekly View</SelectItem>
                <SelectItem value="daily">Daily View</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how your calendar is displayed by default
            </p>
          </div>

          {/* Start Weekday */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Week Starts On</label>
            <Select 
              value={calendarSettings.startWeekday} 
              onValueChange={handleStartWeekdayChange}
              disabled={preferencesLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which day your week starts on
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your calendar is integrated with Google Calendar. Events synced from Google will appear in your calendar view.
            </p>
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Google Calendar Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Management */}
      <Card>
        <CardHeader>
          <CardTitle>Event Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your events and calendar data.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                Export Events
              </Button>
              <Button variant="outline" disabled>
                Import Events
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Event import/export features coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
