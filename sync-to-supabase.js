/**
 * SYNC STATIC PERFUMES → SUPABASE
 * 
 * This script:
 * 1. Reads all perfumes from data/perfumes.js (the static file)
 * 2. Fetches all perfumes currently in Supabase
 * 3. Finds any that are in the static file but NOT in Supabase
 * 4. Inserts the missing ones into Supabase
 * 
 * Safe to run multiple times — it won't create duplicates.
 * 
 * Usage: node sync-to-supabase.js
 *   Add --dry-run to preview without inserting
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

const dryRun = process.argv.includes('--dry-run');

// Load static data
const { PERFUMES, BRAND_TYPES } = require('./data/perfumes.js');

async function fetchAllFromSupabase() {
  let all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('perfumes')
      .select('name, brand')
      .range(offset, offset + 999);
    if (error) { console.error('Fetch error:', error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

function staticToSupabaseRow(p) {
  // Convert pipe-separated notes from static format to comma-separated for Supabase
  const topNotes = p.notes.filter(n => n.position === 'top').map(n => n.name).join(', ');
  const heartNotes = p.notes.filter(n => n.position === 'heart').map(n => n.name).join(', ');
  const baseNotes = p.notes.filter(n => n.position === 'base').map(n => n.name).join(', ');
  const accords = p.accords.map(a => a.name).join(', ');
  const brandType = BRAND_TYPES[p.brand] || 'Unknown';

  return {
    name: p.name,
    brand: p.brand,
    year: p.year,
    gender: p.gender,
    concentration: p.concentration,
    family: p.family,
    price_low: p.priceLow || 0,
    price_high: p.priceHigh || 0,
    top_notes: topNotes,
    heart_notes: heartNotes,
    base_notes: baseNotes,
    main_accords: accords,
    brand_type: brandType,
    rating: p.rating || 4.0,
  };
}

async function main() {
  console.log('=== Sync Static Perfumes → Supabase ===\n');
  if (dryRun) console.log('🔍 DRY RUN MODE — no data will be inserted\n');

  // Step 1: Load static data
  console.log(`Static file: ${PERFUMES.length} perfumes`);

  // Step 2: Fetch Supabase data
  console.log('Fetching from Supabase...');
  const supabasePerfumes = await fetchAllFromSupabase();
  console.log(`Supabase: ${supabasePerfumes.length} perfumes\n`);

  // Step 3: Find missing ones (match on name + brand, case-insensitive)
  const supaSet = new Set(
    supabasePerfumes.map(p => `${p.name}|||${p.brand}`.toLowerCase())
  );

  const missing = PERFUMES.filter(p => 
    !supaSet.has(`${p.name}|||${p.brand}`.toLowerCase())
  );

  console.log(`Missing from Supabase: ${missing.length} perfumes`);

  if (missing.length === 0) {
    console.log('\n✅ Everything is already in Supabase! Nothing to do.');
    return;
  }

  // Show what's missing
  console.log('\nMissing perfumes:');
  missing.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} — ${p.brand} (${p.family}, ${p.concentration})`);
  });

  if (dryRun) {
    console.log(`\n🔍 DRY RUN: Would insert ${missing.length} perfumes. Run without --dry-run to actually insert.`);
    return;
  }

  // Step 4: Insert in batches of 50
  console.log(`\nInserting ${missing.length} perfumes...`);
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const rows = batch.map(staticToSupabaseRow);

    const { data, error } = await supabase
      .from('perfumes')
      .insert(rows);

    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      // Try one by one for this batch to find the problematic rows
      for (const row of rows) {
        const { error: singleError } = await supabase.from('perfumes').insert(row);
        if (singleError) {
          console.error(`    ✗ Failed: ${row.name} by ${row.brand} — ${singleError.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: inserted ${batch.length} perfumes`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Inserted: ${inserted}`);
  if (errors > 0) console.log(`Errors: ${errors}`);
  console.log(`Supabase should now have: ${supabasePerfumes.length + inserted} perfumes`);
}

main().catch(console.error);
