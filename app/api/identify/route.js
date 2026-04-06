import { NextResponse } from 'next/server';

function logMissToSheet(brand, fragrance, concentration, confidence) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
  if (!webhookUrl) return;
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: brand || 'Unknown',
      fragrance: fragrance || 'Unknown',
      concentration: concentration || 'Unknown',
      confidence: confidence || 'Unknown',
      timestamp: new Date().toISOString(),
    }),
  }).catch(err => console.error('Sheet log failed:', err));
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.logMiss) {
      logMissToSheet(body.brand, body.fragrance, body.concentration, body.confidence);
      return NextResponse.json({ logged: true });
    }

    const { image, mediaType } = body;
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: 'You are a fragrance identification expert. Look at this image and identify the perfume or cologne. Read any text visible on the bottle, box, or label.\n\nRespond ONLY with a JSON object, no markdown, no backticks, no explanation:\n{"brand": "Brand Name", "fragrance": "Fragrance Name", "concentration": "EDT/EDP/Parfum/Extrait/etc", "confidence": "high/medium/low"}\n\nIf you cannot identify it at all, respond with:\n{"brand": "unknown", "fragrance": "unknown", "concentration": "unknown", "confidence": "none"}\n\nImportant:\n- Use the official brand name (e.g., "Maison Francis Kurkdjian" not "MFK")\n- Use the official fragrance name as it appears on the bottle\n- For concentration, use standard abbreviations: EDT, EDP, Parfum, Extrait, Elixir, EDC, etc.' },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(clean); } catch {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'Failed to parse identification' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Scanner API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
