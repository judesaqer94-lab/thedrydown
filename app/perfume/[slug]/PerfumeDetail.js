'use client';

import { useState, useCallback } from 'react';
import { Stars, Tag, PerfumeCard, Header, Footer } from '../../components/shared';
import { FAMILY_COLORS, TYPE_COLORS, NOTE_COLORS, NOTE_LABELS, ACCORD_COLORS, RETAILERS, slugify } from '../../lib/constants';
import { supabase } from '../../../lib/supabase';

export default function PerfumeDetail({ perfume, similar, reviews: initialReviews }) {
  const [reviews] = useState(initialReviews);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const submitVote = useCallback(async (perfumeName, voteType, voteValue) => {
    try {
      await supabase.from('votes').insert({ perfume_name: perfumeName, vote_type: voteType, vote_value: voteValue });
      showToast(`Vote recorded!`);
    } catch (e) { console.error(e); }
  }, [showToast]);

  // Parse notes
  const parseNotes = (notesStr) => (notesStr || '').split(',').map(n => n.trim()).filter(Boolean);
  const topNotes = parseNotes(perfume.top_notes);
  const heartNotes = parseNotes(perfume.heart_notes);
  const baseNotes = parseNotes(perfume.base_notes);
  const accords = parseNotes(perfume.main_accords);

  // Parse accord percentages if available
  let accordPercentages = {};
  try { accordPercentages = perfume.accord_percentages ? JSON.parse(perfume.accord_percentages) : {}; } catch {}

  // Parse season ranking if available
  let seasons = [];
  try { seasons = perfume.season_ranking ? JSON.parse(perfume.season_ranking) : []; } catch {}

  // Parse occasion ranking if available  
  let occasions = [];
  try { occasions = perfume.occasion_ranking ? JSON.parse(perfume.occasion_ranking) : []; } catch {}

  const bt = perfume.brand_type;

  // Map accord level to percentage
  const accordLevelToWidth = (level) => {
    if (typeof level === 'string') {
      const map = { 'Dominant': 90, 'Prominent': 70, 'Moderate': 50, 'Light': 30, 'Subtle': 20 };
      return map[level] || 40;
    }
    return 50;
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header current="directory" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-paper px-5 py-3 text-sm animate-slide-up">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-fade-up">
          <a href="/" className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block no-underline">← Back to Directory</a>

          {/* Hero */}
          <div className="mb-12">
            <div className="flex gap-6 items-start">
              {perfume.image_url && (
                <div className="flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden bg-cream">
                  <img src={perfume.image_url} alt={perfume.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Tag color={FAMILY_COLORS[perfume.family]}>{perfume.family}</Tag>
                  <Tag>{perfume.concentration}</Tag>
                  <Tag>{perfume.gender}</Tag>
                  {bt && <Tag color={TYPE_COLORS[bt]}>{bt}</Tag>}
                  <Tag>{perfume.year}</Tag>
                </div>
                <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>{perfume.name}</h1>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <a href={`/brand/${perfume.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-lg text-stone hover:text-ink transition-colors no-underline" style={{ borderBottom: '1px solid #D8D0C8' }}>{perfume.brand}</a>
                  <span className="text-stone">·</span>
                  <span className="font-serif text-2xl">AED {perfume.price_low}{perfume.price_high !== perfume.price_low && `–${perfume.price_high}`}</span>
                  <span className="text-stone">·</span>
                  <Stars value={perfume.rating} size={16} />
                </div>
                {/* Longevity & Sillage badges */}
                {(perfume.longevity || perfume.sillage) && (
                  <div className="flex gap-3 mt-4">
                    {perfume.longevity && <Tag>{`Longevity: ${perfume.longevity}`}</Tag>}
                    {perfume.sillage && <Tag>{`Sillage: ${perfume.sillage}`}</Tag>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two-column: Accords + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Accords */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6 pb-2 border-b border-faint">Main Accords</h2>
              {accords.map((a, i) => {
                const ac = ACCORD_COLORS[a.toLowerCase()] || `hsl(${a.length * 37 % 360},40%,45%)`;
                const width = accordPercentages[a] ? accordLevelToWidth(accordPercentages[a]) : Math.max(30, 90 - i * 12);
                return (
                  <div key={a} className="flex items-center gap-3 mb-3">
                    <div className="w-28 text-xs text-stone text-right capitalize flex-shrink-0">{a}</div>
                    <div className="flex-1 h-2 bg-cream overflow-hidden">
                      <div className="h-full bar-fill" style={{ width: `${width}%`, background: ac }} />
                    </div>
                    {accordPercentages[a] && (
                      <div className="w-16 text-[10px] text-stone">{accordPercentages[a]}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6 pb-2 border-b border-faint">Fragrance Notes</h2>
              {[
                { key: 'top', notes: topNotes },
                { key: 'heart', notes: heartNotes },
                { key: 'base', notes: baseNotes },
              ].map(group => group.notes.length > 0 && (
                <div key={group.key} className="mb-5">
                  <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: NOTE_COLORS[group.key] }}>
                    {NOTE_LABELS[group.key]}
                  </div>
                  {group.notes.map((n, i) => {
                    const strength = group.key === 'top' ? 70 + (i * 7) % 25 : group.key === 'heart' ? 55 + (i * 5) % 30 : 50 + (i * 3) % 35;
                    return (
                      <a key={n} href={`/note/${encodeURIComponent(n.toLowerCase())}`} className="flex items-center gap-3 mb-2 no-underline text-inherit hover:opacity-80 transition-opacity">
                        <div className="w-28 text-xs text-stone text-right truncate flex-shrink-0">{n}</div>
                        <div className="flex-1 h-2 bg-cream overflow-hidden">
                          <div className="h-full bar-fill" style={{ width: `${strength}%`, background: NOTE_COLORS[group.key] }} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Seasons & Occasions (if available from API) */}
          {(seasons.length > 0 || occasions.length > 0) && (
            <div className="border-t border-faint pt-10 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {seasons.length > 0 && (
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Best Seasons</h2>
                    <div className="grid grid-cols-4 gap-3">
                      {seasons.sort((a, b) => b.score - a.score).map(s => {
                        const colors = { fall: '#C4956B', winter: '#4A7090', spring: '#A0657B', summer: '#D4A060', autumn: '#C4956B' };
                        const pct = Math.round(s.score / 3 * 100);
                        return (
                          <div key={s.name} className="text-center py-3 border border-faint">
                            <div className="text-xs font-medium mb-2 capitalize" style={{ color: colors[s.name] || '#8C8378' }}>{s.name}</div>
                            <div className="mx-auto w-8 h-1 bg-cream overflow-hidden">
                              <div className="h-full" style={{ width: `${pct}%`, background: colors[s.name] || '#8C8378' }} />
                            </div>
                            <div className="text-[10px] text-stone mt-1">{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {occasions.length > 0 && (
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Best Occasions</h2>
                    {occasions.sort((a, b) => b.score - a.score).map(o => (
                      <div key={o.name} className="flex items-center gap-3 mb-3">
                        <div className="w-24 text-xs text-stone text-right capitalize flex-shrink-0">{o.name}</div>
                        <div className="flex-1 h-2 bg-cream overflow-hidden">
                          <div className="h-full bar-fill" style={{ width: `${Math.round(o.score / 2 * 100)}%`, background: '#9B8EC4' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Community */}
          <div className="border-t border-faint pt-10 mb-12">
            <h2 className="font-serif text-3xl mb-8">Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {/* Rating */}
              <div>
                <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Rating</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl">{perfume.rating}</span>
                  <span className="text-stone text-sm">/ 5</span>
                </div>
                <div className="mt-2"><Stars value={perfume.rating} size={16} /></div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-stone">Rate:</span>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={() => { submitVote(perfume.name, 'rating', String(s)); showToast(`Rated ${perfume.name} ${s}/5`); }}
                      className="cursor-pointer text-lg hover:scale-110 transition-transform" style={{ color: '#9B8EC4' }}>★</span>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Gender Leaning</div>
                <div className="flex gap-2 mt-4">
                  {[["Feminine", "#A0657B"], ["Unisex", "#C4A882"], ["Masculine", "#4A7090"]].map(([label, color]) => (
                    <button key={label} onClick={() => submitVote(perfume.name, 'gender', label)}
                      className="flex-1 py-2 text-xs font-medium border border-faint hover:border-stone transition-colors" style={{ color }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Day/Night */}
              <div>
                <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Day or Night</div>
                <div className="flex gap-2 mt-4">
                  {[["Day", "#D4A060"], ["Night", "#2C3E6B"]].map(([label, color]) => (
                    <button key={label} onClick={() => submitVote(perfume.name, 'daynight', label)}
                      className="flex-1 py-2 text-xs font-medium border border-faint hover:border-stone transition-colors" style={{ color }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Performance</div>
                <div className="space-y-4">
                  {[
                    { label: "Sillage", value: perfume.sillage, levels: ["Intimate", "Moderate", "Strong", "Beast"] },
                    { label: "Longevity", value: perfume.longevity, levels: ["Weak", "Moderate", "Long Lasting", "Beast"] },
                  ].map(perf => {
                    const idx = perf.value ? perf.levels.findIndex(l => l.toLowerCase() === (perf.value || '').toLowerCase()) : -1;
                    const activeIdx = idx >= 0 ? idx : 2;
                    return (
                      <div key={perf.label}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-stone">{perf.label}</span>
                          <span className="font-medium">{perf.value || perf.levels[activeIdx]}</span>
                        </div>
                        <div className="flex gap-1">
                          {perf.levels.map((l, i) => (
                            <div key={l} className="flex-1 h-1.5" style={{ background: i <= activeIdx ? '#9B8EC4' : '#EDE7DF' }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Where to Buy */}
          <div className="border-t border-faint pt-10 mb-12">
            <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Where to Buy</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {RETAILERS.map(r => (
                <a key={r.name} href={r.url.replace("Q", encodeURIComponent(perfume.name + " " + perfume.brand))} target="_blank" rel="noopener noreferrer"
                  className="text-center py-3 border border-faint hover:border-ink transition-colors no-underline text-inherit">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-[10px] text-stone mt-0.5">{r.tag}</div>
                </a>
              ))}
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="border-t border-faint pt-10 mb-12">
              <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Reviews</h2>
              {reviews.map((rv, i) => (
                <div key={i} className="border-b border-faint py-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cream flex items-center justify-center text-sm font-medium text-stone">{(rv.user || "A")[0]}</div>
                      <div><div className="text-sm font-medium">{rv.user}</div><div className="text-xs text-stone">{rv.date || rv.created_at}</div></div>
                    </div>
                    <Stars value={rv.rating} size={12} />
                  </div>
                  <div className="text-sm font-medium mb-1">{rv.title}</div>
                  <p className="text-sm text-stone leading-relaxed">{rv.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Similar */}
          <div className="border-t border-faint pt-10">
            <h2 className="font-serif text-3xl mb-6">You Might Also Like</h2>
            <div className="border-t border-faint">
              {similar.map(p => (
                <PerfumeCard key={p.id} perfume={p} href={`/perfume/${slugify(p.name, p.brand)}`} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
