'use client';

import { PortableText } from '@portabletext/react';
import imageUrlBuilder from '@sanity/image-url';
import { Header, Footer, Stars, Tag, PerfumeCard } from '../../components/shared';
import { ACCENT, FAMILY_COLORS, slugify } from '../../lib/constants';

const builder = imageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
});
function urlFor(source) { return builder.image(source); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function PerfumeEmbed({ value, perfumes }) {
  const p = perfumes.find((pf) => pf.id === value.perfumeId);
  if (!p) return null;
  return (
    <a href={`/perfume/${slugify(p.name, p.brand)}`} className="perfume-embed" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid #E8E8E8', borderRadius: 8, margin: '24px 0', transition: 'all 0.2s' }}>
        {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 4 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, letterSpacing: '-0.02em' }}>{p.name}</div>
          <div style={{ fontSize: 13, color: '#8C8378', marginTop: 2 }}>{p.brand} · {p.family} · {p.concentration || ''}</div>
        </div>
        {p.price_low && <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontFamily: "'EB Garamond', serif", fontSize: 20 }}>AED {p.price_low}</div></div>}
      </div>
    </a>
  );
}

function TipBlock({ value }) {
  return (
    <div style={{ padding: '20px 24px', border: `1px solid ${ACCENT}30`, background: `${ACCENT}05`, borderRadius: 8, margin: '24px 0', fontSize: 16, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: ACCENT, marginBottom: 8 }}>Tip</div>
      {value.text}
    </div>
  );
}

function SanityImage({ value }) {
  if (!value?.asset) return null;
  return (
    <figure style={{ margin: '24px 0' }}>
      <img src={urlFor(value).width(800).auto('format').url()} alt={value.alt || ''} style={{ width: '100%', borderRadius: 8 }} />
      {value.caption && <figcaption style={{ textAlign: 'center', fontSize: 13, color: '#8C8378', marginTop: 8 }}>{value.caption}</figcaption>}
    </figure>
  );
}

function PostContent({ content, perfumes }) {
  if (!content) return null;
  const components = {
    types: {
      image: ({ value }) => <SanityImage value={value} />,
      perfumeEmbed: ({ value }) => <PerfumeEmbed value={value} perfumes={perfumes} />,
      tipBlock: ({ value }) => <TipBlock value={value} />,
    },
    marks: {
      link: ({ children, value }) => (
        <a href={value?.href} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: ACCENT + '40' }}>{children}</a>
      ),
    },
  };
  return <div className="blog-content"><PortableText value={content} components={components} /></div>;
}

function RelatedCard({ post }) {
  return (
    <a href={`/blog/${post.slug}`} className="block no-underline text-inherit group">
      {post.cover_image && <div className="aspect-[3/2] rounded-lg overflow-hidden mb-3" style={{ background: '#F5F5F5' }}><img src={post.cover_image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" /></div>}
      <div className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: ACCENT }}>{post.category?.replace(/-/g, ' ')}</div>
      <h3 className="font-serif text-lg leading-tight group-hover:opacity-70 transition-opacity" style={{ letterSpacing: '-0.01em' }}>{post.title}</h3>
      <div className="text-xs mt-2" style={{ color: '#8C8378' }}>{formatDate(post.published_at)}</div>
    </a>
  );
}

export default function BlogPost({ post, related, perfumes }) {
  return (
    <div className="min-h-screen">
      <Header current="blog" />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <a href="/blog" className="text-xs uppercase tracking-widest inline-block mb-8 no-underline transition-all" style={{ color: '#8C8378' }}>← Back to Blog</a>
        <article style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs uppercase tracking-widest font-medium px-2.5 py-1 rounded" style={{ background: ACCENT + '12', color: ACCENT }}>{post.category?.replace(/-/g, ' ')}</span>
              <span className="text-xs" style={{ color: '#8C8378' }}>{post.reading_time || 5} min read</span>
            </div>
            <h1 className="font-serif text-4xl leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>{post.title}</h1>
            {post.excerpt && <p className="text-lg leading-relaxed" style={{ color: '#666', fontFamily: 'EB Garamond, serif' }}>{post.excerpt}</p>}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t" style={{ borderColor: '#E8E8E8' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: ACCENT + '15', color: ACCENT }}>{(post.author || 'TD').charAt(0)}</div>
              <div>
                <div className="text-sm font-medium">{post.author || 'The Dry Down'}</div>
                <div className="text-xs" style={{ color: '#8C8378' }}>{formatDate(post.published_at)}</div>
              </div>
            </div>
          </div>
          {post.cover_image && <div className="aspect-[16/9] rounded-lg overflow-hidden mb-10" style={{ background: '#F5F5F5' }}><img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" /></div>}
          <PostContent content={post.body} perfumes={perfumes} />
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-10 pt-6 border-t" style={{ borderColor: '#E8E8E8' }}>
              {post.tags.map((tag) => <span key={tag} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: '#E8E8E8', color: '#8C8378' }}>{tag}</span>)}
            </div>
          )}
        </article>
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t" style={{ borderColor: '#E8E8E8' }}>
            <h2 className="font-serif text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>More in this series</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{related.map((r) => <RelatedCard key={r.id} post={r} />)}</div>
          </div>
        )}
      </main>
      <Footer />
      <style jsx global>{`
        .blog-content { font-family: 'EB Garamond', Georgia, serif; font-size: 18px; line-height: 1.8; color: #333; }
        .blog-content h2 { font-family: 'EB Garamond', serif; font-size: 28px; letter-spacing: -0.02em; margin: 40px 0 16px; color: #1A1A1A; line-height: 1.3; }
        .blog-content h3 { font-family: 'EB Garamond', serif; font-size: 22px; letter-spacing: -0.01em; margin: 32px 0 12px; color: #1A1A1A; line-height: 1.3; }
        .blog-content p { margin: 0 0 20px; }
        .blog-content a { color: ${ACCENT}; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: ${ACCENT}40; transition: text-decoration-color 0.2s; }
        .blog-content a:hover { text-decoration-color: ${ACCENT}; }
        .blog-content blockquote { border-left: 3px solid ${ACCENT}; padding: 16px 24px; margin: 32px 0; font-style: italic; color: #555; background: ${ACCENT}06; border-radius: 0 8px 8px 0; }
        .blog-content img { width: 100%; border-radius: 8px; margin: 24px 0; }
        .blog-content ul, .blog-content ol { padding-left: 24px; margin: 16px 0 24px; }
        .blog-content li { margin: 8px 0; }
        .blog-content .perfume-embed:hover div { border-color: ${ACCENT} !important; background: ${ACCENT}04 !important; }
        .blog-content strong { font-weight: 600; color: #1A1A1A; }
        .blog-content hr { border: none; border-top: 1px solid #E8E8E8; margin: 40px 0; }
      `}</style>
    </div>
  );
}
