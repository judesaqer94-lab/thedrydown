'use client';

import { useState } from 'react';
import { Header, Footer, PerfumeCard } from '../components/shared';
import { TYPE_COLORS, slugify } from '../lib/constants';

export default function BrandsExplorer({ brands }) {
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands;

  const types = ["Arabic", "Niche", "Designer", "Indie", "Affordable", "Celebrity", "Unknown"];

  if (selectedBrand) {
    return (
      <div className="min-h-screen bg-paper">
        <Header current="brands" />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="animate-fade-up">
            <button onClick={() => setSelectedBrand(null)} className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block cursor-pointer" style={{ background: 'none', border: 'none' }}>← All Brands</button>
            <div className="mb-8">
              <h1 className="font-serif text-4xl mb-2">{selectedBrand.name}</h1>
              <div className="flex items-center gap-3">
                <span className="inline-block text-xs tracking-wide uppercase px-2 py-1 border" style={{ borderColor: TYPE_COLORS[selectedBrand.type] || '#D8D0C8', color: TYPE_COLORS[selectedBrand.type] || '#8C8378' }}>{selectedBrand.type}</span>
                <span className="text-sm text-stone">{selectedBrand.count} fragrances</span>
              </div>
            </div>
            <div className="border-t border-faint">
              {selectedBrand.perfumes.map(p => (
                <PerfumeCard key={p.name} perfume={p} href={`/perfume/${slugify(p.name, p.brand)}`} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header current="brands" />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-fade-up">
          <div className="mb-10 pt-4">
            <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
              Brand<br /><span className="italic" style={{ color: '#9B8EC4' }}>Directory</span>
            </h1>
            <p className="text-sm text-stone mt-3">{brands.length} brands</p>
          </div>

          {/* Search */}
          <div className="border-b border-ink pb-2 mb-8 flex items-center gap-3">
            <span className="text-stone text-sm">Search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a brand..." className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-faint" />
            {search && <button onClick={() => setSearch('')} className="text-stone hover:text-ink text-sm transition-colors">Clear</button>}
          </div>

          {types.map(type => {
            const bs = filtered.filter(b => b.type === type);
            if (!bs.length) return null;
            return (
              <div key={type} className="mb-10">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-faint">
                  <h2 className="text-xs uppercase tracking-widest font-medium" style={{ color: TYPE_COLORS[type] || "#8C8378" }}>{type}</h2>
                  <span className="text-xs text-stone">{bs.length} brands</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint">
                  {bs.map(b => (
                    <div key={b.name} onClick={() => setSelectedBrand(b)} className="bg-paper p-4 cursor-pointer hover:bg-cream transition-colors">
                      <div className="text-sm font-medium">{b.name}</div>
                      <div className="text-xs text-stone mt-1">{b.count} fragrances</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
