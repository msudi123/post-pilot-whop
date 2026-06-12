import { InfoPageShell } from '@/app/components/InfoPageShell';
import { SUPPORT_EMAIL } from '@/lib/site';

export default function SupportPage() {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Support Email"
      summary="PostPilot support is available for billing questions, access problems, publishing issues, and general product help."
    >
      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for support.
      </p>
      <p>
        Include a short description of the issue and any relevant screenshots so we can help faster.
      </p>

      <h2>Best Uses For Support</h2>
      <ul>
        <li>Billing and upgrade questions</li>
        <li>Workspace access or installation issues</li>
        <li>Publishing failures or forum permission issues</li>
        <li>Questions about AI credits and usage limits</li>
      </ul>
    </InfoPageShell>
  );
}
