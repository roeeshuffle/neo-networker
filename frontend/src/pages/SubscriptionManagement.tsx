import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star, Zap, Building2, Crown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import { toast } from 'sonner';

interface PlanDetails {
  name: string;
  product_id: string;
  tax_code: string;
  tax_code_id: string;
  description: string;
  features: string[];
}

interface PlansData {
  [key: string]: PlanDetails;
}

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('Starter');
  const [plans, setPlans] = useState<PlansData>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPlan();
    fetchAllPlans();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const response = await apiClient.getUserPlan();
      if (response.data && response.data.success) {
        setCurrentPlan(response.data.plan);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
      toast.error('Failed to fetch current plan');
    }
  };

  const fetchAllPlans = async () => {
    try {
      const response = await apiClient.getAllPlans();
      if (response.data && response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planName: string) => {
    if (planName === currentPlan) return;
    
    setUpdating(planName);
    try {
      const response = await apiClient.updateUserPlan(planName);
      if (response.data && response.data.success) {
        setCurrentPlan(planName);
        toast.success(`Plan updated to ${planName}`);
      } else {
        toast.error('Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelMembership = async () => {
    // For now, we'll just show a message since we don't have a cancellation API yet
    toast.info('Membership cancellation feature coming soon. Please contact support for assistance.');
  };

  const handleSubscribe = async (planName: string) => {
    try {
      setUpdating(planName);
      const response = await apiClient.createStripeCheckoutSession(planName);
      if (response.data && response.data.success) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else if (response.error) {
        const errorMessage = response.error.error || 'Failed to create checkout session';
        toast.error(errorMessage);
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session. Please try again.');
    } finally {
      setUpdating('');
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await apiClient.createStripePortalSession();
      if (response.data && response.data.success) {
        // Redirect to Stripe's customer portal
        window.location.href = response.data.portal_url;
      } else if (response.error) {
        // Handle API error response
        const errorMessage = response.error.error || 'Failed to open billing portal';
        if (errorMessage.includes('No Stripe customer found')) {
          toast.error('Your account is not set up for billing yet. Please contact support to set up your subscription.');
        } else if (errorMessage.includes('Billing portal not available')) {
          toast.error('Billing portal is not available with the current configuration. Please contact support.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to open billing portal');
      }
    } catch (error: any) {
      console.error('Error opening billing portal:', error);
      
      // Handle network or other errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'No Stripe customer found';
        if (errorMessage.includes('No Stripe customer found')) {
          toast.error('Your account is not set up for billing yet. Please contact support to set up your subscription.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to open billing portal. Please try again or contact support.');
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free':
        return <Star className="w-5 h-5 text-gray-600" />;
      case 'Starter':
        return <Star className="w-5 h-5 text-blue-600" />;
      case 'Pro':
        return <Zap className="w-5 h-5 text-purple-600" />;
      case 'Business':
        return <Building2 className="w-5 h-5 text-green-600" />;
      default:
        return <Star className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Free':
        return 'bg-gray-50 border-gray-200';
      case 'Starter':
        return 'bg-blue-50 border-blue-200';
      case 'Pro':
        return 'bg-purple-50 border-purple-200';
      case 'Business':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName) {
      case 'Free':
        return 'bg-gray-100 text-gray-800';
      case 'Starter':
        return 'bg-blue-100 text-blue-800';
      case 'Pro':
        return 'bg-purple-100 text-purple-800';
      case 'Business':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading subscription plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-soft flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow overflow-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-gray-600">Choose the plan that best fits your needs</p>
        </div>


      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).sort(([a], [b]) => {
          // Order: Starter (left), Pro (center), Business (right)
          const order = { 'Starter': 0, 'Pro': 1, 'Business': 2 };
          return order[a as keyof typeof order] - order[b as keyof typeof order];
        }).map(([planName, planDetails]) => (
          <Card 
            key={planName} 
            className={`relative ${getPlanColor(planName)} ${
              currentPlan === planName ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getPlanIcon(planName)}
              </div>
              <CardTitle className="text-xl">{planName}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Features:</h4>
                <ul className="space-y-1 text-sm">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-4">
                <Button
                  onClick={() => currentPlan === planName ? handleManageBilling() : handleSubscribe(planName)}
                  disabled={true}
                  className="w-full"
                  variant="default"
                >
                  {currentPlan === planName ? (
                    'Manage Billing'
                  ) : (
                    'Coming Soon...'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> Plan changes are immediate and will affect your account limits and features.</p>
            <p><strong>Support:</strong> For questions about plans or billing, please contact our support team.</p>
            <p><strong>Billing:</strong> All plans are billed monthly and can be changed at any time.</p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Footer with legal links */}
      <footer className="border-t border-border bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Alist. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm ml-8">
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SubscriptionManagement;
