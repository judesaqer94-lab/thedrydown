/**
 * Find perfumes that generate broken slugs
 * Run: node find-broken.js
 */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://wydptxijqfqimsftgmlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

function normalizeSlug(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  let all = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('perfumes').select('id, name, brand').range(page * 500, (page + 1) * 500 - 1).order('id');
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 500) break;
    page++;
  }
  console.log('Total:', all.length);

  // Check for broken ones
  const broken = ['memo-paris-african-rose-memo-paris', 'nishane-hacivat-nishane', 'nishane-hundred-silent-ways-nishane', 'essential-parfums-bois-imperial-by-quentin-bisch-100-ml-essential-parfums'];

  broken.forEach(slug => {
    const match = all.find(p => normalizeSlug(`${p.name}-${p.brand}`) === slug);
    console.log(`\n"${slug}":`);
    if (match) {
      console.log(`  ✅ Found: ID ${match.id} | "${match.name}" by ${match.brand}`);
    } else {
      console.log(`  ❌ NO MATCH`);
      // Try partial matching
      const partial = all.filter(p => p.name.toLowerCase().includes(slug.split('-')[0]) || normalizeSlug(`${p.name}-${p.brand}`).includes(slug.substring(0, 15)));
      if (partial.length > 0) {
        console.log('  Possible matches:');
        partial.forEach(p => console.log(`    ID ${p.id}: "${p.name}" by ${p.brand} → slug: ${normalizeSlug(p.name + '-' + p.brand)}`));
      }
    }
  });

  // Also find all perfumes with brand name in the perfume name (duplicated)
  const dupes = all.filter(p => p.name.toLowerCase().includes(p.brand.toLowerCase()));
  console.log('\n\n--- Perfumes with brand name baked into name field ---');
  console.log('Count:', dupes.length);
  dupes.forEach(p => console.log(`  ID ${p.id}: "${p.name}" by ${p.brand} → slug: ${normalizeSlug(p.name + '-' + p.brand)}`));

  // Find perfumes with very long names
  console.log('\n\n--- Perfumes with long names (>40 chars) ---');
  const long = all.filter(p => p.name.length > 40);
  long.forEach(p => console.log(`  ID ${p.id}: "${p.name}" (${p.name.length} chars) by ${p.brand}`));
}

main();
