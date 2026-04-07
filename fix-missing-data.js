/**
 * THE DRY DOWN — Fill Missing Perfume Data (v2)
 * 
 * Fetches ALL perfumes using pagination, finds ones missing data,
 * and fills them from Fragella API.
 * 
 * Run: node fix-missing-data.js
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

// Fetch ALL perfumes using pagination
async function fetchAllPerfumes() {
  let all = [];
  let page = 0;
  const pageSize = 500;
  
  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('perfumes')
      .select('id, name, brand, top_notes, heart_notes, base_notes, main_accords, season_ranking, occasion_ranking, longevity, sillage, image_url, price_low')
      .range(from, to)
      .order('id');
    
    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    all = all.concat(data);
    console.log(`  Fetched ${all.length} perfumes...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  return all;
}

async function fetchFromFragella(name) {
  try {
    const res = await fetch(
      `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(name)}`,
      { headers: { 'x-api-key': FRAGELLA_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return data.find(f => f.Name.toLowerCase() === name.toLowerCase()) || data[0];
  } catch (err) {
    console.error(`  Error fetching ${name}:`, err.message);
    return null;
  }
}

function parseNotes(fragella) {
  const getNames = (arr) => {
    if (!arr) return '';
    if (typeof arr === 'string') return arr;
    if (Array.isArray(arr)) return arr.map(n => typeof n === 'string' ? n : n.name || n.Name || '').filter(Boolean).join(', ');
    return '';
  };
  return {
    top_notes: getNames(fragella['Top Notes'] || fragella.top_notes),
    heart_notes: getNames(fragella['Middle Notes'] || fragella['Heart Notes'] || fragella.heart_notes || fragella.middle_notes),
    base_notes: getNames(fragella['Base Notes'] || fragella.base_notes),
  };
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
  console.log('🔍 Fetching ALL perfumes from Supabase...\n');

  const perfumes = await fetchAllPerfumes();
  console.log(`\nTotal perfumes: ${perfumes.length}\n`);

  // Find perfumes missing notes OR accords
  const incomplete = perfumes.filter(p => 
    (!p.top_notes && !p.heart_notes && !p.base_notes) || !p.main_accords
  );

  console.log(`Incomplete (missing notes or accords): ${incomplete.length}\n`);

  if (incomplete.length === 0) {
    console.log('✅ All perfumes have data!');
    return;
  }

  incomplete.forEach(p => {
    const missing = [];
    if (!p.top_notes && !p.heart_notes && !p.base_notes) missing.push('notes');
    if (!p.main_accords) missing.push('accords');
    if (!p.season_ranking) missing.push('seasons');
    if (!p.image_url) missing.push('image');
    console.log(`  ${p.name} (${p.brand}) — missing: ${missing.join(', ')}`);
  });

  console.log(`\n📡 Fetching from Fragella API...\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < incomplete.length; i++) {
    const p = incomplete[i];
    console.log(`[${i + 1}/${incomplete.length}] ${p.name} by ${p.brand}...`);

    // Try name only first, then name + brand
    let f = await fetchFromFragella(p.name);
    if (!f) f = await fetchFromFragella(`${p.name} ${p.brand}`);
    
    if (!f) {
      console.log(`  ⚠️ Not found on Fragella`);
      failed++;
      await sleep(300);
      continue;
    }

    const notes = parseNotes(f);
    const accords = parseAccords(f);
    const updateData = {};

    if (!p.top_notes && notes.top_notes) updateData.top_notes = notes.top_notes;
    if (!p.heart_notes && notes.heart_notes) updateData.heart_notes = notes.heart_notes;
    if (!p.base_notes && notes.base_notes) updateData.base_notes = notes.base_notes;
    if (!p.main_accords && accords.main_accords) updateData.main_accords = accords.main_accords;
    if (accords.accord_percentages) updateData.accord_percentages = accords.accord_percentages;
    if (!p.season_ranking && f['Season Ranking']) updateData.season_ranking = JSON.stringify(f['Season Ranking']);
    if (!p.occasion_ranking && f['Occasion Ranking']) updateData.occasion_ranking = JSON.stringify(f['Occasion Ranking']);
    if (!p.longevity && f.Longevity) updateData.longevity = f.Longevity;
    if (!p.sillage && f.Sillage) updateData.sillage = f.Sillage;
    if (!p.image_url && f['Image URL']) updateData.image_url = f['Image URL'];
    if (f.Price && !p.price_low) {
      const usd = parseFloat(f.Price);
      if (!isNaN(usd) && usd > 0) {
        updateData.price_low = Math.round(usd * USD_TO_AED);
        updateData.price_high = Math.round(usd * USD_TO_AED * 1.3);
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('perfumes').update(updateData).eq('id', p.id);
      if (!updateError) {
        console.log(`  ✅ Updated: ${Object.keys(updateData).join(', ')}`);
        updated++;
      } else {
        console.log(`  ❌ Update failed: ${updateError.message}`);
        failed++;
      }
    } else {
      console.log(`  ⚠️ Found on Fragella but no new data to add`);
      failed++;
    }

    await sleep(400);
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed/No data: ${failed}`);
}

main();
