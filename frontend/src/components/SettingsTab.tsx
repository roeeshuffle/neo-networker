import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ChevronDown, ChevronRight, Trash2, Merge, Calendar, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { GoogleSyncPreviewDialog } from './GoogleSyncPreviewDialog';
import DuplicateManager from './DuplicateManager';
import CustomFieldsSettings from './CustomFieldsSettings';
import TableColumnsSettings from './TableColumnsSettings';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsTabProps {
  onDeleteAllTelegramUsers?: () => Promise<void>;
  onDeleteAllPeople?: () => Promise<void>;
  currentUser?: any;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  onDeleteAllTelegramUsers, 
  onDeleteAllPeople,
  currentUser 
}) => {
  const { refreshUser } = useAuth();
  const [telegramId, setTelegramId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState('telegram');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleContactsSynced, setGoogleContactsSynced] = useState(false);
  const [googleCalendarSynced, setGoogleCalendarSynced] = useState(false);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'contacts' | 'calendar'>('contacts');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Collapse/Expand state for settings sections
  const [expandedSections, setExpandedSections] = useState({
    telegram: false,
    whatsapp: false,
    google: false,
    contacts: false,
    calendar: false,
    customFields: false,
    tableColumns: false
  });

  // Loading state for initial data load
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Calendar settings
  const [calendarSettings, setCalendarSettings] = useState({
    defaultView: 'monthly',
    startWeekday: 'sunday'
  });
  
  // Loading state for preferences
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  
  // Contact management state
  const [showDuplicates, setShowDuplicates] = useState(false);

  const toggleSection = (section: 'telegram' | 'whatsapp' | 'google' | 'contacts' | 'calendar' | 'customFields' | 'tableColumns') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    console.log('🚀 FRONTEND VERSION: 16.0 - ENHANCED GOOGLE SYNC WITH SELECTION');
    console.log('🔧 SettingsTab loaded with user preferences backend integration!');
    checkAllStatus();
    loadUserPreferences();
  }, []);

  const checkAllStatus = async () => {
    try {
      console.log('🔍 Checking all status...');
      const { data: user } = await apiClient.getCurrentUser();
      console.log('👤 User data:', user);
      
      // Update Telegram status
      if (user?.telegram_id) {
        setTelegramConnected(true);
        setTelegramId(user.telegram_id.toString());
      } else {
        setTelegramConnected(false);
        setTelegramId('');
      }
      
      // Update WhatsApp status
      if (user?.whatsapp_phone_number) {
        console.log('✅ WhatsApp phone found:', user.whatsapp_phone_number);
        setWhatsappConnected(true);
        setWhatsappPhone(user.whatsapp_phone_number);
      } else {
        console.log('❌ No WhatsApp phone found');
        setWhatsappConnected(false);
        setWhatsappPhone('');
      }
      
      // Update preferred platform
      if (user?.preferred_messaging_platform) {
        console.log('📱 Preferred platform:', user.preferred_messaging_platform);
        setPreferredPlatform(user.preferred_messaging_platform);
      }
      
      // Check Google status separately (this might fail if Google Auth is not configured)
      checkGoogleStatus();
      
      // Set initial loading to false after data is loaded
      setInitialLoading(false);
      
    } catch (error) {
      console.error('❌ Error checking status:', error);
      setTelegramConnected(false);
      setTelegramId('');
      setWhatsappConnected(false);
      setWhatsappPhone('');
      setInitialLoading(false);
    }
  };

  // checkTelegramStatus removed - now handled by checkAllStatus

  const connectTelegram = async () => {
    if (!telegramId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram ID",
        variant: "destructive"
      });
      return;
    }

    setTelegramLoading(true);
    try {
      const { data, error } = await apiClient.connectTelegram(telegramId);
      if (error) throw error;

      // Check if this was a transfer
      if (data?.transferred_from) {
        toast({
          title: "Success",
          description: `Telegram account transferred from ${data.transferred_from}!`,
        });
      } else {
        toast({
          title: "Success",
          description: "Telegram account connected successfully!",
        });
      }
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkAllStatus();
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      toast({
        title: "Error",
        description: "Failed to connect Telegram account",
        variant: "destructive"
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const { error } = await apiClient.disconnectTelegram();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram account disconnected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkAllStatus();
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Telegram account",
        variant: "destructive"
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  // checkWhatsappStatus removed - now handled by checkAllStatus

  const connectWhatsapp = async () => {
    if (!whatsappPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp phone number",
        variant: "destructive"
      });
      return;
    }

    // Remove + prefix and clean the phone number
    const cleanPhone = whatsappPhone.replace(/^\+/, '').replace(/\s+/g, '').replace(/-/g, '');
    
    console.log('🔧 Connecting WhatsApp with phone:', cleanPhone);
    
    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.connectWhatsapp(cleanPhone);
      if (error) throw error;

      console.log('✅ WhatsApp connected successfully, refreshing user data...');

      toast({
        title: "Success",
        description: "WhatsApp account connected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkAllStatus();
      
      console.log('✅ User data refreshed, WhatsApp status checked');
    } catch (error) {
      console.error('❌ Error connecting WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to connect WhatsApp account",
        variant: "destructive"
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const disconnectWhatsapp = async () => {
    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.disconnectWhatsapp();
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account disconnected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkAllStatus();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp account",
        variant: "destructive"
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const previewGoogleContacts = async () => {
    try {
      setContactsLoading(true);
      setPreviewType('contacts');
      
      const response = await fetch('https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/preview-contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setPreviewData(result.preview_data || []);
        setPreviewDialogOpen(true);
      } else {
        const error = await response.json();
        toast({
          title: "Preview Failed",
          description: error.error || "Failed to preview contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error previewing contacts:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to preview contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setContactsLoading(false);
    }
  };

  const previewGoogleCalendar = async () => {
    try {
      setCalendarLoading(true);
      setPreviewType('calendar');
      
      const response = await fetch('https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/preview-calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setPreviewData(result.preview_data || []);
        setPreviewDialogOpen(true);
      } else {
        const error = await response.json();
        toast({
          title: "Preview Failed",
          description: error.error || "Failed to preview calendar events",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error previewing calendar:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to preview calendar events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handlePreviewApprove = async (selectedIndices: number[], showDuplicates: boolean) => {
    try {
      setPreviewLoading(true);
      
      const endpoint = previewType === 'contacts' 
        ? 'https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/sync-selected-contacts'
        : 'https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/sync-selected-calendar';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_indices: selectedIndices,
          show_duplicates: showDuplicates
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sync Successful",
          description: result.message || `Successfully synced ${previewType}`,
        });
        
        if (previewType === 'contacts') {
          setGoogleContactsSynced(true);
        } else {
          setGoogleCalendarSynced(true);
        }
        
        setPreviewDialogOpen(false);
        await checkGoogleStatus(); // Refresh status
      } else {
        const error = await response.json();
        toast({
          title: "Sync Failed",
          description: error.error || "Failed to sync data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewCancel = () => {
    setPreviewDialogOpen(false);
    setPreviewData([]);
  };

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch(`https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.has_google_account);
        setGoogleContactsSynced(!!data.contacts_synced_at);
        setGoogleCalendarSynced(!!data.calendar_synced_at);
      } else {
        // Google Auth might not be configured - this is OK
        console.log('Google Auth not configured or not available');
        setGoogleConnected(false);
        setGoogleContactsSynced(false);
        setGoogleCalendarSynced(false);
      }
    } catch (error) {
      // Google Auth might not be configured - this is OK, don't log as error
      console.log('Google Auth not available:', error.message);
      setGoogleConnected(false);
      setGoogleContactsSynced(false);
      setGoogleCalendarSynced(false);
    }
  };

  const connectGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Get Google OAuth authorization URL
      const response = await fetch(`https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Google authentication');
      }

      const data = await response.json();
      const { authorization_url } = data;

      // Open Google OAuth in a popup window
      const popup = window.open(
        authorization_url,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setGoogleLoading(false);
          checkGoogleStatus(); // Refresh status
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          toast({
            title: "Success",
            description: "Google account connected successfully!",
          });
          
          checkGoogleStatus();
          setGoogleLoading(false);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          toast({
            title: "Google Auth Failed",
            description: event.data.error || "Authentication failed",
            variant: "destructive",
          });
          setGoogleLoading(false);
        }
      };

      window.addEventListener('message', messageListener);

    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast({
        title: "Error", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect Google account');
      }

      toast({
        title: "Success",
        description: "Google account disconnected successfully!",
      });
      
      await refreshUser();
      await checkGoogleStatus();
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Google account",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const syncGoogleContacts = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/sync-contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync contacts');
      }

      const data = await response.json();
      toast({
        title: "Contacts Synced",
        description: data.message,
      });
      
      await checkGoogleStatus();
    } catch (error: any) {
      console.error('Error syncing Google contacts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync Google contacts",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };


  const updatePreferredPlatform = async (platform: string) => {
    try {
      const { error } = await apiClient.updatePreferredPlatform(platform);
      if (error) throw error;

      setPreferredPlatform(platform);
      toast({
        title: "Success",
        description: `Preferred messaging platform updated to ${platform}`,
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Error updating preferred platform:', error);
      toast({
        title: "Error",
        description: "Failed to update preferred platform",
        variant: "destructive"
      });
    }
  };

  // Contact Management Functions
  const handleDeleteAllContacts = async () => {
    try {
      // Get all people first, then delete them one by one
      const { data: people, error: fetchError } = await apiClient.getPeople();
      if (fetchError) throw fetchError;
      
      // Delete all people
      for (const person of people || []) {
        const { error } = await apiClient.deletePerson(person.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "All contacts have been deleted.",
      });

      // Call the parent refresh function if provided
      if (onDeleteAllPeople) {
        await onDeleteAllPeople();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting contacts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicatesRemoved = () => {
    setShowDuplicates(false);
    // Call the parent refresh function if provided
    if (onDeleteAllPeople) {
      onDeleteAllPeople();
    }
  };

  // Load user preferences from backend
  const loadUserPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await fetch('https://dkdrn34xpx.us-east-1.awsapprunner.com/api/user/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const preferences = data.preferences || {};
        
        // Update calendar settings if available
        if (preferences.calendar) {
          setCalendarSettings(prev => ({
            ...prev,
            ...preferences.calendar
          }));
        }
        
        console.log('✅ User preferences loaded:', preferences);
      } else {
        console.log('⚠️ User preferences API not available, using defaults');
      }
    } catch (error) {
      console.log('⚠️ User preferences API not available, using defaults');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Save user preferences to backend
  const saveUserPreferences = async (category: string, settings: any) => {
    try {
      setPreferencesLoading(true);
      const response = await fetch('https://dkdrn34xpx.us-east-1.awsapprunner.com/api/user/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          settings
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User preferences saved:', data);
        return true;
      } else {
        console.log('⚠️ User preferences API not available, saving locally');
        // Save to localStorage as fallback
        localStorage.setItem(`user_preferences_${category}`, JSON.stringify(settings));
        return true;
      }
    } catch (error) {
      console.log('⚠️ User preferences API not available, saving locally');
      // Save to localStorage as fallback
      localStorage.setItem(`user_preferences_${category}`, JSON.stringify(settings));
      return true;
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Calendar Settings Functions
  const updateCalendarSettings = async (key: string, value: string) => {
    const newSettings = {
      ...calendarSettings,
      [key]: value
    };
    
    setCalendarSettings(newSettings);
    
    // Save to backend
    const success = await saveUserPreferences('calendar', newSettings);
    
    if (success) {
      toast({
        title: "Settings Updated",
        description: `Calendar ${key} updated to ${value}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save calendar settings",
        variant: "destructive",
      });
    }
  };


  // Debug current state before rendering
  console.log('🎨 Rendering SettingsTab with state:', {
    whatsappConnected,
    whatsappPhone,
    preferredPlatform
  });

  // Show duplicates manager if active
  if (showDuplicates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowDuplicates(false)}
          >
            ← Back to Settings
          </Button>
        </div>
        <DuplicateManager 
          onDuplicatesRemoved={handleDuplicatesRemoved} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messaging Platform Connection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Bot Connection
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your Telegram and WhatsApp accounts to receive bot messages
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('telegram')}
              className="p-1 h-auto"
            >
              {expandedSections.telegram ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.telegram && (
          <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Preferred Messaging Platform</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="telegram"
                  checked={preferredPlatform === 'telegram'}
                  onChange={(e) => updatePreferredPlatform(e.target.value)}
                  disabled={initialLoading}
                  className="w-4 h-4"
                />
                <span className="text-sm">Telegram</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="whatsapp"
                  checked={preferredPlatform === 'whatsapp'}
                  onChange={(e) => updatePreferredPlatform(e.target.value)}
                  disabled={initialLoading}
                  className="w-4 h-4"
                />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which platform to use for bot messages (you can connect both)
            </p>
          </div>

          {/* Telegram Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">Telegram Connection</span>
                {initialLoading && <span className="text-xs text-muted-foreground">(Loading...)</span>}
              </div>
            </div>
            <div className="space-y-4">
            {initialLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading connection status...</p>
              </div>
            ) : telegramConnected ? (
              <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-800">Telegram Connected</div>
                  <div className="text-sm text-green-600">ID: {telegramId}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectTelegram}
                  disabled={telegramLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Telegram User ID</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    To get your Telegram ID, message @userinfobot on Telegram
                  </p>
                  <Input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Enter your Telegram ID"
                  />
                </div>
                <Button
                  onClick={connectTelegram}
                  disabled={telegramLoading || !telegramId.trim()}
                  className="w-full"
                >
                  {telegramLoading ? 'Connecting...' : 'Connect Telegram'}
                </Button>
              </div>
            )}
            </div>
          </div>

          {/* WhatsApp Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">WhatsApp Connection</span>
                {initialLoading && <span className="text-xs text-muted-foreground">(Loading...)</span>}
              </div>
            </div>
            <div className="space-y-4">
            {initialLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading connection status...</p>
              </div>
            ) : whatsappConnected ? (
              <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-800">WhatsApp Connected</div>
                  <div className="text-sm text-green-600">Phone: {whatsappPhone}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWhatsapp}
                  disabled={whatsappLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">WhatsApp Phone Number</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter your WhatsApp phone number (with country code, e.g., +1234567890)
                  </p>
                  <Input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <Button
                  onClick={connectWhatsapp}
                  disabled={whatsappLoading || !whatsappPhone.trim()}
                  className="w-full"
                >
                  {whatsappLoading ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              </div>
            )}
            </div>
          </div>

          {/* Connection Status */}
          <div className="text-xs text-muted-foreground">
            <p>• You can connect both Telegram and WhatsApp simultaneously</p>
            <p>• Choose your preferred platform for bot messages using the radio buttons above</p>
            <p>• Phone numbers are automatically cleaned (removes + prefix and spaces)</p>
          </div>
          </CardContent>
        )}
      </Card>

      {/* Google Integration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your Google account to sync contacts and calendar events
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('google')}
              className="p-1 h-auto"
            >
              {expandedSections.google ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.google && (
          <CardContent className="space-y-6">
          {/* Google Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">Google Account</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('google')}
                className="p-1 h-auto"
              >
                {expandedSections.google ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
            {expandedSections.google && (
              <div className="space-y-4">
            {googleConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium text-green-800">Google Connected</div>
                    <div className="text-sm text-green-600">Account linked successfully</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectGoogle}
                    disabled={googleLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
                
                {/* Sync Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <div className="font-medium">Google Contacts</div>
                      <div className="text-sm text-muted-foreground">
                        {googleContactsSynced ? 'Last synced' : 'Not synced yet'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previewGoogleContacts}
                      disabled={contactsLoading}
                    >
                      {contactsLoading ? 'Loading...' : 'Preview & Sync Contacts'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-muted-foreground">
                        {googleCalendarSynced ? 'Last synced' : 'Not synced yet'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previewGoogleCalendar}
                      disabled={calendarLoading}
                    >
                      {calendarLoading ? 'Loading...' : 'Preview & Sync Calendar'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Connect your Google account to access contacts and calendar events. 
                  This will allow you to sync your Google data with the CRM.
                </div>
                <Button
                  onClick={connectGoogle}
                  disabled={googleLoading}
                  className="w-full"
                >
                  {googleLoading ? 'Connecting...' : 'Connect Google Account'}
                </Button>
              </div>
            )}
              </div>
            )}
          </div>

          {/* Google Integration Info */}
          <div className="text-xs text-muted-foreground">
            <p>• Google integration requires calendar and contacts permissions</p>
            <p>• Your data is synced securely and stored in your CRM account</p>
            <p>• You can disconnect your Google account at any time</p>
          </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contact Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your contacts with bulk operations and duplicate removal
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('contacts')}
              className="p-1 h-auto"
            >
              {expandedSections.contacts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.contacts && (
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowDuplicates(true)}
                className="flex items-center gap-2"
              >
                <Merge className="w-4 h-4" />
                Remove Duplicates
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete All Contacts
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all contacts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllContacts}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>• Remove Duplicates: Find and merge duplicate contact records</p>
              <p>• Delete All Contacts: Permanently remove all contacts from your account</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Calendar Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendar Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your calendar display preferences
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('calendar')}
              className="p-1 h-auto"
            >
              {expandedSections.calendar ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.calendar && (
          <CardContent className="space-y-4">
            {preferencesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading preferences...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default View</label>
                  <Select 
                    value={calendarSettings.defaultView} 
                    onValueChange={(value) => updateCalendarSettings('defaultView', value)}
                    disabled={preferencesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Weekday</label>
                  <Select 
                    value={calendarSettings.startWeekday} 
                    onValueChange={(value) => updateCalendarSettings('startWeekday', value)}
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
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <p>• Default View: Choose how the calendar displays by default</p>
              <p>• Start Weekday: Choose which day the week starts on</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Custom Fields Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Custom Fields
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create custom fields to store additional information about your contacts
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('customFields')}
              className="p-1 h-auto"
            >
              {expandedSections.customFields ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.customFields && (
          <CardContent>
            <CustomFieldsSettings 
              isOpen={expandedSections.customFields}
              onClose={() => setExpandedSections(prev => ({ ...prev, customFields: false }))}
            />
          </CardContent>
        )}
      </Card>

      {/* Table Columns Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Table Columns
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which columns to display in the contacts table
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('tableColumns')}
              className="p-1 h-auto"
            >
              {expandedSections.tableColumns ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.tableColumns && (
          <CardContent>
            <TableColumnsSettings 
              isOpen={expandedSections.tableColumns}
              onClose={() => setExpandedSections(prev => ({ ...prev, tableColumns: false }))}
            />
          </CardContent>
        )}
      </Card>
      
      {/* Preview Dialog */}
      <GoogleSyncPreviewDialog
        isOpen={previewDialogOpen}
        onClose={handlePreviewCancel}
        type={previewType}
        previewData={previewData}
        onApprove={handlePreviewApprove}
        onCancel={handlePreviewCancel}
        isLoading={previewLoading}
      />
    </div>
  );
};
