import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function TermsOfServicePage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Terms of Service"
      summary="These terms describe the basic operating expectations for using PostPilot with your Whop business."
    >
      <h2>Service Scope</h2>
      <p>
        PostPilot helps Whop businesses generate drafts, schedule posts, and publish content through the PostPilot agent installed in
        the connected company.
      </p>

      <h2>Your Responsibilities</h2>
      <ul>
        <li>Provide accurate product and brand context</li>
        <li>Review generated content before publishing when appropriate</li>
        <li>Maintain the permissions and app installation required for forum posting in Whop</li>
        <li>Use the service in compliance with Whop policies and applicable law</li>
      </ul>

      <h2>Plan Access</h2>
      <p>
        Access to paid features is validated through Whop checkout and Whop membership status. PostPilot uses Supabase only for usage
        tracking and app operation.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep the service available and reliable, but uptime, generated content quality, and third-party platform availability
        cannot be guaranteed at all times.
      </p>
    </InfoPageShell>
  );
}
