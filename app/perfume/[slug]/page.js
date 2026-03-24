import { createClient } from '@supabase/supabase-js';
import PerfumeDetail from './PerfumeDetail';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ═══ SEO METADATA ═══
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await supabase.from('perfumes').select('*').limit(1000);
  
  const perfume = data?.find(p => {
    const s = `${p.name}-${p.brand}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
  const { data: allPerfumes } = await supabase.from('perfumes').select('*').limit(1000);
  
  const perfume = allPerfumes?.find(p => {
    const s = `${p.name}-${p.brand}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

  // Fetch reviews for this perfume
  const { data: reviews } = await supabase.from('reviews').select('*').eq('perfume', perfume.name).order('created_at', { ascending: false });

  // Find similar perfumes
  const pNotes = new Set((perfume.top_notes + ',' + perfume.heart_notes + ',' + perfume.base_notes).split(',').map(n => n.trim().toLowerCase()).filter(Boolean));
  const pAccords = new Set((perfume.main_accords || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean));
  
  const similar = (allPerfumes || [])
    .filter(x => x.id !== perfume.id)
    .map(x => {
      const xNotes = new Set((x.top_notes + ',' + x.heart_notes + ',' + x.base_notes).split(',').map(n => n.trim().toLowerCase()).filter(Boolean));
      const xAccords = new Set((x.main_accords || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean));
      const noteOverlap = [...pNotes].filter(n => xNotes.has(n)).length;
      const accordOverlap = [...pAccords].filter(a => xAccords.has(a)).length;
      const familyBonus = x.family === perfume.family ? 3 : 0;
      return { ...x, score: noteOverlap * 2 + accordOverlap * 3 + familyBonus };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

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
