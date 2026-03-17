'use client';

import { useState, useMemo, useCallback } from 'react';
import { PERFUMES, FAMILIES, ALL_NOTES, BRANDS, BRAND_TYPES, NOTE_COLORS_MAP } from '../data/perfumes';

/* ═══ STYLE CONSTANTS ═══ */
const FAMILY_COLORS = {
  Floral: "#C4728F", Woody: "#7B6348", Oriental: "#A0522D", Fresh: "#5B8F6B",
  Citrus: "#B89B30", Gourmand: "#8B6240", Fruity: "#C4548A", Aromatic: "#5B7F5B",
  Leather: "#6B4D35", Aquatic: "#4A8A9F", Smoky: "#6B6560", Green: "#5B8F5B",
  "Floral Aldehyde": "#B07090", "Woody Floral": "#8B7060",
};
const TYPE_COLORS = { Niche: "#8B6914", Designer: "#4A6B8A", Arabic: "#A0522D", Indie: "#6B8F6B", Affordable: "#6B8B6B", Celebrity: "#8B5A8B" };
const NOTE_COLORS = { top: "#E8B84A", heart: "#C4728F", base: "#7B6348" };
const NOTE_LABELS = { top: "Top Notes", heart: "Heart Notes", base: "Base Notes" };

const RETAILERS = [
  { name: "FragranceNet", icon: "🛒", color: "#2E7D32", tag: "Best Price", url: "https://www.fragrancenet.com/search?q=Q&utm_source=thedrydown" },
  { name: "ScentSplit", icon: "💧", color: "#1565C0", tag: "Decants", url: "https://www.scentsplit.com/search?q=Q&ref=thedrydown" },
  { name: "Amazon", icon: "📦", color: "#FF9800", tag: "Fast Ship", url: "https://www.amazon.com/s?k=Q&tag=thedrydown-20" },
  { name: "Sephora", icon: "✨", color: "#000", tag: "Rewards", url: "https://www.sephora.com/search?keyword=Q&utm_source=thedrydown" },
  { name: "Notino", icon: "🌍", color: "#E91E63", tag: "Global", url: "https://www.notino.com/search/?q=Q&utm_source=thedrydown" },
];

const SEED_REVIEWS = [
  { user: "Nour A.", rating: 5, perfume: "Khamrah", title: "Beast mode for $28", body: "Sweet, warm, spicy — lasts 10+ hours.", date: "2d ago", helpful: 47 },
  { user: "Layla H.", rating: 5, perfume: "Baccarat Rouge 540", title: "The hype is real", body: "Saffron into ambergris is perfumery at its finest.", date: "3d ago", helpful: 62 },
  { user: "Dina R.", rating: 5, perfume: "Cloud", title: "BR540 dupe that delivers", body: "At this price, nothing compares.", date: "5d ago", helpful: 89 },
  { user: "Fatima Z.", rating: 5, perfume: "Angels' Share", title: "Liquid gold", body: "Cognac cinnamon opening is intoxicating.", date: "6d ago", helpful: 72 },
  { user: "Rania Q.", rating: 4, perfume: "La Rosée", title: "90% of Delina, 10% the price", body: "Rose and lychee spot on.", date: "3d ago", helpful: 94 },
  { user: "Leila F.", rating: 5, perfume: "Grand Soir", title: "Amber perfection", body: "Pure warm amber. 12+ hours longevity.", date: "5d ago", helpful: 67 },
  { user: "Yasmin L.", rating: 5, perfume: "Tobacco Vanille", title: "Unisex masterpiece", body: "Date night staple.", date: "1w ago", helpful: 55 },
  { user: "Jenna W.", rating: 4, perfume: "Missing Person", title: "Your skin but better", body: "Clean warm skin scent.", date: "2d ago", helpful: 63 },
];

/* ═══ SMALL COMPONENTS ═══ */
function Bottle({ family, size = 48 }) {
  const c = { Floral: ["#E8A4BA", "#C4728F"], Woody: ["#B89B70", "#7B6348"], Oriental: ["#D4A06A", "#A0522D"], Fresh: ["#8FC4A0", "#5B8F6B"], Citrus: ["#E8D060", "#B89B30"], Gourmand: ["#C4A07A", "#8B6240"], Fruity: ["#E89AB0", "#C4548A"], Aromatic: ["#8FC48F", "#5B7F5B"] }[family] || ["#ccc", "#999"];
  const id = "b" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 40 56" style={{ flexShrink: 0 }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c[0]} /><stop offset="100%" stopColor={c[1]} /></linearGradient></defs>
      <rect x="15" y="0" width="10" height="6" rx="1.5" fill={c[1]} opacity=".7" />
      <rect x="17" y="5" width="6" height="5" rx="1" fill={c[1]} opacity=".5" />
      <rect x="8" y="10" width="24" height="42" rx="5" fill={`url(#${id})`} />
      <rect x="8" y="10" width="24" height="42" rx="5" fill="white" opacity=".15" />
      <rect x="12" y="16" width="5" height="28" rx="2.5" fill="white" opacity=".18" />
    </svg>
  );
}

function Stars({ value, size = 13 }) {
  return <span style={{ color: "#D4A94B", fontSize: size, letterSpacing: 1 }}>{"★".repeat(Math.floor(value))}{value % 1 >= 0.5 ? "½" : ""}<span style={{ color: "#DDD" }}>{"★".repeat(5 - Math.ceil(value))}</span></span>;
}

function Badge({ text, color, bg }) {
  return <span className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{ background: bg || "#f5f3f0", color: color || "#6B6560" }}>{text}</span>;
}

