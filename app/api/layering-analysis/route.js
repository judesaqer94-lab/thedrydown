import { NextResponse } from 'next/server';

/**
 * POST /api/layering-analysis
 * 
 * Sends two perfumes' data to Claude for a real layering analysis.
 * Returns a written analysis with reasoning a perfume expert would give.
 */
export async function POST(request) {
  try {
    const { perfumeA, perfumeB } = await request.json();

    if (!perfumeA || !perfumeB) {
      return NextResponse.json({ error: 'Two perfumes required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI analysis not configured' }, { status: 503 });
    }

    const prompt = buildPrompt(perfumeA, perfumeB);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return NextResponse.json({ error: 'AI analysis unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse the structured response
    const analysis = parseAnalysis(text);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('Layering analysis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildPrompt(a, b) {
  const formatPerfume = (p) => {
    const accords = (p.main_accords || '').split(',').map(s => s.trim()).filter(Boolean);
    const pcts = p.accord_percentages ? (typeof p.accord_percentages === 'string' ? JSON.parse(p.accord_percentages) : p.accord_percentages) : {};
    const accordsWithLevel = accords.map(a => `${a} (${pcts[a] || 'unknown'})`).join(', ');
    const seasons = p.season_ranking ? (typeof p.season_ranking === 'string' ? JSON.parse(p.season_ranking) : p.season_ranking) : [];
    const occasions = p.occasion_ranking ? (typeof p.occasion_ranking === 'string' ? JSON.parse(p.occasion_ranking) : p.occasion_ranking) : [];
    
    return `${p.name} by ${p.brand}
  Concentration: ${p.concentration || 'unknown'}
  Family: ${p.family || 'unknown'}
  Gender: ${p.gender || 'unisex'}
  Top notes: ${p.top_notes || 'unknown'}
  Heart notes: ${p.heart_notes || 'unknown'}
  Base notes: ${p.base_notes || 'unknown'}
  Accords: ${accordsWithLevel}
  Longevity: ${p.longevity || 'unknown'}
  Sillage: ${p.sillage || 'unknown'}
  Best seasons: ${seasons.sort((a, b) => b.score - a.score).slice(0, 2).map(s => `${s.name} (${s.score.toFixed(1)})`).join(', ') || 'unknown'}
  Best occasions: ${occasions.sort((a, b) => b.score - a.score).slice(0, 2).map(o => `${o.name} (${o.score.toFixed(1)})`).join(', ') || 'unknown'}`;
  };

  return `You are a professional perfume consultant specializing in fragrance layering. A user wants to layer these two perfumes together. Analyze the combination honestly — not every combo works well, and users trust honesty over hype.

PERFUME A (base layer):
${formatPerfume(a)}

PERFUME B (top layer):
${formatPerfume(b)}

Respond in this EXACT format with no additional text or markdown:

VERDICT: [one short phrase, e.g. "A natural pairing" or "Risky but interesting" or "These fight each other"]
WHY_IT_WORKS: [1-2 sentences on what makes these click together, or why they clash. Reference specific notes/accords.]
HOW_TO_WEAR: [1-2 sentences — which to apply first, where on the body, how many sprays of each. Be specific.]
BEST_FOR: [one scenario, e.g. "A cool evening dinner in autumn" or "Weekend brunch in spring"]
WATCH_OUT: [1 sentence — what could go wrong, or what to be aware of. Be honest.]
THE_BLEND: [1-2 sentences describing what the combined scent would smell like to someone nearby — paint a picture.]`;
}

function parseAnalysis(text) {
  const extract = (key) => {
    const regex = new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    verdict: extract('VERDICT'),
    whyItWorks: extract('WHY_IT_WORKS'),
    howToWear: extract('HOW_TO_WEAR'),
    bestFor: extract('BEST_FOR'),
    watchOut: extract('WATCH_OUT'),
    theBlend: extract('THE_BLEND'),
  };
}
