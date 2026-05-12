import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function BillingPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Billing"
      title="Refund And Billing Note"
      summary="PostPilot billing runs through Whop. This page explains the practical billing expectations for Free and Starter plans."
    >
      <h2>Billing Provider</h2>
      <p>
        PostPilot subscriptions are handled through Whop checkout and Whop access validation. PostPilot does not use Stripe, Paystack,
        Lemon Squeezy, Paddle, or any other payment provider for subscriptions.
      </p>

      <h2>Plans</h2>
      <ul>
        <li>Free: 7 lifetime AI-generated post credits</li>
        <li>Starter: $19/month for 300 AI-generated posts per month</li>
      </ul>

      <h2>Refunds And Billing Questions</h2>
      <p>
        Refund handling, billing status, and active access should be reviewed against the Whop subscription used for checkout. If you
        need billing help, contact support and include the company ID and the Whop membership details if available.
      </p>

      <h2>What Does Not Consume Extra Credits</h2>
      <ul>
        <li>Editing generated drafts</li>
        <li>Scheduling generated drafts</li>
        <li>Publishing existing drafts</li>
      </ul>
    </InfoPageShell>
  );
}
