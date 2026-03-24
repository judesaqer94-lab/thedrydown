// retry-all-missed.js — Smart retry for missed perfumes
// Uses multiple search strategies: accent stripping, brand aliases, name cleanup

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

const DELAY_MS = 3000;

// Brand aliases — how Fragella might list them
const BRAND_ALIASES = {
  'Yves Saint Laurent': ['YSL', 'Saint Laurent'],
  'Dolce & Gabbana': ['Dolce Gabbana', 'D&G'],
  'Jean Paul Gaultier': ['JPG', 'Gaultier'],
  'Giorgio Armani': ['Armani'],
  'Hugo Boss': ['Boss'],
  'Ralph Lauren': ['Ralph'],
  'Tiffany & Co.': ['Tiffany'],
  'Maison Francis Kurkdjian': ['MFK', 'Francis Kurkdjian'],
  'Maison Alhambra': ['Alhambra'],
  'Maison Tahité': ['Tahite'],
  'Sol de Janeiro': ['Sol Janeiro'],
  'Victoria Beckham Beauty': ['Victoria Beckham'],
  'The Body Shop': ['Body Shop'],
  'Escentric Molecules': ['Escentric'],
  'Lancôme': ['Lancome'],
  'Prada': ['Prada'],
};

// Name cleanup — strip prefixes that might confuse search
function cleanName(name, brand) {
  let clean = name;
  // Remove brand name from perfume name if it starts with it
  if (clean.startsWith(brand)) clean = clean.replace(brand, '').trim();
  if (clean.startsWith('—') || clean.startsWith('-')) clean = clean.substring(1).trim();
  // Remove "Type" suffix (Oil Perfumery dupes)
  clean = clean.replace(/ Type$/, '');
  // Remove "Kayali" prefix from Kayali names
  clean = clean.replace(/^Kayali /, '');
  // Remove "Khadlaj " prefix
  clean = clean.replace(/^Khadlaj /, '');
  // Remove "La Fede " prefix
  clean = clean.replace(/^La Fede /, '');
  // Remove "Afnan " prefix
  clean = clean.replace(/^Afnan /, '');
  // Remove edition suffixes for cleaner search
  clean = clean.replace(/ EDP$/, '');
  clean = clean.replace(/ EDT$/, '');
  // Strip accents
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return clean;
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(query, retries = 1) {
  const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=5`;
  try {
    const res = await fetch(url, { headers: { 'x-api-key': FRAGELLA_API_KEY } });
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.log(`\n  ⏳ Rate limited, waiting 2 min...`);
        await sleep(120000);
        return searchFragella(query, retries - 1);
      }
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

async function findPerfume(name, brand) {
  // Build list of search queries to try
  const queries = [];
  const cleanedName = cleanName(name, brand);
  const strippedBrand = stripAccents(brand);
  
  // Strategy 1: cleaned name + brand
  queries.push(`${cleanedName} ${strippedBrand}`);
  
  // Strategy 2: cleaned name + brand aliases
  const aliases = BRAND_ALIASES[brand] || [];
  for (const alias of aliases) {
    queries.push(`${cleanedName} ${alias}`);
  }
  
  // Strategy 3: just cleaned name
  queries.push(cleanedName);
  
  // Strategy 4: original name stripped of accents + brand
  queries.push(`${stripAccents(name)} ${strippedBrand}`);
  
  // Strategy 5: original name only
  queries.push(stripAccents(name));
  
  // Deduplicate
  const unique = [...new Set(queries)];
  
  for (const query of unique) {
    const results = await searchFragella(query);
    if (!results) {
      await sleep(DELAY_MS);
      continue;
    }
    
    const nameLower = stripAccents(name).toLowerCase();
    const cleanLower = cleanedName.toLowerCase();
    
    // Try to find best match
    let match = results.find(d => {
      const dn = stripAccents(d.Name || '').toLowerCase();
      return dn === nameLower || dn === cleanLower;
    });
    
    if (!match) {
      match = results.find(d => {
        const dn = stripAccents(d.Name || '').toLowerCase();
        return dn.includes(cleanLower) || cleanLower.includes(dn);
      });
    }
    
    if (!match && results.length > 0) {
      // Check if first result is plausible
      const firstDn = stripAccents(results[0].Name || '').toLowerCase();
      const words = cleanLower.split(' ').filter(w => w.length > 3);
      const matchCount = words.filter(w => firstDn.includes(w)).length;
      if (matchCount >= Math.max(1, words.length * 0.5)) {
        match = results[0];
      }
    }
    
    if (match) return match;
    await sleep(DELAY_MS);
  }
  
  return null;
}

function extractData(d) {
  const result = {};

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
  if (d['rating']) result.rating = parseFloat(d['rating']) || undefined;
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
  console.log('🔄 The Dry Down — Smart Retry for Missed Perfumes');
  console.log('==================================================');
  console.log('Multiple search strategies: accent strip, brand aliases, name cleanup\n');

  // Check API usage
  const usageRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const usage = await usageRes.json();
  console.log(`📊 API: ${usage.usage.requests_remaining} requests remaining\n`);

  // Load perfumes that still have no longevity data (missed ones)
  console.log('📦 Loading missed perfumes...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?select=id,name,brand&longevity=is.null&order=brand.asc&limit=200`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const missed = await res.json();
  console.log(`🔍 Found ${missed.length} perfumes to retry\n`);

  let updated = 0;
  let stillMissing = 0;
  const notFoundList = [];
  const startTime = Date.now();

  for (let i = 0; i < missed.length; i++) {
    const p = missed[i];
    process.stdout.write(`[${i + 1}/${missed.length}] ${p.brand} — ${p.name}... `);

    const fragellaData = await findPerfume(p.name, p.brand);

    if (fragellaData) {
      const updates = extractData(fragellaData);
      if (Object.keys(updates).length > 0) {
        const saved = await updatePerfume(p.id, updates);
        if (saved) {
          console.log(`✅ ${Object.keys(updates).length} fields (matched: "${fragellaData.Name}")`);
          updated++;
        } else {
          console.log('⚠️ save failed');
          stillMissing++;
          notFoundList.push(`${p.brand} — ${p.name}`);
        }
      } else {
        console.log('⏭️ no useful data');
        stillMissing++;
        notFoundList.push(`${p.brand} — ${p.name}`);
      }
    } else {
      console.log('❌ not found');
      stillMissing++;
      notFoundList.push(`${p.brand} — ${p.name}`);
    }

    if ((i + 1) % 25 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      console.log(`\n--- ${elapsed}min | ${updated} found | ${stillMissing} still missing ---\n`);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 60000);

  console.log('\n==================================================');
  console.log('🏁 DONE!');
  console.log(`⏱️  Time: ${totalTime} minutes`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Still missing: ${stillMissing}`);

  if (notFoundList.length > 0) {
    console.log(`\n📋 These perfumes are NOT in Fragella's database:`);
    console.log('   (These are likely niche/clone brands or very new releases)');
    notFoundList.forEach(n => console.log(`   • ${n}`));
  }

  const finalRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const finalUsage = await finalRes.json();
  console.log(`\n📊 API requests remaining: ${finalUsage.usage.requests_remaining}`);
}

main().catch(err => console.error('Script error:', err.message));