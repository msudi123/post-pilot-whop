import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function PostPilotAgentPage() {
  return (
    <InfoPageShell
      eyebrow="Help"
      title="Why Posts Show As PostPilot Agent"
      summary="This page explains why published content is shown as coming from the PostPilot agent instead of from your personal Whop user identity."
    >
      <h2>Why You See PostPilot Agent</h2>
      <p>
        Posts are published by your PostPilot agent on behalf of your Whop business. This is intentional and reflects the actual
        publishing path used by the app.
      </p>

      <h2>Why This Is Better</h2>
      <ul>
        <li>It keeps authorship consistent across scheduled and published content</li>
        <li>It avoids pretending posts were sent directly from a personal user account</li>
        <li>It matches the installed-app workflow used for reliable Whop posting</li>
      </ul>

      <h2>What PostPilot Does Not Do</h2>
      <ul>
        <li>It does not spoof your personal author name</li>
        <li>It does not spoof your personal avatar</li>
        <li>It does not rely on experimental user-token forum posting for production publishing</li>
      </ul>
    </InfoPageShell>
  );
}
