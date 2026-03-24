// fix-all-data.js — Overwrites ALL perfume data with accurate Fragella API data
// Usage: node fix-all-data.js

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

const DELAY_MS = 3000; // 3 seconds — pro plan can handle this

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(name, brand, retries = 2) {
  const searches = [
    `${name} ${brand}`,
    `${stripAccents(name)} ${brand}`,
    name,
    stripAccents(name),
  ];

  for (const query of searches) {
    const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=5`;

    try {
      const res = await fetch(url, { headers: { 'x-api-key': FRAGELLA_API_KEY } });

      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          console.log(`\n  ⏳ Rate limited, waiting 2 min...`);
          await sleep(120000);
          return searchFragella(name, brand, retries - 1);
        }
        continue;
      }

      const data = await res.json();
      if (!data || !Array.isArray(data) || data.length === 0) continue;

      const nameLower = stripAccents(name).toLowerCase();
      const brandLower = stripAccents(brand).toLowerCase();
      const brandFirst = brandLower.split(' ')[0];

      // Best: exact name + brand match
      let match = data.find(d => {
        const dn = stripAccents(d.Name || '').toLowerCase();
        const db = stripAccents(d.Brand || '').toLowerCase();
        return dn === nameLower && db.includes(brandFirst);
      });

      // Good: name contains + brand contains
      if (!match) {
        match = data.find(d => {
          const dn = stripAccents(d.Name || '').toLowerCase();
          const db = stripAccents(d.Brand || '').toLowerCase();
          return (dn.includes(nameLower) || nameLower.includes(dn)) && db.includes(brandFirst);
        });
      }

      // OK: name match, ignore brand
      if (!match) {
        match = data.find(d => {
          const dn = stripAccents(d.Name || '').toLowerCase();
          return dn.includes(nameLower) || nameLower.includes(dn);
        });
      }

      if (match) return match;
    } catch {
      continue;
    }
  }

  return null;
}

function extractData(d) {
  const result = {};

  // ═══ NOTES (correct structure: d.Notes.Top/Middle/Base) ═══
  if (d.Notes) {
    if (d.Notes.Top && Array.isArray(d.Notes.Top)) {
      result.top_notes = d.Notes.Top.map(n => n.name).join(', ');
    }
    if (d.Notes.Middle && Array.isArray(d.Notes.Middle)) {
      result.heart_notes = d.Notes.Middle.map(n => n.name).join(', ');
    }
    if (d.Notes.Base && Array.isArray(d.Notes.Base)) {
      result.base_notes = d.Notes.Base.map(n => n.name).join(', ');
    }
  }

  // ═══ ACCORDS ═══
  if (d['Main Accords'] && Array.isArray(d['Main Accords'])) {
    result.main_accords = d['Main Accords'].join(', ');
  }

  // ═══ ACCORD PERCENTAGES ═══
  if (d['Main Accords Percentage']) {
    result.accord_percentages = JSON.stringify(d['Main Accords Percentage']);
  }

  // ═══ SEASON RANKING ═══
  if (d['Season Ranking'] && Array.isArray(d['Season Ranking'])) {
    result.season_ranking = JSON.stringify(d['Season Ranking']);
  }

  // ═══ OCCASION RANKING ═══
  if (d['Occasion Ranking'] && Array.isArray(d['Occasion Ranking'])) {
    result.occasion_ranking = JSON.stringify(d['Occasion Ranking']);
  }

  // ═══ LONGEVITY & SILLAGE ═══
  if (d['Longevity']) result.longevity = d['Longevity'];
  if (d['Sillage']) result.sillage = d['Sillage'];

  // ═══ COUNTRY ═══
  if (d['Country']) result.country = d['Country'];

  // ═══ PRICE VALUE ═══
  if (d['Price Value']) result.price_value = d['Price Value'];

  // ═══ IMAGE ═══
  if (d['Image URL']) {
    result.image_url = d['Image URL'].replace('.jpg', '.webp');
  }

  // ═══ RATING ═══
  if (d['rating']) result.rating = parseFloat(d['rating']) || undefined;

  // ═══ YEAR ═══
  if (d['Year']) {
    const y = parseInt(d['Year']);
    if (y > 1900 && y < 2030) result.year = y;
  }

  // ═══ GENDER ═══
  if (d['Gender']) {
    const g = d['Gender'].toLowerCase();
    if (g.includes('women') || g.includes('female')) result.gender = 'Women';
    else if (g.includes('men') || g.includes('male')) result.gender = 'Men';
    else result.gender = 'Unisex';
  }

  // ═══ CONCENTRATION ═══
  if (d['OilType']) {
    const oil = d['OilType'];
    if (oil.includes('Extrait') || oil.includes('Parfum')) result.concentration = oil.includes('Extrait') ? 'Extrait' : 'Parfum';
    else if (oil.includes('EDP') || oil.includes('Eau de Parfum')) result.concentration = 'EDP';
    else if (oil.includes('EDT') || oil.includes('Eau de Toilette')) result.concentration = 'EDT';
    else if (oil.includes('Cologne')) result.concentration = 'Cologne';
    else result.concentration = oil;
  }

  // Remove undefined values
  Object.keys(result).forEach(k => {
    if (result[k] === undefined || result[k] === null || result[k] === '') delete result[k];
  });

  return result;
}

async function updatePerfume(id, updates) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🧴 The Dry Down — DEFINITIVE Data Fix');
  console.log('======================================');
  console.log('Overwrites ALL data with accurate Fragella API info');
  console.log('Notes • Accords • Seasons • Occasions • Longevity • Sillage\n');

  // Check API usage
  const usageRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const usage = await usageRes.json();
  console.log(`📊 API: ${usage.usage.requests_remaining} requests remaining (${usage.plan} plan)`);

  if (usage.usage.requests_remaining < 100) {
    console.log('⚠️  Not enough requests. Wait for reset or check your plan.');
    return;
  }

  // Load all perfumes
  console.log('📦 Loading perfumes from Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?select=id,name,brand&order=brand.asc&limit=2000`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const perfumes = await res.json();
  console.log(`📦 Loaded ${perfumes.length} perfumes`);

  const eta = Math.round(perfumes.length * DELAY_MS / 60000);
  console.log(`⏱️  Estimated time: ~${eta} minutes\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < perfumes.length; i++) {
    const p = perfumes[i];
    const progress = `[${i + 1}/${perfumes.length}]`;
    const elapsed = Math.round((Date.now() - startTime) / 60000);
    const remaining = Math.round((perfumes.length - i) * DELAY_MS / 60000);

    process.stdout.write(`${progress} ${p.brand} — ${p.name}... `);

    const fragellaData = await searchFragella(p.name, p.brand);

    if (fragellaData) {
      const updates = extractData(fragellaData);
      const fieldCount = Object.keys(updates).length;

      if (fieldCount > 0) {
        const saved = await updatePerfume(p.id, updates);
        if (saved) {
          console.log(`✅ ${fieldCount} fields`);
          updated++;
        } else {
          console.log('⚠️ save failed');
          errors++;
        }
      } else {
        console.log('⏭️ no data');
        notFound++;
      }
    } else {
      console.log('❌ not found');
      notFound++;
    }

    // Progress every 50
    if ((i + 1) % 50 === 0) {
      const pct = Math.round(updated / (i + 1) * 100);
      console.log(`\n--- ${elapsed}min | ${updated} updated (${pct}%) | ${notFound} missed | ~${remaining}min left ---\n`);
    }

    await sleep(DELAY_MS);
  }

  const totalTime = Math.round((Date.now() - startTime) / 60000);

  console.log('\n======================================');
  console.log('🏁 ALL DONE!');
  console.log(`⏱️  Time: ${totalTime} minutes`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Not found: ${notFound}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log(`📊 Success rate: ${Math.round(updated / perfumes.length * 100)}%`);

  // Final API usage
  const finalRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const finalUsage = await finalRes.json();
  console.log(`📊 API requests remaining: ${finalUsage.usage.requests_remaining}`);
  console.log('\n🌐 Check thedrydown.io — all data should now be accurate!');
}

main().catch(err => console.error('Script error:', err.message));