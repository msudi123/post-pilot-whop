import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function PostingPage() {
  return (
    <InfoPageShell
      eyebrow="Help"
      title="How Posting Works"
      summary="This page explains how PostPilot turns generated content into scheduled or published forum posts."
    >
      <h2>Workflow</h2>
      <ol>
        <li>Generate a draft using your available AI credits</li>
        <li>Edit the draft if needed</li>
        <li>Schedule it for later or publish it immediately</li>
        <li>PostPilot sends the final content through your connected workspace for publishing</li>
      </ol>

      <h2>Important Detail</h2>
      <p>
        AI credits apply to generation. They do not apply to editing, scheduling, or publishing a draft that already exists.
      </p>

      <h2>Publishing Path</h2>
      <p>
        PostPilot publishes through the connected workspace path instead of pretending to post as an individual team member.
      </p>

      <h2>If Posting Fails</h2>
      <p>
        The most common causes are missing publishing permissions, forum restrictions, or a workspace installation issue.
      </p>
    </InfoPageShell>
  );
}
