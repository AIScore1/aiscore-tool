// Shared types for AI Score tool

export interface CategoryScores {
  technicalSEO: number;
  schemaMarkup: number;
  eeat: number;
  citability: number;
  brandAuthority: number;
  platformReadiness: number;
}

export interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface CrawledPage {
  url: string;
  status: number;
  html: string;
  text: string;
  title: string;
  metaDescription: string;
  responseTimeMs: number;
  headers: Record<string, string>;
  contentType: string;
  bytes: number;
}

export interface CrawlResult {
  domain: string;
  pages: CrawledPage[];
  sitemapFound: boolean;
  robotsTxt: string | null;
  llmsTxt: string | null;
  brokenLinks: string[];
  homepageHtml: string;
}

export interface PublicAuditInput {
  name: string;
  email: string;
  phone?: string;
  url: string;
  competitorUrl?: string;
  ip?: string;
  captchaAnswer?: string;
}

export interface PublicAuditResult {
  reportId: string;
  generatedAt: string;
  expiresAt: string;
  prospect: {
    domain: string;
    geoScore: number;
    grade: string;
    categoryScores: CategoryScores;
    topIssues: Issue[];
    quickWins: string[];
    aiCrawlerAccess: number;
    hasLlmsTxt: boolean;
    hasSchema: boolean;
  };
  competitor?: {
    domain: string;
    geoScore: number;
    grade: string;
    categoryScores: CategoryScores;
  };
  sectorBenchmark: {
    sector: string;
    averageScore: number;
    label: string;
  };
  projectedScores: {
    afterQuickWins: number;
    afterFoundation: number;
  };
}

export interface BusinessProfile {
  businessName: string;
  domain: string;
  url: string;
  sector: string;
  location: string;
  services: string[];
  targetCustomers: string;
  competitors: string[];
  meetingNotes: string;
  contactEmail?: string;
  // Brand voice questionnaire
  clientDescription: string;
  uniqueDifference: string;
  tonePreference: 'authoritative' | 'warm' | 'friendly' | 'playful';
  proofPoints: string;
  primaryProblem: string;
}

export interface AuditReport {
  id: string;
  url: string;
  domain: string;
  businessType: string;
  generatedAt: string;
  expiresAt: string;
  pagesCrawled: number;
  geoScore: number;
  grade: string;
  categoryScores: CategoryScores;
  detail: {
    technicalSEO: TechnicalSEOResult;
    schemaMarkup: SchemaMarkupResult;
    eeat: EEATResult;
    aiCrawlers: AICrawlersResult;
    brandAuthority: BrandAuthorityResult;
    citability: CitabilityResult;
    platformScores: PlatformScores;
  };
  findings: {
    critical: Issue[];
    high: Issue[];
    medium: Issue[];
  };
  executiveSummary: string;
  actionPlan: ActionPlan;
  schemaCode: SchemaCodeOutput;
  eeatNarrative: string;
}

export interface TechnicalSEOResult {
  total: number;
  crawlability: number;
  indexability: number;
  security: number;
  urlStructure: number;
  mobile: number;
  coreWebVitals: number;
  ssr: number;
  pageSpeed: number;
  details: Record<string, unknown>;
}

export interface SchemaMarkupResult {
  total: number;
  schemasFound: string[];
  details: Record<string, unknown>;
}

export interface EEATResult {
  total: number;
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
  details: Record<string, unknown>;
}

export interface AICrawlersResult {
  total: number;
  welcomedCrawlers: string[];
  blockedCrawlers: string[];
  hasLlmsTxt: boolean;
  llmsTxtValid: boolean;
}

export interface BrandAuthorityResult {
  total: number;
  youtube: number;
  reddit: number;
  wikipedia: number;
  linkedin: number;
  github: number;
  details: Record<string, unknown>;
}

export interface CitabilityBlock {
  heading: string;
  content: string;
  answer_quality: number;
  self_containment: number;
  structural_readability: number;
  statistical_density: number;
  uniqueness: number;
  weighted_total: number;
  weakness: string;
}

export interface CitabilityResult {
  total: number;
  blocks: CitabilityBlock[];
  averageStatDensity: number;
}

export interface PlatformScores {
  googleAIO: number;
  chatgpt: number;
  perplexity: number;
  gemini: number;
  bingCopilot: number;
  total: number;
}

export interface ActionItem {
  action: string;
  expected_impact: string;
  effort: 'low' | 'medium' | 'high';
  estimated_points: number;
}

export interface ActionPlan {
  quickWins: ActionItem[];
  mediumTermActions: ActionItem[];
  strategicInitiatives: ActionItem[];
  projectedScores: {
    phase: string;
    timeline: string;
    score: number;
    improvement: number;
  }[];
}

export interface SchemaCodeOutput {
  schemas: { type: string; label: string; code: string }[];
}

// Improvement pack
export interface ImprovementResult {
  id: string;
  profile: BusinessProfile;
  generatedAt: string;
  expiresAt: string;
  quickWins: {
    robotsTxt: string;
    llmsTxt: string;
    metaTags: string;
  };
  schemas: { type: string; label: string; code: string }[];
  faqHub: {
    faqs: { question: string; answer: string }[];
    htmlPage: string;
    schemaJsonLd: string;
  };
  articles: ArticleOutput[];
  brandVoice: string;
  contentStrategy: string;
  promptLibrary: { title: string; prompt: string; usageNotes: string }[];
}

export interface ArticleOutput {
  id: string;
  title: string;
  targetQuery: string;
  mode: 'full' | 'outline';
  content: string;
  wordCount: number;
  published: boolean;
}

// Lead model
export interface Lead {
  id: string;
  createdAt: string;
  reportId: string;
  reportExpiresAt: string;
  name: string;
  email: string;
  phone?: string;
  domain: string;
  competitorDomain?: string;
  geoScore: number;
  competitorScore?: number;
  sector: string;
  sectorAverage: number;
  scoreGap: number;
  temperature: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'audit_sent' | 'proposal' | 'client' | 'lost';
  notes: string;
  categoryScores: CategoryScores;
  topIssues: Issue[];
  read: boolean;
}

// API usage tracking
export interface ApiCall {
  id: string;
  timestamp: string;
  model: 'haiku' | 'sonnet';
  task: string;
  tokensIn: number;
  tokensOut: number;
  costUSD: number;
  costZAR: number;
  clientName?: string;
}

export interface CreditBalance {
  initialCreditsUSD: number;
  initialCreditsZAR: number;
  spentUSD: number;
  spentZAR: number;
  remainingUSD: number;
  remainingZAR: number;
  lastUpdated: string;
}

// SSE event payload
export interface ProgressEvent {
  type: 'progress' | 'done' | 'error';
  percent?: number;
  message?: string;
  data?: unknown;
  error?: string;
}