function NoteBar({ name, strength, color, noteColor }) {
  const barColor = noteColor || color;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      {noteColor && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: noteColor, border: '0.5px solid rgba(0,0,0,0.08)' }} />}
      <div className="text-sm text-right font-medium text-gray-700 truncate flex-shrink-0" style={{ width: noteColor ? 85 : 96 }}>{name}</div>
      <div className="flex-1 h-3.5 rounded bg-gray-100 overflow-hidden min-w-[60px]">
        <div className="h-full rounded transition-all duration-700" style={{ width: `${strength}%`, background: `linear-gradient(90deg, ${barColor}90, ${barColor})` }} />
      </div>
      <div className="w-7 text-xs text-gray-400 text-right flex-shrink-0">{strength}%</div>
    </div>
  );
}

function PerfumeCard({ perfume: p, onClick, compact }) {
  const fc = FAMILY_COLORS[p.family] || "#6B6560";
  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:shadow-md flex items-center gap-3" style={{ padding: compact ? 10 : 14 }}>
      <Bottle family={p.family} size={compact ? 28 : 36} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-gray-900 truncate" style={{ fontSize: compact ? 13 : 15 }}>{p.name}</div>
            <div className="text-gray-500" style={{ fontSize: compact ? 11 : 12 }}>{p.brand}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="font-bold text-gray-900" style={{ fontSize: compact ? 12 : 14 }}>${p.priceLow}</div>
            <Stars value={p.rating} size={compact ? 9 : 10} />
          </div>
        </div>
        {!compact && (
          <div className="flex gap-1 flex-wrap mt-1">
            <Badge text={p.family} color={fc} bg={fc + "15"} />
            <Badge text={p.gender} />
            <Badge text={p.concentration} />
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          {p.notes.filter(n => n.position === "top").slice(0, 3).map(n => n.name).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function getSimilar(perfume) {
  const pNotes = new Set(perfume.notes.map(n => n.name));
  const pAccords = new Set(perfume.accords.map(a => a.name));
  return PERFUMES
    .filter(x => x.name !== perfume.name)
    .map(x => {
      const xN = new Set(x.notes.map(n => n.name));
      const xA = new Set(x.accords.map(a => a.name));
      return { ...x, score: [...pNotes].filter(n => xN.has(n)).length * 2 + [...pAccords].filter(a => xA.has(a)).length * 3 + (x.family === perfume.family ? 3 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

/* ═══ SUBMIT PERFUME FORM ═══ */
function SubmitForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", brand: "", year: 2025, gender: "Women", concentration: "EDP", family: "Floral", priceLow: "", priceHigh: "", topNotes: "", heartNotes: "", baseNotes: "", accords: "", description: "" });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const families = ["Floral", "Oriental", "Woody", "Aromatic", "Gourmand", "Fruity", "Citrus", "Fresh", "Aquatic", "Leather", "Green"];
  const concs = ["EDT", "EDP", "Extrait", "Parfum", "Cologne", "Body Mist", "Perfume Oil", "Hair Mist", "Elixir"];
  const submit = () => { if (!form.name || !form.brand) { alert("Name and brand are required!"); return; } onSubmit({ ...form, priceLow: Number(form.priceLow) || 0, priceHigh: Number(form.priceHigh) || 0 }); };
  const inp = "w-full p-2.5 rounded-lg border border-gray-300 text-sm font-body focus:border-brand-gold focus:outline-none";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-fade-up">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-2xl font-semibold">Submit a Perfume</h2>
        <button onClick={onCancel} className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg flex items-center justify-center">×</button>
      </div>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">Help grow The Dry Down database! Submit a perfume and it will be reviewed before going live.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Perfume Name *</label><input value={form.name} onChange={e => u("name", e.target.value)} placeholder="e.g. Lost Cherry" className={inp} /></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Brand *</label><input value={form.brand} onChange={e => u("brand", e.target.value)} placeholder="e.g. Tom Ford" className={inp} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Year</label><input type="number" value={form.year} onChange={e => u("year", Number(e.target.value))} className={inp} /></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Gender</label><select value={form.gender} onChange={e => u("gender", e.target.value)} className={inp}>{["Women", "Men", "Unisex"].map(g => <option key={g}>{g}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Concentration</label><select value={form.concentration} onChange={e => u("concentration", e.target.value)} className={inp}>{concs.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Family</label><select value={form.family} onChange={e => u("family", e.target.value)} className={inp}>{families.map(f => <option key={f}>{f}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Price Low ($)</label><input type="number" value={form.priceLow} onChange={e => u("priceLow", e.target.value)} placeholder="e.g. 90" className={inp} /></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Price High ($)</label><input type="number" value={form.priceHigh} onChange={e => u("priceHigh", e.target.value)} placeholder="e.g. 130" className={inp} /></div>
      </div>
      <div className="mb-3"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Top Notes (comma separated)</label><input value={form.topNotes} onChange={e => u("topNotes", e.target.value)} placeholder="e.g. Bergamot, Pink Pepper, Raspberry" className={inp} /></div>
      <div className="mb-3"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Heart Notes (comma separated)</label><input value={form.heartNotes} onChange={e => u("heartNotes", e.target.value)} placeholder="e.g. Rose, Jasmine, Orange Blossom" className={inp} /></div>
      <div className="mb-3"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Base Notes (comma separated)</label><input value={form.baseNotes} onChange={e => u("baseNotes", e.target.value)} placeholder="e.g. Vanilla, Musk, Sandalwood" className={inp} /></div>
      <div className="mb-3"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Main Accords (comma separated)</label><input value={form.accords} onChange={e => u("accords", e.target.value)} placeholder="e.g. floral, sweet, warm, powdery" className={inp} /></div>
      <div className="mb-4"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description (optional)</label><textarea value={form.description} onChange={e => u("description", e.target.value)} placeholder="Brief description..." rows={3} className={inp + " resize-y"} /></div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
        <button onClick={submit} className="px-6 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">Submit for Review</button>
      </div>
    </div>
  );
}

/* ═══ ADMIN PANEL ═══ */
function AdminPanel({ pending, onApprove, onReject, onClose }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-fade-up">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Admin Review Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve community submissions</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg flex items-center justify-center">×</button>
      </div>
      {pending.length === 0 ? (
        <div className="text-center py-10 text-gray-400"><div className="text-3xl mb-2">✓</div>No pending submissions</div>
      ) : pending.map((p, i) => (
        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
            <div><span className="font-display text-lg font-semibold">{p.name}</span><span className="text-gray-500 ml-2 text-sm">by {p.brand}</span></div>
            <div className="flex gap-1"><Badge text={p.family} /><Badge text={p.gender} /><Badge text={p.concentration} /><Badge text={`$${p.priceLow}–$${p.priceHigh}`} /></div>
          </div>
          <div className="text-xs text-gray-600 mb-1"><strong>Top:</strong> {p.topNotes}</div>
          <div className="text-xs text-gray-600 mb-1"><strong>Heart:</strong> {p.heartNotes}</div>
          <div className="text-xs text-gray-600 mb-1"><strong>Base:</strong> {p.baseNotes}</div>
          <div className="text-xs text-gray-600 mb-2"><strong>Accords:</strong> {p.accords}</div>
          <div className="flex gap-2">
            <button onClick={() => onApprove(i)} className="px-4 py-1.5 rounded-md bg-green-700 text-white text-xs font-semibold hover:bg-green-800">✓ Approve</button>
            <button onClick={() => onReject(i)} className="px-4 py-1.5 rounded-md border border-red-500 text-red-500 text-xs font-semibold hover:bg-red-50">✗ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function Home() {
  const [allPerfumes, setAllPerfumes] = useState(PERFUMES);
  const [view, setView] = useState("browse");
  const [query, setQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selected, setSelected] = useState(null);
  const [brandView, setBrandView] = useState(null);
  const [noteView, setNoteView] = useState(null);
  const [reviewSort, setReviewSort] = useState("helpful");
  const [voted, setVoted] = useState({});
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, title: "", body: "", perfume: "" });
  const [userReviews, setUserReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const nav = (v) => { setView(v); scrollTop(); };

  const handleSubmit = useCallback((form) => {
    setPending(prev => [...prev, form]);
    nav("browse");
    showToast("Perfume submitted for review!");
  }, [showToast]);

  const handleApprove = useCallback((idx) => {
    const p = pending[idx];
    const newP = {
      id: allPerfumes.length, name: p.name, brand: p.brand, year: p.year, gender: p.gender,
      concentration: p.concentration, family: p.family, priceLow: p.priceLow, priceHigh: p.priceHigh, rating: 4.0,
      notes: [
        ...p.topNotes.split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "top", strength: 75 })),
        ...p.heartNotes.split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "heart", strength: 65 })),
        ...p.baseNotes.split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "base", strength: 60 })),
      ],
      accords: p.accords.split(",").map(a => a.trim()).filter(Boolean).map((a, i) => ({ name: a, strength: 90 - i * 15 })),
    };
    setAllPerfumes(prev => [...prev, newP]);
    setPending(prev => prev.filter((_, i) => i !== idx));
    showToast(`"${p.name}" approved and added!`);
  }, [pending, allPerfumes, showToast]);

  const handleReject = useCallback((idx) => {
    setPending(prev => prev.filter((_, i) => i !== idx));
    showToast("Submission rejected.");
  }, [showToast]);

  // Derived data
  const brands = useMemo(() => {
    const m = {};
    allPerfumes.forEach(p => {
      if (!m[p.brand]) m[p.brand] = { name: p.brand, type: BRAND_TYPES[p.brand] || "Unknown", count: 0, perfumes: [] };
      m[p.brand].count++;
      m[p.brand].perfumes.push(p);
    });
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [allPerfumes]);

  const allNotes = useMemo(() => {
    const m = {};
    allPerfumes.forEach(p => p.notes.forEach(n => { if (!m[n.name]) m[n.name] = { name: n.name, count: 0 }; m[n.name].count++; }));
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [allPerfumes]);

  const families = useMemo(() => [...new Set(allPerfumes.map(p => p.family))].sort(), [allPerfumes]);

  const filtered = useMemo(() => {
    let r = allPerfumes.filter(p => {
      if (query) { const s = query.toLowerCase(); if (!(p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s) || p.notes.some(n => n.name.toLowerCase().includes(s)) || p.accords.some(a => a.name.toLowerCase().includes(s)))) return false; }
      if (familyFilter !== "all" && p.family !== familyFilter) return false;
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;
      if (typeFilter !== "all" && (BRAND_TYPES[p.brand] || "") !== typeFilter) return false;
      if (priceFilter === "under50" && p.priceLow >= 50) return false;
      if (priceFilter === "50to150" && (p.priceLow < 50 || p.priceLow >= 150)) return false;
      if (priceFilter === "150to300" && (p.priceLow < 150 || p.priceLow >= 300)) return false;
      if (priceFilter === "over300" && p.priceLow < 300) return false;
      return true;
    });
    if (sortBy === "popular") r.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "newest") r.sort((a, b) => b.year - a.year);
    else if (sortBy === "price_low") r.sort((a, b) => a.priceLow - b.priceLow);
    else if (sortBy === "price_high") r.sort((a, b) => b.priceLow - a.priceLow);
    else if (sortBy === "name") r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [query, familyFilter, genderFilter, typeFilter, priceFilter, sortBy, allPerfumes]);

  const allReviews = [...SEED_REVIEWS, ...userReviews].sort((a, b) => reviewSort === "helpful" ? b.helpful - a.helpful : b.rating - a.rating);

  const openPerfume = (p) => { setSelected(p); setView("detail"); scrollTop(); };
  const openBrand = (name) => { setBrandView(brands.find(b => b.name === name)); setView("brand"); scrollTop(); };
  const openNote = (name) => { setNoteView(allNotes.find(n => n.name === name)); setView("note_detail"); scrollTop(); };

  return (
    <div className="min-h-screen bg-brand-cream font-body">
      {/* TOAST */}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium z-50 animate-slide-up shadow-2xl max-w-[90%] text-center">{toast}</div>}

      {/* NAV */}
      <nav className="bg-white border-b border-gray-200 px-5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-13 flex-wrap gap-2 py-2">
          <div onClick={() => nav("browse")} className="cursor-pointer flex items-baseline gap-0.5">
            <span className="font-display text-xl font-bold text-gray-900">The</span>
            <span className="font-display text-xl font-normal text-brand-gold">Dry</span>
            <span className="font-display text-xl font-bold text-gray-900">Down</span>
          </div>
          <div className="flex gap-1 items-center flex-wrap">
            {[["browse", "Perfumes"], ["reviews", "Reviews"], ["brands", "Brands"], ["notes", "Notes"]].map(([id, label]) => (
              <button key={id} onClick={() => nav(id)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${(view === id || (view === "detail" && id === "browse") || (view === "brand" && id === "brands") || (view === "note_detail" && id === "notes")) ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{label}</button>
            ))}
            <button onClick={() => nav("submit")} className="px-3 py-1.5 rounded-md text-sm font-semibold bg-brand-gold text-white hover:opacity-90 ml-1">+ Add Perfume</button>
            <button onClick={() => nav("admin")} className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-500 hover:bg-gray-50 relative">
              Admin{pending.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pending.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 py-5 pb-20">

        {/* SUBMIT */}
        {view === "submit" && <SubmitForm onSubmit={handleSubmit} onCancel={() => nav("browse")} />}

        {/* ADMIN */}
        {view === "admin" && <AdminPanel pending={pending} onApprove={handleApprove} onReject={handleReject} onClose={() => nav("browse")} />}

        {/* BROWSE */}
        {view === "browse" && (
          <div>
            <div className="mb-4">
              <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Perfume Directory</h1>
              <p className="text-sm text-gray-500">{allPerfumes.length} fragrances · {brands.length} brands · {allNotes.length} notes</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 flex items-center gap-2 mb-3">
              <span className="text-gray-400">🔍</span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search perfumes, brands, notes..." className="border-none bg-transparent w-full text-sm focus:outline-none" />
              {query && <button onClick={() => setQuery("")} className="w-5 h-5 rounded bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300">×</button>}
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {[[familyFilter, setFamilyFilter, [["all", "All Families"], ...families.map(f => [f, f])]], [genderFilter, setGenderFilter, [["all", "All"], ["Women", "Women"], ["Men", "Men"], ["Unisex", "Unisex"]]], [typeFilter, setTypeFilter, [["all", "All Types"], ["Designer", "Designer"], ["Niche", "Niche"], ["Arabic", "Arabic"], ["Indie", "Indie"], ["Affordable", "Affordable"], ["Celebrity", "Celebrity"]]], [priceFilter, setPriceFilter, [["all", "Any Price"], ["under50", "Under $50"], ["50to150", "$50–150"], ["150to300", "$150–300"], ["over300", "$300+"]]], [sortBy, setSortBy, [["popular", "Top Rated"], ["newest", "Newest"], ["price_low", "Price ↑"], ["price_high", "Price ↓"], ["name", "A→Z"]]]].map(([val, setter, opts], i) => (
                <select key={i} value={val} onChange={e => setter(e.target.value)} className="px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-700 bg-white cursor-pointer focus:outline-none">
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <span className="text-xs text-gray-400 self-center">{filtered.length} results</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filtered.map((p, i) => <PerfumeCard key={p.name + p.brand + i} perfume={p} onClick={() => openPerfume(p)} />)}
            </div>
            {filtered.length === 0 && <div className="text-center py-16 text-gray-400">No perfumes match your filters</div>}
          </div>
        )}

        {/* DETAIL */}
        {view === "detail" && selected && (() => {
          const fc = FAMILY_COLORS[selected.family] || "#6B6560";
          const bt = BRAND_TYPES[selected.brand];
          const similar = getSimilar(selected);
          const grouped = { top: [], heart: [], base: [] };
          selected.notes.forEach(n => { if (grouped[n.position]) grouped[n.position].push(n); });
          Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => b.strength - a.strength));
          const perfReviews = allReviews.filter(r => r.perfume === selected.name);

          return (
            <div className="animate-fade-up">
              <button onClick={() => nav("browse")} className="border border-gray-300 rounded-md px-3.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 mb-4">← Back</button>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-7 flex gap-6 items-start flex-wrap" style={{ background: fc + "0C", borderBottom: `1px solid ${fc}15` }}>
                  <Bottle family={selected.family} size={64} />
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: fc }}>{selected.family} · {selected.concentration} · {selected.year}</div>
                    <h1 className="font-display text-3xl font-semibold text-gray-900 leading-tight">{selected.name}</h1>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span onClick={() => openBrand(selected.brand)} className="text-base text-gray-600 cursor-pointer border-b border-dashed border-gray-400">{selected.brand}</span>
                      {bt && <Badge text={bt} color={TYPE_COLORS[bt]} bg={TYPE_COLORS[bt] + "15"} />}
                      <Badge text={selected.gender} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">${selected.priceLow}{selected.priceHigh !== selected.priceLow && `–$${selected.priceHigh}`}</div>
                    <Stars value={selected.rating} size={16} />
                  </div>
                </div>

                <div className="p-7">
                  {/* Accords FIRST — the overall vibe */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-4">Main Accords</h2>
                    <div className="max-w-md">
                      {selected.accords.map(a => {
                        const ac = { sweet:"#FF0000", warm:"#FF8C00", "warm spicy":"#D2691E", woody:"#8B4513", floral:"#FF1493", fruity:"#FF6347", citrus:"#FFFF00", fresh:"#228B22", musky:"#C0C0C0", powdery:"#DDA0DD", rose:"#FF1493", oud:"#4A2810", amber:"#DAA520", vanilla:"#FFD700", coffee:"#4A2810", leather:"#808080", tobacco:"#8B6040", boozy:"#B8860B", gourmand:"#D2691E", coconut:"#F5E6C8", chocolate:"#6B3410", smoky:"#808080", incense:"#A0522D", clean:"#4682B4", aquatic:"#4682B4", green:"#228B22", salty:"#4682B4", honey:"#FFD700", creamy:"#FFFACD", earthy:"#8B6040", "skin scent":"#D2B48C", dark:"#4A2810", balsamic:"#A0522D", "white floral":"#FFFFFF", "fresh spicy":"#32CD32", cherry:"#DC143C", patchouli:"#556B2F", sandalwood:"#D2B48C", tea:"#228B22", tropical:"#FFA500", berry:"#DC143C", almond:"#D2B48C", iris:"#DDA0DD", fig:"#8B6040", saffron:"#FF8C00", cinnamon:"#D2691E", tuberose:"#FFFFFF", lavender:"#9370DB", apple:"#32CD32", pineapple:"#FFD700", peach:"#FFA07A", plum:"#8B008B", solar:"#FFA500", mineral:"#A9A9A9", resinous:"#A0522D", animalic:"#8B6040", "warm":"#FF8C00" }[a.name] || `hsl(${a.name.length * 37 % 360},60%,50%)`;
                        return (
                          <div key={a.name} className="flex items-center gap-2 mb-2">
                            <div className="w-24 text-sm text-gray-600 font-medium text-right flex-shrink-0 capitalize">{a.name}</div>
                            <div className="flex-1 h-3.5 rounded bg-gray-100 overflow-hidden">
                              <div className="h-full rounded" style={{ width: `${a.strength}%`, background: ac, border: ac === '#FFFFFF' ? '0.5px solid #ddd' : 'none' }} />
                            </div>
                            <div className="w-8 text-xs text-gray-500 text-right font-medium">{a.strength}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes SECOND — the detailed breakdown */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-4">Fragrance Notes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {["top", "heart", "base"].map(pos => grouped[pos].length > 0 && (
                        <div key={pos}>
                          <div className="text-xs font-bold tracking-widest uppercase mb-2.5 flex items-center gap-1.5" style={{ color: NOTE_COLORS[pos] }}>
                            <div className="w-3 h-0.5 rounded" style={{ background: NOTE_COLORS[pos] }} />{NOTE_LABELS[pos]}
                          </div>
                          {grouped[pos].map(n => {
                            const nc = NOTE_COLORS_MAP[n.name] || NOTE_COLORS[pos];
                            return (
                              <div key={n.name} className="flex items-center gap-2 mb-2">
                                <div className="w-24 text-sm text-right font-medium text-gray-700 truncate flex-shrink-0">{n.name}</div>
                                <div className="flex-1 h-4 rounded bg-gray-100 overflow-hidden min-w-[60px]">
                                  <div className="h-full rounded" style={{ width: `${n.strength}%`, background: nc, border: nc === '#FFFFFF' || nc === '#F2F0E8' ? '0.5px solid #ddd' : 'none' }} />
                                </div>
                                <div className="w-8 text-xs text-gray-500 text-right font-medium">{n.strength}%</div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gender Vote Bar */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-3">Gender Leaning</h2>
                    <p className="text-xs text-gray-400 mb-3">How does the community feel this wears?</p>
                    {(() => {
                      const votes = selected.genderVotes || { feminine: 40, masculine: 20, unisex: 40 };
                      const total = votes.feminine + votes.masculine + votes.unisex;
                      const fPct = Math.round(votes.feminine / total * 100);
                      const mPct = Math.round(votes.masculine / total * 100);
                      const uPct = 100 - fPct - mPct;
                      return (
                        <div>
                          <div className="flex rounded-lg overflow-hidden h-10 mb-2" style={{ border: "1px solid #edebe8" }}>
                            <div className="flex items-center justify-center text-xs font-semibold text-white transition-all" style={{ width: `${fPct}%`, background: "linear-gradient(135deg, #E8A4BA, #C4728F)", minWidth: fPct > 5 ? 40 : 0 }}>
                              {fPct > 8 && `${fPct}%`}
                            </div>
                            <div className="flex items-center justify-center text-xs font-semibold transition-all" style={{ width: `${uPct}%`, background: "linear-gradient(135deg, #D4C5A9, #B8A88A)", color: "#6b5b3e", minWidth: uPct > 5 ? 40 : 0 }}>
                              {uPct > 8 && `${uPct}%`}
                            </div>
                            <div className="flex items-center justify-center text-xs font-semibold text-white transition-all" style={{ width: `${mPct}%`, background: "linear-gradient(135deg, #8BAFC4, #4A7A9F)", minWidth: mPct > 5 ? 40 : 0 }}>
                              {mPct > 8 && `${mPct}%`}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs mb-3">
                            <span style={{ color: "#C4728F" }}>♀ Feminine ({fPct}%)</span>
                            <span style={{ color: "#9C8B70" }}>◎ Unisex ({uPct}%)</span>
                            <span style={{ color: "#4A7A9F" }}>♂ Masculine ({mPct}%)</span>
                          </div>
                          <div className="flex gap-2">
                            {[["♀ Feminine", "#C4728F"], ["◎ Unisex", "#9C8B70"], ["♂ Masculine", "#4A7A9F"]].map(([label, color]) => (
                              <button key={label} onClick={() => showToast(`Voted "${label}" for ${selected.name}!`)}
                                className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                                style={{ borderColor: color + "40", color: color, background: color + "08" }}
                                onMouseEnter={e => { e.currentTarget.style.background = color + "15"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = color + "08"; }}>
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-300 mt-2 text-center">{total} votes</div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ═══ COMMUNITY RATING ═══ */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-3">Community Rating</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl font-bold text-gray-900">{selected.rating}</div>
                      <div>
                        <Stars value={selected.rating} size={20} />
                        <div className="text-xs text-gray-400 mt-1">{120 + (selected.id * 17) % 380} ratings</div>
                      </div>
                    </div>
                    {/* Star breakdown */}
                    <div className="max-w-sm">
                      {[5,4,3,2,1].map(star => {
                        const pcts = {5: 35 + (selected.id * 3) % 30, 4: 20 + (selected.id * 7) % 15, 3: 8 + (selected.id * 2) % 10, 2: 2 + (selected.id) % 5, 1: 1 + (selected.id * 5) % 3};
                        return (
                          <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                            <span className="text-xs text-yellow-500">★</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pcts[star]}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 w-8 text-right">{pcts[star]}%</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Rate this perfume */}
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm text-gray-500">Rate this:</span>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} onClick={() => showToast(`You rated ${selected.name} ${s}/5 stars!`)}
                          className="cursor-pointer text-2xl hover:scale-110 transition-transform" style={{ color: "#D4A94B" }}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* ═══ DAY / NIGHT ═══ */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-3">Day or Night?</h2>
                    <p className="text-xs text-gray-400 mb-3">When does the community wear this?</p>
                    {(() => {
                      const dayPct = 25 + (selected.id * 11 + selected.name.length * 3) % 50;
                      const nightPct = 100 - dayPct;
                      return (
                        <div>
                          <div className="flex rounded-lg overflow-hidden h-10 mb-2" style={{ border: "1px solid #edebe8" }}>
                            <div className="flex items-center justify-center text-xs font-semibold transition-all"
                              style={{ width: `${dayPct}%`, background: "linear-gradient(135deg, #F9D976, #F39F86)", color: "#7B5B2E", minWidth: 40 }}>
                              ☀️ {dayPct}%
                            </div>
                            <div className="flex items-center justify-center text-xs font-semibold text-white transition-all"
                              style={{ width: `${nightPct}%`, background: "linear-gradient(135deg, #2C3E6B, #1a1a40)", minWidth: 40 }}>
                              🌙 {nightPct}%
                            </div>
                          </div>
                          <div className="flex justify-between text-xs mb-3">
                            <span style={{ color: "#C4901E" }}>☀️ Daytime ({dayPct}%)</span>
                            <span style={{ color: "#4A5580" }}>🌙 Nighttime ({nightPct}%)</span>
                          </div>
                          <div className="flex gap-2">
                            {[["☀️ Day", "#E8B84A"], ["🌙 Night", "#4A5580"]].map(([label, color]) => (
                              <button key={label} onClick={() => showToast(`Voted "${label}" for ${selected.name}!`)}
                                className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                                style={{ borderColor: color + "40", color: color, background: color + "08" }}
                                onMouseEnter={e => { e.currentTarget.style.background = color + "15"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = color + "08"; }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ═══ SEASONALITY ═══ */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-3">Best Seasons</h2>
                    <p className="text-xs text-gray-400 mb-3">When does this shine? Vote for all that apply.</p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { name: "Spring", icon: "🌸", color: "#E8A4BA", pct: 30 + (selected.id * 7) % 60 },
                        { name: "Summer", icon: "☀️", color: "#E8B84A", pct: 20 + (selected.id * 13) % 55 },
                        { name: "Autumn", icon: "🍂", color: "#C4901E", pct: 35 + (selected.id * 3) % 55 },
                        { name: "Winter", icon: "❄️", color: "#6B8FC4", pct: 25 + (selected.id * 11) % 60 },
                      ].map(s => (
                        <button key={s.name} onClick={() => showToast(`Voted "${s.name}" for ${selected.name}!`)}
                          className="flex flex-col items-center p-3 rounded-xl border transition-all hover:shadow-md"
                          style={{ borderColor: s.pct > 50 ? s.color + "60" : "#edebe8", background: s.pct > 50 ? s.color + "08" : "#fff" }}>
                          <span className="text-2xl mb-1">{s.icon}</span>
                          <span className="text-xs font-semibold" style={{ color: s.color }}>{s.name}</span>
                          <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">{s.pct}%</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ═══ PERFORMANCE: SILLAGE + LONGEVITY ═══ */}
                  <div className="mb-7">
                    <h2 className="font-display text-xl font-semibold mb-3">Performance</h2>
                    <p className="text-xs text-gray-400 mb-4">Community-rated projection and lasting power</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sillage */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">💨</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">Sillage</div>
                            <div className="text-[10px] text-gray-400">How far does it project?</div>
                          </div>
                        </div>
                        {(() => {
                          const levels = ["Intimate", "Moderate", "Strong", "Beast Mode"];
                          const sillageIdx = (selected.id * 7 + selected.name.length) % 4;
                          return (
                            <div>
                              <div className="flex gap-1 mb-2">
                                {levels.map((l, i) => (
                                  <div key={l} className="flex-1 h-3 rounded-full transition-all"
                                    style={{ background: i <= sillageIdx ? "linear-gradient(90deg, #9C8B70, #D4C5A9)" : "#f0ede8" }} />
                                ))}
                              </div>
                              <div className="text-xs font-semibold text-brand-gold text-center">{levels[sillageIdx]}</div>
                              <div className="flex justify-between text-[9px] text-gray-300 mt-1">
                                <span>Intimate</span><span>Beast Mode</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Longevity */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">⏱️</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">Longevity</div>
                            <div className="text-[10px] text-gray-400">How long does it last?</div>
                          </div>
                        </div>
                        {(() => {
                          const levels = ["1-2 hrs", "3-5 hrs", "6-8 hrs", "8-12 hrs", "12+ hrs"];
                          const longevityIdx = (selected.id * 3 + selected.name.length * 2) % 5;
                          const hours = [1.5, 4, 7, 10, 14][longevityIdx];
                          return (
                            <div>
                              <div className="flex gap-1 mb-2">
                                {levels.map((l, i) => (
                                  <div key={l} className="flex-1 h-3 rounded-full transition-all"
                                    style={{ background: i <= longevityIdx ? "linear-gradient(90deg, #7B6348, #B89B70)" : "#f0ede8" }} />
                                ))}
                              </div>
                              <div className="text-xs font-semibold text-center" style={{ color: "#7B6348" }}>{levels[longevityIdx]}</div>
                              <div className="flex justify-between text-[9px] text-gray-300 mt-1">
                                <span>Short</span><span>Very Long</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Vote on performance */}
                    <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Rate Performance</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Sillage</label>
                          <div className="flex gap-1">
                            {["Intimate", "Moderate", "Strong", "Beast"].map(l => (
                              <button key={l} onClick={() => showToast(`Rated sillage "${l}" for ${selected.name}!`)}
                                className="flex-1 py-1.5 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all">
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Longevity</label>
                          <div className="flex gap-1">
                            {["1-2h", "3-5h", "6-8h", "8-12h", "12h+"].map(l => (
                              <button key={l} onClick={() => showToast(`Rated longevity "${l}" for ${selected.name}!`)}
                                className="flex-1 py-1.5 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-500 hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all">
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buy Panel */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-7">
                    <div className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-3">Where to Buy</div>
                    <div className="flex flex-col gap-2">
                      {RETAILERS.map(r => {
                        const q = encodeURIComponent(`${selected.brand} ${selected.name}`);
                        return (
                          <a key={r.name} href={r.url.replace("Q", q)} target="_blank" rel="noopener noreferrer nofollow"
                            className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg no-underline text-gray-900 transition-all hover:shadow-sm"
                            style={{ '--hover-color': r.color }}>
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{r.icon}</span>
                              <div><div className="text-sm font-semibold">{r.name}</div><div className="text-xs text-gray-400">Shop {selected.brand}</div></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: r.color + "12", color: r.color }}>{r.tag}</span>
                              <span className="text-gray-400">→</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-gray-300 mt-2.5 text-center">The Dry Down may earn a commission from purchases</div>
                  </div>

                  {/* Reviews */}
                  {perfReviews.length > 0 && (
                    <div className="mb-7">
                      <h2 className="font-display text-xl font-semibold mb-3">Reviews</h2>
                      {perfReviews.slice(0, 3).map((rv, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-100">
                          <div className="flex justify-between mb-1"><span className="text-sm font-semibold">{rv.user}</span><Stars value={rv.rating} size={11} /></div>
                          <div className="text-sm font-semibold text-gray-800 mb-0.5">{rv.title}</div>
                          <div className="text-sm text-gray-600">{rv.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Similar */}
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3.5">You Might Also Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {similar.map(s => <PerfumeCard key={s.name + s.brand} perfume={s} onClick={() => { setSelected(s); scrollTop(); }} compact />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* REVIEWS */}
        {view === "reviews" && (
          <div>
            <div className="flex justify-between items-end flex-wrap gap-3 mb-5">
              <div>
                <h1 className="font-display text-3xl font-semibold mb-1">Community Reviews</h1>
                <p className="text-sm text-gray-500">{allReviews.length} reviews</p>
              </div>
              <button onClick={() => setShowWriteReview(!showWriteReview)} className="px-4 py-2 rounded-md bg-brand-gold text-white text-sm font-semibold hover:opacity-90">
                {showWriteReview ? "Cancel" : "Write Review"}
              </button>
            </div>
            {showWriteReview && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 animate-fade-up">
                <h3 className="font-display text-lg font-semibold mb-3">Write a Review</h3>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <input value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} placeholder="Your name" className="p-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:border-brand-gold" />
                  <input value={newReview.perfume} onChange={e => setNewReview({ ...newReview, perfume: e.target.value })} placeholder="Perfume name" className="p-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:border-brand-gold" />
                </div>
                <div className="flex gap-2 mb-2.5 items-center">
                  <span className="text-sm text-gray-500">Rating:</span>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} onClick={() => setNewReview({ ...newReview, rating: s })} className="cursor-pointer text-xl" style={{ color: s <= newReview.rating ? "#D4A94B" : "#ddd" }}>★</span>)}
                </div>
                <input value={newReview.title} onChange={e => setNewReview({ ...newReview, title: e.target.value })} placeholder="Review title" className="w-full p-2 rounded-md border border-gray-300 text-sm mb-2.5 focus:outline-none focus:border-brand-gold" />
                <textarea value={newReview.body} onChange={e => setNewReview({ ...newReview, body: e.target.value })} placeholder="Your review..." rows={3} className="w-full p-2 rounded-md border border-gray-300 text-sm mb-2.5 resize-y focus:outline-none focus:border-brand-gold" />
                <button onClick={() => {
                  if (newReview.title && newReview.body && newReview.perfume) {
                    setUserReviews(prev => [...prev, { user: newReview.name || "Anonymous", rating: newReview.rating, perfume: newReview.perfume, title: newReview.title, body: newReview.body, date: "Just now", helpful: 0 }]);
                    setNewReview({ name: "", rating: 5, title: "", body: "", perfume: "" });
                    setShowWriteReview(false);
                    showToast("Review published!");
                  }
                }} className="px-5 py-2 rounded-md bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">Submit</button>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {allReviews.map((rv, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-display text-sm font-semibold text-gray-500">{(rv.user || "A")[0]}</div>
                      <div><div className="text-sm font-semibold">{rv.user}</div><div className="text-xs text-gray-400">{rv.date}</div></div>
                    </div>
                    <Stars value={rv.rating} size={12} />
                  </div>
                  <div className="inline-block px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 mb-1">{rv.perfume}</div>
                  <div className="text-sm font-semibold mb-0.5">{rv.title}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">{rv.body}</p>
                  <button onClick={() => setVoted(p => ({ ...p, [i]: !p[i] }))} className={`border border-gray-200 rounded-md px-2.5 py-1 text-xs cursor-pointer ${voted[i] ? "bg-gray-100 text-brand-gold" : "text-gray-400"}`}>
                    👍 ({voted[i] ? (rv.helpful || 0) + 1 : rv.helpful || 0})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BRANDS */}
        {view === "brands" && (
          <div>
            <h1 className="font-display text-3xl font-semibold mb-5">Brand Directory</h1>
            {["Arabic", "Niche", "Designer", "Indie", "Affordable", "Celebrity"].map(type => {
              const bs = brands.filter(b => b.type === type);
              if (!bs.length) return null;
              return (
                <div key={type} className="mb-6">
                  <h2 className="text-sm font-semibold mb-2.5" style={{ color: TYPE_COLORS[type] || "#6b6560" }}>
                    <Badge text={type} color={TYPE_COLORS[type]} bg={(TYPE_COLORS[type] || "#6b6560") + "15"} />
                    <span className="text-xs text-gray-400 font-normal ml-2">{bs.length} brands</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {bs.map(b => (
                      <div key={b.name} onClick={() => openBrand(b.name)} className="bg-white border border-gray-200 rounded-lg p-3.5 cursor-pointer hover:shadow-sm transition-shadow">
                        <div className="font-display text-sm font-semibold">{b.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.count} perfumes</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {view === "brand" && brandView && (
          <div className="animate-fade-up">
            <button onClick={() => nav("brands")} className="border border-gray-300 rounded-md px-3.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 mb-4">← All Brands</button>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
              <h1 className="font-display text-2xl font-semibold inline">{brandView.name}</h1>
              <span className="ml-2"><Badge text={brandView.type} color={TYPE_COLORS[brandView.type]} bg={(TYPE_COLORS[brandView.type] || "#6b6560") + "15"} /></span>
              <div className="text-sm text-gray-500 mt-1">{brandView.count} perfumes</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {brandView.perfumes.map(p => <PerfumeCard key={p.name} perfume={p} onClick={() => openPerfume(p)} />)}
            </div>
          </div>
        )}

        {/* NOTES */}
        {view === "notes" && (
          <div>
            <h1 className="font-display text-3xl font-semibold mb-1">Notes Explorer</h1>
            <p className="text-sm text-gray-500 mb-5">{allNotes.length} unique notes</p>
            <div className="flex flex-wrap gap-1.5">
              {allNotes.map(n => (
                <span key={n.name} onClick={() => openNote(n.name)} className="px-3.5 py-1.5 rounded-md bg-white border border-gray-200 text-sm text-gray-700 font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                  {n.name} <span className="text-xs text-gray-400">({n.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {view === "note_detail" && noteView && (
          <div className="animate-fade-up">
            <button onClick={() => nav("notes")} className="border border-gray-300 rounded-md px-3.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 mb-4">← All Notes</button>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
              <h1 className="font-display text-2xl font-semibold">{noteView.name}</h1>
              <div className="text-sm text-gray-500 mt-1">Found in {noteView.count} perfumes</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {allPerfumes.filter(p => p.notes.some(n => n.name === noteView.name)).map(p => <PerfumeCard key={p.name + p.brand} perfume={p} onClick={() => openPerfume(p)} />)}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 px-5 py-4 text-center text-xs text-gray-400">
        The Dry Down · {allPerfumes.length} perfumes · {brands.length} brands · {allNotes.length} notes · Dubai · © 2026
      </footer>
    </div>
  );
}
