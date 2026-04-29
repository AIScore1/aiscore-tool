export const SECTOR_BENCHMARKS: Record<string, { label: string; avg: number }> = {
  legal: { label: 'Legal services in South Africa', avg: 52 },
  accounting: { label: 'Accounting & finance in South Africa', avg: 49 },
  healthcare: { label: 'Healthcare practices in South Africa', avg: 44 },
  realestate: { label: 'Real estate in South Africa', avg: 55 },
  education: { label: 'Education & training in South Africa', avg: 47 },
  hospitality: { label: 'Hospitality in South Africa', avg: 51 },
  ecommerce: { label: 'E-commerce in South Africa', avg: 58 },
  construction: { label: 'Construction in South Africa', avg: 41 },
  technology: { label: 'Technology & SaaS in South Africa', avg: 56 },
  default: { label: 'SMEs in South Africa', avg: 49 },
};

const KEYWORDS: Record<string, string[]> = {
  legal: ['attorney', 'lawyer', 'law firm', 'legal services', 'advocate', 'litigation', 'conveyancing'],
  accounting: ['accountant', 'accounting', 'tax', 'sars', 'bookkeeping', 'audit', 'cfo', 'finance'],
  healthcare: ['clinic', 'doctor', 'medical', 'physiotherap', 'dentist', 'practice', 'hospital', 'wellness'],
  realestate: ['property', 'real estate', 'estate agent', 'realtor', 'rentals', 'sales agent'],
  education: ['school', 'tutor', 'training', 'course', 'education', 'academy', 'college'],
  hospitality: ['restaurant', 'hotel', 'lodge', 'guesthouse', 'cafe', 'tour', 'safari'],
  ecommerce: ['shop online', 'online store', 'e-commerce', 'add to cart', 'product range', 'shipping'],
  construction: ['construction', 'builder', 'contractor', 'engineering', 'civils'],
  technology: ['software', 'saas', 'platform', 'developer', 'api', 'tech stack', 'product'],
};

export function detectSector(homepageText: string): string {
  const lower = homepageText.toLowerCase();
  let best = 'default';
  let bestHits = 0;
  for (const [sector, words] of Object.entries(KEYWORDS)) {
    const hits = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (hits > bestHits) {
      bestHits = hits;
      best = sector;
    }
  }
  return bestHits > 0 ? best : 'default';
}

export function getBenchmark(sector: string) {
  return SECTOR_BENCHMARKS[sector] ?? SECTOR_BENCHMARKS.default;
}
