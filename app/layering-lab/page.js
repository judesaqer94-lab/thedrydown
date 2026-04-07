import { createClient } from '@supabase/supabase-js';
import LayeringLab from './LayeringLab';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export const metadata = {
  title: 'Layering Lab — Combine Perfumes | The Dry Down',
  description: 'Experiment with fragrance layering. Pick two perfumes and see how their notes, accords, and seasons blend together. AI-powered analysis and community-tested combinations.',
  keywords: 'perfume layering, fragrance combination, scent layering guide, perfume mixing, layering lab, perfume pairing',
  openGraph: {
    title: 'Layering Lab — The Dry Down',
    description: 'Pick two perfumes. See how they layer together.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.thedrydown.io/layering-lab',
  },
};

export default async function LayeringLabPage() {
  const { data: perfumes } = await supabase
    .from('perfumes')
    .select('id, name, brand, family, concentration, gender, top_notes, heart_notes, base_notes, main_accords, accord_percentages, season_ranking, occasion_ranking, longevity, sillage, image_url, rating')
    .order('name')
    .limit(2000);

  return <LayeringLab perfumes={perfumes || []} />;
}
