type QueryValue = string | number | boolean | null | undefined;

function getSupabaseRestBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  return `${url.replace(/\/+$/, '')}/rest/v1`;
}

function getSupabaseRestHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function supabaseRestFetch<T>(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${getSupabaseRestBase()}/${path.replace(/^\/+/, '')}`);

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: getSupabaseRestHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase REST ${path} failed: ${res.status} ${body}`);
  }

  return (await res.json()) as T;
}
