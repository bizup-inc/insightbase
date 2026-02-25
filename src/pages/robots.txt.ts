import type { APIContext } from "astro";

const disallowPaths = [
  "/inquiry/thanks",
  "/checkout/thanks-ga4",
  "/checkout/thanks-gad",
  "/checkout/thanks-set",
  "/column/preview"
];

export async function GET(context: APIContext) {
  const site = context.site ?? new URL(context.request.url).origin;
  const sitemapUrl = new URL("/sitemap.xml", site).toString();

  const lines = [
    "User-agent: *",
    "Allow: /",
    ...disallowPaths.map((path) => `Disallow: ${path}`),
    "Disallow: /*?draftKey=",
    "Disallow: /*&draftKey=",
    `Sitemap: ${sitemapUrl}`
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
