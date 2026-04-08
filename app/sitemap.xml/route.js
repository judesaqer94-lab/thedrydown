import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(name, brand) {
  return `${name}-${brand}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET() {
  const { data: perfumes } = await supabase.from('perfumes').select('name, brand, top_notes, heart_notes, base_notes').limit(10000);

  const baseUrl = 'https://www.thedrydown.io';
  const today = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/brands', priority: '0.8', changefreq: 'weekly' },
    { url: '/notes', priority: '0.8', changefreq: 'weekly' },
  ];

  // Perfume pages
  const perfumePages = (perfumes || []).map(p => ({
    url: `/perfume/${slugify(p.name, p.brand)}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  // Note pages — extract unique notes
  const noteSet = new Set();
  (perfumes || []).forEach(p => {
    [p.top_notes, p.heart_notes, p.base_notes].forEach(field => {
      if (field) {
        field.split(',').map(n => n.trim()).filter(Boolean).forEach(n => noteSet.add(n));
      }
    });
  });
  const notePages = [...noteSet].map(n => ({
    url: `/note/${encodeURIComponent(n.toLowerCase())}`,
    priority: '0.6',
    changefreq: 'monthly',
  }));

  const allPages = [...staticPages, ...perfumePages, ...notePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
