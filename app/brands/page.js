import { createClient } from '@supabase/supabase-js';
import BrandsExplorer from './BrandsExplorer';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export const metadata = {
  title: 'Perfume Brands Directory — Designer, Niche, Arabic & More | The Dry Down',
  description: 'Browse perfume brands by category: Designer, Niche, Arabic, Indie, Affordable, and Celebrity. Explore fragrances from over 140 brands.',
  keywords: 'perfume brands, niche perfume, designer fragrance, arabic perfume, Tom Ford, Dior, Lattafa, Parfums de Marly',
};

export default async function BrandsPage() {
  const { data: allPerfumes } = await supabase.from('perfumes').select('name, brand, brand_type, family, concentration, gender, price_low, price_high, rating, year, image_url, top_notes').limit(2000);

  // Build brand data
  const brandMap = {};
  (allPerfumes || []).forEach(p => {
    if (!brandMap[p.brand]) {
      brandMap[p.brand] = { name: p.brand, type: p.brand_type || 'Unknown', count: 0, perfumes: [] };
    }
    brandMap[p.brand].count++;
    brandMap[p.brand].perfumes.push(p);
  });

  const brands = Object.values(brandMap).sort((a, b) => b.count - a.count);

  return <BrandsExplorer brands={brands} />;
}
