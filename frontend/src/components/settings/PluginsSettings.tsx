import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Star, Zap, Shield, TrendingUp, Users, Building2, Calculator, PieChart, CreditCard, Calendar, MessageSquare, FileText, BarChart3, Target, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Plugin {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  icon: React.ReactNode;
  category: string;
  popular?: boolean;
  integrations: string[];
}

const plugins: Plugin[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Essential features for contact, task, and event management',
    features: [
      'Contact management',
      'Task tracking',
      'Event scheduling',
      'Google Calendar integration',
      'WhatsApp notifications',
      'Basic reporting'
    ],
    price: 'Included',
    icon: <Star className="w-6 h-6" />,
    category: 'Core',
    popular: true,
    integrations: ['Google Calendar', 'WhatsApp Agent', 'Google', 'Notion']
  },
  {
    id: 'companies-list',
    name: 'Companies List',
    description: 'Manage your companies connections and business relationships',
    features: [
      'Company profile management',
      'Business relationship tracking',
      'Company contact organization',
      'Partnership monitoring',
      'Business opportunity tracking'
    ],
    price: '$9.99/month',
    icon: <Building2 className="w-6 h-6" />,
    category: 'Business',
    popular: true,
    integrations: ['Google', 'Notion', 'Excel', 'WhatsApp Agent']
  },
  {
    id: 'financial-manager',
    name: 'Financial Manager',
    description: 'Track your income, expenses, and financial health',
    features: [
      'Income and expense tracking',
      'Financial reporting',
      'Budget management',
      'Investment monitoring',
      'Tax preparation tools'
    ],
    price: '$14.99/month',
    icon: <Calculator className="w-6 h-6" />,
    category: 'Finance',
    integrations: ['Google Calendar', 'Excel', 'Stripe', 'Notion']
  },
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Monitor your investments and portfolio performance',
    features: [
      'Real-time portfolio tracking',
      'Performance analytics',
      'Risk assessment',
      'Investment alerts',
      'Market analysis'
    ],
    price: '$19.99/month',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'Finance',
    popular: true,
    integrations: ['Google', 'Excel', 'Notion', 'WhatsApp Agent']
  },
  {
    id: 'crm-pro',
    name: 'CRM Pro',
    description: 'Advanced customer relationship management',
    features: [
      'Lead management',
      'Sales pipeline tracking',
      'Customer analytics',
      'Automated follow-ups',
      'Integration with email'
    ],
    price: '$24.99/month',
    icon: <Users className="w-6 h-6" />,
    category: 'Sales',
    integrations: ['WhatsApp Agent', 'Notion', 'Google', 'Slack']
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive business analytics and reporting',
    features: [
      'Custom dashboards',
      'Data visualization',
      'Performance metrics',
      'Trend analysis',
      'Export capabilities'
    ],
    price: '$16.99/month',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'Analytics',
    integrations: ['Google', 'Excel', 'Notion', 'Zoom']
  },
  {
    id: 'security-center',
    name: 'Security Center',
    description: 'Advanced security monitoring and threat detection',
    features: [
      'Threat monitoring',
      'Security alerts',
      'Access control',
      'Audit logs',
      'Compliance reporting'
    ],
    price: '$29.99/month',
    icon: <Shield className="w-6 h-6" />,
    category: 'Security',
    integrations: ['Google', 'Slack', 'WhatsApp Agent', 'Notion']
  },
  {
    id: 'payment-processor',
    name: 'Payment Processor',
    description: 'Streamlined payment processing and invoicing',
    features: [
      'Invoice generation',
      'Payment tracking',
      'Automated billing',
      'Payment analytics',
      'Multi-currency support'
    ],
    price: '$12.99/month',
    icon: <CreditCard className="w-6 h-6" />,
    category: 'Finance',
    integrations: ['Stripe', 'Google', 'Excel', 'WhatsApp Agent']
  },
  {
    id: 'event-planner',
    name: 'Event Planner',
    description: 'Plan and manage events with ease',
    features: [
      'Event scheduling',
      'Guest management',
      'Venue booking',
      'Event analytics',
      'RSVP tracking'
    ],
    price: '$8.99/month',
    icon: <Calendar className="w-6 h-6" />,
    category: 'Productivity',
    integrations: ['Google Calendar', 'Zoom', 'WhatsApp Agent', 'Notion']
  },
  {
    id: 'social-manager',
    name: 'Social Manager',
    description: 'Manage your social media presence',
    features: [
      'Multi-platform posting',
      'Content scheduling',
      'Engagement tracking',
      'Social analytics',
      'Brand monitoring'
    ],
    price: '$18.99/month',
    icon: <MessageSquare className="w-6 h-6" />,
    category: 'Marketing',
    integrations: ['WhatsApp Agent', 'Google', 'Notion', 'Slack']
  },
  {
    id: 'document-manager',
    name: 'Document Manager',
    description: 'Organize and manage your documents',
    features: [
      'Document storage',
      'Version control',
      'Collaboration tools',
      'Search functionality',
      'Access permissions'
    ],
    price: '$7.99/month',
    icon: <FileText className="w-6 h-6" />,
    category: 'Productivity',
    integrations: ['Google Drive', 'Notion', 'Excel', 'Slack']
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    description: 'Set and track your personal and business goals',
    features: [
      'Goal setting',
      'Progress tracking',
      'Milestone management',
      'Performance reports',
      'Team collaboration'
    ],
    price: '$6.99/month',
    icon: <Target className="w-6 h-6" />,
    category: 'Productivity',
    integrations: ['Notion', 'Google Calendar', 'WhatsApp Agent', 'Slack']
  }
];

