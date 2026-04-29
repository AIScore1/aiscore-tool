import axios from 'axios';
import { BrandAuthorityResult } from '../types';

const TIMEOUT = 6000;
const UA = { 'User-Agent': 'AIScore-GEO-Audit/1.0 (found@aiscore.co.za)' };

async function head(url: string): Promise<number> {
  try {
    const res = await axios.head(url, {
      timeout: TIMEOUT,
      headers: UA,
      validateStatus: () => true,
      maxRedirects: 5,
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function youtubeScore(brand: string): Promise<number> {
  const slug = brand.toLowerCase().replace(/\s+/g, '');
  const status = await head(`https://www.youtube.com/@${slug}`);
  return status === 200 ? 60 : 10;
}

async function redditScore(brand: string): Promise<number> {
  try {
    const res = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(brand)}&limit=25`,
      { timeout: TIMEOUT, headers: UA, validateStatus: () => true }
    );
    const count = res.data?.data?.children?.length ?? 0;
    if (count === 0) return 10;
    if (count <= 3) return 40;
    if (count <= 10) return 60;
    if (count <= 20) return 75;
    return 85;
  } catch {
    return 10;
  }
}

async function wikipediaScore(brand: string): Promise<number> {
  try {
    const res = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(brand)}&limit=1&format=json`,
      { timeout: TIMEOUT, headers: UA, validateStatus: () => true }
    );
    const titles = res.data?.[1] ?? [];
    return titles.length > 0 ? 70 : 0;
  } catch {
    return 0;
  }
}

async function linkedinScore(brand: string): Promise<number> {
  const slug = brand.toLowerCase().replace(/\s+/g, '-');
  const status = await head(`https://www.linkedin.com/company/${slug}`);
  return status === 200 ? 60 : 35;
}

async function githubScore(brand: string): Promise<number> {
  try {
    const res = await axios.get(
      `https://api.github.com/search/users?q=${encodeURIComponent(brand)}`,
      {
        timeout: TIMEOUT,
        headers: { ...UA, Accept: 'application/vnd.github+json' },
        validateStatus: () => true,
      }
    );
    const count = res.data?.total_count ?? 0;
    if (count === 0) return 30;
    if (count <= 3) return 50;
    return 70;
  } catch {
    return 30;
  }
}

export async function scoreBrandAuthority(brand: string): Promise<BrandAuthorityResult> {
  if (!brand) {
    return {
      total: 0,
      youtube: 0,
      reddit: 0,
      wikipedia: 0,
      linkedin: 0,
      github: 0,
      details: {},
    };
  }
  const [yt, rd, wk, ln, gh] = await Promise.all([
    youtubeScore(brand),
    redditScore(brand),
    wikipediaScore(brand),
    linkedinScore(brand),
    githubScore(brand),
  ]);

  let weighted = yt * 0.25 + rd * 0.25 + wk * 0.2 + ln * 0.15 + gh * 0.15;
  if (wk === 0) weighted *= 0.85;

  return {
    total: Math.round(weighted),
    youtube: yt,
    reddit: rd,
    wikipedia: wk,
    linkedin: ln,
    github: gh,
    details: { brand },
  };
}
