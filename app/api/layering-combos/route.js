import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY'
);

// Sort IDs so A+B and B+A always match the same combo
function sortIds(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  return numA <= numB ? [numA, numB] : [numB, numA];
}

// GET — fetch reviews for a perfume combo (order-independent)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawA = searchParams.get('perfumeA');
    const rawB = searchParams.get('perfumeB');

    if (!rawA || !rawB) {
      return NextResponse.json({ combos: [] });
    }

    const [idA, idB] = sortIds(rawA, rawB);

    // Fetch combos where the sorted pair matches — this makes A+B = B+A
    const { data, error } = await supabase
      .from('layering_combos')
      .select('*')
      .eq('perfume_a_id', idA)
      .eq('perfume_b_id', idB)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch combos error:', error);
      return NextResponse.json({ combos: [] });
    }

    return NextResponse.json({ combos: data || [] });
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ combos: [] });
  }
}

// POST — submit a new layering review
export async function POST(request) {
  try {
    const body = await request.json();
    const { perfumeAId, perfumeBId, submittedBy, review, rating } = body;

    if (!perfumeAId || !perfumeBId || !review?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Always store with sorted IDs so A+B and B+A go to the same combo
    const [idA, idB] = sortIds(perfumeAId, perfumeBId);

    const { data, error } = await supabase
      .from('layering_combos')
      .insert({
        perfume_a_id: idA,
        perfume_b_id: idB,
        submitted_by: submittedBy || 'Anonymous',
        review: review.trim(),
        rating: Math.min(5, Math.max(1, rating || 4)),
        upvotes: 0,
        downvotes: 0,
        status: 'approved',
      })
      .select();

    if (error) {
      console.error('Insert combo error:', error);
      return NextResponse.json({ error: 'Could not submit review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, combo: data?.[0] });
  } catch (err) {
    console.error('POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — upvote or downvote a combo review
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { comboId, vote } = body;

    if (!comboId || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Get current counts
    const { data: current, error: fetchError } = await supabase
      .from('layering_combos')
      .select('upvotes, downvotes')
      .eq('id', comboId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
    }

    const field = vote === 'up' ? 'upvotes' : 'downvotes';
    const { error: updateError } = await supabase
      .from('layering_combos')
      .update({ [field]: (current[field] || 0) + 1 })
      .eq('id', comboId);

    if (updateError) {
      console.error('Vote error:', updateError);
      return NextResponse.json({ error: 'Could not vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
