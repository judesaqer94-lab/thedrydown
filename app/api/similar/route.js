import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/similar?id=123&limit=6
 * 
 * Uses the Supabase RPC function for multi-dimensional similarity scoring.
 * Falls back to JS-based scoring if the RPC function isn't deployed yet.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const perfumeId = searchParams.get('id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

  if (!perfumeId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    // Try the Supabase RPC function first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('find_similar_perfumes', { 
        target_id: parseInt(perfumeId), 
        result_limit: limit 
      });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return NextResponse.json({ 
        results: rpcData, 
        engine: 'supabase_rpc',
        target_id: parseInt(perfumeId)
      });
    }

    // Fallback: JS-based multi-dimensional scoring
    console.log('RPC unavailable, using JS fallback:', rpcError?.message);
    const results = await jsFallbackSimilarity(parseInt(perfumeId), limit);
    
    return NextResponse.json({ 
      results, 
      engine: 'js_fallback',
      target_id: parseInt(perfumeId)
    });

  } catch (err) {
    console.error('Similarity engine error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * JS fallback — same algorithm as the SQL function but runs in Node.
 * Used when the RPC hasn't been deployed to Supabase yet.
 */
async function jsFallbackSimilarity(targetId, limit) {
  // Fetch target perfume
  const { data: targetArr } = await supabase
    .from('perfumes')
    .select('*')
    .eq('id', targetId)
    .limit(1);

  if (!targetArr || targetArr.length === 0) return [];
  const target = targetArr[0];

  // Fetch all candidates (paginate if needed)
  const { data: allPerfumes } = await supabase
    .from('perfumes')
    .select('*')
    .neq('id', targetId)
    .limit(10000);

  if (!allPerfumes) return [];

  // Parse target data
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

  // Level weight map
  const levelWeight = { 'Dominant': 1.0, 'Prominent': 0.75, 'Moderate': 0.5 };

  // Cosine similarity helper
  const cosineSim = (vecA, vecB) => {
    if (!vecA.length || !vecB.length) return 0.5; // neutral
    const mapA = Object.fromEntries(vecA.map(v => [v.name, v.score]));
    const mapB = Object.fromEntries(vecB.map(v => [v.name, v.score]));
    const keys = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])];
    let dot = 0, magA = 0, magB = 0;
    for (const k of keys) {
      const a = mapA[k] || 0;
      const b = mapB[k] || 0;
      dot += a * b;
      magA += a * a;
      magB += b * b;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom > 0 ? dot / denom : 0;
  };

  // Score each candidate
  const scored = allPerfumes.map(c => {
    const cTop = new Set(parseNotes(c.top_notes));
    const cHeart = new Set(parseNotes(c.heart_notes));
    const cBase = new Set(parseNotes(c.base_notes));
    const cAccords = parseNotes(c.main_accords);

    // ── Accord score (35 pts) ──
    let accordHits = 0;
    const sharedAccords = cAccords.filter(a => tAccords.has(a));
    for (const a of sharedAccords) {
      const weight = levelWeight[tAccordPcts[a]] || 0.5;
      accordHits += weight;
    }
    const accordScore = (accordHits / Math.max(tAccords.size, 1)) * 35;

    // ── Note score (25 pts) — base 3x, heart 2x, top 1x ──
    const baseOverlap = [...tBase].filter(n => cBase.has(n)).length;
    const heartOverlap = [...tHeart].filter(n => cHeart.has(n)).length;
    const topOverlap = [...tTop].filter(n => cTop.has(n)).length;
    const noteScore = (
      (baseOverlap * 3 / Math.max(tBase.size, 1)) +
      (heartOverlap * 2 / Math.max(tHeart.size, 1)) +
      (topOverlap * 1 / Math.max(tTop.size, 1))
    ) / 6 * 25;

    // ── Season score (15 pts) ──
    let cSeasons = [];
    try { cSeasons = c.season_ranking ? (typeof c.season_ranking === 'string' ? JSON.parse(c.season_ranking) : c.season_ranking) : []; } catch {}
    const seasonScore = cosineSim(tSeasons, cSeasons) * 15;

    // ── Occasion score (10 pts) ──
    let cOccasions = [];
    try { cOccasions = c.occasion_ranking ? (typeof c.occasion_ranking === 'string' ? JSON.parse(c.occasion_ranking) : c.occasion_ranking) : []; } catch {}
    const occasionScore = cosineSim(tOccasions, cOccasions) * 10;

    // ── Performance score (5 pts) ──
    const perfScore = 
      ((c.longevity || '').toLowerCase() === (target.longevity || '').toLowerCase() ? 2.5 : 0) +
      ((c.sillage || '').toLowerCase() === (target.sillage || '').toLowerCase() ? 2.5 : 0);

    // ── Gender score (5 pts) ──
    const genderScore = (c.gender || '').toLowerCase() === (target.gender || '').toLowerCase() ? 5 : 0;

    // ── Family score (5 pts) ──
    const familyScore = (c.family || '').toLowerCase() === (target.family || '').toLowerCase() ? 5 : 0;

    const totalScore = Math.round((accordScore + noteScore + seasonScore + occasionScore + perfScore + genderScore + familyScore) * 10) / 10;

    return {
      id: c.id,
      name: c.name,
      brand: c.brand,
      family: c.family,
      concentration: c.concentration,
      gender: c.gender,
      year: c.year,
      rating: c.rating,
      price_low: c.price_low,
      price_high: c.price_high,
      image_url: c.image_url,
      top_notes: c.top_notes,
      heart_notes: c.heart_notes,
      base_notes: c.base_notes,
      main_accords: c.main_accords,
      longevity: c.longevity,
      sillage: c.sillage,
      similarity_score: totalScore,
    };
  });

  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, limit);
}
