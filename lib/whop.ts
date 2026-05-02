import Whop from '@whop/sdk';

let whopsdk: Whop | null = null;

export function getWhopSdk() {
  if (!whopsdk) {
    whopsdk = new Whop({
      apiKey: process.env.WHOP_API_KEY,
      appID: process.env.WHOP_APP_ID,
    });
  }

  return whopsdk;
}
