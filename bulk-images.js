// bulk-images.js — Run this on your Mac to bulk-add perfume images
// Usage: node bulk-images.js

const FRAGELLA_API_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';
const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFragella(name, brand) {
  const query = `${name} ${brand}`;
  const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}&limit=3`;
  
  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': FRAGELLA_API_KEY }
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        console.log('  ⏳ Rate limited, waiting 60s...');
        await sleep(60000);
        return searchFragella(name, brand); // retry
      }
      console.log(`  ⚠️ API error ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    // Try to find best match
    const nameLower = name.toLowerCase();
    const brandLower = brand.toLowerCase();
    
    // First try exact name match
    let match = data.find(d => 
      d.Name && d.Name.toLowerCase() === nameLower
    );
    
    // Then try contains
    if (!match) {
      match = data.find(d => 
        d.Name && (d.Name.toLowerCase().includes(nameLower) || nameLower.includes(d.Name.toLowerCase()))
      );
    }
    
    // Fall back to first result
    if (!match) match = data[0];
    
    // Get image URL — try webp first, then jpg
    let imageUrl = null;
    if (match['Image URL']) {
      imageUrl = match['Image URL'];
      // Try webp version for transparent background
      const webpUrl = imageUrl.replace('.jpg', '.webp');
      imageUrl = webpUrl;
    }
    
    return imageUrl;
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return null;
  }
}

async function updateSupabase(id, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ image_url: imageUrl })
  });
  return res.ok;
}

async function main() {
  console.log('🧴 The Dry Down — Bulk Image Fetcher');
  console.log('=====================================\n');
  
  // Fetch all perfumes from Supabase
  console.log('📦 Loading perfumes from Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?select=id,name,brand,image_url&order=brand.asc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  const perfumes = await res.json();
  const needImages = perfumes.filter(p => !p.image_url);
  
  console.log(`📊 Total perfumes: ${perfumes.length}`);
  console.log(`✅ Already have images: ${perfumes.length - needImages.length}`);
  console.log(`🔍 Need images: ${needImages.length}\n`);
  
  if (needImages.length === 0) {
    console.log('🎉 All perfumes already have images!');
    return;
  }
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < needImages.length; i++) {
    const p = needImages[i];
    const progress = `[${i + 1}/${needImages.length}]`;
    
    process.stdout.write(`${progress} ${p.brand} — ${p.name}... `);
    
    const imageUrl = await searchFragella(p.name, p.brand);
    
    if (imageUrl) {
      const saved = await updateSupabase(p.id, imageUrl);
      if (saved) {
        console.log('✅');
        success++;
      } else {
        console.log('⚠️ Save failed');
        failed++;
      }
    } else {
      console.log('❌ No image found');
      skipped++;
    }
    
    // Small delay to avoid rate limits (200ms between requests)
    await sleep(200);
    
    // Progress update every 50
    if ((i + 1) % 50 === 0) {
      console.log(`\n--- Progress: ${success} added, ${skipped} not found, ${failed} errors ---\n`);
    }
  }
  
  console.log('\n=====================================');
  console.log('🏁 DONE!');
  console.log(`✅ Images added: ${success}`);
  console.log(`❌ Not found: ${skipped}`);
  console.log(`⚠️ Errors: ${failed}`);
  console.log(`📊 Coverage: ${Math.round((perfumes.length - needImages.length + success) / perfumes.length * 100)}%`);
}

main().catch(console.error);
