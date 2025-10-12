import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Alist – Terms and Conditions</CardTitle>
          <p className="text-sm text-gray-600">Effective Date: 01.01.2025</p>
          <p className="text-sm text-gray-600">Operated by: Wershuffle. d/b/a "Alist" ("Company," "we," "our," or "us")</p>
          <p className="text-sm text-gray-600">Registered Address: 169 Madison Ave STE 11073, New York, NY 10016</p>
          <p className="text-sm text-gray-600">Email: info@alist.ai</p>
          <p className="text-sm text-gray-600">Governing Law: United States (Delaware)</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Overview and Acceptance</h2>
            <p className="text-gray-700">
              These Terms and Conditions ("Terms") form a legally binding agreement between you ("Client," "User," or "Customer") and Alist, governing your access to and use of the Alist software platform, automation tools, integrations, and related services (collectively, the "Services").
            </p>
            <p className="text-gray-700 mt-2">
              By registering, accessing, or using our Services, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Services</h2>
            <h3 className="text-lg font-medium mb-2">2.1 Scope</h3>
            <p className="text-gray-700 mb-2">Alist provides an AI-powered assistant for business automation, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Task management via WhatsApp, Telegram, and web chat;</li>
              <li>Voice-to-action automation (creating tasks, meetings, or reminders from audio);</li>
              <li>CRM and contact management within chat;</li>
              <li>Automatic meeting summaries and reports;</li>
              <li>Google Calendar integration for scheduling and reminders;</li>
              <li>Invoice generation via integrations with accounting tools (Invoice Ninja, QuickBooks, etc.);</li>
              <li>Email-to-task and automatic weekly performance summaries;</li>
              <li>Team collaboration through WhatsApp groups and dashboards;</li>
              <li>Secure permissions and access controls.</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Beta and Add-ons</h3>
            <p className="text-gray-700">
              Some features (e.g., CFO/Investor Hub, voice analytics, AI recommendations) may be released as beta or add-on modules and are provided "as is."
            </p>
            
            <h3 className="text-lg font-medium mb-2 mt-4">2.3 Service Modifications</h3>
            <p className="text-gray-700">
              We may enhance, modify, or discontinue certain features at any time with prior notice when possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration and Access</h2>
            <p className="text-gray-700 mb-2">3.1 To access the Services, you must create an account and provide accurate, current, and complete information.</p>
            <p className="text-gray-700 mb-2">3.2 You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.</p>
            <p className="text-gray-700 mb-2">3.3 You agree not to use the Services for illegal, harmful, or unauthorized purposes, including impersonation, data scraping, or misuse of integrations.</p>
            <p className="text-gray-700">3.4 The Company may suspend or terminate accounts violating these Terms or applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Client Responsibilities</h2>
            <p className="text-gray-700 mb-2">4.1 Data Access and Cooperation. You agree to provide necessary access to your messaging platforms, calendars, and files for the Service to operate properly.</p>
            <p className="text-gray-700 mb-2">4.2 Compliance. You must comply with all applicable laws, privacy regulations, and platform policies (WhatsApp, Telegram, Google, etc.).</p>
            <p className="text-gray-700 mb-2">4.3 Content Accuracy. You are solely responsible for the accuracy of the information, media, and voice commands provided through the Service.</p>
            <p className="text-gray-700">4.4 Third-Party Systems. You acknowledge that Alist relies on APIs and integrations from third-party platforms and that disruptions in those services are beyond our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment and Billing</h2>
            <p className="text-gray-700 mb-2">5.1 Fees. Subscription fees and pricing tiers are specified on our website or order form. Fees are charged monthly or annually depending on your plan.</p>
            <p className="text-gray-700 mb-2">5.2 Billing Authorization. By subscribing, you authorize us to charge your payment method automatically at each billing cycle.</p>
            <p className="text-gray-700 mb-2">5.3 Late Payments. Overdue payments of more than 14 days may lead to account suspension.</p>
            <p className="text-gray-700">5.4 Refunds. Payments are non-refundable except as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Term and Termination</h2>
            <p className="text-gray-700 mb-2">6.1 Duration. These Terms take effect upon your first use of the Service and remain in force until terminated.</p>
            <p className="text-gray-700 mb-2">6.2 Termination by Client. You may cancel your subscription with 7 days' written notice before the next billing cycle.</p>
            <p className="text-gray-700 mb-2">6.3 Termination by Company. We may suspend or terminate your account immediately in case of non-payment, breach, or misuse of the platform.</p>
            <p className="text-gray-700 mb-2">6.4 Post-Termination. Upon termination:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Access to the platform and data may be restricted;</li>
              <li>You remain liable for unpaid fees;</li>
              <li>We will retain client data for up to 60 days for export upon request, after which it will be deleted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Privacy and Security</h2>
            <p className="text-gray-700 mb-2">7.1 Data Processing. We process client data only to provide the Services. Data may include messages, voice notes, and scheduling details.</p>
            <p className="text-gray-700 mb-2">7.2 Security Measures. We employ encryption, role-based access, and cloud storage safeguards to protect your information.</p>
            <p className="text-gray-700 mb-2">7.3 Confidentiality. Both parties agree to maintain confidentiality of all exchanged information except as required by law.</p>
            <p className="text-gray-700 mb-2">7.4 Third-Party Integrations. By enabling integrations (e.g., Google, WhatsApp), you authorize Alist to exchange relevant data with those providers under their own terms.</p>
            <p className="text-gray-700">7.5 Data Retention. Alist retains user data as long as necessary for service performance or legal compliance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-2">8.1 The Company retains all rights, title, and interest in the Alist platform, its code, algorithms, UI, documentation, and all derivative works.</p>
            <p className="text-gray-700 mb-2">8.2 The Client retains ownership of content, data, and materials they provide.</p>
            <p className="text-gray-700 mb-2">8.3 The Client grants Alist a limited, non-exclusive license to use submitted content solely to deliver the Services.</p>
            <p className="text-gray-700">8.4 You may not reverse engineer, resell, or create competing services based on Alist technology.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Service Levels and Support</h2>
            <p className="text-gray-700 mb-2">9.1 Availability. We aim for 99% uptime except for planned maintenance or outages caused by third-party APIs.</p>
            <p className="text-gray-700 mb-2">9.2 Support.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Starter Plan: Email support (48h response)</li>
              <li>Pro Plan: Priority email (24h response)</li>
              <li>Business Plan: Live chat or email (8h response)</li>
            </ul>
            <p className="text-gray-700 mt-2">9.3 Updates. Service improvements may be rolled out automatically without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitations of Liability</h2>
            <p className="text-gray-700 mb-2">10.1 To the fullest extent permitted by law, Alist shall not be liable for indirect, incidental, or consequential damages, including data loss or business interruption.</p>
            <p className="text-gray-700 mb-2">10.2 Alist's total liability for any claim shall not exceed the total fees paid in the 12 months preceding the event.</p>
            <p className="text-gray-700 mb-2">10.3 Alist shall not be liable for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Failures of third-party integrations or APIs;</li>
              <li>Misuse or incorrect data entered by the Client;</li>
              <li>Losses due to external service providers or platform downtime.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold Alist, its affiliates, employees, and agents harmless from any claims, damages, or liabilities arising out of:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Misuse of the Service;</li>
              <li>Violation of laws or third-party rights;</li>
              <li>Content or data you submit through the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Amendments and Notices</h2>
            <p className="text-gray-700 mb-2">12.1 We may modify these Terms by updating our website or notifying you by email. Continued use constitutes acceptance.</p>
            <p className="text-gray-700">12.2 All notices must be sent in writing to info@alist.ai or to your registered email.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 mb-2">These Terms are governed by the laws of the State of Delaware, U.S.A.</p>
            <p className="text-gray-700">Any disputes shall be resolved exclusively in the state or federal courts of Delaware.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Miscellaneous</h2>
            <p className="text-gray-700 mb-2">14.1 Entire Agreement. These Terms, along with any Order or subscription plan, represent the entire agreement between the parties.</p>
            <p className="text-gray-700 mb-2">14.2 No Waiver. Failure to enforce a provision does not constitute a waiver.</p>
            <p className="text-gray-700 mb-2">14.3 Severability. If any provision is held invalid, the remainder remains enforceable.</p>
            <p className="text-gray-700">14.4 Assignment. You may not assign these Terms without our prior written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-gray-700 mb-2">Alist (operated by Wershuffle Inc.)</p>
            <p className="text-gray-700 mb-2">Email: info@alist.ai</p>
            <p className="text-gray-700 mb-2">Phone: +1 (585) 508-3409</p>
            <p className="text-gray-700">Address: 169 Madison Ave STE 11073, New York, NY 10016</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
