import { BusinessProfile } from '../types';
import { extractJson, run } from '../anthropic';

const SYSTEM = `Generate valid JSON-LD only. No markdown. No explanation.`;

interface SchemaOutput {
  schemas: { type: string; label: string; code: string }[];
}

export async function generateSchemas(
  profile: BusinessProfile,
  socialLinks: string[] = []
): Promise<SchemaOutput['schemas']> {
  const user = `Generate Schema.org markup for ${profile.domain}.
Business: ${profile.businessName} | Sector: ${profile.sector} | Location: ${profile.location}
Services: ${profile.services.join(', ')} | Social profiles found during crawl: ${socialLinks.join(', ') || 'none'}

Generate these schema types: Organization (with sameAs), LocalBusiness (or sector subtype),
Service (one per service listed), WebSite+SearchAction, BreadcrumbList.

Return ONLY:
{"schemas":[{"type":"...","label":"display name","code":"...full json-ld string..."},...]}`;

  const text = await run({
    model: 'haiku',
    task: 'Schema generation',
    system: SYSTEM,
    user,
    maxTokens: 3000,
    clientName: profile.businessName,
  });
  const parsed = extractJson<SchemaOutput>(text);
  if (parsed?.schemas) return parsed.schemas;
  return fallbackSchemas(profile);
}

export function fallbackSchemas(profile: BusinessProfile): SchemaOutput['schemas'] {
  const url = `https://${profile.domain}`;
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: profile.businessName,
    url,
    description: profile.clientDescription,
    sameAs: [],
  };
  const local = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.businessName,
    url,
    address: { '@type': 'PostalAddress', addressLocality: profile.location, addressCountry: 'ZA' },
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile.businessName,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/?s={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const services = profile.services.slice(0, 5).map((s) => ({
    type: 'Service',
    label: s,
    code: JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: s,
        provider: { '@type': 'Organization', name: profile.businessName },
        areaServed: profile.location,
      },
      null,
      2
    ),
  }));
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: url },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${url}/services` },
    ],
  };
  return [
    { type: 'Organization', label: 'Organization', code: JSON.stringify(org, null, 2) },
    { type: 'LocalBusiness', label: 'LocalBusiness', code: JSON.stringify(local, null, 2) },
    { type: 'WebSite', label: 'WebSite + SearchAction', code: JSON.stringify(website, null, 2) },
    ...services,
    { type: 'BreadcrumbList', label: 'BreadcrumbList', code: JSON.stringify(breadcrumb, null, 2) },
  ];
}
