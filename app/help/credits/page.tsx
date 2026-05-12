import { InfoPageShell } from '@/app/components/InfoPageShell';

export default function CreditsPage() {
  return (
    <InfoPageShell
      eyebrow="Help"
      title="How Credits Work"
      summary="This page explains when PostPilot uses AI generation credits and when it does not."
    >
      <h2>Free Plan</h2>
      <ul>
        <li>Start with 7 lifetime AI-generated post credits</li>
        <li>The first regeneration per generated draft is free when regeneration is available</li>
        <li>After the 7 free AI-generated credits are used, new AI generation is blocked until you upgrade</li>
      </ul>

      <h2>Starter Plan</h2>
      <ul>
        <li>Starter costs $19/month</li>
        <li>Starter includes 300 AI-generated posts per month</li>
        <li>Monthly availability resets with the billing period when reset data is available</li>
      </ul>

      <h2>What Uses Credits</h2>
      <ul>
        <li>Successful AI post generation</li>
        <li>Successful AI batch generation</li>
      </ul>

      <h2>What Does Not Use Credits</h2>
      <ul>
        <li>Editing a generated draft</li>
        <li>Scheduling an existing draft</li>
        <li>Publishing an existing draft</li>
      </ul>
    </InfoPageShell>
  );
}