// Integration logos mapping
const getIntegrationLogo = (integration: string) => {
  const logos: { [key: string]: React.ReactNode } = {
    'Google': (
      <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
    ),
    'Notion': (
      <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">N</span>
      </div>
    ),
    'Excel': (
      <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">X</span>
      </div>
    ),
    'WhatsApp Agent': (
      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <MessageSquare className="w-3 h-3 text-white" />
      </div>
    ),
    'Google Calendar': (
      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
        <Calendar className="w-3 h-3 text-white" />
      </div>
    ),
    'Stripe': (
      <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
        <CreditCard className="w-3 h-3 text-white" />
      </div>
    ),
    'Slack': (
      <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">S</span>
      </div>
    ),
    'Zoom': (
      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">Z</span>
      </div>
    ),
    'Google Drive': (
      <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">G</span>
      </div>
    )
  };
  return logos[integration] || (
    <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center">
      <span className="text-white font-bold text-xs">{integration[0]}</span>
    </div>
  );
};

export const PluginsSettings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showPluginDetails, setShowPluginDetails] = useState(false);

  const filteredPlugins = useMemo(() => {
    if (!searchQuery.trim()) return plugins;
    
    const query = searchQuery.toLowerCase();
    return plugins.filter(plugin => 
      plugin.name.toLowerCase().includes(query) ||
      plugin.description.toLowerCase().includes(query) ||
      plugin.category.toLowerCase().includes(query) ||
      plugin.features.some(feature => feature.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleViewPlugin = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setShowPluginDetails(true);
  };

  const handleSubscribe = (plugin: Plugin) => {
    toast({
      title: "Coming Soon",
      description: `${plugin.name} subscription will be available soon!`,
    });
    setShowPluginDetails(false);
  };

  const categories = [...new Set(plugins.map(plugin => plugin.category))];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Plugins</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={searchQuery === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchQuery('')}
        >
          All
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={searchQuery.toLowerCase() === category.toLowerCase() ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchQuery(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map(plugin => (
          <Card key={plugin.id} className="relative flex flex-col h-full">
            {plugin.popular && (
              <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="text-blue-600">
                  {plugin.icon}
                </div>
                {plugin.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-grow space-y-3">
                <p className="text-sm text-muted-foreground">
                  {plugin.description}
                </p>
                
                {/* Integration Logos */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Integrates with:</p>
                  <div className="flex flex-wrap gap-1">
                    {plugin.integrations.map((integration, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                        {getIntegrationLogo(integration)}
                        <span className="text-xs text-muted-foreground">{integration}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{plugin.category}</Badge>
                  <span className="text-sm font-semibold text-green-600">
                    {plugin.price}
                  </span>
                </div>
              </div>
              
              {/* Button - positioned at bottom */}
              <div className="mt-4 pt-3 border-t border-border">
                {plugin.id === 'basic' ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Subscribed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewPlugin(plugin)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse all plugins.
          </p>
        </div>
      )}

      {/* Plugin Details Dialog */}
      <Dialog open={showPluginDetails} onOpenChange={setShowPluginDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="text-blue-600">
                {selectedPlugin?.icon}
              </div>
              {selectedPlugin?.name}
              {selectedPlugin?.popular && (
                <Badge className="bg-orange-500 hover:bg-orange-600">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlugin && (
            <div className="flex flex-col h-full">
              <div className="flex-grow space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">
                    {selectedPlugin.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Features</h4>
                  <ul className="space-y-2">
                    {selectedPlugin.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Integrations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.integrations.map((integration, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        {getIntegrationLogo(integration)}
                        <span className="text-sm font-medium">{integration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Button positioned at bottom */}
              <div className="mt-6 flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-semibold">{selectedPlugin.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPlugin.category} • {selectedPlugin.price}
                  </div>
                </div>
                {selectedPlugin.id === 'basic' ? (
                  <Button
                    disabled
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Subscribed
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(selectedPlugin)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
