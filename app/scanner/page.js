'use client';
import { useState, useRef, useCallback } from 'react';
import { PERFUMES, BRAND_TYPES } from '../../data/perfumes';

function findPerfume(brand, fragrance) {
  const b = (brand || '').toLowerCase().trim();
  const f = (fragrance || '').toLowerCase().trim();
  let match = PERFUMES.find(p => p.brand.toLowerCase() === b && p.name.toLowerCase() === f);
  if (match) return match;
  match = PERFUMES.find(p => p.name.toLowerCase() === f && p.brand.toLowerCase().includes(b));
  if (match) return match;
  match = PERFUMES.find(p => (p.brand.toLowerCase().includes(b) || b.includes(p.brand.toLowerCase())) && (p.name.toLowerCase().includes(f) || f.includes(p.name.toLowerCase())));
  if (match) return match;
  match = PERFUMES.find(p => p.name.toLowerCase() === f);
  if (match) return match;
  match = PERFUMES.find(p => f.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(f));
  return match || null;
}

function makeSlug(perfume) {
  const name = perfume.name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const brand = perfume.brand.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return name + '-' + brand;
}

function logMiss(identified) {
  fetch('/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logMiss: true, brand: identified.brand, fragrance: identified.fragrance, concentration: identified.concentration, confidence: identified.confidence }),
  }).catch(function() {});
}

