'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Header, Footer, Tag } from '../components/shared';
import { ACCENT, ACCORD_COLORS, NOTE_COLORS, FAMILY_COLORS, slugify } from '../lib/constants';

/* ═══ HELPERS ═══ */
const parseCSV = (str) => (str || '').split(',').map(s => s.trim()).filter(Boolean);
const parseJSON = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
};

const LEVEL_TO_WIDTH = { 'Dominant': 90, 'Prominent': 70, 'Moderate': 50, 'Light': 30 };
const SEASON_ICONS = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' };
const OCCASION_ICONS = { casual: '👕', professional: '💼', 'night out': '🌙' };

/* ═══ PERFUME PICKER ═══ */
function PerfumeSearch({ perfumes, selected, onSelect, onClear, label }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return perfumes.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0, 8);
  }, [query, perfumes]);

  if (selected) {
    const fc = FAMILY_COLORS[selected.family] || '#8C8378';
    return (
      <div className="relative animate-fade-up">
        <div className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: ACCENT }}>{label}</div>
        <div className="p-5 rounded-lg border" style={{ borderColor: ACCENT + '40', background: ACCENT + '06' }}>
          <div className="flex items-start gap-4">
            {selected.image_url && (
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-faint">
                <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>{selected.name}</h3>
              <div className="text-sm mt-1" style={{ color: '#8C8378' }}>{selected.brand}</div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <Tag color={fc}>{selected.family}</Tag>
                <Tag>{selected.concentration}</Tag>
              </div>
            </div>
            <button onClick={onClear}
              className="text-xs uppercase tracking-widest font-medium px-3 py-1.5 rounded transition-all hover:bg-ink hover:text-paper"
              style={{ color: '#8C8378', border: '1px solid #D8D0C8' }}>
              Change
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: ACCENT }}>{label}</div>
      <input type="text" value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or brand..."
        className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
        style={{ borderColor: open && results.length ? ACCENT : '#D8D0C8', boxShadow: open && results.length ? `0 0 0 3px ${ACCENT}20` : 'none' }}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border overflow-hidden"
          style={{ borderColor: '#E8E8E8', background: '#FFF', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
          {results.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setQuery(''); setOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-faint border-b last:border-b-0"
              style={{ borderColor: '#F5F5F5' }}>
              {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs" style={{ color: '#8C8378' }}>{p.brand} · {p.family}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ COMBINED PROFILE ENGINE ═══ 
 * No fake scores. This just shows what the merged scent profile looks like.
 */
function buildCombinedProfile(a, b) {
  const accordsA = parseCSV(a.main_accords);
  const accordsB = parseCSV(b.main_accords);
  const pctsA = parseJSON(a.accord_percentages) || {};
  const pctsB = parseJSON(b.accord_percentages) || {};

  // Merge accords — show where each comes from
  const allAccords = [...new Set([...accordsA, ...accordsB])];
  const accords = allAccords.map(name => {
    const inA = accordsA.map(x => x.toLowerCase()).includes(name.toLowerCase());
    const inB = accordsB.map(x => x.toLowerCase()).includes(name.toLowerCase());
    const widthA = LEVEL_TO_WIDTH[pctsA[name]] || (inA ? 40 : 0);
    const widthB = LEVEL_TO_WIDTH[pctsB[name]] || (inB ? 40 : 0);
    // The combined bar shows the average if shared, or the single value if unique
    const combinedWidth = inA && inB ? Math.round((widthA + widthB) / 2) : Math.max(widthA, widthB);
    return { name, widthA, widthB, combinedWidth, inA, inB, shared: inA && inB };
  }).sort((a, b) => b.combinedWidth - a.combinedWidth);

  // Notes
  const mergeNotes = (strA, strB) => {
    const a = parseCSV(strA);
    const b = parseCSV(strB);
    const all = [...new Set([...a, ...b])];
    return all.map(n => ({
      name: n,
      inA: a.map(x => x.toLowerCase()).includes(n.toLowerCase()),
      inB: b.map(x => x.toLowerCase()).includes(n.toLowerCase()),
      shared: a.map(x => x.toLowerCase()).includes(n.toLowerCase()) && b.map(x => x.toLowerCase()).includes(n.toLowerCase()),
    }));
  };

  // Seasons — side by side, not averaged
  const seasonsA = parseJSON(a.season_ranking) || [];
  const seasonsB = parseJSON(b.season_ranking) || [];
  const seasonNames = [...new Set([...seasonsA.map(s => s.name), ...seasonsB.map(s => s.name)])];
  const seasons = seasonNames.map(name => ({
    name,
    scoreA: seasonsA.find(s => s.name === name)?.score || 0,
    scoreB: seasonsB.find(s => s.name === name)?.score || 0,
  }));

  // Occasions
  const occasionsA = parseJSON(a.occasion_ranking) || [];
  const occasionsB = parseJSON(b.occasion_ranking) || [];
  const occasionNames = [...new Set([...occasionsA.map(o => o.name), ...occasionsB.map(o => o.name)])];
  const occasions = occasionNames.map(name => ({
    name,
    scoreA: occasionsA.find(o => o.name === name)?.score || 0,
    scoreB: occasionsB.find(o => o.name === name)?.score || 0,
  }));

  return {
    accords,
    notes: {
      top: mergeNotes(a.top_notes, b.top_notes),
      heart: mergeNotes(a.heart_notes, b.heart_notes),
      base: mergeNotes(a.base_notes, b.base_notes),
    },
    seasons,
    occasions,
    sharedAccordCount: accords.filter(a => a.shared).length,
    totalAccords: accords.length,
  };
}

/* ═══ COMBINED PROFILE VIEW ═══ */
function CombinedProfile({ perfA, perfB, profile }) {
  return (
    <div className="animate-fade-up">
      {/* Shared accords summary */}
      <div className="text-center mb-8 py-4">
        <div className="text-sm" style={{ color: '#8C8378' }}>
          {profile.sharedAccordCount} of {profile.totalAccords} accords are shared between these two
        </div>
      </div>

      {/* Accord comparison */}
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Accord comparison</h3>
        <p className="text-xs mb-5" style={{ color: '#8C8378' }}>
          Side-by-side accord strengths — shared accords will be amplified when layered
        </p>
        
        {/* Legend */}
        <div className="flex items-center gap-5 mb-4 text-xs" style={{ color: '#8C8378' }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: ACCENT }} />
            {perfA.name}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#D4915B' }} />
            {perfB.name}
          </span>
        </div>

        <div className="space-y-3">
          {profile.accords.slice(0, 12).map((a, i) => (
            <div key={a.name} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-28 text-right text-xs capitalize flex-shrink-0 truncate" style={{ color: a.shared ? '#1A1A1A' : '#8C8378' }}>
                  {a.name}
                  {a.shared && <span className="ml-1" style={{ color: '#7EC8A0', fontSize: 10 }}>●</span>}
                </div>
                <div className="flex-1 space-y-0.5">
                  {/* Perfume A bar */}
                  {a.inA && (
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F5F5F5' }}>
                      <div className="h-full rounded-full bar-fill" style={{ width: `${a.widthA}%`, background: ACCORD_COLORS[a.name] || ACCENT, opacity: 0.7 }} />
                    </div>
                  )}
                  {/* Perfume B bar */}
                  {a.inB && (
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F5F5F5' }}>
                      <div className="h-full rounded-full bar-fill" style={{ width: `${a.widthB}%`, background: ACCORD_COLORS[a.name] || '#D4915B', opacity: 0.45 }} />
                    </div>
                  )}
                </div>
                <div className="w-14 flex-shrink-0 text-right">
                  {a.shared ? (
                    <span className="text-xs font-medium" style={{ color: '#7EC8A0' }}>shared</span>
                  ) : a.inA ? (
                    <span className="text-xs" style={{ color: ACCENT }}>A only</span>
                  ) : (
                    <span className="text-xs" style={{ color: '#D4915B' }}>B only</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-5" style={{ letterSpacing: '-0.02em' }}>Combined notes</h3>
        {['top', 'heart', 'base'].map(layer => {
          const notes = profile.notes[layer];
          if (!notes.length) return null;
          return (
            <div key={layer} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: NOTE_COLORS[layer] }} />
                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: NOTE_COLORS[layer] }}>
                  {layer} notes
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {notes.map(n => (
                  <a key={n.name} href={`/note/${n.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all no-underline"
                    style={{
                      borderColor: n.shared ? '#7EC8A040' : '#E8E8E8',
                      background: n.shared ? '#7EC8A008' : 'transparent',
                      color: '#1A1A1A',
                    }}>
                    {n.name}
                    {n.shared && <span style={{ color: '#7EC8A0', fontSize: 10 }}>✦</span>}
                    {!n.shared && <span className="text-xs" style={{ color: n.inA ? ACCENT : '#D4915B', fontSize: 9, opacity: 0.7 }}>{n.inA ? 'A' : 'B'}</span>}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seasons — side by side */}
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-4" style={{ letterSpacing: '-0.02em' }}>Seasonal overlap</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {profile.seasons.map(s => {
            const max = Math.max(...profile.seasons.map(x => Math.max(x.scoreA, x.scoreB)), 0.01);
            const agree = Math.abs(s.scoreA - s.scoreB) < 0.8;
            return (
              <div key={s.name} className="text-center p-4 rounded-lg border" style={{ borderColor: agree ? '#7EC8A030' : '#E8E8E8' }}>
                <div className="text-xl mb-2">{SEASON_ICONS[s.name] || '🌍'}</div>
                <div className="text-xs capitalize font-medium mb-2">{s.name}</div>
                <div className="flex justify-center gap-2 text-xs">
                  <span style={{ color: ACCENT }}>{s.scoreA.toFixed(1)}</span>
                  <span style={{ color: '#D8D0C8' }}>/</span>
                  <span style={{ color: '#D4915B' }}>{s.scoreB.toFixed(1)}</span>
                </div>
                {agree && s.scoreA > 1.5 && (
                  <div className="text-xs mt-1 font-medium" style={{ color: '#7EC8A0' }}>aligned</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ AI ANALYSIS SECTION ═══ */
function AIAnalysis({ perfA, perfB }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/layering-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeA: perfA, perfumeB: perfB }),
      });
      if (!res.ok) {
        const msg = res.status === 503 ? 'AI analysis is not configured yet. Add your ANTHROPIC_API_KEY to Vercel environment variables.' : 'Could not generate analysis. Try again.';
        throw new Error(msg);
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [perfA, perfB]);

  if (!analysis && !loading && !error) {
    return (
      <div className="mb-10 p-6 rounded-lg border text-center" style={{ borderColor: ACCENT + '25', background: ACCENT + '04' }}>
        <div className="font-serif text-xl mb-2" style={{ letterSpacing: '-0.02em' }}>Want a deeper take?</div>
        <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: '#8C8378' }}>
          Get an AI-powered analysis of this combination — how it would smell, when to wear it, and what to watch out for.
        </p>
        <button onClick={fetchAnalysis}
          className="text-xs uppercase tracking-widest font-medium px-6 py-2.5 rounded transition-all hover:opacity-80"
          style={{ background: '#1A1A1A', color: '#FAF8F5' }}>
          Analyze this layer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-10 p-8 rounded-lg border text-center" style={{ borderColor: '#E8E8E8' }}>
        <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-3" style={{ borderColor: '#E8E8E8', borderTopColor: ACCENT }} />
        <div className="text-sm" style={{ color: '#8C8378' }}>Analyzing these two fragrances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10 p-5 rounded-lg border" style={{ borderColor: '#E07B7B30', background: '#E07B7B06' }}>
        <p className="text-sm" style={{ color: '#E07B7B' }}>{error}</p>
        <button onClick={fetchAnalysis} className="text-xs underline mt-2" style={{ color: '#8C8378' }}>Try again</button>
      </div>
    );
  }

  return (
    <div className="mb-10 animate-fade-up">
      <h3 className="font-serif text-2xl mb-5" style={{ letterSpacing: '-0.02em' }}>AI analysis</h3>
      <div className="space-y-4">
        {/* Verdict */}
        <div className="p-5 rounded-lg border" style={{ borderColor: ACCENT + '30', background: ACCENT + '05' }}>
          <div className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: ACCENT }}>Verdict</div>
          <div className="font-serif text-xl" style={{ letterSpacing: '-0.02em' }}>{analysis.verdict}</div>
        </div>

        {/* Why it works */}
        {analysis.whyItWorks && (
          <div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}>
            <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>Why it works</div>
            <p className="text-sm leading-relaxed">{analysis.whyItWorks}</p>
          </div>
        )}

        {/* The blend */}
        {analysis.theBlend && (
          <div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}>
            <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>What it smells like</div>
            <p className="text-sm leading-relaxed font-serif italic" style={{ color: '#555' }}>{analysis.theBlend}</p>
          </div>
        )}

        {/* How to wear + Best for */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.howToWear && (
            <div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}>
              <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>How to wear</div>
              <p className="text-sm leading-relaxed">{analysis.howToWear}</p>
            </div>
          )}
          {analysis.bestFor && (
            <div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}>
              <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>Best for</div>
              <p className="text-sm leading-relaxed">{analysis.bestFor}</p>
            </div>
          )}
        </div>

        {/* Watch out */}
        {analysis.watchOut && (
          <div className="p-4 rounded-lg border" style={{ borderColor: '#D4915B25', background: '#D4915B06' }}>
            <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#D4915B' }}>Watch out for</div>
            <p className="text-sm leading-relaxed">{analysis.watchOut}</p>
          </div>
        )}
      </div>
      <div className="text-xs mt-3 text-center" style={{ color: '#D8D0C8' }}>Analysis generated by AI — your nose is the final judge</div>
    </div>
  );
}

/* ═══ COMMUNITY SUBMISSIONS ═══ */
function CommunitySection({ perfA, perfB }) {
  const [combos, setCombos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', review: '', rating: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Load community combos for this pair
  useEffect(() => {
    if (!perfA || !perfB) return;
    fetch(`/api/layering-combos?perfumeA=${perfA.id}&perfumeB=${perfB.id}`)
      .then(r => r.json())
      .then(d => { setCombos(d.combos || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [perfA, perfB]);

  const submitCombo = useCallback(async () => {
    if (!form.review.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/layering-combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeAId: perfA.id, perfumeBId: perfB.id,
          submittedBy: form.name || 'Anonymous',
          review: form.review,
          rating: form.rating,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast('Submitted! Your combo will appear after review.');
        setShowForm(false);
        setForm({ name: '', review: '', rating: 4 });
      } else {
        setToast(data.error || 'Could not submit');
      }
    } catch { setToast('Something went wrong'); }
    setSubmitting(false);
    setTimeout(() => setToast(null), 3000);
  }, [form, perfA, perfB]);

  const vote = useCallback(async (comboId, direction) => {
    try {
      await fetch('/api/layering-combos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comboId, vote: direction }),
      });
      setCombos(prev => prev.map(c => c.id === comboId ? { ...c, [direction === 'up' ? 'upvotes' : 'downvotes']: (c[direction === 'up' ? 'upvotes' : 'downvotes'] || 0) + 1 } : c));
    } catch {}
  }, []);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-2xl" style={{ letterSpacing: '-0.02em' }}>Community reviews</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs uppercase tracking-widest font-medium px-4 py-2 rounded transition-all"
          style={{ background: showForm ? '#E8E8E8' : '#1A1A1A', color: showForm ? '#1A1A1A' : '#FAF8F5' }}>
          {showForm ? 'Cancel' : 'Tried this layer?'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 p-3 rounded-lg text-center text-sm animate-slide-up" style={{ background: '#7EC8A015', color: '#5BA87D', border: '1px solid #7EC8A030' }}>
          {toast}
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-lg border animate-fade-up" style={{ borderColor: '#E8E8E8' }}>
          <div className="mb-4">
            <label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>Your name (optional)</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Anonymous" maxLength={50}
              className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ borderColor: '#E8E8E8' }} />
          </div>
          <div className="mb-4">
            <label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>How was this combination?</label>
            <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
              placeholder="How did you wear it? What did it smell like? Would you recommend it?"
              maxLength={500} rows={3}
              className="w-full px-3 py-2 rounded border text-sm outline-none resize-none" style={{ borderColor: '#E8E8E8' }} />
          </div>
          <div className="mb-4">
            <label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className="text-lg transition-transform hover:scale-110"
                  style={{ color: n <= form.rating ? ACCENT : '#D8D0C8' }}>★</button>
              ))}
            </div>
          </div>
          <button onClick={submitCombo} disabled={submitting || !form.review.trim()}
            className="text-xs uppercase tracking-widest font-medium px-5 py-2 rounded transition-all disabled:opacity-50"
            style={{ background: '#1A1A1A', color: '#FAF8F5' }}>
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </div>
      )}

      {/* Existing combos */}
      {combos.length > 0 ? (
        <div className="space-y-4">
          {combos.map(c => (
            <div key={c.id} className="p-4 rounded-lg border" style={{ borderColor: '#F0F0F0' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.submitted_by || 'Anonymous'}</span>
                  <span style={{ color: ACCENT, fontSize: 12 }}>{"★".repeat(c.rating || 4)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button onClick={() => vote(c.id, 'up')} className="flex items-center gap-1 transition-colors hover:text-ink" style={{ color: '#8C8378' }}>
                    ▲ {c.upvotes || 0}
                  </button>
                  <button onClick={() => vote(c.id, 'down')} className="flex items-center gap-1 transition-colors hover:text-ink" style={{ color: '#8C8378' }}>
                    ▼ {c.downvotes || 0}
                  </button>
                </div>
              </div>
              {c.review && <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{c.review}</p>}
            </div>
          ))}
        </div>
      ) : loaded ? (
        <div className="text-center py-8" style={{ color: '#D8D0C8' }}>
          <p className="text-sm">No community reviews for this combo yet.</p>
          {!showForm && <p className="text-xs mt-1">Be the first — click "Tried this layer?" above.</p>}
        </div>
      ) : null}
    </div>
  );
}

/* ═══ POPULAR COMBOS ═══ */
const POPULAR_COMBOS = [
  { a: 'Baccarat Rouge 540', brandA: 'Maison Francis', b: 'Cloud', brandB: 'Ariana Grande', why: 'The viral TikTok layer — sweet, airy, cozy' },
  { a: 'Oud Wood', brandA: 'Tom Ford', b: 'Velvet Orchid', brandB: 'Tom Ford', why: 'Dark florals meet smoky wood — evening royalty' },
  { a: 'Delina', brandA: 'Parfums de Marly', b: 'La Rosée', brandB: 'Lattafa', why: 'Double down on rose-lychee — triple the compliments' },
  { a: 'Khamrah', brandA: 'Lattafa', b: "Angels' Share", brandB: 'Kilian', why: 'Boozy, warm, gourmand — winter beast mode' },
  { a: 'Bleu de Chanel', brandA: 'Chanel', b: 'Sauvage', brandB: 'Dior', why: 'Fresh + fresh = the ultimate clean scent' },
  { a: 'Black Opium', brandA: 'Yves Saint Laurent', b: 'Vanilla Fatale', brandB: 'Tom Ford', why: 'Coffee meets dark vanilla — addictive' },
];

/* ═══ MAIN COMPONENT ═══ */
export default function LayeringLab({ perfumes }) {
  const [perfA, setPerfA] = useState(null);
  const [perfB, setPerfB] = useState(null);

  const profile = useMemo(() => {
    if (!perfA || !perfB) return null;
    return buildCombinedProfile(perfA, perfB);
  }, [perfA, perfB]);

  const handleCombo = useCallback((combo) => {
    const a = perfumes.find(p => p.name === combo.a && p.brand === combo.brandA);
    const b = perfumes.find(p => p.name === combo.b && p.brand === combo.brandB);
    if (a && b) { setPerfA(a); setPerfB(b); }
  }, [perfumes]);

  const handleSwap = useCallback(() => { setPerfA(perfB); setPerfB(perfA); }, [perfA, perfB]);

  return (
    <div className="min-h-screen">
      <Header current="layering" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <a href="/" className="text-xs uppercase tracking-widest inline-block mb-6 no-underline transition-all" style={{ color: '#8C8378' }}>← Back to Directory</a>
          <h1 className="font-serif text-5xl leading-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
            Layering <span className="italic" style={{ color: ACCENT }}>Lab</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: '#8C8378' }}>
            Pick two fragrances and see how they layer. Compare accords side-by-side, get an AI analysis, and read real community reviews.
          </p>
        </div>

        {/* Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <PerfumeSearch perfumes={perfumes.filter(p => p.id !== perfB?.id)} selected={perfA} onSelect={setPerfA} onClear={() => setPerfA(null)} label="Perfume A — Base layer" />
          <PerfumeSearch perfumes={perfumes.filter(p => p.id !== perfA?.id)} selected={perfB} onSelect={setPerfB} onClear={() => setPerfB(null)} label="Perfume B — Top layer" />
        </div>

        {/* Swap */}
        {perfA && perfB && (
          <div className="flex justify-center mb-10">
            <button onClick={handleSwap} className="text-xs uppercase tracking-widest font-medium px-4 py-2 rounded-full border transition-all hover:bg-ink hover:text-paper" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>
              ⇄ Swap layers
            </button>
          </div>
        )}

        {/* LAYER 1: Combined profile */}
        {profile && <CombinedProfile perfA={perfA} perfB={perfB} profile={profile} />}

        {/* LAYER 2: AI analysis */}
        {perfA && perfB && <AIAnalysis perfA={perfA} perfB={perfB} />}

        {/* LAYER 3: Community reviews */}
        {perfA && perfB && <CommunitySection perfA={perfA} perfB={perfB} />}

        {/* View individual perfumes */}
        {perfA && perfB && (
          <div className="flex gap-4 mt-6">
            <a href={`/perfume/${slugify(perfA.name, perfA.brand)}`}
              className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 rounded border transition-all no-underline hover:bg-faint" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>
              View {perfA.name} →
            </a>
            <a href={`/perfume/${slugify(perfB.name, perfB.brand)}`}
              className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 rounded border transition-all no-underline hover:bg-faint" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>
              View {perfB.name} →
            </a>
          </div>
        )}

        {/* Empty state — Popular combos */}
        {!perfA && !perfB && (
          <div className="mt-12 animate-fade-up">
            <h2 className="font-serif text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Popular combinations</h2>
            <p className="text-xs mb-6" style={{ color: '#8C8378' }}>Try these crowd-favorite layers to get started</p>
            <div className="space-y-3">
              {POPULAR_COMBOS.map((combo, i) => {
                const available = perfumes.some(p => p.name === combo.a && p.brand === combo.brandA) && perfumes.some(p => p.name === combo.b && p.brand === combo.brandB);
                return (
                  <button key={i} onClick={() => available && handleCombo(combo)} disabled={!available}
                    className="w-full text-left p-4 rounded-lg border transition-all group"
                    style={{ borderColor: '#E8E8E8', opacity: available ? 1 : 0.5 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {combo.a} <span className="mx-2" style={{ color: ACCENT }}>+</span> {combo.b}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#8C8378' }}>{combo.why}</div>
                      </div>
                      {available && <span className="text-xs uppercase tracking-widest font-medium group-hover:translate-x-1 transition-transform" style={{ color: ACCENT }}>Try →</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
