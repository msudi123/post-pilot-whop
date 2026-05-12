import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      summary="This page explains the main categories of data PostPilot uses to operate the app for Whop communities."
    >
      <h2>What PostPilot Uses</h2>
      <p>
        PostPilot uses the minimum business, product, scheduling, and account data needed to generate drafts, manage posting schedules,
        validate Whop access, and publish content through the installed app.
      </p>

      <h2>Examples Of Data Processed</h2>
      <ul>
        <li>Whop company identifiers and product context you provide inside the app</li>
        <li>Draft content, scheduled posts, and post analytics used to operate the service</li>
        <li>Whop membership status needed to validate access to Starter features</li>
        <li>Connection details needed to publish as the PostPilot agent for your Whop business</li>
      </ul>

      <h2>What PostPilot Does Not Do</h2>
      <ul>
        <li>It does not expose your API keys or billing secrets in the client</li>
        <li>It does not publish posts as if they were written directly by your personal Whop account</li>
        <li>It does not use external payment providers outside of Whop for subscriptions</li>
      </ul>

      <h2>Questions</h2>
      <p>
        If you need clarification about data handling for your account, use the support contact listed on the support page.
      </p>
    </InfoPageShell>
  );
}
