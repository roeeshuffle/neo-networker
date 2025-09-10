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

  const testBot = async () => {
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
      const { data, error } = await supabase.functions.invoke('telegram-simple', {
        body: { 
          action: 'send_message',
          chatId: chatId,
          message: '🚀 Bot is working! Your CRM bot is connected and ready.'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test message sent! Check your Telegram.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to send test message: ${error.message}`,
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

        {/* Test Bot */}
        <div className="space-y-2">
          <Button onClick={testBot} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test Bot Connection"}
          </Button>
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
          <Button onClick={searchContacts} disabled={loading} variant="outline">
            {loading ? "Searching..." : "Search Contacts"}
          </Button>
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