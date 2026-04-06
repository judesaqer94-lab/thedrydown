// add-new-perfumes.js — Adds new perfumes using Fragella API
// Usage: node add-new-perfumes.js

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

const DELAY_MS = 3000;

// ═══ PERFUMES TO ADD ═══
// For brands with [range], we search by brand to pull popular ones
const SPECIFIC_PERFUMES = [
  // Carolina Herrera
  { name: "Cedar Chic", brand: "Carolina Herrera" },

  // BDK
  { name: "Vanille Leather", brand: "BDK Parfums" },

  // Khadlaj
  { name: "Musk Ice", brand: "Khadlaj" },

  // Panache
  { name: "Angel Dust", brand: "Panache" },
];

// Brands to pull full range from Fragella
const BRAND_SEARCHES = [
  { brand: "Memo Paris", searchAs: "Memo Paris", type: "Niche" },
  { brand: "Nishane", searchAs: "Nishane", type: "Niche" },
  { brand: "Essential Parfums", searchAs: "Essential Parfums", type: "Niche" },
  { brand: "Diptyque", searchAs: "Diptyque", type: "Niche" },
];

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(query, limit = 5) {
  const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=${limit}`;
  try {
    const res = await fetch(url, { headers: { 'x-api-key': FRAGELLA_API_KEY } });
    if (!res.ok) {
      if (res.status === 429) {
        console.log(`  ⏳ Rate limited, waiting 2 min...`);
        await sleep(120000);
        return searchFragella(query, limit);
      }
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch { return null; }
}

async function searchBrand(brandName, limit = 20) {
  const url = `https://api.fragella.com/api/v1/brands/${encodeURIComponent(brandName)}?limit=${limit}`;
  try {
    const res = await fetch(url, { headers: { 'x-api-key': FRAGELLA_API_KEY } });
    if (!res.ok) {
      if (res.status === 429) {
        console.log(`  ⏳ Rate limited, waiting 2 min...`);
        await sleep(120000);
        return searchBrand(brandName, limit);
      }
      // Try search endpoint instead
      return await searchFragella(brandName, limit);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch { return null; }
}

function extractData(d, overrideBrand, brandType) {
  const result = {
    name: d.Name || '',
    brand: overrideBrand || (d.Brand || '').replace(/^.*? /, ''), // Clean brand name
    brand_type: brandType || 'Niche',
    price_low: 0,
    price_high: 0,
  };

  // Fix brand name from Fragella format (often "Brand Name")
  if (d.Brand) {
    // Use override if provided, otherwise clean up Fragella brand
    if (!overrideBrand) result.brand = d.Brand;
  }

  if (d.Notes) {
    if (d.Notes.Top && Array.isArray(d.Notes.Top))
      result.top_notes = d.Notes.Top.map(n => n.name).join(', ');
    if (d.Notes.Middle && Array.isArray(d.Notes.Middle))
      result.heart_notes = d.Notes.Middle.map(n => n.name).join(', ');
    if (d.Notes.Base && Array.isArray(d.Notes.Base))
      result.base_notes = d.Notes.Base.map(n => n.name).join(', ');
  }

  if (d['Main Accords'] && Array.isArray(d['Main Accords']))
    result.main_accords = d['Main Accords'].join(', ');
  if (d['Main Accords Percentage'])
    result.accord_percentages = JSON.stringify(d['Main Accords Percentage']);
  if (d['Season Ranking'] && Array.isArray(d['Season Ranking']))
    result.season_ranking = JSON.stringify(d['Season Ranking']);
  if (d['Occasion Ranking'] && Array.isArray(d['Occasion Ranking']))
    result.occasion_ranking = JSON.stringify(d['Occasion Ranking']);
  if (d['Longevity']) result.longevity = d['Longevity'];
  if (d['Sillage']) result.sillage = d['Sillage'];
  if (d['Country']) result.country = d['Country'];
  if (d['Price Value']) result.price_value = d['Price Value'];
  if (d['Image URL']) result.image_url = d['Image URL'].replace('.jpg', '.webp');
  if (d['rating']) result.rating = parseFloat(d['rating']) || 4.0;
  if (d['Year']) {
    const y = parseInt(d['Year']);
    if (y > 1900 && y < 2030) result.year = y;
  }
  if (d['Gender']) {
    const g = d['Gender'].toLowerCase();
    if (g.includes('women') || g.includes('female')) result.gender = 'Women';
    else if (g.includes('men') || g.includes('male')) result.gender = 'Men';
    else result.gender = 'Unisex';
  }
  if (d['OilType']) {
    const oil = d['OilType'];
    if (oil.includes('Extrait')) result.concentration = 'Extrait';
    else if (oil.includes('Parfum') && !oil.includes('Eau')) result.concentration = 'Parfum';
    else if (oil.includes('EDP') || oil.includes('Eau de Parfum')) result.concentration = 'EDP';
    else if (oil.includes('EDT') || oil.includes('Eau de Toilette')) result.concentration = 'EDT';
    else if (oil.includes('Cologne')) result.concentration = 'Cologne';
    else result.concentration = oil;
  }

  // Defaults
  if (!result.year) result.year = 2020;
  if (!result.gender) result.gender = 'Unisex';
  if (!result.concentration) result.concentration = 'EDP';
  if (!result.family) result.family = 'Oriental';
  if (!result.rating) result.rating = 4.0;

  return result;
}

async function checkExists(name, brand) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/perfumes?name=eq.${encodeURIComponent(name)}&brand=eq.${encodeURIComponent(brand)}&select=id&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    return data && data.length > 0;
  } catch { return false; }
}

