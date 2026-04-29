import { BusinessProfile } from '../types';

export function generateOgTags(profile: BusinessProfile): string {
  const today = new Date().toISOString();
  const url = `https://${profile.domain}/`;
  const title = profile.businessName;
  const description = profile.clientDescription || profile.targetCustomers || profile.businessName;
  return `<!-- AI Score (aiscore.co.za) — Open Graph + Canonical + Date metadata -->
<!-- Paste into the <head> section of every page. Customise per-page where needed. -->

<!-- Open Graph: how this page appears when shared on social or AI engines -->
<meta property="og:title" content="${escapeAttr(title)}" />
<meta property="og:description" content="${escapeAttr(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="${url}og-image.jpg" />
<meta property="og:locale" content="en_ZA" />

<!-- Twitter Card: how this page appears when shared on X/Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeAttr(title)}" />
<meta name="twitter:description" content="${escapeAttr(description)}" />

<!-- Canonical: tells AI engines and search engines this is the authoritative URL -->
<link rel="canonical" href="${url}" />

<!-- Article modified time: AI engines weight fresh content. Update on every change. -->
<meta name="article:modified_time" content="${today}" />
<meta name="article:published_time" content="${today}" />`;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
