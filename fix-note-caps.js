// fix-note-caps.js — Fixes inconsistent note capitalization in Supabase
// Usage: node fix-note-caps.js
// 
// This script:
// 1. Pulls all perfumes from Supabase
// 2. Finds notes with inconsistent capitalization (e.g. "sandalwood" vs "Sandalwood")
// 3. Standardizes to Title Case (first letter capitalized)
// 4. Updates Supabase

const SUPABASE_URL = 'https://wydptxijqfqimsftgmlp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';

function titleCase(str) {
  // Handle special cases
  const specials = {
    'iso e super': 'Iso E Super',
    'lily-of-the-valley': 'Lily-of-the-Valley',
    'ylang-ylang': 'Ylang-Ylang',
    'orange blossom': 'Orange Blossom',
    'pink pepper': 'Pink Pepper',
    'black pepper': 'Black Pepper',
    'black currant': 'Black Currant',
    'red currant': 'Red Currant',
    'tonka bean': 'Tonka Bean',
    'vanilla orchid': 'Vanilla Orchid',
    'green tea': 'Green Tea',
    'black tea': 'Black Tea',
    'white tea': 'White Tea',
    'green notes': 'Green Notes',
    'woody notes': 'Woody Notes',
    'spicy notes': 'Spicy Notes',
    'floral notes': 'Floral Notes',
    'fruity notes': 'Fruity Notes',
    'aquatic notes': 'Aquatic Notes',
    'sweet notes': 'Sweet Notes',
    'white musk': 'White Musk',
    'red berries': 'Red Berries',
    'wild berries': 'Wild Berries',
    'green apple': 'Green Apple',
    'red apple': 'Red Apple',
    'blood orange': 'Blood Orange',
    'bitter orange': 'Bitter Orange',
    'star anise': 'Star Anise',
    'sea salt': 'Sea Salt',
    'sea notes': 'Sea Notes',
    'brown sugar': 'Brown Sugar',
    'tonka bean': 'Tonka Bean',
    'cocoa': 'Cocoa',
    'cacao': 'Cacao',
    'oud': 'Oud',
    'agarwood (oud)': 'Agarwood (Oud)',
    'guaiac wood': 'Guaiac Wood',
    'cashmere wood': 'Cashmere Wood',
    'blonde wood': 'Blonde Wood',
    'blonde woods': 'Blonde Woods',
    'jasmine sambac': 'Jasmine Sambac',
    'jasmine grandiflorum': 'Jasmine Grandiflorum',
    'damask rose': 'Damask Rose',
    'bulgarian rose': 'Bulgarian Rose',
    'turkish rose': 'Turkish Rose',
    'centifolia rose': 'Centifolia Rose',
    'may rose': 'May Rose',
    'rose absolute': 'Rose Absolute',
    'orris root': 'Orris Root',
    'violet leaf': 'Violet Leaf',
    'fig leaf': 'Fig Leaf',
    'bay leaf': 'Bay Leaf',
    'clary sage': 'Clary Sage',
    'cedar': 'Cedar',
    'virginia cedar': 'Virginia Cedar',
  };

  const lower = str.toLowerCase().trim();
  if (specials[lower]) return specials[lower];

  // Default: capitalize first letter of each word
  return lower.replace(/(?:^|\s|-)\S/g, match => match.toUpperCase());
}

function fixNotes(notesStr) {
  if (!notesStr) return notesStr;
  const notes = notesStr.split(',').map(n => n.trim()).filter(Boolean);
  const fixed = notes.map(n => titleCase(n));
  return fixed.join(', ');
}

async function main() {
  console.log('');
  console.log('🧹 The Dry Down — Fix Note Capitalization');
  console.log('==========================================\n');

  // Load all perfumes
  console.log('📦 Loading perfumes...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?select=id,top_notes,heart_notes,base_notes,main_accords&limit=2000`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const perfumes = await res.json();
  console.log(`📦 Loaded ${perfumes.length} perfumes\n`);

  // First pass: find all unique notes and show duplicates
  const noteVariants = {};
  perfumes.forEach(p => {
    ['top_notes', 'heart_notes', 'base_notes'].forEach(field => {
      if (p[field]) {
        p[field].split(',').map(n => n.trim()).filter(Boolean).forEach(n => {
          const key = n.toLowerCase();
          if (!noteVariants[key]) noteVariants[key] = new Set();
          noteVariants[key].add(n);
        });
      }
    });
  });

  // Show duplicates
  const dupes = Object.entries(noteVariants).filter(([key, variants]) => variants.size > 1);
  console.log(`🔍 Found ${dupes.length} notes with inconsistent capitalization:\n`);
  dupes.forEach(([key, variants]) => {
    console.log(`   ${key}: ${[...variants].join(' | ')} → ${titleCase(key)}`);
  });

  // Fix all perfumes
  console.log(`\n📝 Fixing ${perfumes.length} perfumes...\n`);

  let fixed = 0;
  let unchanged = 0;

  for (let i = 0; i < perfumes.length; i++) {
    const p = perfumes[i];
    const newTop = fixNotes(p.top_notes);
    const newHeart = fixNotes(p.heart_notes);
    const newBase = fixNotes(p.base_notes);
    const newAccords = fixNotes(p.main_accords);

    const changed = newTop !== p.top_notes || newHeart !== p.heart_notes || newBase !== p.base_notes || newAccords !== p.main_accords;

    if (changed) {
      const updates = {};
      if (newTop !== p.top_notes) updates.top_notes = newTop;
      if (newHeart !== p.heart_notes) updates.heart_notes = newHeart;
      if (newBase !== p.base_notes) updates.base_notes = newBase;
      if (newAccords !== p.main_accords) updates.main_accords = newAccords;

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/perfumes?id=eq.${p.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updates)
        });
        if (res.ok) fixed++;
      } catch {}
    } else {
      unchanged++;
    }

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`   ${i + 1}/${perfumes.length}...\r`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`🏁 DONE!`);
  console.log(`✅ Fixed: ${fixed} perfumes`);
  console.log(`⏭️  Already correct: ${unchanged} perfumes`);
  console.log(`\n🌐 Check thedrydown.io/notes — duplicates should be gone!`);
}

main().catch(err => console.error('Error:', err.message));
