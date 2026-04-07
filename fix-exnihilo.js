/**
 * THE DRY DOWN — Fix Ex Nihilo Notes
 * 
 * Updates the 10 Ex Nihilo perfumes that were added without notes.
 * Uses correct Fragella field names: Notes.Top, Notes.Middle, Notes.Base
 * 
 * Run: node fix-exnihilo.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wydptxijqfqimsftgmlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

const FRAGELLA_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';

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
    return await res.json() || [];
  } catch (err) {
    console.error('Error:', err.message);
    return [];
  }
}

function extractNotes(fragellaData) {
  const notes = fragellaData.Notes || {};
  
  const getNames = (arr) => {
    if (!arr) return '';
    if (Array.isArray(arr)) return arr.map(n => n.name || n.Name || n).filter(Boolean).join(', ');
    return '';
  };

  return {
    top_notes: getNames(notes.Top),
    heart_notes: getNames(notes.Middle || notes.Heart),
    base_notes: getNames(notes.Base),
  };
}

function extractAccords(fragellaData) {
  const accords = fragellaData['Main Accords'];
  const pcts = fragellaData['Main Accords Percentage'];
  
  if (!accords) return { main_accords: '', accord_percentages: null };
  
  const names = Array.isArray(accords) ? accords.join(', ') : String(accords);
  
  return {
    main_accords: names,
    accord_percentages: pcts ? JSON.stringify(pcts) : null,
  };
}

async function main() {
  console.log('🔍 Finding Ex Nihilo perfumes in Supabase...\n');

  // Get all Ex Nihilo perfumes
  let all = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('perfumes').select('*').range(page * 500, (page + 1) * 500 - 1).order('id');
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 500) break;
    page++;
  }

  const exNihilo = all.filter(p => p.brand === 'Ex Nihilo');
  console.log(`Found ${exNihilo.length} Ex Nihilo perfumes\n`);

  let updated = 0;

  for (const p of exNihilo) {
    console.log(`Updating: ${p.name}...`);

    const results = await searchFragella(`Ex Nihilo ${p.name}`);
    const match = results.find(f => 
      f.Brand && f.Brand.toLowerCase().includes('ex nihilo')
    );

    if (!match) {
      console.log(`  ⚠️ Not found on Fragella`);
      await sleep(300);
      continue;
    }

    const notes = extractNotes(match);
    const accords = extractAccords(match);

    const updateData = {};
    if (notes.top_notes) updateData.top_notes = notes.top_notes;
    if (notes.heart_notes) updateData.heart_notes = notes.heart_notes;
    if (notes.base_notes) updateData.base_notes = notes.base_notes;
    if (accords.main_accords) updateData.main_accords = accords.main_accords;
    if (accords.accord_percentages) updateData.accord_percentages = accords.accord_percentages;
    if (match['Season Ranking']) updateData.season_ranking = JSON.stringify(match['Season Ranking']);
    if (match['Occasion Ranking']) updateData.occasion_ranking = JSON.stringify(match['Occasion Ranking']);
    if (match.Longevity) updateData.longevity = match.Longevity;
    if (match.Sillage) updateData.sillage = match.Sillage;
    if (match['Image URL']) updateData.image_url = match['Image URL'];
    if (match.Year) updateData.year = parseInt(match.Year) || null;
    if (match.Gender) updateData.gender = match.Gender.charAt(0).toUpperCase() + match.Gender.slice(1);
    if (match.OilType) updateData.concentration = match.OilType;

    // Family from accords
    if (accords.main_accords) {
      const first = accords.main_accords.split(',')[0].trim();
      const familyMap = {
        'woody': 'Woody', 'floral': 'Floral', 'oriental': 'Oriental', 'citrus': 'Citrus',
        'fresh': 'Fresh', 'aromatic': 'Aromatic', 'gourmand': 'Gourmand', 'fruity': 'Fruity',
        'white floral': 'Floral', 'musky': 'Musky', 'leather': 'Leather', 'oud': 'Oriental',
        'powdery': 'Floral', 'sweet': 'Gourmand', 'amber': 'Oriental', 'green': 'Green',
      };
      updateData.family = familyMap[first.toLowerCase()] || 'Oriental';
    }

    // Price
    if (match.Price) {
      const usd = parseFloat(match.Price);
      if (!isNaN(usd) && usd > 0) {
        updateData.price_low = Math.round(usd * 3.67);
        updateData.price_high = Math.round(usd * 3.67 * 1.3);
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('perfumes').update(updateData).eq('id', p.id);
      if (!error) {
        console.log(`  ✅ Updated with: ${notes.top_notes ? 'notes, ' : ''}${accords.main_accords ? 'accords, ' : ''}seasons, image`);
        updated++;
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    await sleep(400);
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Updated: ${updated}/${exNihilo.length}`);
}

main();
