import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { LogOut, Check, X, Clock, Users, Upload, Trash2, ArrowLeft, Settings } from "lucide-react";
import { CsvUploader } from "@/components/CsvUploader";
import { SettingsTab } from "@/components/SettingsTab";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          checkAdminAccess(session.user.email);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkAdminAccess(session.user.email);
        setupRealtimeSubscription();
      setupRealtimeSubscription();
      }
    });

    return () => {
      subscription.unsubscribe();
      // Clean up realtime subscription if it exists
      if (typeof window !== 'undefined') {
        supabase.removeAllChannels();
      }
    };
  }, [navigate]);

  const setupRealtimeSubscription = () => {
    console.log("Setting up realtime subscription for profiles");
    
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles table changed:', payload);
          // Refresh the user list when profiles change
          fetchPendingUsers();
        }
      )
      .subscribe();

    return channel;
  };

  const checkAdminAccess = (email: string | undefined) => {
    if (email !== 'guy@wershuffle.com') {
      toast({
        title: "Access Denied",
        description: "You don't have admin access.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    fetchPendingUsers();
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users as admin:", user?.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log("Fetch result:", { data, error });

      if (error) throw error;

      setPendingUsers(data || []);
    } catch (error: any) {
      console.error("Error details:", error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approved: boolean, userEmail: string, userName: string) => {
    try {
      setProcessingUser(userId);
      
      // Update user approval status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_approved: approved,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: approved ? "User Approved" : "User Denied",
        description: `${userName} has been ${approved ? 'approved' : 'denied'}.`,
      });

      // Refresh the list
      fetchPendingUsers();
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteAllPeople = async () => {
    if (!confirm("Are you sure you want to delete ALL people data? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "All people data has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDataLoaded = () => {
    // Refresh or notify that data has been loaded
    toast({
      title: "Success",
      description: "CSV data has been imported successfully.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingCount = pendingUsers.filter(u => !u.is_approved).length;
  const approvedCount = pendingUsers.filter(u => u.is_approved).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/756c1423-2a04-4806-8117-719d07336118.png" 
                alt="VCrm Logo" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold">VCrm Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage user approvals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Admin: {user?.email}
              </span>
              <div className="flex gap-2">
                <CsvUploader onDataLoaded={handleDataLoaded} />
                <Button variant="destructive" onClick={handleDeleteAllPeople}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Data
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-2 bg-muted">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </div>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingUsers.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser) => (
                      <div key={pendingUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{pendingUser.full_name}</p>
                              <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Registered: {formatDate(pendingUser.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant={pendingUser.is_approved ? "default" : "secondary"}>
                            {pendingUser.is_approved ? "Approved" : "Pending"}
                          </Badge>
                          
                          {!pendingUser.is_approved && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproval(pendingUser.id, true, pendingUser.email, pendingUser.full_name)}
                                disabled={processingUser === pendingUser.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproval(pendingUser.id, false, pendingUser.email, pendingUser.full_name)}
                                disabled={processingUser === pendingUser.id}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;