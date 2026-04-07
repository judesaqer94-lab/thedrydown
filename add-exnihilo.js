/**
 * THE DRY DOWN — Add Ex Nihilo Perfumes
 * 
 * Fetches Ex Nihilo perfumes from Fragella and adds them to Supabase.
 * 
 * Run: node add-exnihilo.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wydptxijqfqimsftgmlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

const FRAGELLA_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const USD_TO_AED = 3.67;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(query) {
  try {
    const res = await fetch(
      `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}`,
      { headers: { 'x-api-key': FRAGELLA_KEY } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error('Error:', err.message);
    return [];
  }
}

function getNames(arr) {
  if (!arr) return '';
  if (typeof arr === 'string') return arr;
  if (Array.isArray(arr)) return arr.map(n => typeof n === 'string' ? n : n.name || n.Name || '').filter(Boolean).join(', ');
  return '';
}

function parseAccords(fragella) {
  const accords = fragella['Main Accords'] || fragella.main_accords;
  if (!accords) return { main_accords: '', accord_percentages: null };
  if (Array.isArray(accords)) {
    const names = accords.map(a => typeof a === 'string' ? a : a.name || a.Name || '').filter(Boolean);
    const pcts = {};
    accords.forEach(a => {
      if (a && typeof a === 'object' && a.name && a.level) pcts[a.name] = a.level;
    });
    return {
      main_accords: names.join(', '),
      accord_percentages: Object.keys(pcts).length > 0 ? JSON.stringify(pcts) : null
    };
  }
  return { main_accords: String(accords), accord_percentages: null };
}

async function main() {
  console.log('🔍 Searching Fragella for Ex Nihilo perfumes...\n');

  const results = await searchFragella('Ex Nihilo');
  const exNihilo = results.filter(f => 
    f.Brand && f.Brand.toLowerCase().includes('ex nihilo')
  );

  console.log(`Found ${exNihilo.length} Ex Nihilo perfumes on Fragella\n`);

  if (exNihilo.length === 0) {
    console.log('No results. Trying alternative searches...');
    const alt = await searchFragella('ExNihilo');
    const altResults = alt.filter(f => f.Brand && f.Brand.toLowerCase().includes('nihilo'));
    console.log(`Alt search found: ${altResults.length}`);
    if (altResults.length === 0) return;
    exNihilo.push(...altResults);
  }

  // Check which already exist in Supabase
  let existing = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('perfumes').select('name, brand').range(page * 500, (page + 1) * 500 - 1);
    if (!data || data.length === 0) break;
    existing = existing.concat(data);
    if (data.length < 500) break;
    page++;
  }

  const existingNames = new Set(existing.map(p => `${p.name.toLowerCase()}-${p.brand.toLowerCase()}`));

  let added = 0;
  let skipped = 0;

  for (const f of exNihilo) {
    const name = f.Name;
    const brand = 'Ex Nihilo';
    const key = `${name.toLowerCase()}-${brand.toLowerCase()}`;

    if (existingNames.has(key)) {
      console.log(`  ⏭️ Already exists: ${name}`);
      skipped++;
      continue;
    }

    const topNotes = getNames(f['Top Notes'] || f.top_notes);
    const heartNotes = getNames(f['Middle Notes'] || f['Heart Notes'] || f.heart_notes || f.middle_notes);
    const baseNotes = getNames(f['Base Notes'] || f.base_notes);
    const accords = parseAccords(f);

    const perfume = {
      name: name,
      brand: brand,
      year: f.Year || f.year || null,
      gender: f.Gender || f.gender || 'Unisex',
      concentration: f.Concentration || f.concentration || 'EDP',
      family: f.Family || f.family || '',
      top_notes: topNotes,
      heart_notes: heartNotes,
      base_notes: baseNotes,
      main_accords: accords.main_accords,
      accord_percentages: accords.accord_percentages,
      image_url: f['Image URL'] || f.image_url || '',
      longevity: f.Longevity || f.longevity || null,
      sillage: f.Sillage || f.sillage || null,
      season_ranking: f['Season Ranking'] ? JSON.stringify(f['Season Ranking']) : null,
      occasion_ranking: f['Occasion Ranking'] ? JSON.stringify(f['Occasion Ranking']) : null,
    };

    // Price
    if (f.Price) {
      const usd = parseFloat(f.Price);
      if (!isNaN(usd) && usd > 0) {
        perfume.price_low = Math.round(usd * USD_TO_AED);
        perfume.price_high = Math.round(usd * USD_TO_AED * 1.3);
      }
    }

    const { error } = await supabase.from('perfumes').insert(perfume);
    if (!error) {
      console.log(`  ✅ Added: ${name}`);
      added++;
    } else {
      console.log(`  ❌ Failed: ${name} — ${error.message}`);
    }

    await sleep(300);
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Added: ${added}`);
  console.log(`Skipped (already exist): ${skipped}`);
}

main();
