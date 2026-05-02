import { NextRequest, NextResponse } from 'next/server';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { getProductContext } from '@/lib/product-context';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

function compact(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET(req: NextRequest) {
  try {
    const companyId =
      (req.nextUrl.searchParams.get('companyId') || getCompanyIdFromReferer(req.headers) || '').trim();

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const whop = getWhopSdk();
    const lines: string[] = [];
    let whopCompany = '';
    let whopUrl = '';
    let whopProducts: Array<{ name: string; headline?: string; description?: string; link?: string }> = [];

    try {
      const company = (await whop.companies.retrieve(companyId)) as any;
      const title = compact(company.title);
      const description = compact(company.description);
      const audience = compact(company.target_audience);
      const route = compact(company.route);

      whopCompany = title;
      whopUrl = route ? `https://whop.com/${route}` : '';
      if (title) lines.push(`Company: ${title}`);
      if (description) lines.push(`Description: ${description}`);
      if (audience) lines.push(`Target audience: ${audience}`);
      if (route) lines.push(`Whop page: whop.com/${route}`);
    } catch (err) {
      console.warn('[product-context:company]', getErrorMessage(err));
    }

    try {
      const products = await whop.products.list({ company_id: companyId, first: 10 });
      const productLines: string[] = [];

      for await (const product of products as any) {
        const title = compact(product.title);
        const headline = compact(product.headline);
        const description = compact(product.description);
        const route = compact(product.route);
        const parts = [title, headline, description].filter(Boolean);

        if (parts.length > 0) {
          whopProducts.push({
            name: title || 'Untitled product',
            headline: headline || undefined,
            description: description || undefined,
            link: route ? `https://whop.com/${route}` : undefined,
          });
          productLines.push(
            `- ${parts.join(' | ')}${route ? ` | whop.com/${route}` : ''}`
          );
        }
      }

      if (productLines.length > 0) {
        lines.push(`Products:\n${productLines.join('\n')}`);
      }
    } catch (err) {
      console.warn('[product-context:products]', getErrorMessage(err));
    }

    if (lines.length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not read Whop company/product details. Add company:basic:read and access_pass:basic:read permissions, or enter context manually.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      context: lines.join('\n\n'),
      saved: await getProductContext(companyId),
      whop: {
        company: whopCompany,
        products: whopProducts,
        url: whopUrl,
      },
    });
  } catch (err) {
    console.error('[product-context]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
