'use client';

import { Stars, Tag, PerfumeCard, Header, Footer } from '../../components/shared';
import { NOTE_COLORS, slugify } from '../../lib/constants';

export default function NoteDetail({ noteName, info, matching, inTop, inHeart, inBase, topPaired }) {
  return (
    <div className="min-h-screen bg-paper">
      <Header current="notes" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-fade-up">
          <a href="/notes" className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block no-underline">← All Notes</a>

          {/* Hero */}
          <div className="mb-12">
            <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>{noteName}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {info && <Tag color={
                info.category === 'Floral' ? '#D291BC' : 
                info.category === 'Wood' || info.category === 'Woody' ? '#A18062' : 
                info.category === 'Spice' ? '#C87941' : 
                info.category === 'Citrus' ? '#E8D44D' : 
                info.category === 'Gourmand' ? '#CC8855' :
                info.category === 'Resin' ? '#B5651D' :
                info.category === 'Animalic' ? '#8B7355' :
                info.category === 'Aromatic' ? '#73C27E' : '#8C8378'
              }>{info.category}</Tag>}
              <span className="text-sm text-stone">Found in {matching.length} fragrances</span>
            </div>
          </div>

          {/* Education section */}
          {info && (
            <div className="mb-12 max-w-3xl">
              <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-4 pb-2 border-b border-faint">About {noteName}</h2>
              <p className="text-sm leading-relaxed text-stone mb-4">{info.description}</p>
              {info.origin && (
                <div className="text-xs text-stone">
                  <span className="uppercase tracking-widest font-medium text-ink">Origin: </span>{info.origin}
                </div>
              )}
            </div>
          )}

          {/* Position breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { label: 'As Top Note', count: inTop.length, color: NOTE_COLORS.top },
              { label: 'As Heart Note', count: inHeart.length, color: NOTE_COLORS.heart },
              { label: 'As Base Note', count: inBase.length, color: NOTE_COLORS.base },
            ].map(pos => (
              <div key={pos.label} className="border border-faint p-4 text-center">
                <div className="font-serif text-3xl" style={{ color: pos.color }}>{pos.count}</div>
                <div className="text-xs text-stone mt-1">{pos.label}</div>
              </div>
            ))}
          </div>

          {/* Commonly paired with */}
          {topPaired.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-4 pb-2 border-b border-faint">Often Paired With</h2>
              <div className="flex flex-wrap gap-2">
                {topPaired.map(([note, count]) => (
                  <a key={note} href={`/note/${encodeURIComponent(note)}`}
                    className="px-3 py-1.5 border border-faint text-sm hover:border-ink hover:bg-cream transition-all no-underline text-inherit capitalize">
                    {note} <span className="text-xs text-stone">{count}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Perfumes with this note */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-4 pb-2 border-b border-faint">
              Perfumes featuring {noteName}
            </h2>
            <div className="border-t border-faint">
              {matching.sort((a, b) => (b.rating || 0) - (a.rating || 0)).map(p => (
                <PerfumeCard key={p.id} perfume={p} href={`/perfume/${slugify(p.name, p.brand)}`} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer perfumeCount={matching.length} />
    </div>
  );
}
