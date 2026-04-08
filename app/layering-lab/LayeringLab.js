'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Header, Footer, Tag } from '../components/shared';
import { ACCENT, ACCORD_COLORS, NOTE_COLORS, FAMILY_COLORS, slugify } from '../lib/constants';

const parseCSV = (str) => (str || '').split(',').map(s => s.trim()).filter(Boolean);
const parseJSON = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
};

const LEVEL_TO_WIDTH = { 'Dominant': 90, 'Prominent': 70, 'Moderate': 50, 'Light': 30 };

function SeasonIcon({ season, size = 18 }) {
  if (season === 'spring') return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E4899A" strokeWidth="1.8"><path d="M12 22V12"/><path d="M8 18c-2 0-4-1-4-3s3-4 5-5"/><path d="M16 18c2 0 4-1 4-3s-3-4-5-5"/><path d="M12 12c0-3 1.5-5 3-6.5C13.5 4 12 3 12 3s-1.5 1-3 2.5C10.5 7 12 9 12 12z"/></svg>);
  if (season === 'summer') return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E8B84B" strokeWidth="1.8"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>);
  if (season === 'fall') return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D4915B" strokeWidth="1.8"><path d="M11 20c0-4 2-7 6-10C13 7 9 5 5 4c0 4 1 8 4 11"/><path d="M5 4c4 3 8 7 8 16"/><line x1="15" y1="6" x2="10" y2="14"/></svg>);
  if (season === 'winter') return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6BA3BE" strokeWidth="1.8"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/><line x1="12" y1="6" x2="9" y2="4"/><line x1="12" y1="6" x2="15" y2="4"/><line x1="12" y1="18" x2="9" y2="20"/><line x1="12" y1="18" x2="15" y2="20"/><line x1="6" y1="12" x2="4" y2="9"/><line x1="6" y1="12" x2="4" y2="15"/><line x1="18" y1="12" x2="20" y2="9"/><line x1="18" y1="12" x2="20" y2="15"/></svg>);
  return null;
}

function getSeasonLabel(scoreA, scoreB) {
  if (scoreA >= 1.5 && scoreB >= 1.5) return { text: 'Great for both', color: '#7EC8A0' };
  if (scoreA >= 1.5 && scoreB < 1.0) return { text: 'Better for A', color: ACCENT };
  if (scoreB >= 1.5 && scoreA < 1.0) return { text: 'Better for B', color: '#D4915B' };
  if (scoreA >= 1.0 && scoreB >= 1.0) return { text: 'Decent for both', color: '#8C8378' };
  if (scoreA >= 1.5) return { text: 'Better for A', color: ACCENT };
  if (scoreB >= 1.5) return { text: 'Better for B', color: '#D4915B' };
  return { text: 'Not ideal', color: '#D8D0C8' };
}

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
            {selected.image_url && (<div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-faint"><img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain" /></div>)}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>{selected.name}</h3>
              <div className="text-sm mt-1" style={{ color: '#8C8378' }}>{selected.brand}</div>
              <div className="flex gap-1.5 mt-2 flex-wrap"><Tag color={fc}>{selected.family}</Tag><Tag>{selected.concentration}</Tag></div>
            </div>
            <button onClick={onClear} className="text-xs uppercase tracking-widest font-medium px-3 py-1.5 rounded transition-all hover:bg-ink hover:text-paper" style={{ color: '#8C8378', border: '1px solid #D8D0C8' }}>Change</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <div className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: ACCENT }}>{label}</div>
      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search by name or brand..." className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all" style={{ borderColor: open && results.length ? ACCENT : '#D8D0C8', boxShadow: open && results.length ? `0 0 0 3px ${ACCENT}20` : 'none' }} />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border overflow-hidden" style={{ borderColor: '#E8E8E8', background: '#FFF', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
          {results.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setQuery(''); setOpen(false); }} className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-faint border-b last:border-b-0" style={{ borderColor: '#F5F5F5' }}>
              {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />}
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs" style={{ color: '#8C8378' }}>{p.brand} · {p.family}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildCombinedProfile(a, b) {
  const accordsA = parseCSV(a.main_accords);
  const accordsB = parseCSV(b.main_accords);
  const pctsA = parseJSON(a.accord_percentages) || {};
  const pctsB = parseJSON(b.accord_percentages) || {};
  const allAccords = [...new Set([...accordsA, ...accordsB])];
  const accords = allAccords.map(name => {
    const inA = accordsA.map(x => x.toLowerCase()).includes(name.toLowerCase());
    const inB = accordsB.map(x => x.toLowerCase()).includes(name.toLowerCase());
    const widthA = LEVEL_TO_WIDTH[pctsA[name]] || (inA ? 40 : 0);
    const widthB = LEVEL_TO_WIDTH[pctsB[name]] || (inB ? 40 : 0);
    const combinedWidth = inA && inB ? Math.round((widthA + widthB) / 2) : Math.max(widthA, widthB);
    return { name, widthA, widthB, combinedWidth, inA, inB, shared: inA && inB };
  }).sort((a, b) => b.combinedWidth - a.combinedWidth);
  const mergeNotes = (strA, strB) => {
    const a2 = parseCSV(strA); const b2 = parseCSV(strB);
    const all = [...new Set([...a2, ...b2])];
    return all.map(n => ({ name: n, inA: a2.map(x => x.toLowerCase()).includes(n.toLowerCase()), inB: b2.map(x => x.toLowerCase()).includes(n.toLowerCase()), shared: a2.map(x => x.toLowerCase()).includes(n.toLowerCase()) && b2.map(x => x.toLowerCase()).includes(n.toLowerCase()) }));
  };
  const seasonsA = parseJSON(a.season_ranking) || []; const seasonsB = parseJSON(b.season_ranking) || [];
  const seasonNames = [...new Set([...seasonsA.map(s => s.name), ...seasonsB.map(s => s.name)])];
  const seasons = seasonNames.map(name => ({ name, scoreA: seasonsA.find(s => s.name === name)?.score || 0, scoreB: seasonsB.find(s => s.name === name)?.score || 0 }));
  return { accords, notes: { top: mergeNotes(a.top_notes, b.top_notes), heart: mergeNotes(a.heart_notes, b.heart_notes), base: mergeNotes(a.base_notes, b.base_notes) }, seasons, sharedAccordCount: accords.filter(a => a.shared).length, totalAccords: accords.length };
}

