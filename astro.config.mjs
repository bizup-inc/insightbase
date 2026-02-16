// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const normalizedSiteUrl = process.env.SITE_URL
  ? process.env.SITE_URL.replace(/\/+$/, '')
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;

// https://astro.build/config
export default defineConfig({
  site: normalizedSiteUrl,
  output: 'server',
  adapter: vercel()
});
