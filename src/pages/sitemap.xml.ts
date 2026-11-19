import type { APIRoute } from 'astro';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/work/verdict', priority: '0.9', changefreq: 'yearly' },
  { path: '/work/tb-amr', priority: '0.9', changefreq: 'yearly' },
  { path: '/work/karnataka-transit', priority: '0.9', changefreq: 'yearly' },
  { path: '/work/sweety', priority: '0.9', changefreq: 'yearly' },
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://amarthya.dev');
  const today = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${new URL(page.path, base).href}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
