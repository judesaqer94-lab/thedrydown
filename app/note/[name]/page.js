import { createClient } from '@supabase/supabase-js';
import NoteDetail from './NoteDetail';
import NOTE_ENCYCLOPEDIA from '../../lib/noteEncyclopedia';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({ params }) {
  const { name } = await params;
  const noteName = decodeURIComponent(name);
  const displayName = noteName.charAt(0).toUpperCase() + noteName.slice(1);
  const info = NOTE_ENCYCLOPEDIA[noteName.toLowerCase()];
  
  return {
    title: `${displayName} in Perfumery — What Does ${displayName} Smell Like? | The Dry Down`,
    description: info 
      ? `${info.description.slice(0, 150)} Discover all perfumes featuring ${noteName} as a note.`
      : `Explore perfumes featuring ${displayName}. Find fragrances with ${displayName} notes, learn what it smells like, and discover your next scent.`,
    keywords: `${noteName}, ${noteName} perfume, ${noteName} note, fragrance notes, what does ${noteName} smell like`,
    alternates: { canonical: `https://www.thedrydown.io/note/${encodeURIComponent(noteName.toLowerCase())}` },
  };
}

export default async function NotePage({ params }) {
  const { name } = await params;
  const noteName = decodeURIComponent(name);
  const displayName = noteName.charAt(0).toUpperCase() + noteName.slice(1);

  // Fetch all perfumes
  const { data: allPerfumes } = await supabase.from('perfumes').select('*').limit(2000);

  // Find perfumes with this note
  const matching = (allPerfumes || []).filter(p => {
    const allNotes = `${p.top_notes},${p.heart_notes},${p.base_notes}`.toLowerCase();
    return allNotes.includes(noteName.toLowerCase());
  });

  // Categorize by position
  const inTop = matching.filter(p => (p.top_notes || '').toLowerCase().includes(noteName.toLowerCase()));
  const inHeart = matching.filter(p => (p.heart_notes || '').toLowerCase().includes(noteName.toLowerCase()));
  const inBase = matching.filter(p => (p.base_notes || '').toLowerCase().includes(noteName.toLowerCase()));

  const info = NOTE_ENCYCLOPEDIA[noteName.toLowerCase()];

  // Find commonly paired notes
  const pairedNotes = {};
  matching.forEach(p => {
    const allNotes = `${p.top_notes},${p.heart_notes},${p.base_notes}`.split(',').map(n => n.trim().toLowerCase()).filter(Boolean);
    allNotes.forEach(n => {
      if (n !== noteName.toLowerCase()) {
        pairedNotes[n] = (pairedNotes[n] || 0) + 1;
      }
    });
  });
  const topPaired = Object.entries(pairedNotes).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${displayName} in Perfumery`,
    "description": info?.description || `Learn about ${displayName} as a fragrance note.`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <NoteDetail 
        noteName={displayName} 
        info={info} 
        matching={matching} 
        inTop={inTop} 
        inHeart={inHeart} 
        inBase={inBase}
        topPaired={topPaired}
      />
    </>
  );
}
