// retry-missed.js — Retries the perfumes that failed due to accents
// Usage: node retry-missed.js

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

const DELAY_MS = 5000;

// These failed — retry with accent-stripped search queries
const MISSED = [
  { name: "Hibiscus Mahajád", brand: "Maison Crivelli", searchAs: "Hibiscus Mahajad Maison Crivelli" },
  { name: "Oud Maracujá", brand: "Maison Crivelli", searchAs: "Oud Maracuja Maison Crivelli" },
  { name: "Black Cat", brand: "Yves Saint Laurent", searchAs: "Black Cat YSL" },
  { name: "Angélique Noire", brand: "Guerlain", searchAs: "Angelique Noire Guerlain" },
  { name: "Tonka Impériale", brand: "Guerlain", searchAs: "Tonka Imperiale Guerlain" },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(query, retries = 2) {
  const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=5`;
  
  try {
    const res = await fetch(url, { headers: { 'x-api-key': FRAGELLA_API_KEY } });
    
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.log(`  ⏳ Rate limited, waiting 2 min...`);
        await sleep(120000);
        return searchFragella(query, retries - 1);
      }
      return null;
    }
    
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    return data[0]; // take best match
  } catch {
    return null;
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
  console.log('🔄 Retrying missed perfumes (accent-stripped search)');
  console.log('====================================================\n');
  
  let added = 0;
  
  for (let i = 0; i < MISSED.length; i++) {
    const m = MISSED[i];
    process.stdout.write(`[${i + 1}/${MISSED.length}] ${m.brand} — ${m.name}... `);
    
    const data = await searchFragella(m.searchAs);
    
    if (data) {
      // Extract what we can
      let topNotes = data['Top Notes'] || '';
      let heartNotes = data['Middle Notes'] || data['Heart Notes'] || '';
      let baseNotes = data['Base Notes'] || '';
      let accords = '';
      if (data['Accords'] || data['Main Accords']) {
        const acc = data['Accords'] || data['Main Accords'];
        if (typeof acc === 'string') accords = acc;
        else if (Array.isArray(acc)) accords = acc.map(a => typeof a === 'object' ? a.name || a.accord : a).join(', ');
        else if (typeof acc === 'object') accords = Object.keys(acc).join(', ');
      }
      
      let imageUrl = data['Image URL'] ? data['Image URL'].replace('.jpg', '.webp') : null;
      let year = parseInt(data['Year']) || 2020;
      let rating = parseFloat(data['rating'] || data['Rating']) || 4.0;
      let concentration = data['OilType'] || data['Concentration'] || 'EDP';
      
      let gender = 'Unisex';
      const g = (data['Gender'] || data['gender'] || '').toLowerCase();
      if (g.includes('women') || g.includes('female')) gender = 'Women';
      else if (g.includes('men') || g.includes('male')) gender = 'Men';
      
      const row = {
        name: m.name,
        brand: m.brand,
        year, gender, concentration,
        family: 'Oriental',
        price_low: 0, price_high: 0,
        top_notes: topNotes,
        heart_notes: heartNotes,
        base_notes: baseNotes,
        main_accords: accords,
        rating,
        brand_type: 'Niche',
        image_url: imageUrl,
      };
      
      const saved = await insertPerfume(row);
      if (saved) {
        console.log('✅ added');
        added++;
      } else {
        console.log('⚠️ insert failed');
      }
    } else {
      console.log('❌ still not found');
    }
    
    await sleep(DELAY_MS);
  }
  
  console.log(`\n🏁 Done! Added ${added}/${MISSED.length} perfumes`);
  console.log('🌐 Check thedrydown.io!');
}

main().catch(console.error);