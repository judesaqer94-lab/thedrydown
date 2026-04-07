import { createClient } from '@supabase/supabase-js';
import BlogList from './BlogList';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export const metadata = {
  title: 'Blog — Perfume Guides, Reviews & Layering Tips | The Dry Down',
  description: 'Editorial content about fragrance — perfume of the month, seasonal picks, layering guides, and deep dives into notes and accords for the GCC perfume community.',
  keywords: 'perfume blog, fragrance guide, perfume of the month, layering guide, seasonal perfume, arabic perfume blog',
  openGraph: {
    title: 'Blog — The Dry Down',
    description: 'Guides, reviews, and editorial picks from the GCC fragrance community.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.thedrydown.io/blog',
  },
};

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, cover_image, author, published_at, reading_time, featured')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return <BlogList posts={posts || []} />;
}
