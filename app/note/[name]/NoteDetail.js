'use client';

import { Stars, Tag, PerfumeCard, Header, Footer } from '../../components/shared';
import { NOTE_COLORS, slugify } from '../../lib/constants';

export default function NoteDetail({ noteName, info, matching, inTop, inHeart, inBase, topPaired }) {
  const categoryColor = info ? (
    info.category === 'Floral' ? '#D291BC' : 
    info.category === 'Wood' || info.category === 'Woody' ? '#A18062' : 
    info.category === 'Spice' ? '#C87941' : 
    info.category === 'Citrus' ? '#E8D44D' : 
    info.category === 'Gourmand' ? '#CC8855' :
    info.category === 'Resin' ? '#B5651D' :
    info.category === 'Animalic' ? '#8B7355' :
    info.category === 'Aromatic' ? '#73C27E' :
    info.category === 'Fruity' ? '#E07B7B' :
    info.category === 'Green' ? '#73C27E' :
    info.category === 'Aquatic' ? '#6BB3D9' :
    info.category === 'Synthetic' ? '#A9A9A9' : '#8C8378'
  ) : '#8C8378';

  return (
    <div className="min-h-screen bg-paper">
      <Header current="notes" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-fade-up">
          <a href="/notes" className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block no-underline">← All Notes</a>

          {/* Hero with image */}
          <div className="mb-12">
            <div className="flex gap-8 items-start flex-col md:flex-row">
              {info?.image && (
                <div className="flex-shrink-0 w-full md:w-48 h-48 rounded-lg overflow-hidden bg-cream">
                  <img src={info.image} alt={noteName} className="w-full h-full object-cover" loading="eager" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>{noteName}</h1>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  {info && <Tag color={categoryColor}>{info.category}</Tag>}
                  <span className="text-sm text-stone">Found in <span className="font-medium text-ink">{matching.length}</span> fragrances</span>
                </div>
                {info && <p className="text-sm leading-relaxed text-stone mb-4 max-w-2xl">{info.description}</p>}
                {info?.origin && (
                  <div className="text-xs text-stone">
                    <span className="uppercase tracking-widest font-medium text-ink">Origin: </span>{info.origin}
                  </div>
                )}
                {!info && (
                  <p className="text-sm leading-relaxed text-stone">
                    {noteName} is a {matching.length > 50 ? 'widely used' : matching.length > 20 ? 'popular' : matching.length > 5 ? 'distinctive' : 'rare and unique'} fragrance ingredient, appearing in {matching.length} perfume{matching.length !== 1 ? 's' : ''} in our directory.
                    {inBase.length > inTop.length ? ` It's most commonly used as a base note, providing lasting depth and character.` : 
                     inTop.length > inHeart.length ? ` It's most commonly used as a top note, creating an immediate first impression.` : 
                     inHeart.length > 0 ? ` It's most commonly used as a heart note, forming the core character of a fragrance.` : ''}
                    {' '}Explore the perfumes below to discover how this note is used by different houses and perfumers.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scent Profile Cards — Smells Like, Role, Pairs With */}
          {info && (info.smells_like || info.role || info.pairs_with) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {info.smells_like && (
                <div className="border border-faint p-5">
                  <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3 pb-2 border-b border-faint flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>👃</span> Smells Like
                  </div>
                  <p className="text-sm text-stone leading-relaxed">{info.smells_like}</p>
                </div>
              )}
              {info.role && (
                <div className="border border-faint p-5">
                  <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3 pb-2 border-b border-faint flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>🧪</span> Role in Perfumery
                  </div>
                  <p className="text-sm text-stone leading-relaxed">{info.role}</p>
                </div>
              )}
              {info.pairs_with && (
                <div className="border border-faint p-5">
                  <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3 pb-2 border-b border-faint flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>🤝</span> Pairs Well With
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {info.pairs_with.split(',').map(n => n.trim()).filter(Boolean).map(note => (
                      <a key={note} href={`/note/${encodeURIComponent(note.toLowerCase())}`}
                        className="px-2 py-1 border border-faint text-xs hover:border-ink hover:bg-cream transition-all no-underline text-stone capitalize">
                        {note}
                      </a>
                    ))}
                  </div>
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
