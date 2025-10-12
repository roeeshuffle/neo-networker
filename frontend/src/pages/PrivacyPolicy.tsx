import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
          <CardTitle className="text-2xl font-bold">Alist – Privacy Policy</CardTitle>
          <p className="text-sm text-gray-600">Effective Date: 01.01.2025</p>
          <p className="text-sm text-gray-600">Operated by: Shuffle Media Ltd. d/b/a "Alist" ("Company," "we," "our," or "us")</p>
          <p className="text-sm text-gray-600">Registered Address: 169 Madison Ave STE 11073, New York, NY 10016</p>
          <p className="text-sm text-gray-600">Email: privacy@alist.ai</p>
          <p className="text-sm text-gray-600">Governing Law: United States (Delaware)</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-700 mb-2">
              This Privacy Policy explains how Alist ("we," "our," or "us") collects, uses, stores, and protects personal data when you ("User," "Client," or "Customer") use our services, including our website, WhatsApp/Telegram integrations, AI-powered chat assistant, and related software (collectively, the "Services").
            </p>
            <p className="text-gray-700 mb-2">We are committed to protecting your privacy and handling your data responsibly in accordance with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>The General Data Protection Regulation (GDPR – EU 2016/679)</li>
              <li>The UK GDPR and Data Protection Act 2018</li>
              <li>The California Consumer Privacy Act (CCPA, as amended by CPRA)</li>
              <li>Other applicable U.S. and international privacy laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
            <p className="text-gray-700 mb-2">We collect the following categories of personal and business information:</p>
            
            <h3 className="text-lg font-medium mb-2">2.1. Information You Provide Directly</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Name, email address, and contact information</li>
              <li>Business name, role, and billing address</li>
              <li>Login credentials (encrypted)</li>
              <li>Voice messages, texts, or emails you send to Alist for task automation</li>
              <li>Uploaded files (e.g., invoices, CRM exports, meeting notes)</li>
              <li>Payment details (processed securely via third-party payment processors)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">2.2. Information Collected Automatically</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Device and browser type, IP address, operating system</li>
              <li>Log data, usage analytics, and session history</li>
              <li>Integration data from connected services (e.g., Google Calendar, WhatsApp, Telegram)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">2.3. Information from Third Parties</h3>
            <p className="text-gray-700">
              If you connect third-party integrations, we may receive information (e.g., contacts, events, messages) under your consent and subject to each platform's privacy terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">We process personal data to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Provide and operate the Alist Services</li>
              <li>Enable integrations with external platforms</li>
              <li>Communicate with you (support, updates, reports)</li>
              <li>Manage billing, invoicing, and accounting</li>
              <li>Personalize recommendations and automate tasks</li>
              <li>Maintain security, detect fraud, and comply with legal requirements</li>
              <li>Improve and develop our technology and AI models</li>
            </ul>
            <p className="text-gray-700 mt-2 font-semibold">We do not sell your personal information under any circumstances.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 mb-2">We process your data under one or more of the following legal bases:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li><strong>Performance of a contract:</strong> to deliver the Services you request.</li>
              <li><strong>Legitimate interests:</strong> for analytics, improvement, and business operations.</li>
              <li><strong>Consent:</strong> when you connect integrations or share optional data.</li>
              <li><strong>Legal obligation:</strong> to comply with applicable financial or regulatory laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-2">We may share data only in the following cases:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li><strong>Service Providers:</strong> trusted partners who help us operate (cloud hosting, analytics, payment gateways).</li>
              <li><strong>Integrations:</strong> with your explicit consent (e.g., Google, QuickBooks).</li>
              <li><strong>Legal Requirements:</strong> when disclosure is required by law, subpoena, or regulatory authority.</li>
              <li><strong>Business Transfers:</strong> in case of a merger, acquisition, or restructuring, provided protections remain consistent with this Policy.</li>
            </ul>
            <p className="text-gray-700 mt-2">
              All third parties are bound by confidentiality and data protection obligations consistent with GDPR and CCPA standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. International Data Transfers</h2>
            <p className="text-gray-700 mb-2">Your information may be processed in the U.S., Israel, or other countries.</p>
            <p className="text-gray-700 mb-2">We ensure compliance through:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Standard Contractual Clauses (SCCs) for EU/UK data transfers, and</li>
              <li>Compliance with the EU–U.S. Data Privacy Framework (where applicable).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-gray-700 mb-2">We retain your data only as long as necessary to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Provide the Services and fulfill contractual obligations;</li>
              <li>Comply with legal or accounting requirements; or</li>
              <li>Resolve disputes.</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Data from inactive accounts may be anonymized or deleted after 12 months unless retention is legally required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Security</h2>
            <p className="text-gray-700 mb-2">We implement administrative, technical, and physical safeguards including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Encryption of stored and transmitted data</li>
              <li>Role-based access controls</li>
              <li>Regular vulnerability assessments and backups</li>
              <li>Secure cloud infrastructure compliant with ISO 27001 and SOC 2 standards</li>
            </ul>
            <p className="text-gray-700 mt-2">
              However, no system is entirely secure; you acknowledge and accept this residual risk when using our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Your Rights (GDPR & CCPA)</h2>
            <p className="text-gray-700 mb-2">Depending on your jurisdiction, you may have the following rights:</p>
            
            <h3 className="text-lg font-medium mb-2">Under GDPR (EU/UK):</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your data.</li>
              <li><strong>Restriction:</strong> Limit how we process your data.</li>
              <li><strong>Data Portability:</strong> Receive your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Opt out of specific processing (e.g., marketing).</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">Under CCPA (California):</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li><strong>Access:</strong> Request details on data collected or disclosed.</li>
              <li><strong>Deletion:</strong> Request deletion of personal data, subject to legal exceptions.</li>
              <li><strong>Opt-Out:</strong> Decline sale or sharing of your data (Alist does not sell data).</li>
              <li><strong>Non-Discrimination:</strong> You will not be penalized for exercising your privacy rights.</li>
            </ul>
            
            <p className="text-gray-700 mt-2">
              You can exercise these rights by contacting privacy@alist.ai. We may verify your identity before responding.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-2">Alist uses cookies and similar technologies for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li>Session management and security</li>
              <li>Analytics (e.g., Google Analytics, Mixpanel)</li>
              <li>Feature personalization</li>
            </ul>
            <p className="text-gray-700 mt-2">
              You may disable cookies in your browser settings, but some functionality may be limited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Children's Privacy</h2>
            <p className="text-gray-700 mb-2">
              Our Services are not directed toward individuals under 16. We do not knowingly collect personal information from minors. If you believe a child has provided data, please contact us for deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Data Processor and Controller Information</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
              <li><strong>Data Controller:</strong> Shuffle Media Ltd. (Alist)</li>
              <li><strong>EU Representative (if required):</strong> [To be appointed per GDPR Article 27]</li>
              <li><strong>Data Protection Officer (DPO):</strong> privacy@alist.ai</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Updates to This Policy</h2>
            <p className="text-gray-700 mb-2">
              We may update this Privacy Policy periodically. Changes will be posted on our website with a revised "Effective Date." Significant changes will be communicated via email or in-app notification.
            </p>
            <p className="text-gray-700">
              Continued use of the Services after updates constitutes acceptance of the revised Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
            <p className="text-gray-700 mb-2">For questions or privacy requests, contact:</p>
            <p className="text-gray-700 mb-2"><strong>Alist Privacy Team</strong></p>
            <p className="text-gray-700 mb-2">Email: privacy@alist.ai</p>
            <p className="text-gray-700 mb-2">Address: 169 Madison Ave STE 11073, New York, NY 10016, USA</p>
            <p className="text-gray-700">
              If you are an EU/UK resident and believe we have not addressed your privacy concerns, you have the right to lodge a complaint with your local Data Protection Authority (DPA).
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
