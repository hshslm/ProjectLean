import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Terms and Conditions of Service</h1>
        <p className="text-muted-foreground mb-8">Effective Date: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">By accessing or subscribing to The Lean Brain™, a product of Project Lean (Stride Performance FZ-LLC) ("Stride Performance", "we", "us"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the service.</p>
            <p className="text-muted-foreground">The Lean Brain™ is operated by Project Lean (Stride Performance FZ-LLC), based in Dubai, United Arab Emirates. These terms are governed by the laws of the UAE.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground">The Lean Brain™ is a behavior-change and coaching intelligence platform that includes:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Daily behavior check-in and AI coaching responses</li>
              <li>Pattern detection and tracking dashboard</li>
              <li>Real-time AI chat in coaching style</li>
              <li>Macro and meal photo logging</li>
              <li>Recovery score, consistency tracking, and weekly behavior insights</li>
              <li>Trigger mapping and personal risk protocols</li>
            </ul>
            <p className="text-muted-foreground">The Lean Brain™ is a behavior and coaching tool. It is not a medical service, clinical nutrition service, or substitute for professional medical advice, diagnosis, or treatment.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Subscription and Billing</h2>
            <h3 className="text-lg font-medium mb-1">3.1 Subscription Plans</h3>
            <p className="text-muted-foreground">The Lean Brain™ is offered on a monthly subscription basis. Current pricing is displayed on the website at the time of purchase. Founders pricing is a limited-time rate available to early subscribers only.</p>
            <h3 className="text-lg font-medium mb-1 mt-3">3.2 Automatic Renewal</h3>
            <p className="text-muted-foreground">Your subscription renews automatically each month on your billing date. By subscribing, you authorise Project Lean (Stride Performance FZ-LLC) to charge your payment method on a recurring monthly basis until you cancel.</p>
            <h3 className="text-lg font-medium mb-1 mt-3">3.3 Founders Pricing Lock</h3>
            <p className="text-muted-foreground">If you subscribed at founders pricing, your rate is locked for the duration of your active, continuous subscription. If you cancel your subscription for any reason, your founders pricing is forfeited permanently. Upon resubscription, standard pricing will apply.</p>
            <h3 className="text-lg font-medium mb-1 mt-3">3.4 Price Changes</h3>
            <p className="text-muted-foreground">Project Lean (Stride Performance FZ-LLC) reserves the right to change subscription pricing at any time. Active subscribers will be notified of any price changes at least 14 days in advance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. No Refund Policy</h2>
            <p className="text-muted-foreground">All subscription payments are non-refundable. This includes but is not limited to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Partial months of service</li>
              <li>Unused subscription periods</li>
              <li>Periods during which you did not access the platform</li>
              <li>Cancellations made after the billing date</li>
            </ul>
            <p className="text-muted-foreground">By subscribing, you acknowledge and accept this no-refund policy. If you do not wish to be charged for a subsequent billing period, you must cancel your subscription before your next billing date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Cancellation</h2>
            <p className="text-muted-foreground">You may cancel your subscription at any time through your account settings or by contacting Project Lean (Stride Performance FZ-LLC) directly. Cancellation takes effect at the end of your current billing cycle. You will retain full access to the service until that date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree to use The Lean Brain™ solely for personal, non-commercial purposes. You must not:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Share your account credentials with any other person</li>
              <li>Attempt to reverse-engineer, copy, or replicate any part of the platform or its AI systems</li>
              <li>Use the platform to distribute spam, harmful content, or abusive messages</li>
              <li>Attempt to overwhelm or abuse the AI chat system through automated or excessive use</li>
              <li>Misrepresent yourself or your health conditions within the platform</li>
            </ul>
            <p className="text-muted-foreground">Project Lean (Stride Performance FZ-LLC) reserves the right to terminate your account immediately and without refund if you violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Health and Medical Disclaimer</h2>
            <p className="text-muted-foreground">The Lean Brain™ provides general behavior-change coaching, nutritional guidance, and habit-tracking tools. It is not a medical service and does not provide medical advice, clinical nutrition counselling, or treatment of any kind.</p>
            <p className="text-muted-foreground">You should consult a qualified medical professional or registered dietitian before making significant changes to your diet, exercise, or health routine, particularly if you have a medical condition, food allergy, hormonal condition, or are taking medication.</p>
            <p className="text-muted-foreground">Project Lean (Stride Performance FZ-LLC) is not liable for any health outcomes arising from the use of or reliance on content provided through The Lean Brain™.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Intellectual Property</h2>
            <p className="text-muted-foreground">All content, systems, methodologies, AI prompts, coaching frameworks, and branding within The Lean Brain™ are the exclusive intellectual property of Project Lean (Stride Performance FZ-LLC).</p>
            <p className="text-muted-foreground">You may not reproduce, distribute, or create derivative works from any part of The Lean Brain™ without prior written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Privacy and Data</h2>
            <p className="text-muted-foreground">Your use of The Lean Brain™ is subject to our Privacy Policy. By using the service, you consent to the collection and use of your data as described in the Privacy Policy.</p>
            <p className="text-muted-foreground">Data collected through the platform is used solely to power your personal coaching experience and improve the platform. Your data is never sold to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">To the maximum extent permitted by applicable law, Project Lean (Stride Performance FZ-LLC) shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of The Lean Brain™.</p>
            <p className="text-muted-foreground">Total liability shall not exceed the amount you paid in the 30 days prior to the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Modifications to Terms</h2>
            <p className="text-muted-foreground">Project Lean (Stride Performance FZ-LLC) reserves the right to modify these Terms at any time. Continued use of the service after the effective date constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Governing Law</h2>
            <p className="text-muted-foreground">These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">13. Contact</h2>
            <p className="text-muted-foreground">Project Lean (Stride Performance FZ-LLC)<br />Dubai, United Arab Emirates<br />Email: karimzaki@projectleaneg.com</p>
          </section>

          <p className="text-xs text-muted-foreground pt-4 border-t">© 2026 Project Lean (Stride Performance FZ-LLC). All rights reserved. The Lean Brain™ is a trademark of Project Lean (Stride Performance FZ-LLC).</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
