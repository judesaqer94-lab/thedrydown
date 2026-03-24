// fix-and-add.js — Fixes existing perfume data + adds new ones
// Usage: node fix-and-add.js
// 
// What it does:
// 1. Corrects notes & accords for ALL existing perfumes using Fragella API
// 2. Adds new perfumes (Ex Nihilo, Maison Crivelli, Vilhelm, etc.)
// 3. Pulls images for any that are missing

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

const DELAY_MS = 5000; // 5 seconds between API calls

// ═══ NEW PERFUMES TO ADD ═══
const NEW_PERFUMES = [
  // Liquid Imaginaires
  { name: "Blanche Bete", brand: "Liquid Imaginaires" },
  
  // Maison Crivelli
  { name: "Hibiscus Mahajád", brand: "Maison Crivelli" },
  { name: "Iris Malikhan", brand: "Maison Crivelli" },
  { name: "Absinthe Boreale", brand: "Maison Crivelli" },
  { name: "Oud Maracujá", brand: "Maison Crivelli" },
  { name: "Oud Stallion", brand: "Maison Crivelli" },
  
  // BDK Parfums
  { name: "Vanille Leather", brand: "BDK Parfums" },
  { name: "Gris Charnel Extrait", brand: "BDK Parfums" },
  
  // Vilhelm Parfumerie
  { name: "Morning Chess", brand: "Vilhelm Parfumerie" },
  { name: "Dear Polly", brand: "Vilhelm Parfumerie" },
  { name: "Room Service", brand: "Vilhelm Parfumerie" },
  { name: "Basilico & Fellini", brand: "Vilhelm Parfumerie" },
  { name: "Mango Skin", brand: "Vilhelm Parfumerie" },
  
  // YSL additions
  { name: "Black Cat", brand: "Yves Saint Laurent" },
  { name: "Tuxedo", brand: "Yves Saint Laurent" },
  { name: "Jumpsuit", brand: "Yves Saint Laurent" },
  
  // Guerlain additions
  { name: "Angélique Noire", brand: "Guerlain" },
  { name: "Tobacco Honey", brand: "Guerlain" },
  { name: "Cuir Beluga", brand: "Guerlain" },
  { name: "Cherry Oud", brand: "Guerlain" },
  { name: "Musc Outreblanc", brand: "Guerlain" },
  { name: "Tonka Impériale", brand: "Guerlain" },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(name, brand, retries = 2) {
  // Try name + brand first, then just name
  const queries = [
    `${name} ${brand}`,
    name,
  ];
  
  for (const query of queries) {
    const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=5`;
    
    try {
      const res = await fetch(url, {
        headers: { 'x-api-key': FRAGELLA_API_KEY }
      });
      
      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          console.log(`  ⏳ Rate limited, waiting 2 min...`);
          await sleep(120000);
          return searchFragella(name, brand, retries - 1);
        }
        continue;
      }
      
      const data = await res.json();
      if (!data || !Array.isArray(data) || data.length === 0) continue;
      
      const nameLower = name.toLowerCase();
      const brandLower = brand.toLowerCase();
      
      // Best match: exact name + matching brand
      let match = data.find(d => 
        d.Name && d.Name.toLowerCase() === nameLower &&
        d.Brand && d.Brand.toLowerCase().includes(brandLower.split(' ')[0])
      );
      
      // Good match: name contains + brand contains
      if (!match) {
        match = data.find(d => 
          d.Name && d.Brand &&
          (d.Name.toLowerCase().includes(nameLower) || nameLower.includes(d.Name.toLowerCase())) &&
          (d.Brand.toLowerCase().includes(brandLower.split(' ')[0]) || brandLower.includes(d.Brand.toLowerCase().split(' ')[0]))
        );
      }
      
      // OK match: just name
      if (!match) {
        match = data.find(d => 
          d.Name && (d.Name.toLowerCase().includes(nameLower) || nameLower.includes(d.Name.toLowerCase()))
        );
      }
      
      if (match) return match;
    } catch (err) {
      continue;
    }
  }
  
  return null;
}

function extractNotes(fragellaData) {
  // Fragella returns notes in various formats — extract what we can
  const d = fragellaData;
  
  let topNotes = '';
  let heartNotes = '';
  let baseNotes = '';
  let accords = '';
  let imageUrl = null;
  let year = null;
  let gender = 'Unisex';
  let concentration = 'EDP';
  let family = '';
  let rating = 4.0;
  
  // Notes
  if (d['Top Notes']) topNotes = typeof d['Top Notes'] === 'string' ? d['Top Notes'] : (Array.isArray(d['Top Notes']) ? d['Top Notes'].join(', ') : '');
  if (d['Middle Notes'] || d['Heart Notes']) heartNotes = typeof (d['Middle Notes'] || d['Heart Notes']) === 'string' ? (d['Middle Notes'] || d['Heart Notes']) : '';
  if (d['Base Notes']) baseNotes = typeof d['Base Notes'] === 'string' ? d['Base Notes'] : (Array.isArray(d['Base Notes']) ? d['Base Notes'].join(', ') : '');
  
  // Accords
  if (d['Accords'] || d['Main Accords']) {
    const acc = d['Accords'] || d['Main Accords'];
    if (typeof acc === 'string') {
      accords = acc;
    } else if (Array.isArray(acc)) {
      accords = acc.map(a => typeof a === 'object' ? a.name || a.accord : a).join(', ');
    } else if (typeof acc === 'object') {
      accords = Object.keys(acc).join(', ');
    }
  }
  
  // Image
  if (d['Image URL']) {
    imageUrl = d['Image URL'].replace('.jpg', '.webp');
  }
  
  // Year
  if (d['Year']) year = parseInt(d['Year']) || null;
  
  // Rating
  if (d['rating'] || d['Rating']) rating = parseFloat(d['rating'] || d['Rating']) || 4.0;
  
  // Gender — try to figure out
  if (d['Gender'] || d['gender']) {
    const g = (d['Gender'] || d['gender'] || '').toLowerCase();
    if (g.includes('women') || g.includes('female') || g.includes('her')) gender = 'Women';
    else if (g.includes('men') || g.includes('male') || g.includes('him')) gender = 'Men';
    else gender = 'Unisex';
  }
  
  // Concentration
  if (d['OilType'] || d['Concentration'] || d['concentration']) {
    concentration = d['OilType'] || d['Concentration'] || d['concentration'] || 'EDP';
  }
  
  return { topNotes, heartNotes, baseNotes, accords, imageUrl, year, gender, concentration, family, rating };
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
  } catch {
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🧴 The Dry Down — Fix Data + Add New Perfumes');
  console.log('==============================================');
  console.log('⏱️  5s between requests to stay within limits\n');
  
  // Check API usage first
  console.log('📊 Checking API usage...');
  const usageRes = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const usage = await usageRes.json();
  console.log(`   Plan: ${usage.plan}`);
  console.log(`   Used: ${usage.usage.requests_made} / ${usage.limit.total_effective_limit}`);
  console.log(`   Remaining: ${usage.usage.requests_remaining}\n`);
  
  if (usage.usage.requests_remaining < 50) {
    console.log('⚠️  Not enough API requests remaining. Wait for reset or upgrade plan.');
    return;
  }
  
  // ═══ PHASE 1: FIX EXISTING PERFUMES ═══
  console.log('═══ PHASE 1: Fixing existing perfume data ═══\n');
  
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?select=id,name,brand,top_notes,heart_notes,base_notes,main_accords,image_url&order=brand.asc&limit=2000`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  const existing = await existingRes.json();
  console.log(`📦 Loaded ${existing.length} existing perfumes\n`);
  
  let fixed = 0;
  let fixFailed = 0;
  let skipped = 0;
  
  for (let i = 0; i < existing.length; i++) {
    const p = existing[i];
    const progress = `[${i + 1}/${existing.length}]`;
    
    process.stdout.write(`${progress} ${p.brand} — ${p.name}... `);
    
    const fragellaData = await searchFragella(p.name, p.brand);
    
    if (fragellaData) {
      const extracted = extractNotes(fragellaData);
      
      // Only update if we got better data
      const updates = {};
      if (extracted.topNotes) updates.top_notes = extracted.topNotes;
      if (extracted.heartNotes) updates.heart_notes = extracted.heartNotes;
      if (extracted.baseNotes) updates.base_notes = extracted.baseNotes;
      if (extracted.accords) updates.main_accords = extracted.accords;
      if (extracted.imageUrl && !p.image_url) updates.image_url = extracted.imageUrl;
      
      if (Object.keys(updates).length > 0) {
        const saved = await updatePerfume(p.id, updates);
        if (saved) {
          console.log(`✅ updated ${Object.keys(updates).length} fields`);
          fixed++;
        } else {
          console.log('⚠️ save failed');
          fixFailed++;
        }
      } else {
        console.log('⏭️ no new data');
        skipped++;
      }
    } else {
      console.log('❌ not found in API');
      fixFailed++;
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`\n--- Progress: ${fixed} fixed, ${skipped} skipped, ${fixFailed} not found ---\n`);
    }
    
    await sleep(DELAY_MS);
  }
  
  console.log(`\n✅ Phase 1 done: ${fixed} fixed, ${skipped} skipped, ${fixFailed} not found\n`);
  
  // ═══ PHASE 2: ADD NEW PERFUMES ═══
  console.log('═══ PHASE 2: Adding new perfumes ═══\n');
  
  let added = 0;
  let addFailed = 0;
  
  for (let i = 0; i < NEW_PERFUMES.length; i++) {
    const np = NEW_PERFUMES[i];
    const progress = `[${i + 1}/${NEW_PERFUMES.length}]`;
    
    // Check if already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/perfumes?name=eq.${encodeURIComponent(np.name)}&brand=eq.${encodeURIComponent(np.brand)}&select=id&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const checkData = await checkRes.json();
    if (checkData && checkData.length > 0) {
      console.log(`${progress} ${np.brand} — ${np.name}... ⏭️ already exists`);
      continue;
    }
    
    process.stdout.write(`${progress} ${np.brand} — ${np.name}... `);
    
    await sleep(DELAY_MS);
    
    const fragellaData = await searchFragella(np.name, np.brand);
    
    if (fragellaData) {
      const extracted = extractNotes(fragellaData);
      
      const perfumeRow = {
        name: np.name,
        brand: np.brand,
        year: extracted.year || 2020,
        gender: extracted.gender || 'Unisex',
        concentration: extracted.concentration || 'EDP',
        family: extracted.family || 'Oriental',
        price_low: 0,
        price_high: 0,
        top_notes: extracted.topNotes || '',
        heart_notes: extracted.heartNotes || '',
        base_notes: extracted.baseNotes || '',
        main_accords: extracted.accords || '',
        rating: extracted.rating || 4.0,
        brand_type: np.brandType || 'Niche',
        image_url: extracted.imageUrl || null,
      };
      
      const saved = await insertPerfume(perfumeRow);
      if (saved) {
        console.log('✅ added');
        added++;
      } else {
        console.log('⚠️ insert failed');
        addFailed++;
      }
    } else {
      console.log('❌ not found in API');
      addFailed++;
    }
    
    await sleep(DELAY_MS);
  }
  
  // ═══ SUMMARY ═══
  console.log('\n==============================================');
  console.log('🏁 ALL DONE!');
  console.log(`📝 Existing perfumes fixed: ${fixed}`);
  console.log(`➕ New perfumes added: ${added}`);
  console.log(`❌ Issues: ${fixFailed + addFailed}`);
  console.log('\n🌐 Check thedrydown.io — everything should be updated!');
  
  // Check remaining API usage
  const finalUsage = await fetch('https://api.fragella.com/api/v1/usage', {
    headers: { 'x-api-key': FRAGELLA_API_KEY }
  });
  const finalData = await finalUsage.json();
  console.log(`📊 API requests remaining: ${finalData.usage.requests_remaining}`);
}

main().catch(err => {
  console.error('Script error:', err.message);
});