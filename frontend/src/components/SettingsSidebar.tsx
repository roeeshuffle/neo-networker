import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  Calendar, 
  Settings2,
  ChevronRight
} from 'lucide-react';

export interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
}

interface SettingsSidebarProps {
  sections: SettingsSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  sections,
  activeSection,
  onSectionChange
}) => {
  return (
    <div className="w-64 bg-card border-r border-border h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Settings</h2>
        <nav className="space-y-2">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3 text-left",
                activeSection === section.id && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => onSectionChange(section.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "flex-shrink-0",
                  activeSection === section.id ? "text-secondary-foreground" : "text-muted-foreground"
                )}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{section.title}</div>
                  {section.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {section.description}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              </div>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};
