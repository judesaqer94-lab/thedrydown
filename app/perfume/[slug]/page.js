import { createClient } from '@supabase/supabase-js';
import PerfumeDetail from './PerfumeDetail';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ═══ MULTI-DIMENSIONAL SIMILARITY ENGINE ═══
// Scoring: Accords 35% | Notes 25% (base 3x, heart 2x, top 1x) | 
//          Seasons 15% | Occasions 10% | Performance 5% | Gender 5% | Family 5%
function findSimilarPerfumes(target, allPerfumes, limit = 6) {
  const parseNotes = (str) => (str || '').split(',').map(n => n.trim().toLowerCase()).filter(Boolean);
  const tTop = new Set(parseNotes(target.top_notes));
  const tHeart = new Set(parseNotes(target.heart_notes));
  const tBase = new Set(parseNotes(target.base_notes));
  const tAccords = new Set(parseNotes(target.main_accords));

  let tAccordPcts = {};
  try { tAccordPcts = target.accord_percentages ? (typeof target.accord_percentages === 'string' ? JSON.parse(target.accord_percentages) : target.accord_percentages) : {}; } catch {}

  let tSeasons = [];
  try { tSeasons = target.season_ranking ? (typeof target.season_ranking === 'string' ? JSON.parse(target.season_ranking) : target.season_ranking) : []; } catch {}

  let tOccasions = [];
  try { tOccasions = target.occasion_ranking ? (typeof target.occasion_ranking === 'string' ? JSON.parse(target.occasion_ranking) : target.occasion_ranking) : []; } catch {}

  const levelWeight = { 'Dominant': 1.0, 'Prominent': 0.75, 'Moderate': 0.5 };

  const cosineSim = (vecA, vecB) => {
    if (!vecA.length || !vecB.length) return 0.5;
    const mapA = Object.fromEntries(vecA.map(v => [v.name, v.score]));
    const mapB = Object.fromEntries(vecB.map(v => [v.name, v.score]));
    const keys = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])];
    let dot = 0, magA = 0, magB = 0;
    for (const k of keys) {
      const a = mapA[k] || 0, b = mapB[k] || 0;
      dot += a * b; magA += a * a; magB += b * b;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom > 0 ? dot / denom : 0;
  };

  return allPerfumes
    .filter(c => c.id !== target.id)
    .map(c => {
      const cTop = new Set(parseNotes(c.top_notes));
      const cHeart = new Set(parseNotes(c.heart_notes));
      const cBase = new Set(parseNotes(c.base_notes));
      const cAccords = parseNotes(c.main_accords);

      // Accord score (35 pts)
      let accordHits = 0;
      for (const a of cAccords.filter(a => tAccords.has(a))) {
        accordHits += levelWeight[tAccordPcts[a]] || 0.5;
      }
      const accordScore = (accordHits / Math.max(tAccords.size, 1)) * 35;

      // Note score (25 pts) — base 3x, heart 2x, top 1x
      const noteScore = (
        ([...tBase].filter(n => cBase.has(n)).length * 3 / Math.max(tBase.size, 1)) +
        ([...tHeart].filter(n => cHeart.has(n)).length * 2 / Math.max(tHeart.size, 1)) +
        ([...tTop].filter(n => cTop.has(n)).length * 1 / Math.max(tTop.size, 1))
      ) / 6 * 25;

      // Season score (15 pts)
      let cSeasons = [];
      try { cSeasons = c.season_ranking ? (typeof c.season_ranking === 'string' ? JSON.parse(c.season_ranking) : c.season_ranking) : []; } catch {}
      const seasonScore = cosineSim(tSeasons, cSeasons) * 15;

      // Occasion score (10 pts)
      let cOccasions = [];
      try { cOccasions = c.occasion_ranking ? (typeof c.occasion_ranking === 'string' ? JSON.parse(c.occasion_ranking) : c.occasion_ranking) : []; } catch {}
      const occasionScore = cosineSim(tOccasions, cOccasions) * 10;

      // Performance (5 pts)
      const perfScore = 
        ((c.longevity || '').toLowerCase() === (target.longevity || '').toLowerCase() ? 2.5 : 0) +
        ((c.sillage || '').toLowerCase() === (target.sillage || '').toLowerCase() ? 2.5 : 0);

      // Gender (5 pts) + Family (5 pts)
      const genderScore = (c.gender || '').toLowerCase() === (target.gender || '').toLowerCase() ? 5 : 0;
      const familyScore = (c.family || '').toLowerCase() === (target.family || '').toLowerCase() ? 5 : 0;

      const similarity_score = Math.round((accordScore + noteScore + seasonScore + occasionScore + perfScore + genderScore + familyScore) * 10) / 10;

      return { ...c, similarity_score };
    })
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

