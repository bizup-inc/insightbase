import type { APIContext } from 'astro';
import { getPublishedColumns } from '../lib/microcms';

const pageModules = import.meta.glob('/src/pages/**/*.astro');
const excludedRoutes = new Set([
  '/inquiry/thanks',
  '/checkout/thanks-ga4',
  '/checkout/thanks-gad',
  '/checkout/thanks-set',
  '/knowledge/preview'
]);

function normalizeRoute(filePath: string): string | null {
  let route = filePath
    .replace('/src/pages', '')
    .replace(/index\.astro$/, '')
    .replace(/\.astro$/, '');

  if (!route.startsWith('/')) {
    route = `/${route}`;
  }

  if (!route || route === '') {
    return '/';
  }

  if (route.includes('/api/') || route === '/api') {
    return null;
  }

  if (route.includes('[') || route.includes(']')) {
    return null;
  }

  route = route.replace(/\/+$/, '');
  const normalizedRoute = route === '' ? '/' : route;

  if (excludedRoutes.has(normalizedRoute)) {
    return null;
  }

  return normalizedRoute;
}

type SitemapEntry = {
  path: string;
  lastmod?: string;
};

const toSitemapXml = (site: string | URL, entries: SitemapEntry[]) =>
  entries
    .map(({ path, lastmod }) => {
      const loc = new URL(path, site).toString();
      if (!lastmod) return `<url><loc>${loc}</loc></url>`;
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join('');

export async function GET(context: APIContext) {
  const site = context.site ?? new URL(context.request.url).origin;

  const staticRoutes = Object.keys(pageModules)
    .map(normalizeRoute)
    .filter((route): route is string => Boolean(route))
    .sort((a, b) => a.localeCompare(b));

  const staticEntries: SitemapEntry[] = staticRoutes.map((path) => ({ path }));

  const columnEntries: SitemapEntry[] = await getPublishedColumns()
    .then((columns) =>
      columns
        .filter((item) => Boolean(item.slug))
        .map((item) => ({
          path: `/knowledge/${item.slug}`,
          lastmod: item.updatedAt ?? item.publishedAt
        }))
    )
    .catch((error) => {
      console.error('[sitemap] failed to fetch microCMS columns', {
        hasServiceDomain: Boolean(import.meta.env.MICROCMS_SERVICE_DOMAIN),
        hasApiKey: Boolean(import.meta.env.MICROCMS_API_KEY),
        error
      });
      return [];
    });

  const uniqueEntries = new Map<string, SitemapEntry>();
  [...staticEntries, ...columnEntries].forEach((entry) => {
    if (!uniqueEntries.has(entry.path)) {
      uniqueEntries.set(entry.path, entry);
    }
  });

  const urls = toSitemapXml(site, Array.from(uniqueEntries.values()));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls +
    '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
