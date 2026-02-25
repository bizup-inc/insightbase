// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const normalizedSiteUrl = process.env.SITE_URL
  ? process.env.SITE_URL.replace(/\/+$/, '')
  : 'https://insightbase.jp';

// https://astro.build/config
export default defineConfig({
  site: normalizedSiteUrl,
  output: 'server',
  adapter: vercel()
});
