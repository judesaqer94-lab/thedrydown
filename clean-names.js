/**
 * THE DRY DOWN — Clean Perfume Names
 * 
 * Finds perfumes where the brand name is duplicated in the name field
 * and removes it. Also removes perfumer names, bottle sizes, and product types.
 * 
 * Run: node clean-names.js          (preview only)
 * Run: node clean-names.js --fix    (apply changes)
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://wydptxijqfqimsftgmlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

function cleanName(name, brand) {
  let clean = name;

  // Remove brand name from beginning (case insensitive)
  const brandRegex = new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i');
  clean = clean.replace(brandRegex, '');

  // Remove "By [Perfumer Name]" and everything after
  clean = clean.replace(/\s+By\s+[A-Z][a-zA-Z\s]+$/i, '');

  // Remove bottle sizes like "100 Ml", "50 Ml", "270 G"
  clean = clean.replace(/\s+\d+\s*(Ml|G|ml|g)\s*$/i, '');

  // Remove product types
  clean = clean.replace(/\s+(Scented Candle|Hand Cream|Body Lotion|Body Oil|Hair Mist|Coffret|Discovery Set|Gift Set)\s*$/i, '');

  // Remove "X" size multipliers like "8 X 2"
  clean = clean.replace(/\s+\d+\s*X\s*\d+\s*$/i, '');

  // Trim
  clean = clean.trim();

  return clean;
}

// Items that aren't perfumes (candles, hand creams, sample sets)
function isNotPerfume(name) {
  const lower = name.toLowerCase();
  return lower.includes('candle') || 
         lower.includes('hand cream') || 
         lower.includes('body lotion') ||
         lower.includes('coffret decouverte') ||
         lower.includes('discovery set') ||
         lower.includes('gift set');
}

async function main() {
  const doFix = process.argv.includes('--fix');
  
  // Fetch all perfumes
  let all = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('perfumes').select('id, name, brand').range(page * 500, (page + 1) * 500 - 1).order('id');
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 500) break;
    page++;
  }
  console.log('Total perfumes:', all.length);

  // Find perfumes with brand in name
  const needsCleaning = [];
  const needsDeleting = [];

  all.forEach(p => {
    if (isNotPerfume(p.name)) {
      needsDeleting.push(p);
      return;
    }
    
    const cleaned = cleanName(p.name, p.brand);
    if (cleaned !== p.name) {
      needsCleaning.push({ ...p, newName: cleaned });
    }
  });

  console.log(`\nNames to clean: ${needsCleaning.length}`);
  console.log(`Non-perfumes to delete: ${needsDeleting.length}\n`);

  if (needsCleaning.length > 0) {
    console.log('=== NAMES TO CLEAN ===');
    needsCleaning.forEach(p => {
      console.log(`  ID ${p.id}: "${p.name}" → "${p.newName}"`);
    });
  }

  if (needsDeleting.length > 0) {
    console.log('\n=== NON-PERFUMES TO DELETE ===');
    needsDeleting.forEach(p => {
      console.log(`  ID ${p.id}: "${p.name}" (${p.brand})`);
    });
  }

  if (!doFix) {
    console.log('\n⚠️  Preview only. Run with --fix to apply changes.');
    return;
  }

  // Apply fixes
  console.log('\n🔧 Applying fixes...\n');
  
  let fixed = 0;
  for (const p of needsCleaning) {
    const { error } = await supabase.from('perfumes').update({ name: p.newName }).eq('id', p.id);
    if (!error) {
      console.log(`  ✅ ID ${p.id}: "${p.name}" → "${p.newName}"`);
      fixed++;
    } else {
      console.log(`  ❌ ID ${p.id}: ${error.message}`);
    }
  }

  let deleted = 0;
  for (const p of needsDeleting) {
    const { error } = await supabase.from('perfumes').delete().eq('id', p.id);
    if (!error) {
      console.log(`  🗑️ Deleted ID ${p.id}: "${p.name}"`);
      deleted++;
    } else {
      console.log(`  ❌ Delete failed ID ${p.id}: ${error.message}`);
    }
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Cleaned: ${fixed}`);
  console.log(`Deleted: ${deleted}`);
}

main();
