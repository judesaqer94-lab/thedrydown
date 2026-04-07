'use client';

import { useState, useMemo } from 'react';
import { Header, Footer } from '../components/shared';
import { ACCENT } from '../lib/constants';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'perfume-of-the-month', label: 'Perfume of the Month' },
  { key: 'seasonal', label: 'Seasonal Picks' },
  { key: 'layering', label: 'Layering Guides' },
  { key: 'notes', label: 'Note Deep Dives' },
  { key: 'gcc', label: 'GCC Picks' },
  { key: 'guide', label: 'Guides' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function FeaturedPost({ post }) {
  return (
    <a href={`/blog/${post.slug}`} className="block no-underline text-inherit group mb-12"
      style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {post.cover_image && (
          <div className="aspect-[4/3] rounded-lg overflow-hidden" style={{ background: '#F5F5F5' }}>
            <img src={post.cover_image} alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs uppercase tracking-widest font-medium px-2.5 py-1 rounded"
              style={{ background: ACCENT + '12', color: ACCENT }}>{post.category?.replace(/-/g, ' ')}</span>
            <span className="text-xs" style={{ color: '#8C8378' }}>{post.reading_time || 5} min read</span>
          </div>
          <h2 className="font-serif text-3xl leading-tight mb-3 group-hover:opacity-80 transition-opacity"
            style={{ letterSpacing: '-0.02em' }}>{post.title}</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#666' }}>{post.excerpt}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{post.author || 'The Dry Down'}</span>
            <span style={{ color: '#D8D0C8' }}>·</span>
            <span className="text-xs" style={{ color: '#8C8378' }}>{formatDate(post.published_at)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function PostCard({ post, index }) {
  return (
    <a href={`/blog/${post.slug}`} className="block no-underline text-inherit group"
      style={{
        padding: '20px 0',
        borderBottom: '1px solid #E8E8E8',
        animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${index * 60}ms`,
      }}>
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-medium"
              style={{ color: ACCENT }}>{post.category?.replace(/-/g, ' ')}</span>
            <span className="text-xs" style={{ color: '#D8D0C8' }}>·</span>
            <span className="text-xs" style={{ color: '#8C8378' }}>{formatDate(post.published_at)}</span>
          </div>
          <h3 className="font-serif text-xl leading-tight mb-2 group-hover:opacity-70 transition-opacity"
            style={{ letterSpacing: '-0.02em' }}>{post.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: '#8C8378' }}>{post.excerpt}</p>
        </div>
        {post.cover_image && (
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#F5F5F5' }}>
            <img src={post.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </div>
    </a>
  );
}

export default function BlogList({ posts }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const featured = useMemo(() => posts.find(p => p.featured), [posts]);
  const filtered = useMemo(() => {
    const list = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);
    // If there's a featured post and we're showing all, remove it from the regular list
    if (featured && activeCategory === 'all') return list.filter(p => p.id !== featured.id);
    return list;
  }, [posts, activeCategory, featured]);

  return (
    <div className="min-h-screen">
      <Header current="blog" />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-serif text-5xl leading-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
            The <span className="italic" style={{ color: ACCENT }}>Journal</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: '#8C8378' }}>
            Guides, editorial picks, and deep dives for the fragrance-obsessed.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-10 pb-6 border-b" style={{ borderColor: '#E8E8E8' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className="text-xs uppercase tracking-widest font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                background: activeCategory === cat.key ? '#1A1A1A' : 'transparent',
                color: activeCategory === cat.key ? '#FAF8F5' : '#8C8378',
                border: `1px solid ${activeCategory === cat.key ? '#1A1A1A' : '#E8E8E8'}`,
              }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured post */}
        {featured && activeCategory === 'all' && <FeaturedPost post={featured} />}

        {/* Post list */}
        {filtered.length > 0 ? (
          <div>
            {filtered.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20" style={{ animation: 'fadeUp 0.4s both' }}>
            <div className="font-serif text-2xl mb-2" style={{ color: '#D8D0C8' }}>Coming soon</div>
            <p className="text-sm" style={{ color: '#8C8378' }}>
              {posts.length === 0
                ? 'Editorial content is on its way. Check back soon.'
                : 'No posts in this category yet.'}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
