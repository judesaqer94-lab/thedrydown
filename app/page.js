'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PERFUMES, FAMILIES, ALL_NOTES, BRANDS, NOTE_COLORS_MAP } from '../data/perfumes';
import { supabase } from '../lib/supabase';

function slugify(name, brand) {
  return `${name}-${brand}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ═══ PALETTE ═══ */
const TYPE_COLORS = { Niche: "#8B7A5E", Designer: "#5B7B9B", Arabic: "#B08060", Indie: "#7B9B78", Affordable: "#8B9B8B", Celebrity: "#A07898" };
const FAMILY_COLORS = {
  Floral: "#D291BC", Woody: "#A18062", Oriental: "#D4915B", Fresh: "#7EC8A0",
  Citrus: "#E8D44D", Gourmand: "#CC8855", Fruity: "#E07B7B", Aromatic: "#73C27E",
  Leather: "#8B7355", Aquatic: "#6BB3D9", Smoky: "#8E8E8E", Green: "#73C27E",
  Musky: "#C4B7A6", Chypre: "#7A6B3C",
};
const NOTE_COLORS = { top: "#7EC8A0", heart: "#D291BC", base: "#A18062" };
const NOTE_LABELS = { top: "Top", heart: "Heart", base: "Base" };
const ACCORD_COLORS = {
  sweet:"#E28B90", warm:"#D4915B", "warm spicy":"#C87941", woody:"#A18062", floral:"#D291BC",
  fruity:"#E07B7B", citrus:"#E8D44D", fresh:"#7EC8A0", musky:"#C4B7A6", powdery:"#D8BFD8",
  rose:"#E8ADAD", oud:"#6B4226", amber:"#DDAA44", vanilla:"#F5DEB3", coffee:"#6F4E37",
  leather:"#8B7355", tobacco:"#9B7653", boozy:"#BF9B30", gourmand:"#CC8855", coconut:"#F5E6D3",
  chocolate:"#7B3F00", smoky:"#8E8E8E", incense:"#B5651D", clean:"#87CEEB", aquatic:"#6BB3D9",
  green:"#73C27E", salty:"#7EC8E3", honey:"#EB9E3F", creamy:"#F5E6D3", earthy:"#9B7653",
  cherry:"#DC143C", patchouli:"#7A6B3C", sandalwood:"#C19A6B", tea:"#7EC8A0", iris:"#B19CD9",
  fig:"#9B7653", saffron:"#F4C430", cinnamon:"#D2691E", tuberose:"#F0D0E0", lavender:"#B19CD9",
  "white floral":"#F0D0E0", almond:"#EDDCB1", plum:"#8E4585", peach:"#FFDAB9", mango:"#F4BB44",
  jasmine:"#F8EBB0", orange:"#FFA500", bergamot:"#E8D44D", violet:"#8B7FC7", mint:"#98FF98",
  pepper:"#B5651D", cardamom:"#B5A642", ginger:"#D2A03D", "orange blossom":"#FFD580",
  magnolia:"#F0C0D0", lily:"#F5E6D3", orchid:"#DA70D6", marine:"#6BB3D9", musk:"#C4B7A6",
  cedar:"#A18062", vetiver:"#8B9E5B", tonka:"#C19A6B", benzoin:"#B5651D",
  balsamic:"#B5651D", animalic:"#8B7355", "skin scent":"#E8D5C4", dark:"#4A3728",
  resinous:"#B5651D", tropical:"#FFB347", berry:"#8B3A62", mineral:"#A9A9A9",
  "fresh spicy":"#90C87E", solar:"#F5D76E", aromatic:"#73C27E", ozonic:"#B0E0E6",
  aldehydic:"#E8D5C4", herbal:"#73C27E", juniper:"#6B8E5B", moss:"#6B8E5B",
  cotton:"#E8D5C4", caramel:"#C68E3F", toffee:"#C68E3F", marshmallow:"#F5E6D3",
  "cotton candy":"#FFB6C1", rum:"#BF9B30", spicy:"#C87941", talc:"#E8D5C4",
  apple:"#7EC87E", pineapple:"#F5D76E", camphor:"#B0E0E6"
};

const RETAILERS = [
  { name: "FragranceNet", tag: "Best Price", url: "https://www.fragrancenet.com/search?q=Q&utm_source=thedrydown" },
  { name: "ScentSplit", tag: "Decants", url: "https://www.scentsplit.com/search?q=Q&ref=thedrydown" },
  { name: "Amazon", tag: "Fast Ship", url: "https://www.amazon.com/s?k=Q&tag=thedrydown-20" },
  { name: "Sephora", tag: "Rewards", url: "https://www.sephora.com/search?keyword=Q&utm_source=thedrydown" },
  { name: "Notino", tag: "Global", url: "https://www.notino.com/search/?q=Q&utm_source=thedrydown" },
];

/* ═══ FEEDBACK CONFIG ═══ */
/* Replace this URL with your Google Form link after creating it */


const SEED_REVIEWS = [
  { user: "Nour A.", rating: 5, perfume: "Khamrah", title: "Beast mode for AED 103", body: "Sweet, warm, spicy — lasts 10+ hours. Unbeatable at this price point.", date: "2d ago", helpful: 47 },
  { user: "Layla H.", rating: 5, perfume: "Baccarat Rouge 540", title: "The hype is real", body: "Saffron into ambergris is perfumery at its finest. Worth every dirham.", date: "3d ago", helpful: 62 },
  { user: "Dina R.", rating: 5, perfume: "Cloud", title: "BR540 dupe that delivers", body: "At this price, nothing compares. Sweet, cozy, compliment magnet.", date: "5d ago", helpful: 89 },
  { user: "Fatima Z.", rating: 5, perfume: "Angels' Share", title: "Liquid gold", body: "Cognac cinnamon opening is intoxicating. Kilian nailed this one.", date: "6d ago", helpful: 72 },
  { user: "Rania Q.", rating: 4, perfume: "La Rosée", title: "90% of Delina, 10% the price", body: "Rose and lychee spot on. Lattafa keeps winning.", date: "3d ago", helpful: 94 },
  { user: "Leila F.", rating: 5, perfume: "Grand Soir", title: "Amber perfection", body: "Pure warm amber that envelops you. 12+ hours longevity.", date: "5d ago", helpful: 67 },
  { user: "Yasmin L.", rating: 5, perfume: "Tobacco Vanille", title: "Unisex masterpiece", body: "Date night staple. Rich, warm, addictive.", date: "1w ago", helpful: 55 },
  { user: "Jenna W.", rating: 4, perfume: "Missing Person", title: "Your skin but better", body: "Clean warm skin scent. Office-safe, intimate, beautiful.", date: "2d ago", helpful: 63 },
];

/* ═══ COMPONENTS ═══ */
function Stars({ value, size = 13 }) {
  return <span style={{ color: "#9B8EC4", fontSize: size, letterSpacing: 2 }}>{"★".repeat(Math.floor(value))}{value % 1 >= 0.5 ? "½" : ""}<span style={{ color: "#D8D0C8" }}>{"★".repeat(5 - Math.ceil(value))}</span></span>;
}

function Tag({ children, dark, active, onClick, style, color }) {
  const hasColor = color && !active && !dark;
  return (
    <span onClick={onClick}
      className={`inline-block text-xs tracking-wide uppercase transition-all cursor-default`}
      style={{
        padding: '5px 10px',
        background: active ? '#1A1A1A' : dark ? '#1A1A1A' : hasColor ? color + '12' : 'transparent',
        border: `1px solid ${active ? '#1A1A1A' : hasColor ? color + '40' : '#D8D0C8'}`,
        color: active ? '#FAF8F5' : dark ? '#FAF8F5' : hasColor ? color : '#8C8378',
        fontWeight: 500,
        letterSpacing: '0.06em',
        ...style,
        cursor: onClick ? 'pointer' : 'default',
      }}>
      {children}
    </span>
  );
}

function PerfumeCard({ perfume: p, onClick }) {
  const fc = FAMILY_COLORS[p.family] || '#8C8378';
  const href = `/perfume/${slugify(p.name, p.brand)}`;
  return (
    <a href={href} onClick={onClick} className="cursor-pointer group transition-all block no-underline" style={{ padding: '18px 0', borderBottom: '1px solid #D8D0C8', textDecoration: 'none', color: 'inherit' }}>
      <div className="flex justify-between items-start gap-4">
        {p.image_url && (
          <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden bg-cream">
            <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-serif text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>{p.name}</h3>
            <span className="text-xs text-stone uppercase tracking-wider">{p.year}</span>
          </div>
          <div className="text-sm text-stone mt-1">{p.brand}</div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Tag color={fc}>{p.family}</Tag>
            <Tag>{p.concentration}</Tag>
            <Tag>{p.gender}</Tag>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-serif text-2xl" style={{ letterSpacing: '-0.03em' }}>AED {p.priceLow}</div>
          <div className="mt-1"><Stars value={p.rating} size={11} /></div>
        </div>
      </div>
      <div className="text-xs text-stone mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
        {p.notes.filter(n => n.position === "top").slice(0, 4).map(n => n.name).join(" · ")}
      </div>
    </a>
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

/* ═══ SUBMIT FORM ═══ */
function SubmitForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", brand: "", year: 2025, gender: "Women", concentration: "EDP", family: "Floral", priceLow: "", priceHigh: "", topNotes: "", heartNotes: "", baseNotes: "", accords: "", description: "" });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const families = ["Floral", "Oriental", "Woody", "Aromatic", "Gourmand", "Fruity", "Citrus", "Fresh", "Aquatic", "Leather", "Green"];
  const concs = ["EDT", "EDP", "Extrait", "Parfum", "Cologne", "Body Mist", "Perfume Oil", "Hair Mist", "Elixir"];
  const submit = () => { if (!form.name || !form.brand) { alert("Name and brand are required"); return; } onSubmit({ ...form, priceLow: Number(form.priceLow) || 0, priceHigh: Number(form.priceHigh) || 0 }); };
  const inp = "w-full p-3 border border-faint bg-transparent text-sm focus:border-ink focus:outline-none transition-colors";
  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-serif text-4xl">Submit a Perfume</h2>
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center text-stone hover:text-ink transition-colors text-xl">×</button>
      </div>
      <p className="text-sm text-stone mb-8 leading-relaxed">Help grow The Dry Down. Submit a fragrance and it will be reviewed before going live.</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Name *</label><input value={form.name} onChange={e => u("name", e.target.value)} placeholder="Lost Cherry" className={inp} /></div>
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Brand *</label><input value={form.brand} onChange={e => u("brand", e.target.value)} placeholder="Tom Ford" className={inp} /></div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Year</label><input type="number" value={form.year} onChange={e => u("year", Number(e.target.value))} className={inp} /></div>
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Gender</label><select value={form.gender} onChange={e => u("gender", e.target.value)} className={inp}>{["Women", "Men", "Unisex"].map(g => <option key={g}>{g}</option>)}</select></div>
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Type</label><select value={form.concentration} onChange={e => u("concentration", e.target.value)} className={inp}>{concs.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Family</label><select value={form.family} onChange={e => u("family", e.target.value)} className={inp}>{families.map(f => <option key={f}>{f}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Price Low (AED)</label><input type="number" value={form.priceLow} onChange={e => u("priceLow", e.target.value)} placeholder="330" className={inp} /></div>
        <div><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">Price High (AED)</label><input type="number" value={form.priceHigh} onChange={e => u("priceHigh", e.target.value)} placeholder="480" className={inp} /></div>
      </div>
      {[["Top Notes", "topNotes", "Bergamot, Pink Pepper, Raspberry"], ["Heart Notes", "heartNotes", "Rose, Jasmine, Orange Blossom"], ["Base Notes", "baseNotes", "Vanilla, Musk, Sandalwood"], ["Main Accords", "accords", "floral, sweet, warm, powdery"]].map(([label, key, ph]) => (
        <div key={key} className="mb-4"><label className="block text-xs text-stone uppercase tracking-widest mb-2 font-medium">{label}</label><input value={form[key]} onChange={e => u(key, e.target.value)} placeholder={ph} className={inp} /></div>
      ))}
      <div className="flex gap-3 mt-8">
        <button onClick={onCancel} className="px-6 py-3 text-sm font-medium text-stone border border-faint hover:border-stone transition-colors">Cancel</button>
        <button onClick={submit} className="px-8 py-3 text-sm font-medium bg-ink text-paper hover:opacity-80 transition-opacity">Submit for Review</button>
      </div>
    </div>
  );
}

/* ═══ ADMIN PANEL ═══ */
function AdminPanel({ pending, onApprove, onReject, onClose }) {
  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-4xl">Admin Panel</h2>
          <p className="text-sm text-stone mt-2">Review community submissions</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-stone hover:text-ink text-xl">×</button>
      </div>
      {pending.length === 0 ? (
        <div className="py-16 text-stone text-center">
          <div className="font-serif text-2xl italic mb-2">All clear</div>
          <div className="text-sm">No pending submissions</div>
        </div>
      ) : pending.map((p, i) => (
        <div key={i} className="border-b border-faint py-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-serif text-xl">{p.name}</span>
              <span className="text-stone ml-2 text-sm">by {p.brand}</span>
            </div>
            <div className="flex gap-1.5"><Tag>{p.family}</Tag><Tag>{p.gender}</Tag></div>
          </div>
          <div className="text-xs text-stone space-y-1 mb-4">
            <div><span className="uppercase tracking-wider text-stone/60">Top:</span> {p.topNotes}</div>
            <div><span className="uppercase tracking-wider text-stone/60">Heart:</span> {p.heartNotes}</div>
            <div><span className="uppercase tracking-wider text-stone/60">Base:</span> {p.baseNotes}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onApprove(i)} className="px-5 py-2 text-xs font-medium bg-ink text-paper hover:opacity-80">Approve</button>
            <button onClick={() => onReject(i)} className="px-5 py-2 text-xs font-medium border border-faint text-stone hover:border-stone">Reject</button>
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
  const [dbVotes, setDbVotes] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const nav = (v) => { setView(v); scrollTop(); };

  // Check admin mode: only show admin when visiting thedrydown.io?admin=true
  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).get('admin') === 'true');
  }, []);

  // Load perfumes + reviews + pending submissions + votes from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [perfRes, revRes, subRes, voteRes] = await Promise.all([
          supabase.from('perfumes').select('*').order('brand', { ascending: true }),
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
          supabase.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
          supabase.from('votes').select('*'),
        ]);
        // Load perfumes from Supabase if available
        if (perfRes.data && perfRes.data.length > 0) {
          const loaded = perfRes.data.map((p, idx) => ({
            id: p.id, name: p.name, brand: p.brand, year: p.year, gender: p.gender || 'Unisex',
            concentration: p.concentration || 'EDP', family: p.family || '',
            priceLow: p.price_low || 0, priceHigh: p.price_high || 0,
            notes: [
              ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: 'top', strength: 70 + (idx * 7 + n.length * 3) % 25 })),
              ...(p.heart_notes || '').split(',').map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: 'heart', strength: 55 + (idx * 5 + n.length * 7) % 30 })),
              ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: 'base', strength: 50 + (idx * 3 + n.length * 11) % 35 })),
            ],
            accords: (p.main_accords || '').split(',').map(a => a.trim()).filter(Boolean).map((a, i) => ({ name: a, strength: Math.max(30, 90 - i * 12 + (a.length * 3) % 8) })),
            rating: Number(p.rating) || 4.0,
            brandType: p.brand_type || 'Unknown',
            image_url: p.image_url || null,
            genderVotes: { feminine: 30 + (idx * 13) % 40, masculine: 10 + (idx * 7) % 30, unisex: 20 + (idx * 11) % 40 },
          }));
          setAllPerfumes(loaded);
        }
        if (revRes.data) setUserReviews(revRes.data.map(r => ({
          user: r.user_name, rating: r.rating, perfume: r.perfume_name,
          title: r.title, body: r.body, date: new Date(r.created_at).toLocaleDateString(), helpful: r.helpful || 0, id: r.id
        })));
        if (subRes.data) setPending(subRes.data);
        if (voteRes.data) {
          const grouped = {};
          voteRes.data.forEach(v => {
            const key = `${v.perfume_name}:${v.vote_type}`;
            if (!grouped[key]) grouped[key] = {};
            grouped[key][v.vote_value] = (grouped[key][v.vote_value] || 0) + 1;
          });
          setDbVotes(grouped);
        }
      } catch (e) { console.log('Supabase load error:', e); }
    }
    loadData();
  }, []);

  // Submit perfume → Supabase
  const handleSubmit = useCallback(async (form) => {
    try {
      const { error } = await supabase.from('submissions').insert({
        name: form.name, brand: form.brand, year: form.year, gender: form.gender,
        concentration: form.concentration, family: form.family,
        price_low: Number(form.priceLow) || 0, price_high: Number(form.priceHigh) || 0,
        top_notes: form.topNotes, heart_notes: form.heartNotes,
        base_notes: form.baseNotes, accords: form.accords, description: form.description,
      });
      if (error) throw error;
      nav("browse");
      showToast("Perfume submitted for review!");
      // Reload pending
      const { data } = await supabase.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (data) setPending(data);
    } catch (e) {
      console.error('Submit error:', e);
      showToast("Error submitting — try again");
    }
  }, [showToast]);

  // Approve submission → update status in Supabase
  const handleApprove = useCallback(async (idx) => {
    const p = pending[idx];
    try {
      await supabase.from('submissions').update({ status: 'approved' }).eq('id', p.id);
      const newP = {
        id: allPerfumes.length, name: p.name, brand: p.brand, year: p.year, gender: p.gender,
        concentration: p.concentration, family: p.family, priceLow: p.price_low, priceHigh: p.price_high, rating: 4.0,
        notes: [
          ...(p.top_notes || "").split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "top", strength: 75 })),
          ...(p.heart_notes || "").split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "heart", strength: 65 })),
          ...(p.base_notes || "").split(",").map(n => n.trim()).filter(Boolean).map(n => ({ name: n, position: "base", strength: 60 })),
        ],
        accords: (p.accords || "").split(",").map(a => a.trim()).filter(Boolean).map((a, i) => ({ name: a, strength: 90 - i * 15 })),
      };
      setAllPerfumes(prev => [...prev, newP]);
      setPending(prev => prev.filter((_, i) => i !== idx));
      showToast(`${p.name} approved`);
    } catch (e) { console.error('Approve error:', e); }
  }, [pending, allPerfumes, showToast]);

  // Reject submission
  const handleReject = useCallback(async (idx) => {
    const p = pending[idx];
    try {
      await supabase.from('submissions').update({ status: 'rejected' }).eq('id', p.id);
      setPending(prev => prev.filter((_, i) => i !== idx));
      showToast("Submission rejected");
    } catch (e) { console.error('Reject error:', e); }
  }, [pending, showToast]);

  // Submit review → Supabase
  const submitReview = useCallback(async () => {
    if (!newReview.title || !newReview.body || !newReview.perfume) return;
    try {
      const { data, error } = await supabase.from('reviews').insert({
        user_name: newReview.name || "Anonymous",
        perfume_name: newReview.perfume,
        rating: newReview.rating,
        title: newReview.title,
        body: newReview.body,
      }).select();
      if (error) throw error;
      if (data && data[0]) {
        setUserReviews(prev => [{ user: data[0].user_name, rating: data[0].rating, perfume: data[0].perfume_name, title: data[0].title, body: data[0].body, date: "Just now", helpful: 0, id: data[0].id }, ...prev]);
      }
      setNewReview({ name: "", rating: 5, title: "", body: "", perfume: "" });
      setShowWriteReview(false);
      showToast("Review published!");
    } catch (e) {
      console.error('Review error:', e);
      showToast("Error publishing review");
    }
  }, [newReview, showToast]);

  // Submit vote → Supabase
  const submitVote = useCallback(async (perfumeName, voteType, voteValue) => {
    const voteKey = `${perfumeName}:${voteType}:${voteValue}`;
    if (voted[voteKey]) return;
    try {
      await supabase.from('votes').insert({ perfume_name: perfumeName, vote_type: voteType, vote_value: voteValue });
      setVoted(prev => ({ ...prev, [voteKey]: true }));
      setDbVotes(prev => {
        const key = `${perfumeName}:${voteType}`;
        const existing = prev[key] || {};
        return { ...prev, [key]: { ...existing, [voteValue]: (existing[voteValue] || 0) + 1 } };
      });
      showToast(`Voted ${voteValue} for ${perfumeName}`);
    } catch (e) { console.error('Vote error:', e); }
  }, [voted, showToast]);

  // Helpful vote on review → Supabase
  const toggleHelpful = useCallback(async (reviewId, currentCount) => {
    const key = `helpful_${reviewId}`;
    if (voted[key]) return;
    try {
      await supabase.from('reviews').update({ helpful: (currentCount || 0) + 1 }).eq('id', reviewId);
      setVoted(prev => ({ ...prev, [key]: true }));
      setUserReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
      showToast("Marked as helpful");
    } catch (e) { console.error('Helpful error:', e); }
  }, [voted, showToast]);

  const brands = useMemo(() => {
    const m = {};
    allPerfumes.forEach(p => {
      if (!m[p.brand]) m[p.brand] = { name: p.brand, type: p.brandType || "Unknown", count: 0, perfumes: [] };
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
      if (typeFilter !== "all" && (p.brandType || "") !== typeFilter) return false;
      if (priceFilter === "under200" && p.priceLow >= 200) return false;
      if (priceFilter === "200to550" && (p.priceLow < 200 || p.priceLow >= 550)) return false;
      if (priceFilter === "550to1100" && (p.priceLow < 550 || p.priceLow >= 1100)) return false;
      if (priceFilter === "over1100" && p.priceLow < 1100) return false;
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

  const selClass = "text-xs uppercase tracking-widest font-medium cursor-pointer transition-colors px-3 py-2 border";

  return (
    <div className="min-h-screen">
      {/* TOAST */}
      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ink text-paper px-8 py-3.5 text-sm font-medium z-50 animate-slide-up max-w-[90%] text-center tracking-wide">{toast}</div>}

      {/* NAV */}
      <nav className="border-b border-faint sticky top-0 z-40 bg-paper/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <div onClick={() => nav("browse")} className="cursor-pointer select-none">
            <span className="font-serif text-2xl tracking-tight">The </span>
            <span className="font-serif text-2xl italic" style={{ color: '#9B8EC4' }}>Dry</span>
            <span className="font-serif text-2xl tracking-tight"> Down</span>
          </div>
          <div className="flex items-center gap-6">
            {[["browse", "Directory"], ["reviews", "Reviews"], ["brands", "Brands"], ["notes", "Notes"]].map(([id, label]) => (
              <button key={id} onClick={() => nav(id)}
                className={`text-xs uppercase tracking-widest font-medium transition-colors ${(view === id || (view === "detail" && id === "browse") || (view === "brand" && id === "brands") || (view === "note_detail" && id === "notes")) ? "text-ink" : "text-stone hover:text-ink"}`}>
                {label}
              </button>
            ))}
            <button onClick={() => nav("submit")} className="text-xs uppercase tracking-widest font-medium bg-ink text-paper px-4 py-2 hover:opacity-80 transition-opacity">+ Suggest</button>
            {isAdmin && <button onClick={() => nav("admin")} className="text-xs uppercase tracking-widest font-medium text-stone hover:text-ink transition-colors relative">
              Admin{pending.length > 0 && <span className="absolute -top-1 -right-3 bg-accent text-paper text-[9px] font-bold w-4 h-4 flex items-center justify-center">{pending.length}</span>}
            </button>}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 pb-24">

        {/* SUBMIT */}
        {view === "submit" && <SubmitForm onSubmit={handleSubmit} onCancel={() => nav("browse")} />}

        {/* ADMIN */}
        {view === "admin" && <AdminPanel pending={pending} onApprove={handleApprove} onReject={handleReject} onClose={() => nav("browse")} />}

        {/* ═══ BROWSE ═══ */}
        {view === "browse" && (
          <div className="animate-fade-up">
            {/* Hero */}
            <div className="mb-10 pt-4">
              <h1 className="font-serif text-6xl leading-none tracking-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
                Fragrance<br /><span className="italic" style={{ color: '#9B8EC4' }}>Directory</span>
              </h1>
              <p className="text-stone text-sm mt-4">{allPerfumes.length} fragrances · {brands.length} brands · {allNotes.length} notes</p>
            </div>

            {/* Search */}
            <div className="border-b border-ink pb-2 mb-6 flex items-center gap-3">
              <span className="text-stone text-sm">Search</span>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="name, brand, note, accord..."
                className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-faint" style={{ letterSpacing: '-0.01em' }} />
              {query && <button onClick={() => setQuery("")} className="text-stone hover:text-ink text-sm transition-colors">Clear</button>}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap mb-8">
              {[[familyFilter, setFamilyFilter, [["all", "All"], ...families.map(f => [f, f])]], [genderFilter, setGenderFilter, [["all", "All"], ["Women", "Women"], ["Men", "Men"], ["Unisex", "Unisex"]]], [typeFilter, setTypeFilter, [["all", "Type"], ["Designer", "Designer"], ["Niche", "Niche"], ["Arabic", "Arabic"], ["Indie", "Indie"], ["Affordable", "Affordable"], ["Celebrity", "Celebrity"]]], [priceFilter, setPriceFilter, [["all", "Price"], ["under200", "<AED 200"], ["200to550", "AED 200–550"], ["550to1100", "AED 550–1,100"], ["over1100", "AED 1,100+"]]], [sortBy, setSortBy, [["popular", "Top Rated"], ["newest", "Newest"], ["price_low", "Price ↑"], ["price_high", "Price ↓"], ["name", "A–Z"]]]].map(([val, setter, opts], i) => (
                <select key={i} value={val} onChange={e => setter(e.target.value)}
                  className="text-xs uppercase tracking-widest font-medium cursor-pointer bg-transparent border border-faint px-3 py-2 text-ink focus:outline-none focus:border-ink transition-colors" style={{ WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 24, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238C8378'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <span className="text-xs text-stone self-center ml-2">{filtered.length} results</span>
            </div>

            {/* List */}
            <div>
              {filtered.map((p, i) => <PerfumeCard key={p.name + p.brand + i} perfume={p} />)}
            </div>
            {filtered.length === 0 && <div className="py-20 text-center text-stone font-serif text-2xl italic">No results</div>}
          </div>
        )}

        {/* ═══ DETAIL ═══ */}
        {view === "detail" && selected && (() => {
          const bt = selected.brandType;
          const similar = getSimilar(selected);
          const grouped = { top: [], heart: [], base: [] };
          selected.notes.forEach(n => { if (grouped[n.position]) grouped[n.position].push(n); });
          Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => b.strength - a.strength));
          const perfReviews = allReviews.filter(r => r.perfume === selected.name);

          return (
            <div className="animate-fade-up">
              <button onClick={() => nav("browse")} className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block">← Back to Directory</button>

              {/* Hero header */}
              <div className="mb-12">
                <div className="flex gap-6 items-start">
                  {selected.image_url && (
                    <div className="flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden bg-cream">
                      <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Tag color={FAMILY_COLORS[selected.family]}>{selected.family}</Tag>
                      <Tag>{selected.concentration}</Tag>
                      <Tag>{selected.gender}</Tag>
                      {bt && <Tag color={TYPE_COLORS[bt]}>{bt}</Tag>}
                      <Tag>{selected.year}</Tag>
                    </div>
                    <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>{selected.name}</h1>
                    <div className="flex items-center gap-4 mt-3">
                      <span onClick={() => openBrand(selected.brand)} className="text-lg text-stone cursor-pointer hover:text-ink transition-colors" style={{ borderBottom: '1px solid #D8D0C8' }}>{selected.brand}</span>
                      <span className="text-stone">·</span>
                      <span className="font-serif text-2xl">AED {selected.priceLow}{selected.priceHigh !== selected.priceLow && `–${selected.priceHigh}`}</span>
                      <span className="text-stone">·</span>
                      <Stars value={selected.rating} size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                {/* LEFT: Accords */}
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6 pb-2 border-b border-faint">Main Accords</h2>
                  {selected.accords.map(a => {
                    const ac = ACCORD_COLORS[a.name] || `hsl(${a.name.length * 37 % 360},40%,45%)`;
                    return (
                      <div key={a.name} className="flex items-center gap-3 mb-3">
                        <div className="w-28 text-xs text-stone text-right capitalize flex-shrink-0">{a.name}</div>
                        <div className="flex-1 h-2 bg-cream overflow-hidden">
                          <div className="h-full bar-fill" style={{ width: `${a.strength}%`, background: ac }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT: Notes */}
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6 pb-2 border-b border-faint">Fragrance Notes</h2>
                  {["top", "heart", "base"].map(pos => grouped[pos].length > 0 && (
                    <div key={pos} className="mb-5">
                      <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: NOTE_COLORS[pos] }}>
                        {NOTE_LABELS[pos]}
                      </div>
                      {grouped[pos].map(n => {
                        const nc = NOTE_COLORS_MAP[n.name] || NOTE_COLORS[pos];
                        return (
                          <div key={n.name} className="flex items-center gap-3 mb-2">
                            <div className="w-28 text-xs text-stone text-right truncate flex-shrink-0">{n.name}</div>
                            <div className="flex-1 h-2 bg-cream overflow-hidden">
                              <div className="h-full bar-fill" style={{ width: `${n.strength}%`, background: nc, border: nc === '#FFFFFF' || nc === '#F2F0E8' ? '1px solid #ddd' : 'none' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Data — grid */}
              <div className="border-t border-faint pt-10 mb-12">
                <h2 className="font-serif text-3xl mb-8">Community</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {/* Rating */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Rating</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-5xl">{selected.rating}</span>
                      <span className="text-stone text-sm">/ 5</span>
                    </div>
                    <div className="mt-2"><Stars value={selected.rating} size={16} /></div>
                    <div className="text-xs text-stone mt-2">{120 + (selected.id * 17) % 380} ratings</div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-stone">Rate:</span>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} onClick={() => { submitVote(selected.name, 'rating', String(s)); showToast(`Rated ${selected.name} ${s}/5`); }}
                          className="cursor-pointer text-lg hover:scale-110 transition-transform" style={{ color: "#9B8EC4" }}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Gender Leaning</div>
                    {(() => {
                      const votes = selected.genderVotes || { feminine: 40, masculine: 20, unisex: 40 };
                      const total = votes.feminine + votes.masculine + votes.unisex;
                      const fPct = Math.round(votes.feminine / total * 100);
                      const mPct = Math.round(votes.masculine / total * 100);
                      const uPct = 100 - fPct - mPct;
                      return (
                        <div>
                          <div className="flex overflow-hidden h-2 mb-3">
                            <div style={{ width: `${fPct}%`, background: '#A0657B' }} />
                            <div style={{ width: `${uPct}%`, background: '#C4A882' }} />
                            <div style={{ width: `${mPct}%`, background: '#4A7090' }} />
                          </div>
                          <div className="flex justify-between text-xs text-stone">
                            <span>Feminine {fPct}%</span>
                            <span>Unisex {uPct}%</span>
                            <span>Masculine {mPct}%</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {[["Feminine", "#A0657B"], ["Unisex", "#C4A882"], ["Masculine", "#4A7090"]].map(([label, color]) => (
                              <button key={label} onClick={() => submitVote(selected.name, 'gender', label)}
                                className="flex-1 py-2 text-xs font-medium border border-faint hover:border-stone transition-colors"
                                style={{ color }}>{label}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Day/Night */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Day or Night</div>
                    {(() => {
                      const dayPct = 25 + (selected.id * 11 + selected.name.length * 3) % 50;
                      const nightPct = 100 - dayPct;
                      return (
                        <div>
                          <div className="flex overflow-hidden h-2 mb-3">
                            <div style={{ width: `${dayPct}%`, background: '#D4A060' }} />
                            <div style={{ width: `${nightPct}%`, background: '#2C3E6B' }} />
                          </div>
                          <div className="flex justify-between text-xs text-stone">
                            <span>Day {dayPct}%</span>
                            <span>Night {nightPct}%</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {[["Day", "#D4A060"], ["Night", "#2C3E6B"]].map(([label, color]) => (
                              <button key={label} onClick={() => submitVote(selected.name, 'daynight', label)}
                                className="flex-1 py-2 text-xs font-medium border border-faint hover:border-stone transition-colors"
                                style={{ color }}>{label}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Seasons + Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  {/* Seasons */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Best Seasons</div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { name: "Spring", color: "#A0657B", pct: 30 + (selected.id * 7) % 60 },
                        { name: "Summer", color: "#D4A060", pct: 20 + (selected.id * 13) % 55 },
                        { name: "Autumn", color: "#C4956B", pct: 35 + (selected.id * 3) % 55 },
                        { name: "Winter", color: "#4A7090", pct: 25 + (selected.id * 11) % 60 },
                      ].map(s => (
                        <button key={s.name} onClick={() => submitVote(selected.name, 'season', s.name)}
                          className="text-center py-3 border border-faint hover:border-stone transition-colors">
                          <div className="text-xs font-medium mb-2" style={{ color: s.color }}>{s.name}</div>
                          <div className="mx-auto w-8 h-1 bg-cream overflow-hidden">
                            <div className="h-full" style={{ width: `${s.pct}%`, background: s.color }} />
                          </div>
                          <div className="text-[10px] text-stone mt-1">{s.pct}%</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone font-medium mb-4">Performance</div>
                    <div className="space-y-4">
                      {[
                        { label: "Sillage", levels: ["Intimate", "Moderate", "Strong", "Beast"], idx: (selected.id * 7 + selected.name.length) % 4 },
                        { label: "Longevity", levels: ["2–4h", "4–6h", "6–10h", "10h+"], idx: (selected.id * 3 + selected.name.length * 2) % 4 },
                      ].map(perf => (
                        <div key={perf.label}>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-stone">{perf.label}</span>
                            <span className="font-medium">{perf.levels[perf.idx]}</span>
                          </div>
                          <div className="flex gap-1">
                            {perf.levels.map((l, i) => (
                              <div key={l} className="flex-1 h-1.5 transition-all"
                                style={{ background: i <= perf.idx ? '#9B8EC4' : '#EDE7DF' }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Where to Buy */}
              <div className="border-t border-faint pt-10 mb-12">
                <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Where to Buy</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {RETAILERS.map(r => (
                    <a key={r.name} href={r.url.replace("Q", encodeURIComponent(selected.name + " " + selected.brand))} target="_blank" rel="noopener noreferrer"
                      className="text-center py-3 border border-faint hover:border-ink transition-colors">
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-[10px] text-stone mt-0.5">{r.tag}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Reviews for this perfume */}
              {perfReviews.length > 0 && (
                <div className="border-t border-faint pt-10 mb-12">
                  <h2 className="text-xs uppercase tracking-widest text-stone font-medium mb-6">Reviews</h2>
                  {perfReviews.map((rv, i) => (
                    <div key={i} className="border-b border-faint py-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cream flex items-center justify-center text-sm font-medium text-stone">{(rv.user || "A")[0]}</div>
                          <div><div className="text-sm font-medium">{rv.user}</div><div className="text-xs text-stone">{rv.date}</div></div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-faint">
                  {similar.map(p => <PerfumeCard key={p.name + p.brand} perfume={p} />)}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ REVIEWS ═══ */}
        {view === "reviews" && (
          <div className="animate-fade-up">
            <div className="mb-8 pt-4">
              <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
                Community<br /><span className="italic" style={{ color: '#9B8EC4' }}>Reviews</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-faint">
              <button onClick={() => setShowWriteReview(!showWriteReview)} className="text-xs uppercase tracking-widest font-medium bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity">Write a Review</button>
              <div className="flex gap-2 ml-auto">
                {[["helpful", "Most Helpful"], ["rating", "Top Rated"]].map(([v, l]) => (
                  <button key={v} onClick={() => setReviewSort(v)}
                    className={`text-xs uppercase tracking-widest font-medium px-3 py-2 border transition-colors ${reviewSort === v ? "border-ink text-ink" : "border-faint text-stone hover:border-stone"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {showWriteReview && (
              <div className="border-b border-faint pb-8 mb-6 animate-fade-up">
                <div className="max-w-lg">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} placeholder="Your name" className="p-3 border border-faint bg-transparent text-sm focus:border-ink focus:outline-none" />
                    <input value={newReview.perfume} onChange={e => setNewReview({ ...newReview, perfume: e.target.value })} placeholder="Perfume name" className="p-3 border border-faint bg-transparent text-sm focus:border-ink focus:outline-none" />
                  </div>
                  <div className="flex gap-1 mb-3 items-center">
                    <span className="text-xs text-stone mr-2">Rating:</span>
                    {[1, 2, 3, 4, 5].map(s => <span key={s} onClick={() => setNewReview({ ...newReview, rating: s })} className="cursor-pointer text-lg" style={{ color: s <= newReview.rating ? "#9B8EC4" : "#D8D0C8" }}>★</span>)}
                  </div>
                  <input value={newReview.title} onChange={e => setNewReview({ ...newReview, title: e.target.value })} placeholder="Review title" className="w-full p-3 border border-faint bg-transparent text-sm mb-3 focus:border-ink focus:outline-none" />
                  <textarea value={newReview.body} onChange={e => setNewReview({ ...newReview, body: e.target.value })} placeholder="Your review..." rows={3} className="w-full p-3 border border-faint bg-transparent text-sm mb-3 resize-y focus:border-ink focus:outline-none" />
                  <button onClick={submitReview} className="px-6 py-2.5 text-sm font-medium bg-ink text-paper hover:opacity-80">Publish</button>
                </div>
              </div>
            )}
            <div>
              {allReviews.map((rv, i) => (
                <div key={i} className="border-b border-faint py-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-cream flex items-center justify-center text-sm font-medium text-stone">{(rv.user || "A")[0]}</div>
                      <div><div className="text-sm font-medium">{rv.user}</div><div className="text-xs text-stone">{rv.date}</div></div>
                    </div>
                    <Stars value={rv.rating} size={12} />
                  </div>
                  <Tag style={{ marginBottom: 8 }}>{rv.perfume}</Tag>
                  <div className="text-sm font-medium mt-2 mb-1">{rv.title}</div>
                  <p className="text-sm text-stone leading-relaxed mb-3">{rv.body}</p>
                  <button onClick={() => setVoted(p => ({ ...p, [i]: !p[i] }))}
                    className={`text-xs border border-faint px-3 py-1.5 transition-colors ${voted[i] ? "border-accent text-accent" : "text-stone hover:border-stone"}`}>
                    Helpful ({voted[i] ? (rv.helpful || 0) + 1 : rv.helpful || 0})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ BRANDS ═══ */}
        {view === "brands" && (
          <div className="animate-fade-up">
            <div className="mb-10 pt-4">
              <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
                Brand<br /><span className="italic" style={{ color: '#9B8EC4' }}>Directory</span>
              </h1>
            </div>
            {["Arabic", "Niche", "Designer", "Indie", "Affordable", "Celebrity"].map(type => {
              const bs = brands.filter(b => b.type === type);
              if (!bs.length) return null;
              return (
                <div key={type} className="mb-10">
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-faint">
                    <h2 className="text-xs uppercase tracking-widest font-medium" style={{ color: TYPE_COLORS[type] || "#8C8378" }}>{type}</h2>
                    <span className="text-xs text-stone">{bs.length} brands</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint">
                    {bs.map(b => (
                      <div key={b.name} onClick={() => openBrand(b.name)} className="bg-paper p-4 cursor-pointer hover:bg-cream transition-colors">
                        <div className="text-sm font-medium">{b.name}</div>
                        <div className="text-xs text-stone mt-1">{b.count} fragrances</div>
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
            <button onClick={() => nav("brands")} className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block">← All Brands</button>
            <div className="mb-8">
              <h1 className="font-serif text-4xl mb-2">{brandView.name}</h1>
              <div className="flex items-center gap-3">
                <Tag>{brandView.type}</Tag>
                <span className="text-sm text-stone">{brandView.count} fragrances</span>
              </div>
            </div>
            <div className="border-t border-faint">
              {brandView.perfumes.map(p => <PerfumeCard key={p.name} perfume={p} />)}
            </div>
          </div>
        )}

        {/* ═══ NOTES ═══ */}
        {view === "notes" && (
          <div className="animate-fade-up">
            <div className="mb-10 pt-4">
              <h1 className="font-serif text-5xl leading-none mb-3" style={{ letterSpacing: '-0.03em' }}>
                Notes<br /><span className="italic" style={{ color: '#9B8EC4' }}>Explorer</span>
              </h1>
              <p className="text-sm text-stone mt-3">{allNotes.length} unique notes</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allNotes.map(n => (
                <a key={n.name} href={`/note/${encodeURIComponent(n.name.toLowerCase())}`}
                  className="px-3 py-1.5 border border-faint text-sm cursor-pointer hover:border-ink hover:bg-cream transition-all no-underline text-inherit">
                  {n.name} <span className="text-xs text-stone">{n.count}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        {view === "note_detail" && noteView && (
          <div className="animate-fade-up">
            <button onClick={() => nav("notes")} className="text-xs uppercase tracking-widest text-stone hover:text-ink transition-colors mb-8 inline-block">← All Notes</button>
            <div className="mb-8">
              <h1 className="font-serif text-4xl mb-2">{noteView.name}</h1>
              <p className="text-sm text-stone">Found in {noteView.count} fragrances</p>
            </div>
            <div className="border-t border-faint">
              {allPerfumes.filter(p => p.notes.some(n => n.name === noteView.name)).map(p => <PerfumeCard key={p.name + p.brand} perfume={p} />)}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-lite px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start flex-wrap gap-6">
            <div>
              <div className="mb-3">
                <span className="font-serif text-lg">the </span>
                <span className="font-serif text-lg italic" style={{ color: '#9B8EC4' }}>dry</span>
                <span className="font-serif text-lg"> down</span>
              </div>
              <p className="text-xs text-mid leading-relaxed max-w-xs">A fragrance directory built for the community. Discover notes, accords, and your next signature scent.</p>
            </div>
            <div className="flex gap-8">
              <div>
                <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3">Explore</div>
                <div className="flex flex-col gap-1.5">
                  <span onClick={() => nav("browse")} className="text-xs text-mid hover:text-ink cursor-pointer transition-colors">Directory</span>
                  <span onClick={() => nav("brands")} className="text-xs text-mid hover:text-ink cursor-pointer transition-colors">Brands</span>
                  <span onClick={() => nav("notes")} className="text-xs text-mid hover:text-ink cursor-pointer transition-colors">Notes</span>
                  <span onClick={() => nav("reviews")} className="text-xs text-mid hover:text-ink cursor-pointer transition-colors">Reviews</span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3">Community</div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => nav("submit")} className="text-xs uppercase tracking-widest font-medium bg-ink text-paper px-4 py-2 hover:opacity-80 transition-opacity">+ Suggest</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-lite flex justify-between items-center">
            <div className="text-xs text-mid">{allPerfumes.length} fragrances · {brands.length} brands · Dubai</div>
            <div className="text-xs text-mid">© 2026 The Dry Down</div>
          </div>
        </div>
      </footer>
    </div>
  );
}