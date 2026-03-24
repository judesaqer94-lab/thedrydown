'use client';

import { useState } from 'react';
import { Header, Footer } from '../components/shared';

export default function NotesExplorer({ notes }) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? notes.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : notes;

  return (
    <div className="min-h-screen bg-paper">
      <Header current="notes" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-fade-up">
          <div className="mb-10 pt-4">
            <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
              Notes<br /><span className="italic" style={{ color: '#9B8EC4' }}>Explorer</span>
            </h1>
            <p className="text-sm text-stone mt-3">{notes.length} unique notes · Click any note to learn more</p>
          </div>

          {/* Search */}
          <div className="border border-ink rounded-lg px-5 py-3 mb-8 flex items-center gap-3 bg-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8378" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-stone/40" />
            {search && <button onClick={() => setSearch('')} className="text-stone hover:text-ink text-sm transition-colors">Clear</button>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filtered.map(n => (
              <a key={n.name} href={`/note/${encodeURIComponent(n.name.toLowerCase())}`}
                className="px-3 py-1.5 border border-faint text-sm cursor-pointer hover:border-ink hover:bg-cream transition-all no-underline text-inherit">
                {n.name} <span className="text-xs text-stone">{n.count}</span>
              </a>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-stone font-serif text-2xl italic">No notes found</div>
          )}
        </div>
      </main>

      <Footer perfumeCount={notes.length + ' notes'} />
    </div>
  );
}