function StarRating({ rating }) {
  var full = Math.floor(rating);
  var half = rating % 1 >= 0.25;
  var empty = 5 - full - (half ? 1 : 0);
  return <span style={{ color: '#9B8EC4', fontSize: 16, letterSpacing: 1 }}>{'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}</span>;
}

function NoteBar({ name, strength, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{ width: 90, textAlign: 'right', fontSize: 12, color: '#78716C' }}>{name}</div>
      <div style={{ flex: 1, height: 8, background: '#F0ECF4', borderRadius: 4, overflow: 'hidden' }}>
        <div className="bar-fill" style={{ width: strength + '%', height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function AccordBar({ name, strength }) {
  var colors = { woody: '#DAA520', amber: '#DAA520', 'warm spicy': '#D2691E', sweet: '#E8A87C', musky: '#C0C0C0', floral: '#FF69B4', citrus: '#FFD700', fresh: '#4ECDC4', aromatic: '#6B8E23', gourmand: '#D2691E', oud: '#4A2810', leather: '#808080', powdery: '#DDA0DD', fruity: '#FF6347', rose: '#FF1493', vanilla: '#FFD700', coffee: '#4A2810', tobacco: '#8B6040', smoky: '#808080', aquatic: '#4682B4', green: '#228B22', clean: '#87CEEB', coconut: '#F5E6C8', saffron: '#FF8C00', boozy: '#B8860B', incense: '#A0522D', earthy: '#556B2F', balsamic: '#A0522D', cherry: '#DC143C', animalic: '#808080', honey: '#FFD700', patchouli: '#556B2F', chocolate: '#6B3410', tea: '#228B22', resinous: '#A0522D', caramel: '#D2691E', iris: '#DDA0DD', lavender: '#9370DB', cinnamon: '#D2691E', almond: '#D2B48C', tropical: '#FFA500', metallic: '#C0C0C0', mineral: '#A09080' };
  var c = colors[name.toLowerCase()] || '#9B8EC4';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 90, textAlign: 'right', fontSize: 12, color: '#78716C', textTransform: 'capitalize' }}>{name}</div>
      <div style={{ flex: 1, height: 10, background: '#F0ECF4', borderRadius: 5, overflow: 'hidden' }}>
        <div className="bar-fill" style={{ width: strength + '%', height: '100%', background: c, borderRadius: 5 }} />
      </div>
    </div>
  );
}

function BuyLink({ name, sublabel, query }) {
  var urls = {
    FragranceNet: 'https://www.fragrancenet.com/search?q=' + query + '&utm_source=thedrydown',
    ScentSplit: 'https://www.scentsplit.com/search?q=' + query + '&ref=thedrydown',
    Amazon: 'https://www.amazon.com/s?k=' + query + '&tag=thedrydown-20',
    Sephora: 'https://www.sephora.com/search?keyword=' + query + '&utm_source=thedrydown',
    Notino: 'https://www.notino.com/search/?q=' + query + '&utm_source=thedrydown',
  };
  return (
    <a href={urls[name]} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #E8E4ED', textDecoration: 'none', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{name}</span>
      <span style={{ fontSize: 11, color: '#9B8EC4' }}>{sublabel}</span>
    </a>
  );
}

export default function ScannerPage() {
  var [image, setImage] = useState(null);
  var [imageFile, setImageFile] = useState(null);
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [dragOver, setDragOver] = useState(false);
  var [phase, setPhase] = useState('');
  var fileRef = useRef(null);

  var handleFile = useCallback(function(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setResult(null); setError(null); setImageFile(file);
    var r = new FileReader();
    r.onload = function(e) { setImage(e.target.result); };
    r.readAsDataURL(file);
  }, []);

  var analyze = async function() {
    if (!imageFile) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setPhase('Reading the label\u2026');
      var base64 = await new Promise(function(resolve) {
        var r = new FileReader();
        r.onload = function() { resolve(r.result.split(',')[1]); };
        r.readAsDataURL(imageFile);
      });
      var res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: imageFile.type || 'image/jpeg' }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to identify');
      if (data.confidence === 'none' || data.brand === 'unknown') {
        setError("Couldn't identify this fragrance. Try a clearer photo showing the label text.");
        setLoading(false); return;
      }
      setPhase('Searching 1,025 fragrances\u2026');
      await new Promise(function(r) { setTimeout(r, 500); });
      var match = findPerfume(data.brand, data.fragrance);
      if (match) {
        var topNotes = match.notes.filter(function(n) { return n.position === 'top'; });
        var heartNotes = match.notes.filter(function(n) { return n.position === 'heart'; });
        var baseNotes = match.notes.filter(function(n) { return n.position === 'base'; });
        setResult({ perfume: match, slug: makeSlug(match), topNotes: topNotes, heartNotes: heartNotes, baseNotes: baseNotes, identified: data });
      } else {
        logMiss(data);
        setResult({ perfume: null, identified: data, partial: true });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    }
    setLoading(false); setPhase('');
  };

  var reset = function() { setImage(null); setImageFile(null); setResult(null); setError(null); setPhase(''); };
  var p = result ? result.perfume : null;
  var searchQuery = p ? encodeURIComponent(p.name + ' ' + p.brand) : (result && result.identified ? encodeURIComponent(result.identified.fragrance + ' ' + result.identified.brand) : '');

  var NAV_LINKS = [
    { label: 'DIRECTORY', href: '/' },
    { label: 'BRANDS', href: '/brands' },
    { label: 'NOTES', href: '/notes' },
    { label: 'ABOUT', href: '/about' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #E8E4ED' }}>
        <a href="/" style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, fontWeight: 400, color: '#1A1A1A', textDecoration: 'none' }}>the <em style={{ fontStyle: 'italic', color: '#9B8EC4' }}>dry</em> down</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map(function(l) {
            return <a key={l.label} href={l.href} style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#78716C', textDecoration: 'none', textTransform: 'uppercase' }}>{l.label}</a>;
          })}
          <a href="/scanner" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#9B8EC4', textDecoration: 'none', textTransform: 'uppercase', padding: '6px 16px', border: '1.5px solid #9B8EC4', borderRadius: 6 }}>SCANNER</a>
          <a href="/feedback" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#FFFFFF', textDecoration: 'none', textTransform: 'uppercase', padding: '6px 16px', background: '#1A1A1A', borderRadius: 6 }}>FEEDBACK</a>
        </div>
      </nav>

      <main className="animate-fade-up" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
        {/* BACK LINK */}
        <a href="/" style={{ display: 'inline-block', fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', color: '#A8A29E', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 28 }}>← Back to Directory</a>

        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 48, fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>Fragrance <em style={{ fontStyle: 'italic', color: '#9B8EC4', fontWeight: 400 }}>scanner</em></h1>
          <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>Take a photo of any perfume bottle · Instantly get notes, accords, and where to buy</p>
        </div>

        {/* UPLOAD ZONE */}
        {!image && (
          <div className="animate-fade-up"
            onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
            onDragLeave={function() { setDragOver(false); }}
            onDrop={function(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={function() { fileRef.current && fileRef.current.click(); }}
            style={{ border: '2px dashed ' + (dragOver ? '#9B8EC4' : '#D4D0DC'), borderRadius: 14, padding: '52px 32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(155,142,196,0.06)' : '#FFFFFF', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }}>
              <rect x="4" y="8" width="32" height="24" rx="3" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="20" r="6" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="20" r="3" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
              <rect x="14" y="6" width="12" height="4" rx="1.5" stroke="#1A1A1A" strokeWidth="1.2" fill="none"/>
            </svg>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 20, color: '#1A1A1A', marginBottom: 6 }}>Drop a photo or tap to upload</div>
            <div style={{ fontSize: 12, color: '#A8A29E' }}>Clear photo of the label works best</div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={function(e) { handleFile(e.target.files[0]); }} style={{ display: 'none' }} />
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {image && !result && (
          <div className="animate-fade-up">
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #E8E4ED', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <img src={image} alt="Uploaded" style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'cover' }} />
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
                  <div style={{ position: 'absolute', left: '8%', right: '8%', height: 2, background: 'linear-gradient(90deg, transparent, #9B8EC4, transparent)', animation: 'scanLine 2.2s ease-in-out infinite', boxShadow: '0 0 16px rgba(155,142,196,0.3)' }} />
                  <div style={{ fontSize: 12, color: '#9B8EC4', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, animation: 'pulse 1.5s ease infinite' }}>{phase}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: 13, borderRadius: 10, border: '1px solid #E8E4ED', background: '#FFFFFF', color: '#78716C', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Retake</button>
              <button onClick={analyze} disabled={loading} style={{ flex: 2, padding: 13, borderRadius: 10, border: 'none', background: loading ? '#E8E4ED' : '#1A1A1A', color: loading ? '#78716C' : '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 2px 8px rgba(26,26,26,0.15)' }}>
                {loading ? 'Analyzing\u2026' : 'Identify fragrance'}
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="animate-fade-up" style={{ background: 'rgba(220,120,120,0.04)', border: '1px solid rgba(220,120,120,0.3)', borderRadius: 14, padding: 22, marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#C85050', marginBottom: 12, lineHeight: 1.6 }}>{error}</p>
            <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(220,120,120,0.3)', color: '#C85050', fontSize: 12, cursor: 'pointer' }}>Try another photo</button>
          </div>
        )}

        {/* RESULT — FOUND */}
        {result && p && (
          <div className="animate-fade-up">
            {/* Hero section — matches perfume detail page layout */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 40 }}>
              {/* Uploaded photo as thumbnail */}
              <div style={{ width: 140, height: 180, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #E8E4ED' }}>
                <img src={image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(232,168,124,0.2)', color: '#D4824A', border: '1px solid rgba(232,168,124,0.3)' }}>{p.family}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.concentration}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.gender}</span>
                  {BRAND_TYPES[p.brand] && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{BRAND_TYPES[p.brand]}</span>}
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.year}</span>
                </div>
                {/* Name */}
                <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 36, fontWeight: 400, color: '#1A1A1A', margin: '0 0 6px', lineHeight: 1.1 }}>{p.name}</h2>
                {/* Brand · Price · Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <a href="/brands" style={{ fontSize: 14, color: '#78716C', textDecoration: 'underline', textUnderlineOffset: 2 }}>{p.brand}</a>
                  <span style={{ color: '#D4D0DC' }}>·</span>
                  <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: '#9B8EC4', fontWeight: 500 }}>AED {p.priceLow}–{p.priceHigh}</span>
                  <span style={{ color: '#D4D0DC' }}>·</span>
                  <StarRating rating={p.rating} />
                </div>
                {/* Longevity / Sillage */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716C', border: '1px solid #E8E4ED' }}>Longevity: Long Lasting</span>
                  <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716C', border: '1px solid #E8E4ED' }}>Sillage: Strong</span>
                </div>
              </div>
            </div>

            {/* Accords + Notes side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A1A1A', margin: '0 0 20px' }}>Main Accords</h3>
                {p.accords.slice(0, 6).map(function(a, i) { return <AccordBar key={i} name={a.name} strength={a.strength} />; })}
              </div>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A1A1A', margin: '0 0 20px' }}>Fragrance Notes</h3>
                {result.topNotes.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Top</div>
                    {result.topNotes.map(function(n, i) { return <NoteBar key={i} name={n.name} strength={n.strength} color="#4ECDC4" />; })}
                  </div>
                )}
                {result.heartNotes.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#E8A87C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Heart</div>
                    {result.heartNotes.map(function(n, i) { return <NoteBar key={i} name={n.name} strength={n.strength} color="#E8A87C" />; })}
                  </div>
                )}
                {result.baseNotes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#8B6040', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Base</div>
                    {result.baseNotes.map(function(n, i) { return <NoteBar key={i} name={n.name} strength={n.strength} color="#8B6040" />; })}
                  </div>
                )}
              </div>
            </div>

            {/* Where to Buy */}
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A1A1A', margin: '0 0 16px' }}>Where to Buy</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                <BuyLink name="FragranceNet" sublabel="Best Price" query={searchQuery} />
                <BuyLink name="ScentSplit" sublabel="Decants" query={searchQuery} />
                <BuyLink name="Amazon" sublabel="Fast Ship" query={searchQuery} />
                <BuyLink name="Sephora" sublabel="Rewards" query={searchQuery} />
                <BuyLink name="Notino" sublabel="Global" query={searchQuery} />
              </div>
            </div>

            {/* View full profile */}
            <a href={'/perfume/' + result.slug} style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 10, background: '#1A1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 12, boxShadow: '0 2px 8px rgba(26,26,26,0.15)' }}>
              View full profile on The Dry Down →
            </a>

            <button onClick={reset} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #E8E4ED', background: '#FFFFFF', color: '#78716C', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Scan another fragrance
            </button>
          </div>
        )}

        {/* RESULT — NOT FOUND */}
        {result && result.partial && (
          <div className="animate-fade-up">
            <div style={{ background: 'rgba(155,142,196,0.04)', border: '1px solid rgba(155,142,196,0.25)', borderRadius: 14, padding: 22, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 18 }}>✦</span>
                <div>
                  <p style={{ fontSize: 14, color: '#1A1A1A', margin: '0 0 4px' }}>Identified as <strong>{result.identified.brand} {result.identified.fragrance}</strong>{result.identified.concentration !== 'unknown' ? ' (' + result.identified.concentration + ')' : ''}</p>
                  <p style={{ fontSize: 12, color: '#9B8EC4', margin: 0 }}>This fragrance isn't in our database yet — but we've automatically logged your request. We'll add it soon!</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A1A1A', margin: '0 0 16px' }}>Where to Buy</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <BuyLink name="FragranceNet" sublabel="Best Price" query={searchQuery} />
                <BuyLink name="Amazon" sublabel="Fast Ship" query={searchQuery} />
                <BuyLink name="Sephora" sublabel="Rewards" query={searchQuery} />
              </div>
            </div>

            <button onClick={reset} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #E8E4ED', background: '#FFFFFF', color: '#78716C', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Scan another fragrance
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '32px 16px', borderTop: '1px solid #E8E4ED', marginTop: 40 }}>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: '#1A1A1A', marginBottom: 4 }}>the <em style={{ color: '#9B8EC4' }}>dry</em> down</div>
        <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 4 }}>A fragrance directory built for the community.</div>
        <div style={{ fontSize: 11, color: '#A8A29E' }}>1000+ fragrances · 140+ brands · Dubai</div>
        <div style={{ fontSize: 10, color: '#D4D0DC', marginTop: 8 }}>© 2026 The Dry Down</div>
      </footer>

      <style>{'\
        @keyframes scanLine { 0% { top: 0; } 50% { top: 92%; } 100% { top: 0; } }\
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }\
      '}</style>
    </div>
  );
}
