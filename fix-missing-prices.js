/**
 * THE DRY DOWN — Price Fixer
 * 
 * Fetches prices from Fragella API for perfumes missing AED prices
 * and updates them in Supabase.
 * 
 * Run: node fix-missing-prices.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wydptxijqfqimsftgmlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

const FRAGELLA_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';

// USD to AED conversion rate (approximate)
const USD_TO_AED = 3.67;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFragellaPrice(name) {
  try {
    const res = await fetch(
      `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(name)}`,
      { headers: { 'x-api-key': FRAGELLA_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    // Find best match
    const match = data.find(f => f.Name.toLowerCase() === name.toLowerCase()) || data[0];
    
    if (match.Price) {
      const usdPrice = parseFloat(match.Price);
      if (!isNaN(usdPrice) && usdPrice > 0) {
        const aedPrice = Math.round(usdPrice * USD_TO_AED);
        return { low: aedPrice, high: Math.round(aedPrice * 1.3) }; // high = ~30% markup for range
      }
    }
    return null;
  } catch (err) {
    console.error(`  Error fetching ${name}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Fetching perfumes with missing prices...\n');

  // Fetch all perfumes
  const { data: perfumes, error } = await supabase
    .from('perfumes')
    .select('id, name, brand, price_low, price_high')
    .limit(2000);

  if (error) {
    console.error('Error fetching perfumes:', error.message);
    return;
  }

  // Find ones missing prices
  const missing = perfumes.filter(p => !p.price_low || p.price_low === 0);
  console.log(`Total perfumes: ${perfumes.length}`);
  console.log(`Missing prices: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log('✅ All perfumes have prices!');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const p = missing[i];
    console.log(`[${i + 1}/${missing.length}] ${p.name} by ${p.brand}...`);

    const price = await fetchFragellaPrice(p.name);
    
    if (price) {
      const { error: updateError } = await supabase
        .from('perfumes')
        .update({ price_low: price.low, price_high: price.high })
        .eq('id', p.id);

      if (!updateError) {
        console.log(`  ✅ Set AED ${price.low}–${price.high}`);
        updated++;
      } else {
        console.log(`  ❌ Update failed: ${updateError.message}`);
        failed++;
      }
    } else {
      console.log(`  ⚠️ No price found on Fragella`);
      failed++;
    }

    // Rate limit: wait 300ms between requests
    await sleep(300);
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed/No data: ${failed}`);
}

main();
