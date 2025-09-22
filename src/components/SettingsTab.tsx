import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Merge, Trash2, Eye, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface Person {
  id: string;
  full_name: string;
  email?: string;
  company?: string;
  linkedin_profile?: string;
  categories?: string;
  status?: string;
  created_at: string;
}

interface Duplicate {
  full_name: string;
  people: Person[];
}

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
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);
  const [telegramId, setTelegramId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState('telegram');

  useEffect(() => {
    console.log('🔧 SettingsTab loaded with WhatsApp support!');
    fetchDuplicates();
    checkTelegramStatus();
    checkWhatsappStatus();
  }, []);

  const checkTelegramStatus = async () => {
    try {
      const { data: user } = await apiClient.getCurrentUser();
      if (user?.telegram_id) {
        setTelegramConnected(true);
        setTelegramId(user.telegram_id.toString());
      } else {
        setTelegramConnected(false);
        setTelegramId('');
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
      setTelegramConnected(false);
      setTelegramId('');
    }
  };

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
      const { error } = await apiClient.connectTelegram(telegramId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram account connected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkTelegramStatus();
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
      await checkTelegramStatus();
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

  const checkWhatsappStatus = async () => {
    try {
      const { data: user } = await apiClient.getCurrentUser();
      if (user?.whatsapp_phone) {
        setWhatsappConnected(true);
        setWhatsappPhone(user.whatsapp_phone);
      } else {
        setWhatsappConnected(false);
        setWhatsappPhone('');
      }
      if (user?.preferred_messaging_platform) {
        setPreferredPlatform(user.preferred_messaging_platform);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappConnected(false);
      setWhatsappPhone('');
    }
  };

  const connectWhatsapp = async () => {
    if (!whatsappPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp phone number",
        variant: "destructive"
      });
      return;
    }

    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.connectWhatsapp(whatsappPhone);
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account connected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkWhatsappStatus();
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
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
      await checkWhatsappStatus();
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

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient.getPeople();

      if (error) throw error;

      // Group by full_name and find duplicates
      const grouped: { [key: string]: Person[] } = {};
      data?.forEach((person) => {
        const key = person.full_name.toLowerCase().trim();
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(person);
      });

      // Filter only groups with more than one person
      const duplicateGroups = Object.entries(grouped)
        .filter(([_, people]) => people.length > 1)
        .map(([name, people]) => ({
          full_name: people[0].full_name, // Use original case
          people: people.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }));

      setDuplicates(duplicateGroups);
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch duplicate records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoMergeAll = async () => {
    setMergeLoading(true);
    let mergedCount = 0;
    let errorCount = 0;

    try {
      for (const duplicate of duplicates) {
        // Check if all people in this group have identical field values
        const people = duplicate.people;
        const firstPerson = people[0];
        
        const allIdentical = people.every(person => 
          person.email === firstPerson.email &&
          person.company === firstPerson.company &&
          person.linkedin_profile === firstPerson.linkedin_profile &&
          person.categories === firstPerson.categories &&
          person.status === firstPerson.status
        );

        if (allIdentical && people.length > 1) {
          try {
            // Keep the oldest record, delete the rest
            const toDelete = people.slice(1);
            
            for (const person of toDelete) {
              const { error } = await apiClient.deletePerson(person.id);
              if (error) throw error;
            }
            
            mergedCount++;
          } catch (error) {
            console.error(`Error merging ${duplicate.full_name}:`, error);
            errorCount++;
          }
        }
      }

      toast({
        title: "Auto-merge Complete",
        description: `Merged ${mergedCount} duplicate groups${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      });

      // Refresh the duplicates list
      fetchDuplicates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete auto-merge",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const mergeDuplicate = async (duplicate: Duplicate, keepIndex: number) => {
    try {
      setMergeLoading(true);
      const toKeep = duplicate.people[keepIndex];
      const toDelete = duplicate.people.filter((_, i) => i !== keepIndex);

      for (const person of toDelete) {
        const { error } = await apiClient.deletePerson(person.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Merged ${duplicate.full_name} records, kept record from ${new Date(toKeep.created_at).toLocaleDateString()}`,
      });

      setSelectedDuplicate(null);
      fetchDuplicates();
    } catch (error) {
      console.error('Error merging duplicate:', error);
      toast({
        title: "Error",
        description: "Failed to merge duplicate records",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const deleteAllDuplicates = async (duplicate: Duplicate) => {
    try {
      setMergeLoading(true);
      
      for (const person of duplicate.people) {
        const { error } = await apiClient.deletePerson(person.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Deleted all records for ${duplicate.full_name}`,
      });

      setSelectedDuplicate(null);
      fetchDuplicates();
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to delete duplicate records",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  const areRecordsIdentical = (people: Person[]): boolean => {
    if (people.length <= 1) return true;
    
    const first = people[0];
    return people.every(person => 
      person.email === first.email &&
      person.company === first.company &&
      person.linkedin_profile === first.linkedin_profile &&
      person.categories === first.categories &&
      person.status === first.status
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-lg">Loading duplicate records...</div>
        </CardContent>
      </Card>
    );
  }

  const identicalDuplicates = duplicates.filter(d => areRecordsIdentical(d.people));
  const nonIdenticalDuplicates = duplicates.filter(d => !areRecordsIdentical(d.people));

  return (
    <div className="space-y-6 relative">
      {/* Processing Overlay */}
      {mergeLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Processing duplicates...</p>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Platform Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Bot Connection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose your preferred messaging platform and connect your account
          </p>
        </CardHeader>
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
                  className="w-4 h-4"
                />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Telegram Connection */}
          {preferredPlatform === 'telegram' && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">Telegram Connection</span>
              </div>
              {telegramConnected ? (
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
          )}

          {/* WhatsApp Connection */}
          {preferredPlatform === 'whatsapp' && (
            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">WhatsApp Connection</span>
              </div>
              {whatsappConnected ? (
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
          )}

          {/* Connection Status */}
          <div className="text-xs text-muted-foreground">
            <p>• You can only be connected to one platform at a time</p>
            <p>• To switch platforms, disconnect from the current one first</p>
            <p>• Your bot messages will be sent via the connected platform</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicates Management</h2>
          <p className="text-muted-foreground">Manage duplicate people records</p>
        </div>
        
        <div className="flex gap-2">
          {identicalDuplicates.length > 0 && (
            <Button 
              onClick={autoMergeAll}
              disabled={mergeLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Merge className="w-4 h-4 mr-2" />
              Auto-Merge Identical ({identicalDuplicates.length})
            </Button>
          )}
          <Button 
            onClick={autoMergeAll}
            disabled={mergeLoading || duplicates.length === 0}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Merge className="w-4 h-4 mr-2" />
            Merge All Equals Records
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duplicates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{duplicates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Mergeable</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{identicalDuplicates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{nonIdenticalDuplicates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Identical Duplicates */}
        {identicalDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Auto-Mergeable Duplicates ({identicalDuplicates.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These records have identical field values and can be automatically merged
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {identicalDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium">{duplicate.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {duplicate.people.length} identical records
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Auto-mergeable
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Non-identical Duplicates */}
        {nonIdenticalDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Manual Review Required ({nonIdenticalDuplicates.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These records have different field values and require manual review
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {nonIdenticalDuplicates.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{duplicate.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {duplicate.people.length} records with different data
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDuplicate(duplicate)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Duplicates: {duplicate.full_name}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedDuplicate && (
                          <div className="space-y-4">
                            {selectedDuplicate.people.map((person, personIndex) => (
                              <Card key={person.id}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                      Record {personIndex + 1}
                                      <Badge variant="outline" className="ml-2">
                                        Added {new Date(person.created_at).toLocaleDateString()}
                                      </Badge>
                                    </CardTitle>
                                    <div className="flex gap-2">
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => mergeDuplicate(selectedDuplicate, personIndex)}
                                         disabled={mergeLoading}
                                       >
                                        <Merge className="w-4 h-4 mr-1" />
                                        Keep This
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Email:</span> {person.email || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Company:</span> {person.company || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Categories:</span> {person.categories || 'Not provided'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Status:</span> {person.status || 'Not provided'}
                                    </div>
                                    <div className="col-span-2">
                                      <span className="font-medium">LinkedIn:</span> {person.linkedin_profile || 'Not provided'}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            
                            <Separator />
                            
                            <div className="flex justify-center">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete All Records
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete All Records</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete all {selectedDuplicate.people.length} records for {selectedDuplicate.full_name}. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteAllDuplicates(selectedDuplicate)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete All
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {duplicates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Duplicates Found</h3>
              <p className="text-muted-foreground text-center">
                Great! Your database doesn't have any duplicate people records.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Admin Actions */}
        {(onDeleteAllTelegramUsers || onDeleteAllPeople) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These actions are irreversible. Please proceed with caution.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {onDeleteAllTelegramUsers && (
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <div className="font-medium">Delete All Telegram Users</div>
                    <div className="text-sm text-muted-foreground">
                      Permanently remove all telegram user data from the system
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Telegram Users
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Telegram Users</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL telegram users from the system. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onDeleteAllTelegramUsers}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {onDeleteAllPeople && (
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <div className="font-medium">Delete All People Data</div>
                    <div className="text-sm text-muted-foreground">
                      Permanently remove all contact data from the system
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All People Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL people data from the system. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onDeleteAllPeople}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
