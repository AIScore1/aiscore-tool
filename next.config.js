/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // puppeteer-core + @sparticuz/chromium must stay external so Next.js doesn't try
    // to inline the Chromium binary into the function bundle.
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'cheerio'],
  },
};

module.exports = nextConfig;
