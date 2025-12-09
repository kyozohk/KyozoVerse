'use client';

import { CustomButton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: December 2024
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-sm text-gray-700">
          <section>
            <h3 className="font-semibold text-base mb-2">1. Introduction</h3>
            <p>
              Welcome to Kyozo ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Information We Collect</h3>
            <p className="mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Account credentials and profile information</li>
              <li>Content you create, upload, or share on our platform</li>
              <li>Communications with us and other users</li>
              <li>Payment and transaction information</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Communications and Notifications</h3>
            <p className="mb-2 font-medium">
              By creating an account and using our services, you agree to receive:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Feed Notifications:</strong> Updates about new content, posts, and activities from communities you follow</li>
              <li><strong>Email Communications:</strong> Service updates, newsletters, and promotional content</li>
              <li><strong>SMS Messages:</strong> Important account notifications and occasional marketing messages</li>
              <li><strong>WhatsApp Messages:</strong> Community updates, notifications, and promotional content</li>
            </ul>
            <p className="mt-2">
              You can opt out of marketing communications at any time by following the unsubscribe instructions in our messages or updating your account preferences.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. How We Use Your Information</h3>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Send you marketing and promotional communications</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
              <li>Personalize your experience and deliver relevant content</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Information Sharing</h3>
            <p className="mb-2">We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Community owners and administrators for communities you join</li>
              <li>Service providers who perform services on our behalf</li>
              <li>Analytics and advertising partners</li>
              <li>Law enforcement or regulatory authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Data Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Your Rights</h3>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your information</li>
              <li>Object to or restrict certain processing of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Cookies and Tracking</h3>
            <p>
              We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Children's Privacy</h3>
            <p>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">10. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">11. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@kyozo.com
            </p>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <CustomButton onClick={() => onOpenChange(false)}>
            Close
          </CustomButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
