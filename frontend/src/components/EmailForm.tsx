import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/integrations/api/client';

interface EmailFormProps {
  onClose: () => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({ onClose }) => {
  const [emailType, setEmailType] = useState<'single' | 'bulk'>('single');
  const [userEmail, setUserEmail] = useState('');
  const [userEmails, setUserEmails] = useState('');
  const [notificationType, setNotificationType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Message is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (emailType === 'single') {
        if (!userEmail.trim()) {
          toast({
            title: "Error",
            description: "User email is required",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const response = await apiClient.request('/email/send-notification', {
          method: 'POST',
          body: JSON.stringify({
            user_email: userEmail,
            notification_type: notificationType,
            message: message,
          }),
        });

        if (response.data) {
          toast({
            title: "Success",
            description: "Email sent successfully",
          });
          onClose();
        } else {
          throw new Error(response.error?.message || 'Failed to send email');
        }
      } else {
        if (!userEmails.trim()) {
          toast({
            title: "Error",
            description: "User emails are required",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!subject.trim()) {
          toast({
            title: "Error",
            description: "Subject is required for bulk emails",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const emailList = userEmails.split(',').map(email => email.trim()).filter(email => email);
        
        const response = await apiClient.request('/email/send-bulk', {
          method: 'POST',
          body: JSON.stringify({
            user_emails: emailList,
            subject: subject,
            message: message,
          }),
        });

        if (response.data) {
          toast({
            title: "Success",
            description: `Email sent to ${emailList.length} users successfully`,
          });
          onClose();
        } else {
          throw new Error(response.error?.message || 'Failed to send emails');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);

    try {
      const response = await apiClient.request('/email/test', {
        method: 'POST',
      });

      if (response.data) {
        toast({
          title: "Success",
          description: "Test email sent successfully",
        });
      } else {
        throw new Error(response.error?.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Email from alerts@weralist.com</CardTitle>
        <CardDescription>
          Send notification emails to your webapp users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emailType">Email Type</Label>
          <Select value={emailType} onValueChange={(value: 'single' | 'bulk') => setEmailType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single User</SelectItem>
              <SelectItem value="bulk">Multiple Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {emailType === 'single' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationType">Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task_assigned">Task Assigned</SelectItem>
                  <SelectItem value="contact_shared">Contact Shared</SelectItem>
                  <SelectItem value="event_created">Event Created</SelectItem>
                  <SelectItem value="group_invitation">Group Invitation</SelectItem>
                  <SelectItem value="general">General Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="userEmails">User Emails (comma-separated)</Label>
              <Textarea
                id="userEmails"
                placeholder="user1@example.com, user2@example.com, user3@example.com"
                value={userEmails}
                onChange={(e) => setUserEmails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSendEmail} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
          <Button 
            onClick={handleTestEmail} 
            disabled={loading}
            variant="outline"
          >
            Test Email
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
