import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, CheckSquare, Calendar, Settings, User, RefreshCw, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SettingsTab } from '@/components/SettingsTab';
import alistLogo from '@/assets/alist-logo-new.svg';

const SettingsPage = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userPlan, setUserPlan] = useState<string>('Free');
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

  const loadData = async () => {
    try {
      await Promise.all([
        fetchUnreadNotificationsCount(),
        fetchUserPlan()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const { data } = await apiClient.getUnreadNotificationsCount();
      const count = data?.count || 0;
      setUnreadNotificationsCount(count);
      setHasNotifications(count > 0);
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const { data } = await apiClient.getUserPlan();
      setUserPlan(data?.plan || 'Free');
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const handleManualRefresh = async () => {
    await loadData();
    toast({
      title: "Success",
      description: "Data refreshed successfully!",
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAllTelegramUsers = async () => {
    try {
      const { error } = await apiClient.deleteAllTelegramUsers();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "All Telegram users deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting all Telegram users:', error);
      toast({
        title: "Error",
        description: "Failed to delete all Telegram users",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllPeople = async () => {
    try {
      const { error } = await apiClient.deleteAllPeople();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "All contacts deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting all people:', error);
      toast({
        title: "Error",
        description: "Failed to delete all contacts",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen bg-background-soft grid grid-rows-[auto_1fr_auto]">
      {/* Enterprise Header */}
      <header className="enterprise-header">
        <div className="px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
                  <img 
                    src={alistLogo} 
                    alt="Alist Logo" 
                    className="h-6 w-6 object-contain filter brightness-0 invert"
                  />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Alist</h1>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/contacts')}
                  className="nav-item"
                >
                  <User className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/tasks')}
                  className="nav-item"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/events')}
                  className="nav-item"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                  className="nav-item bg-secondary text-secondary-foreground"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
            
            {/* Right: Actions and User */}
            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleManualRefresh}
                  variant="ghost" 
                  size="sm"
                  className="w-9 h-9 p-0"
                  title="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <ThemeToggle />
                
                {/* Notifications Bell */}
                <Button 
                  onClick={() => navigate('/notifications')}
                  variant="ghost" 
                  size="sm"
                  className="w-9 h-9 p-0 relative"
                  title={`Notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
                >
                  <Bell className="h-4 w-4" />
                  {hasNotifications && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </Button>
                
                {user?.email && ['guy@wershuffle.com', 'roee2912@gmail.com'].includes(user.email) && (
                  <Button 
                    onClick={() => navigate('/admin')}
                    variant="ghost" 
                    size="sm"
                    className="w-9 h-9 p-0"
                    title="Admin Panel"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-9">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{user?.email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {userPlan === 'Pro' && <Crown className="w-3 h-3" />}
                        {userPlan === 'Enterprise' && <Building2 className="w-3 h-3" />}
                        {userPlan}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="overflow-auto" style={{ minHeight: 0 }}>
        <SettingsTab 
          currentUser={user}
          onDeleteAllTelegramUsers={handleDeleteAllTelegramUsers}
          onDeleteAllPeople={handleDeleteAllPeople}
        />
      </main>

      {/* Footer with legal links */}
      <footer className="border-t border-border bg-muted/30 py-6">
        <div className="px-12">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <a href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
            <div>
              © 2024 Alist. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;
