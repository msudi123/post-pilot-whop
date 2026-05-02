const apiKey = process.env.WHOP_API_KEY;
const appId = process.env.WHOP_APP_ID || 'app_5fQzk0JCz7u2Bp';

const res = await fetch(`https://api.whop.com/api/v5/apps/${appId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    redirect_uris: ['https://post-pilot-whop.vercel.app/api/auth/whop/callback'],
  }),
});

console.log('Status:', res.status);
const text = await res.text();
console.log(text);