function TheVerdict({ perfA, perfB }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchAnalysis = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/layering-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ perfumeA: perfA, perfumeB: perfB }) });
      if (!res.ok) throw new Error(res.status === 503 ? 'Verdict is not configured yet. Add your ANTHROPIC_API_KEY to Vercel environment variables.' : 'Could not generate verdict. Try again.');
      const data = await res.json(); setAnalysis(data.analysis);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [perfA, perfB]);

  if (!analysis && !loading && !error) {
    return (
      <div className="mb-10 p-6 rounded-lg border text-center" style={{ borderColor: ACCENT + '25', background: ACCENT + '04' }}>
        <div className="font-serif text-xl mb-2" style={{ letterSpacing: '-0.02em' }}>Want the verdict on this combo?</div>
        <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: '#8C8378' }}>How it would smell, when to wear it, and what to watch out for.</p>
        <button onClick={fetchAnalysis} className="text-xs uppercase tracking-widest font-medium px-6 py-2.5 rounded transition-all hover:opacity-80" style={{ background: '#1A1A1A', color: '#FAF8F5' }}>Get the verdict</button>
      </div>
    );
  }
  if (loading) {
    return (<div className="mb-10 p-8 rounded-lg border text-center" style={{ borderColor: '#E8E8E8' }}><div className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-3" style={{ borderColor: '#E8E8E8', borderTopColor: ACCENT }} /><div className="text-sm" style={{ color: '#8C8378' }}>Analyzing these two fragrances...</div></div>);
  }
  if (error) {
    return (<div className="mb-10 p-5 rounded-lg border" style={{ borderColor: '#E07B7B30', background: '#E07B7B06' }}><p className="text-sm" style={{ color: '#E07B7B' }}>{error}</p><button onClick={fetchAnalysis} className="text-xs underline mt-2" style={{ color: '#8C8378' }}>Try again</button></div>);
  }
  return (
    <div className="mb-10 animate-fade-up">
      <h3 className="font-serif text-2xl mb-4" style={{ letterSpacing: '-0.02em' }}>The verdict</h3>
      <div className="space-y-3">
        <div className="p-5 rounded-lg border" style={{ borderColor: ACCENT + '30', background: ACCENT + '05' }}>
          <div className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: ACCENT }}>The verdict</div>
          <div className="font-serif text-xl" style={{ letterSpacing: '-0.02em' }}>{analysis.verdict}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.theBlend && (<div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}><div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>What it smells like</div><p className="text-sm leading-relaxed font-serif italic" style={{ color: '#555' }}>{analysis.theBlend}</p></div>)}
          {analysis.whyItWorks && (<div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}><div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>Why it works</div><p className="text-sm leading-relaxed">{analysis.whyItWorks}</p></div>)}
          {analysis.howToWear && (<div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}><div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>How to wear</div><p className="text-sm leading-relaxed">{analysis.howToWear}</p></div>)}
          {analysis.bestFor && (<div className="p-4 rounded-lg" style={{ background: '#FAFAFA' }}><div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#8C8378' }}>Best for</div><p className="text-sm leading-relaxed">{analysis.bestFor}</p></div>)}
        </div>
        {analysis.watchOut && (<div className="p-4 rounded-lg border" style={{ borderColor: '#D4915B25', background: '#D4915B06' }}><div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#D4915B' }}>Watch out for</div><p className="text-sm leading-relaxed">{analysis.watchOut}</p></div>)}
      </div>
      <div className="text-xs mt-3 text-center" style={{ color: '#D8D0C8' }}>Your nose is the final judge</div>
    </div>
  );
}

function CombinedProfile({ perfA, perfB, profile }) {
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8 py-4"><div className="text-sm" style={{ color: '#8C8378' }}>{profile.sharedAccordCount} of {profile.totalAccords} accords are shared between these two</div></div>
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Accord comparison</h3>
        <p className="text-xs mb-5" style={{ color: '#8C8378' }}>Shared accords get amplified when layered</p>
        <div className="flex items-center gap-5 mb-5 text-xs" style={{ color: '#8C8378' }}>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: ACCENT }} />{perfA.name}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#D4915B' }} />{perfB.name}</span>
        </div>
        <div className="space-y-4">
          {profile.accords.slice(0, 12).map((a, i) => (
            <div key={a.name} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm capitalize" style={{ color: a.shared ? '#1A1A1A' : '#8C8378' }}>{a.name}</span>
                {a.shared ? (<span className="text-xs font-medium" style={{ color: '#7EC8A0' }}>Shared</span>) : a.inA ? (<span className="text-xs" style={{ color: ACCENT }}>A only</span>) : (<span className="text-xs" style={{ color: '#D4915B' }}>B only</span>)}
              </div>
              {a.inA && (<div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#F5F5F5' }}><div className="h-full rounded-full bar-fill" style={{ width: `${a.widthA}%`, background: ACCORD_COLORS[a.name] || ACCENT, opacity: 0.7 }} /></div>)}
              {a.inB && (<div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F5F5F5' }}><div className="h-full rounded-full bar-fill" style={{ width: `${a.widthB}%`, background: ACCORD_COLORS[a.name] || '#D4915B', opacity: 0.45 }} /></div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-5" style={{ letterSpacing: '-0.02em' }}>Combined notes</h3>
        {['top', 'heart', 'base'].map(layer => {
          const notes = profile.notes[layer]; if (!notes.length) return null;
          return (<div key={layer} className="mb-6"><div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full" style={{ background: NOTE_COLORS[layer] }} /><span className="text-xs uppercase tracking-widest font-medium" style={{ color: NOTE_COLORS[layer] }}>{layer} notes</span></div><div className="flex flex-wrap gap-2">{notes.map(n => (<a key={n.name} href={`/note/${n.name.toLowerCase().replace(/\s+/g, '-')}`} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all no-underline" style={{ borderColor: n.shared ? '#7EC8A040' : '#E8E8E8', background: n.shared ? '#7EC8A008' : 'transparent', color: '#1A1A1A' }}>{n.name}{n.shared && <span style={{ color: '#7EC8A0', fontSize: 10 }}>✦</span>}{!n.shared && <span className="text-xs" style={{ color: n.inA ? ACCENT : '#D4915B', fontSize: 9, opacity: 0.7 }}>{n.inA ? 'A' : 'B'}</span>}</a>))}</div></div>);
        })}
      </div>
      <div className="mb-10">
        <h3 className="font-serif text-2xl mb-4" style={{ letterSpacing: '-0.02em' }}>Seasonal overlap</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {profile.seasons.map(s => {
            const label = getSeasonLabel(s.scoreA, s.scoreB);
            const isGood = s.scoreA >= 1.5 && s.scoreB >= 1.5;
            return (<div key={s.name} className="text-center p-4 rounded-lg border" style={{ borderColor: isGood ? '#7EC8A030' : '#E8E8E8' }}><div className="flex justify-center mb-2"><SeasonIcon season={s.name} /></div><div className="text-sm capitalize font-medium mb-1">{s.name}</div><div className="text-xs font-medium" style={{ color: label.color }}>{label.text}</div></div>);
          })}
        </div>
      </div>
    </div>
  );
}

function CommunitySection({ perfA, perfB }) {
  const [combos, setCombos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', review: '', rating: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!perfA || !perfB) return;
    fetch(`/api/layering-combos?perfumeA=${perfA.id}&perfumeB=${perfB.id}`).then(r => r.json()).then(d => { setCombos(d.combos || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, [perfA, perfB]);
  const submitCombo = useCallback(async () => {
    if (!form.review.trim()) return; setSubmitting(true);
    try {
      const res = await fetch('/api/layering-combos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ perfumeAId: perfA.id, perfumeBId: perfB.id, submittedBy: form.name || 'Anonymous', review: form.review, rating: form.rating }) });
      const data = await res.json();
      if (res.ok) { setToast('Review submitted!'); setShowForm(false); setForm({ name: '', review: '', rating: 4 }); const refreshRes = await fetch(`/api/layering-combos?perfumeA=${perfA.id}&perfumeB=${perfB.id}`); const refreshData = await refreshRes.json(); setCombos(refreshData.combos || []); } else { setToast(data.error || 'Could not submit'); }
    } catch { setToast('Something went wrong'); }
    setSubmitting(false); setTimeout(() => setToast(null), 3000);
  }, [form, perfA, perfB]);
  const vote = useCallback(async (comboId, direction) => {
    try { await fetch('/api/layering-combos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comboId, vote: direction }) });
      setCombos(prev => prev.map(c => c.id === comboId ? { ...c, [direction === 'up' ? 'upvotes' : 'downvotes']: (c[direction === 'up' ? 'upvotes' : 'downvotes'] || 0) + 1 } : c));
    } catch {}
  }, []);
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-2xl" style={{ letterSpacing: '-0.02em' }}>Community reviews</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs uppercase tracking-widest font-medium px-4 py-2 rounded transition-all" style={{ background: showForm ? '#E8E8E8' : '#1A1A1A', color: showForm ? '#1A1A1A' : '#FAF8F5' }}>{showForm ? 'Cancel' : 'Tried this layer?'}</button>
      </div>
      {toast && (<div className="mb-4 p-3 rounded-lg text-center text-sm animate-slide-up" style={{ background: '#7EC8A015', color: '#5BA87D', border: '1px solid #7EC8A030' }}>{toast}</div>)}
      {showForm && (
        <div className="mb-6 p-5 rounded-lg border animate-fade-up" style={{ borderColor: '#E8E8E8' }}>
          <div className="mb-4"><label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>Your name (optional)</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Anonymous" maxLength={50} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ borderColor: '#E8E8E8' }} /></div>
          <div className="mb-4"><label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>How was this combination?</label><textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))} placeholder="How did you wear it? What did it smell like? Would you recommend it?" maxLength={500} rows={3} className="w-full px-3 py-2 rounded border text-sm outline-none resize-none" style={{ borderColor: '#E8E8E8' }} /></div>
          <div className="mb-4"><label className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: '#8C8378' }}>Rating</label><div className="flex gap-1">{[1,2,3,4,5].map(n => (<button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))} className="text-lg transition-transform hover:scale-110" style={{ color: n <= form.rating ? ACCENT : '#D8D0C8' }}>★</button>))}</div></div>
          <button onClick={submitCombo} disabled={submitting || !form.review.trim()} className="text-xs uppercase tracking-widest font-medium px-5 py-2 rounded transition-all disabled:opacity-50" style={{ background: '#1A1A1A', color: '#FAF8F5' }}>{submitting ? 'Submitting...' : 'Submit review'}</button>
        </div>
      )}
      {combos.length > 0 ? (
        <div className="space-y-4">{combos.map(c => (<div key={c.id} className="p-4 rounded-lg border" style={{ borderColor: '#F0F0F0' }}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-sm font-medium">{c.submitted_by || 'Anonymous'}</span><span style={{ color: ACCENT, fontSize: 12 }}>{"★".repeat(c.rating || 4)}</span></div><div className="flex items-center gap-3 text-xs"><button onClick={() => vote(c.id, 'up')} className="flex items-center gap-1 transition-colors hover:text-ink" style={{ color: '#8C8378' }}>▲ {c.upvotes || 0}</button><button onClick={() => vote(c.id, 'down')} className="flex items-center gap-1 transition-colors hover:text-ink" style={{ color: '#8C8378' }}>▼ {c.downvotes || 0}</button></div></div>{c.review && <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{c.review}</p>}</div>))}</div>
      ) : loaded ? (<div className="text-center py-8" style={{ color: '#D8D0C8' }}><p className="text-sm">No community reviews for this combo yet.</p>{!showForm && <p className="text-xs mt-1">Be the first — click "Tried this layer?" above.</p>}</div>) : null}
    </div>
  );
}



export default function LayeringLab({ perfumes }) {
  const [perfA, setPerfA] = useState(null);
  const [perfB, setPerfB] = useState(null);
  const profile = useMemo(() => { if (!perfA || !perfB) return null; return buildCombinedProfile(perfA, perfB); }, [perfA, perfB]);
  
  const handleSwap = useCallback(() => { setPerfA(perfB); setPerfB(perfA); }, [perfA, perfB]);
  return (
    <div className="min-h-screen">
      <Header current="layering" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <a href="/" className="text-xs uppercase tracking-widest inline-block mb-6 no-underline transition-all" style={{ color: '#8C8378' }}>← Back to Directory</a>
          <h1 className="font-serif text-5xl leading-tight mb-3" style={{ letterSpacing: '-0.03em' }}>Layering <span className="italic" style={{ color: ACCENT }}>Lab</span></h1>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: '#8C8378' }}>Pick two fragrances and see how they layer. Get a verdict, compare accords side-by-side, and read real community reviews.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <PerfumeSearch perfumes={perfumes.filter(p => p.id !== perfB?.id)} selected={perfA} onSelect={setPerfA} onClear={() => setPerfA(null)} label="Perfume A — Base layer" />
          <PerfumeSearch perfumes={perfumes.filter(p => p.id !== perfA?.id)} selected={perfB} onSelect={setPerfB} onClear={() => setPerfB(null)} label="Perfume B — Top layer" />
        </div>
        {perfA && perfB && (<div className="flex justify-center mb-10"><button onClick={handleSwap} className="text-xs uppercase tracking-widest font-medium px-4 py-2 rounded-full border transition-all hover:bg-ink hover:text-paper" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>⇄ Swap layers</button></div>)}
        {perfA && perfB && <TheVerdict perfA={perfA} perfB={perfB} />}
        {profile && <CombinedProfile perfA={perfA} perfB={perfB} profile={profile} />}
        {perfA && perfB && <CommunitySection perfA={perfA} perfB={perfB} />}
        {perfA && perfB && (<div className="flex gap-4 mt-6"><a href={`/perfume/${slugify(perfA.name, perfA.brand)}`} className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 rounded border transition-all no-underline hover:bg-faint" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>View {perfA.name} →</a><a href={`/perfume/${slugify(perfB.name, perfB.brand)}`} className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 rounded border transition-all no-underline hover:bg-faint" style={{ borderColor: '#D8D0C8', color: '#8C8378' }}>View {perfB.name} →</a></div>)}
        {!perfA && !perfB && (
          <div className="mt-12 animate-fade-up text-center py-16">
            <div className="font-serif text-3xl mb-3" style={{ letterSpacing: '-0.02em', color: '#D8D0C8' }}>Pick two fragrances above</div>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#8C8378' }}>Search for any two perfumes to see how they layer together — accords, notes, seasonal fit, and a full verdict.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
