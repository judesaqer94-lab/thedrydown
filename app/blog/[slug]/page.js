import { createClient } from '@supabase/supabase-js';
import BlogPost from './BlogPost';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, author, category')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!data) return { title: 'Post Not Found — The Dry Down' };

  return {
    title: `${data.title} | The Dry Down Blog`,
    description: data.excerpt,
    keywords: `${data.category?.replace(/-/g, ' ')}, perfume blog, fragrance guide, the dry down`,
    openGraph: {
      title: data.title,
      description: data.excerpt,
      type: 'article',
      images: data.cover_image ? [{ url: data.cover_image }] : [],
      authors: [data.author || 'The Dry Down'],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.excerpt,
    },
    alternates: {
      canonical: `https://www.thedrydown.io/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '2.5rem', marginBottom: 8 }}>Post Not Found</h1>
          <p style={{ color: '#8C8378', marginBottom: 24 }}>This article doesn&apos;t exist.</p>
          <a href="/blog" style={{ color: '#9B8EC4', textDecoration: 'none', fontSize: 14 }}>← Back to Blog</a>
        </div>
      </div>
    );
  }

  // Fetch related posts (same category, excluding current)
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, cover_image, published_at, reading_time')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);

  // Fetch mentioned perfumes if the post has them
  let perfumes = [];
  if (post.perfume_ids) {
    const ids = typeof post.perfume_ids === 'string' ? JSON.parse(post.perfume_ids) : post.perfume_ids;
    if (ids.length > 0) {
      const { data: perfData } = await supabase
        .from('perfumes')
        .select('id, name, brand, family, concentration, image_url, rating, price_low')
        .in('id', ids);
      perfumes = perfData || [];
    }
  }

  // Structured data for Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image || undefined,
    "author": { "@type": "Person", "name": post.author || 'The Dry Down' },
    "publisher": { "@type": "Organization", "name": "The Dry Down" },
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <BlogPost post={post} related={related || []} perfumes={perfumes} />
    </>
  );
}
