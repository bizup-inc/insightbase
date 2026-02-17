import type { APIContext } from 'astro';

const pageModules = import.meta.glob('/src/pages/**/*.astro');

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
  return route === '' ? '/' : route;
}

export function GET(context: APIContext) {
  const site = context.site ?? new URL(context.request.url).origin;

  const routes = Object.keys(pageModules)
    .map(normalizeRoute)
    .filter((route): route is string => Boolean(route))
    .sort((a, b) => a.localeCompare(b));

  const urls = routes
    .map((route) => `<url><loc>${new URL(route, site).toString()}</loc></url>`)
    .join('');

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
