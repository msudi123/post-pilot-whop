import { getSupabaseAdmin } from './supabase';

export interface ProductContextRow {
  id?: string;
  company_id: string;
  tagline?: string | null;
  what_it_does?: string | null;
  who_its_for?: string | null;
  key_benefits?: string | null;
  price?: string | null;
  promo_code?: string | null;
  promo_details?: string | null;
  product_link?: string | null;
  buyer_pain?: string | null;
  desired_outcome?: string | null;
  biggest_objection?: string | null;
  proof_points?: string | null;
  cta_preference?: string | null;
  target_keywords?: string | null;
  whop_company?: string | null;
  whop_products?: string | null;
  posting_mode?: string | null;
  signature_template?: string | null;
  signature_enabled_default?: boolean | null;
  default_forum_id?: string | null;
  brand_voice?: string | null;
  posting_goal?: string | null;
  posting_frequency?: string | null;
  onboarding_completed?: boolean | null;
  updated_at?: string | null;
}

const LEGACY_PRODUCT_CONTEXT_COLUMNS = [
  'id',
  'company_id',
  'tagline',
  'what_it_does',
  'who_its_for',
  'key_benefits',
  'price',
  'promo_code',
  'promo_details',
  'product_link',
  'buyer_pain',
  'desired_outcome',
  'biggest_objection',
  'proof_points',
  'cta_preference',
  'target_keywords',
  'whop_company',
  'whop_products',
  'updated_at',
].join(', ');

const FULL_PRODUCT_CONTEXT_COLUMNS = `${LEGACY_PRODUCT_CONTEXT_COLUMNS}, posting_mode, signature_template, signature_enabled_default, default_forum_id, brand_voice, posting_goal, posting_frequency, onboarding_completed`;

function val(value?: string | null) {
  return value?.trim() || '';
}

export function formatProductContext(row?: ProductContextRow | null) {
  if (!row) return '';

  return `You are writing posts for the following product:

Company: ${val(row.whop_company)}
Product: ${val(row.whop_products)}
Tagline: ${val(row.tagline)}
What it does: ${val(row.what_it_does)}
Who it's for: ${val(row.who_its_for)}
Key benefits:
${val(row.key_benefits)}
Price: ${val(row.price)}
Promo code: ${val(row.promo_code)}${val(row.promo_details) ? ` (${val(row.promo_details)})` : ''}
Link: ${val(row.product_link)}
Buyer pain: ${val(row.buyer_pain)}
Desired outcome: ${val(row.desired_outcome)}
Biggest objection: ${val(row.biggest_objection)}
Proof/results:
${val(row.proof_points)}
CTA preference: ${val(row.cta_preference)}
Target keywords: ${val(row.target_keywords)}

Use this context to write accurate, specific posts.
Reference real details from the product - never make up features or benefits that aren't listed above.
When mentioning price, code, or link use the exact values provided.
Optimize for Whop conversion: curiosity, trust, product education, objection handling, urgency, and direct joins.
Frame the offer as access to a Whop, community, membership, course, or private resource hub - not just a downloadable product.
When possible, use language like "inside the Whop", "members get", "unlock access", "join the Whop", and "inside you get".
Name specific deliverables from the context so readers know what they are buying access to.
Use specific proof only when it is provided. Never invent revenue, reviews, member counts, timelines, results, scarcity, deadlines, or guarantees.
End promotional posts with a direct join CTA when a link or CTA preference is available. Do not use DM/comment funnels.
Write like a helpful creator inside a Whop community, not like a generic social media account.`;
}

function normalizeProductContext(row?: ProductContextRow | null) {
  if (!row) return null;

  return {
    ...row,
    posting_mode: row.posting_mode || 'approval',
    signature_template: row.signature_template || '',
    signature_enabled_default: row.signature_enabled_default ?? true,
    default_forum_id: row.default_forum_id || '',
    brand_voice: row.brand_voice || 'Professional',
    posting_goal: row.posting_goal || 'Engagement',
    posting_frequency: row.posting_frequency || '5 posts/week',
    onboarding_completed: row.onboarding_completed ?? false,
  } as ProductContextRow;
}

export async function getProductContext(companyId: string) {
  let query = await getSupabaseAdmin()
    .from('product_context')
    .select(FULL_PRODUCT_CONTEXT_COLUMNS)
    .eq('company_id', companyId)
    .maybeSingle();

  if (
    query.error &&
    query.error.message.toLowerCase().includes('could not find')
  ) {
    query = await getSupabaseAdmin()
      .from('product_context')
      .select(LEGACY_PRODUCT_CONTEXT_COLUMNS)
      .eq('company_id', companyId)
      .maybeSingle();
  }

  if (query.error) {
    if (
      query.error.message.toLowerCase().includes('does not exist') ||
      query.error.message.toLowerCase().includes('schema cache')
    ) {
      return null;
    }
    throw new Error(`product_context query failed: ${query.error.message}`);
  }

  return normalizeProductContext(query.data as unknown as ProductContextRow | null);
}

export async function saveProductContext(row: ProductContextRow) {
  const fullRow = {
    ...row,
    posting_mode: row.posting_mode || 'approval',
    signature_template: row.signature_template || '',
    signature_enabled_default: row.signature_enabled_default ?? true,
    default_forum_id: row.default_forum_id || '',
    brand_voice: row.brand_voice || 'Professional',
    posting_goal: row.posting_goal || 'Engagement',
    posting_frequency: row.posting_frequency || '5 posts/week',
    onboarding_completed: row.onboarding_completed ?? false,
  };

  let query = await getSupabaseAdmin()
    .from('product_context')
    .upsert(fullRow, { onConflict: 'company_id' })
    .select(FULL_PRODUCT_CONTEXT_COLUMNS)
    .single();

  if (
    query.error &&
    query.error.message.toLowerCase().includes('could not find')
  ) {
    const legacyRow = {
      company_id: row.company_id,
      tagline: row.tagline || '',
      what_it_does: row.what_it_does || '',
      who_its_for: row.who_its_for || '',
      key_benefits: row.key_benefits || '',
      price: row.price || '',
      promo_code: row.promo_code || '',
      promo_details: row.promo_details || '',
      product_link: row.product_link || '',
      buyer_pain: row.buyer_pain || '',
      desired_outcome: row.desired_outcome || '',
      biggest_objection: row.biggest_objection || '',
      proof_points: row.proof_points || '',
      cta_preference: row.cta_preference || '',
      target_keywords: row.target_keywords || '',
      whop_company: row.whop_company || '',
      whop_products: row.whop_products || '',
      updated_at: row.updated_at || new Date().toISOString(),
    };

    query = await getSupabaseAdmin()
      .from('product_context')
      .upsert(legacyRow, { onConflict: 'company_id' })
      .select(LEGACY_PRODUCT_CONTEXT_COLUMNS)
      .single();
  }

  if (query.error) {
    throw new Error(`product_context upsert failed: ${query.error.message}`);
  }

  return normalizeProductContext(query.data as unknown as ProductContextRow | null);
}