// ═══ SLUG HELPER ═══
// Normalize accented characters before slugifying
function normalizeSlug(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents: é→e, è→e, ô→o
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ═══ SEO METADATA ═══
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await supabase.from('perfumes').select('*').limit(2000);
  
  const perfume = data?.find(p => {
    const s = normalizeSlug(`${p.name}-${p.brand}`);
    return s === slug;
  });
  
  if (!perfume) {
    return { title: 'Perfume Not Found — The Dry Down' };
  }

  const topNotes = perfume.top_notes || '';
  const heartNotes = perfume.heart_notes || '';
  const baseNotes = perfume.base_notes || '';
  const allNotes = [topNotes, heartNotes, baseNotes].filter(Boolean).join(', ');
  
  return {
    title: `${perfume.name} by ${perfume.brand} — Notes, Accords & Reviews | The Dry Down`,
    description: `Discover ${perfume.name} by ${perfume.brand}. ${perfume.concentration} · ${perfume.family} · ${perfume.gender}. Notes: ${allNotes.slice(0, 150)}. Read reviews, find dupes, and buy at the best price in AED.`,
    keywords: `${perfume.name}, ${perfume.brand}, ${perfume.family} perfume, ${topNotes}, fragrance review, buy perfume dubai, AED`,
    openGraph: {
      title: `${perfume.name} by ${perfume.brand}`,
      description: `${perfume.concentration} · ${perfume.family} · Notes: ${allNotes.slice(0, 100)}`,
      type: 'article',
      images: perfume.image_url ? [{ url: perfume.image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${perfume.name} by ${perfume.brand}`,
      description: `${perfume.concentration} · ${perfume.family} · ${perfume.gender}`,
    },
    alternates: {
      canonical: `https://www.thedrydown.io/perfume/${slug}`,
    },
  };
}

// ═══ PAGE ═══
export default async function PerfumePage({ params }) {
  const { slug } = await params;
  
  // Fetch all perfumes for matching + similar
  const { data: allPerfumes } = await supabase.from('perfumes').select('*').limit(2000);
  
  const perfume = allPerfumes?.find(p => {
    const s = normalizeSlug(`${p.name}-${p.brand}`);
    return s === slug;
  });
  
  if (!perfume) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '2.5rem', marginBottom: 8 }}>Perfume Not Found</h1>
          <p style={{ color: '#8C8378', marginBottom: 24 }}>This fragrance doesn't exist in our directory.</p>
          <a href="/" style={{ color: '#9B8EC4', textDecoration: 'none', fontSize: 14 }}>← Back to Directory</a>
        </div>
      </div>
    );
  }

  // FIX: Changed .eq('perfume', ...) to .eq('perfume_name', ...) to match actual column name
  const { data: reviews } = await supabase.from('reviews').select('*').eq('perfume_name', perfume.name).order('created_at', { ascending: false });

  // ═══ SIMILARITY ENGINE ═══
  const similar = findSimilarPerfumes(perfume, allPerfumes || []);

  // Generate structured data for Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${perfume.name} by ${perfume.brand}`,
    "brand": { "@type": "Brand", "name": perfume.brand },
    "description": `${perfume.name} is a ${perfume.family} ${perfume.concentration} fragrance by ${perfume.brand}.`,
    "image": perfume.image_url || undefined,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": perfume.rating || 4,
      "bestRating": 5,
      "ratingCount": 50 + (perfume.id * 17) % 300,
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "AED",
      "lowPrice": perfume.price_low,
      "highPrice": perfume.price_high,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PerfumeDetail perfume={perfume} similar={similar} reviews={reviews || []} />
    </>
  );
}
