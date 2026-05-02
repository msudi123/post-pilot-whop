/**
 * One-time script: set the app's oauth_client_type to 'public'
 * so the PKCE token exchange works without a client_secret.
 *
 * Usage:
 *   PERSONAL_API_KEY=your_personal_whop_key node scripts/set-public-client.mjs
 *
 * The personal API key is from your Whop account settings (not the app key).
 * It needs the developer:update_app permission.
 */

const apiKey = process.env.PERSONAL_API_KEY;
const appId = 'app_5fQzk0JCz7u2Bp';

if (!apiKey) {
  console.error('❌ Set PERSONAL_API_KEY env var to your personal Whop API key');
  process.exit(1);
}

console.log('Updating app', appId, 'to public OAuth client type...');

const res = await fetch(`https://api.whop.com/api/v1/apps/${appId}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ oauth_client_type: 'public' }),
});

console.log('Status:', res.status);
const body = await res.text();
try {
  const j = JSON.parse(body);
  console.log('oauth_client_type is now:', j.oauth_client_type);
  if (j.error) console.error('Error:', j.error);
} catch {
  console.log('Body:', body.slice(0, 500));
}
