import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function PostPilotAgentPage() {
  return (
    <InfoPageShell
      eyebrow="Help"
      title="Why Posts Show As PostPilot"
      summary="This page explains why published content is shown as coming from PostPilot instead of from an individual team member."
    >
      <h2>Why You See PostPilot</h2>
      <p>
        Posts are published by PostPilot for your business. This keeps scheduled publishing consistent and avoids confusion about who sent a post.
      </p>

      <h2>Why This Is Better</h2>
      <ul>
        <li>It keeps authorship consistent across scheduled and published content</li>
        <li>It avoids pretending posts were sent directly from a personal user account</li>
        <li>It keeps the publishing workflow stable and predictable</li>
      </ul>

      <h2>What PostPilot Does Not Do</h2>
      <ul>
        <li>It does not spoof your personal author name</li>
        <li>It does not spoof your personal avatar</li>
        <li>It does not rely on personal account impersonation for production publishing</li>
      </ul>
    </InfoPageShell>
  );
}
