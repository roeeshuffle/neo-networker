import React, { useState } from 'react';
import { SettingsSidebar, SettingsSection } from '@/components/SettingsSidebar';
import { BotConnectionSettings } from '@/components/settings/BotConnectionSettings';
import { GoogleIntegrationSettings } from '@/components/settings/GoogleIntegrationSettings';
import { ContactsSettings } from '@/components/settings/ContactsSettings';
import { CalendarSettings } from '@/components/settings/CalendarSettings';
import { GroupManagementSettings } from '@/components/settings/GroupManagementSettings';
import SubscriptionManagement from '@/pages/SubscriptionManagement';
import { Bot, MessageSquare, Users, Calendar, Settings2, Star } from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState('bot-connection');

  const settingsSections: SettingsSection[] = [
    {
      id: 'bot-connection',
      title: 'Bot Connection',
      icon: <Bot className="w-5 h-5" />,
      description: 'Telegram & WhatsApp'
    },
    {
      id: 'google-integration',
      title: 'Google Integration',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Contacts & Calendar'
    },
    {
      id: 'contacts',
      title: 'Contacts',
      icon: <Users className="w-5 h-5" />,
      description: 'Management & Fields'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Display & Events'
    },
    {
      id: 'group-management',
      title: 'Group Management',
      icon: <Settings2 className="w-5 h-5" />,
      description: 'Organize Contacts'
    },
    {
      id: 'subscription',
      title: 'Subscription',
      icon: <Star className="w-5 h-5" />,
      description: 'Plans & Plugins'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'bot-connection':
        return <BotConnectionSettings currentUser={currentUser} />;
      case 'google-integration':
        return <GoogleIntegrationSettings currentUser={currentUser} />;
      case 'contacts':
        return <ContactsSettings onDeleteAllPeople={onDeleteAllPeople} />;
      case 'calendar':
        return <CalendarSettings currentUser={currentUser} />;
      case 'group-management':
        return <GroupManagementSettings currentUser={currentUser} />;
      case 'subscription':
        return <SubscriptionManagement />;
      default:
        return <BotConnectionSettings currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <SettingsSidebar
        sections={settingsSections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};