async function insertPerfume(perfumeData) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(perfumeData)
    });
    return res.ok;
  } catch { return false; }
}

async function main() {
  console.log('');
  console.log('🧴 The Dry Down — Add New Perfumes');
  console.log('====================================\n');

  // Check API usage
  const usageRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const usage = await usageRes.json();
  console.log(`📊 API: ${usage.usage.requests_remaining} requests remaining\n`);

  let added = 0;
  let skipped = 0;
  let notFound = 0;

  // ═══ PHASE 1: Specific perfumes ═══
  console.log('═══ PHASE 1: Adding specific perfumes ═══\n');

  for (const p of SPECIFIC_PERFUMES) {
    process.stdout.write(`${p.brand} — ${p.name}... `);

    const exists = await checkExists(p.name, p.brand);
    if (exists) { console.log('⏭️ already exists'); skipped++; await sleep(500); continue; }

    const results = await searchFragella(`${p.name} ${p.brand}`);
    if (results && results.length > 0) {
      const data = extractData(results[0], p.brand, p.type || 'Niche');
      data.name = p.name; // Keep our name
      const saved = await insertPerfume(data);
      console.log(saved ? '✅ added' : '⚠️ failed');
      if (saved) added++;
    } else {
      console.log('❌ not found');
      notFound++;
    }
    await sleep(DELAY_MS);
  }

  // ═══ PHASE 2: Full brand ranges ═══
  console.log('\n═══ PHASE 2: Adding brand ranges ═══\n');

  for (const b of BRAND_SEARCHES) {
    console.log(`\n🏷️  ${b.brand}:`);

    const results = await searchBrand(b.searchAs, 25);
    if (!results) {
      console.log('  ❌ Brand not found in API');
      await sleep(DELAY_MS);
      continue;
    }

    console.log(`  Found ${results.length} perfumes`);

    for (const fragrance of results) {
      const name = fragrance.Name || '';
      if (!name) continue;

      process.stdout.write(`  ${name}... `);

      const exists = await checkExists(name, b.brand);
      if (exists) { console.log('⏭️ exists'); skipped++; continue; }

      const data = extractData(fragrance, b.brand, b.type);
      const saved = await insertPerfume(data);
      console.log(saved ? '✅' : '⚠️');
      if (saved) added++;

      await sleep(1000); // Faster since we already have the data
    }

    await sleep(DELAY_MS);
  }

  // ═══ SUMMARY ═══
  console.log('\n====================================');
  console.log('🏁 DONE!');
  console.log(`✅ Added: ${added}`);
  console.log(`⏭️  Already existed: ${skipped}`);
  console.log(`❌ Not found: ${notFound}`);

  const finalRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const finalUsage = await finalRes.json();
  console.log(`📊 API requests remaining: ${finalUsage.usage.requests_remaining}`);
  console.log('\n🌐 Check thedrydown.io — new perfumes should be live!');
}

main().catch(err => console.error('Error:', err.message));
