import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BotSetup = () => {
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { toast } = useToast();

  const testBotAuth = async () => {
    if (!chatId) {
      toast({
        title: "Error",
        description: "Please enter your Telegram Chat ID first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate /start command
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'handle_command',
          chatId: chatId,
          telegramId: parseInt(chatId),
          command: '/start',
          message: '/start'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bot authentication started! Check your Telegram for the password prompt.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to start bot auth: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testBotPassword = async () => {
    if (!chatId) {
      toast({
        title: "Error",
        description: "Please enter your Telegram Chat ID first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Send password "121212"
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'handle_command',
          chatId: chatId,
          telegramId: parseInt(chatId),
          command: 'authenticate',
          message: '121212'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Authentication sent! You should now be authenticated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to authenticate: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCustomMessage = async () => {
    if (!chatId || !message) {
      toast({
        title: "Error",
        description: "Please enter both Chat ID and message",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'send_message',
          chatId: chatId,
          message: message
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
      setMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testBotSearch = async () => {
    if (!chatId || !searchQuery) {
      toast({
        title: "Error",
        description: "Please enter your Chat ID and a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Send search command
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'handle_command',
          chatId: chatId,
          telegramId: parseInt(chatId),
          command: 'search',
          message: searchQuery
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Search command sent! Check your Telegram for results.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to search: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchContacts = async () => {
    if (!searchQuery) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'search_people',
          query: searchQuery
        }
      });

      if (error) throw error;

      setSearchResults(data.results);
      toast({
        title: "Success",
        description: `Found ${data.results.length} contacts`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Search failed: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Simple Telegram Bot</CardTitle>
        <CardDescription>Send messages and search contacts directly via Telegram API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chat ID Setup */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Telegram Chat ID:</label>
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Enter your Telegram Chat ID (e.g., 123456789)"
          />
          <p className="text-xs text-gray-500">
            Get your Chat ID by messaging @userinfobot on Telegram
          </p>
        </div>

        {/* Bot Authentication */}
        <div className="space-y-2">
          <Button onClick={testBotAuth} disabled={loading} className="w-full">
            {loading ? "Starting..." : "1. Start Bot (/start)"}
          </Button>
          <Button onClick={testBotPassword} disabled={loading} className="w-full" variant="outline">
            {loading ? "Authenticating..." : "2. Send Password (121212)"}
          </Button>
          <p className="text-xs text-gray-500">
            Step 1: Click "Start Bot" to initiate authentication<br/>
            Step 2: Click "Send Password" to authenticate with password "121212"
          </p>
        </div>

        {/* Send Custom Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Send Custom Message:</label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
          />
          <Button onClick={sendCustomMessage} disabled={loading} variant="outline">
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </div>

        {/* Search Contacts */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Contacts:</label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, email..."
          />
          <div className="flex space-x-2">
            <Button onClick={searchContacts} disabled={loading} variant="outline" className="flex-1">
              {loading ? "Searching..." : "Search via API"}
            </Button>
            <Button onClick={testBotSearch} disabled={loading} variant="outline" className="flex-1">
              {loading ? "Sending..." : "Search via Bot"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            API search shows results here. Bot search sends to Telegram.
          </p>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Search Results:</h4>
            {searchResults.map((person: any, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded border">
                <p><strong>{person.full_name}</strong></p>
                {person.company && <p>🏢 {person.company}</p>}
                {person.email && <p>📧 {person.email}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};