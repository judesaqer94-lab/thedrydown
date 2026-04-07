import { client } from '../../../sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import BlogPostView from './BlogPost';
import { createClient } from '@supabase/supabase-js';

const builder = imageUrlBuilder(client);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

const POST_QUERY = `*[_type == "blogPost" && slug.current == $slug && status == "published"][0] {
  "id": _id, title, "slug": slug.current, excerpt, category,
  "cover_image": coverImage.asset->url, coverImage, author, body,
  "published_at": publishedAt, "updated_at": _updatedAt,
  "reading_time": readingTime, featured, tags, seoTitle, seoDescription
}`;

const RELATED_QUERY = `*[_type == "blogPost" && status == "published" && category == $category && slug.current != $slug] | order(publishedAt desc)[0...3] {
  "id": _id, title, "slug": slug.current, excerpt, category,
  "cover_image": coverImage.asset->url, "published_at": publishedAt, "reading_time": readingTime
}`;

export async function generateStaticParams() {
  const slugs = await client.fetch(`*[_type == "blogPost" && status == "published"]{ "slug": slug.current }`);
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });
  if (!post) return { title: 'Post Not Found — The Dry Down' };
  return {
    title: `${post.seoTitle || post.title} | The Dry Down Blog`,
    description: post.seoDescription || post.excerpt,
    keywords: `${post.category?.replace(/-/g, ' ')}, perfume blog, fragrance guide, the dry down`,
    openGraph: { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, type: 'article',
      images: post.cover_image ? [{ url: post.cover_image }] : [], authors: [post.author || 'The Dry Down'] },
    twitter: { card: 'summary_large_image', title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt },
    alternates: { canonical: `https://www.thedrydown.io/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });
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
  const related = await client.fetch(RELATED_QUERY, { category: post.category, slug });
  let perfumes = [];
  if (post.body) {
    const perfumeIds = post.body.filter((block) => block._type === 'perfumeEmbed' && block.perfumeId).map((block) => block.perfumeId);
    if (perfumeIds.length > 0) {
      const { data: perfData } = await supabase.from('perfumes').select('id, name, brand, family, concentration, image_url, rating, price_low').in('id', perfumeIds);
      perfumes = perfData || [];
    }
  }
  const structuredData = {
    "@context": "https://schema.org", "@type": "Article", "headline": post.title,
    "description": post.excerpt, "image": post.cover_image || undefined,
    "author": { "@type": "Person", "name": post.author || 'The Dry Down' },
    "publisher": { "@type": "Organization", "name": "The Dry Down" },
    "datePublished": post.published_at, "dateModified": post.updated_at || post.published_at,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <BlogPostView post={post} related={related || []} perfumes={perfumes} />
    </>
  );
}
