'use client';
import { useState, useRef, useCallback } from 'react';
import { PERFUMES, BRAND_TYPES } from '../../data/perfumes';
import { supabase } from '../../lib/supabase';

function findLocalPerfume(brand, fragrance) {
  var b = (brand || '').toLowerCase().trim();
  var f = (fragrance || '').toLowerCase().trim();
  var match = PERFUMES.find(function(p) { return p.brand.toLowerCase() === b && p.name.toLowerCase() === f; });
  if (match) return match;
  match = PERFUMES.find(function(p) { return p.name.toLowerCase() === f && p.brand.toLowerCase().includes(b); });
  if (match) return match;
  match = PERFUMES.find(function(p) { return (p.brand.toLowerCase().includes(b) || b.includes(p.brand.toLowerCase())) && (p.name.toLowerCase().includes(f) || f.includes(p.name.toLowerCase())); });
  if (match) return match;
  match = PERFUMES.find(function(p) { return p.name.toLowerCase() === f; });
  if (match) return match;
  match = PERFUMES.find(function(p) { return f.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(f); });
  return match || null;
}

async function findSupabasePerfume(brand, fragrance) {
  var b = (brand || '').toLowerCase().trim();
  var f = (fragrance || '').toLowerCase().trim();
  try {
    var res = await supabase.from('perfumes').select('*');
    if (!res.data) return null;
    var all = res.data;
    var match = all.find(function(p) { return p.brand.toLowerCase() === b && p.name.toLowerCase() === f; });
    if (match) return convertSupabasePerfume(match);
    match = all.find(function(p) { return p.name.toLowerCase() === f && p.brand.toLowerCase().includes(b); });
    if (match) return convertSupabasePerfume(match);
    match = all.find(function(p) { return (p.brand.toLowerCase().includes(b) || b.includes(p.brand.toLowerCase())) && (p.name.toLowerCase().includes(f) || f.includes(p.name.toLowerCase())); });
    if (match) return convertSupabasePerfume(match);
    match = all.find(function(p) { return p.name.toLowerCase() === f; });
    if (match) return convertSupabasePerfume(match);
    match = all.find(function(p) { return f.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(f); });
    if (match) return convertSupabasePerfume(match);
    return null;
  } catch (err) {
    console.error('Supabase search error:', err);
    return null;
  }
}

function convertSupabasePerfume(p) {
  var idx = p.id || 0;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    year: p.year,
    gender: p.gender || 'Unisex',
    concentration: p.concentration || 'EDP',
    family: p.family || '',
    priceLow: p.price_low || 0,
    priceHigh: p.price_high || 0,
    notes: [].concat(
      (p.top_notes || '').split(',').map(function(n) { return n.trim(); }).filter(Boolean).map(function(n) { return { name: n, position: 'top', strength: 70 + (idx * 7 + n.length * 3) % 25 }; }),
      (p.heart_notes || '').split(',').map(function(n) { return n.trim(); }).filter(Boolean).map(function(n) { return { name: n, position: 'heart', strength: 55 + (idx * 5 + n.length * 7) % 30 }; }),
      (p.base_notes || '').split(',').map(function(n) { return n.trim(); }).filter(Boolean).map(function(n) { return { name: n, position: 'base', strength: 50 + (idx * 3 + n.length * 11) % 35 }; })
    ),
    accords: (p.main_accords || '').split(',').map(function(a) { return a.trim(); }).filter(Boolean).map(function(a, i) { return { name: a, strength: Math.max(30, 90 - i * 12 + (a.length * 3) % 8) }; }),
    rating: Number(p.rating) || 4.0,
    brandType: p.brand_type || 'Unknown',
    image_url: p.image_url || null
  };
}

function makeSlug(perfume) {
  var name = perfume.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  var brand = perfume.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return name + '-' + brand;
}

function logMiss(identified) {
  fetch('https://script.google.com/macros/s/AKfycbw_WvPv_6p2z_AC4O4WpN0J_gLZ0wMuo6974yXYUIH6MA9weVKrRlre5hdU5_kpeyJjvA/exec', {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: identified.brand,
      fragrance: identified.fragrance,
      concentration: identified.concentration,
      confidence: identified.confidence,
      timestamp: new Date().toISOString()
    }),
  }).catch(function() {});
}

function StarRating(props) {
  var rating = props.rating;
  var full = Math.floor(rating);
  var half = rating % 1 >= 0.25;
  var empty = 5 - full - (half ? 1 : 0);
  var stars = '';
  for (var i = 0; i < full; i++) stars += '\u2605';
  if (half) stars += '\u00BD';
  for (var j = 0; j < empty; j++) stars += '\u2606';
  return <span style={{ color: '#9B8EC4', fontSize: 16, letterSpacing: 1 }}>{stars}</span>;
}

function NoteBar(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{ width: 90, textAlign: 'right', fontSize: 12, color: '#78716C' }}>{props.name}</div>
      <div style={{ flex: 1, height: 8, background: '#F0ECF4', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: props.strength + '%', height: '100%', background: props.color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function AccordBar(props) {
  var colors = { woody: '#DAA520', amber: '#DAA520', 'warm spicy': '#D2691E', sweet: '#E8A87C', musky: '#C0C0C0', floral: '#FF69B4', citrus: '#FFD700', fresh: '#4ECDC4', aromatic: '#6B8E23', gourmand: '#D2691E', oud: '#4A2810', leather: '#808080', powdery: '#DDA0DD', fruity: '#FF6347', rose: '#FF1493', vanilla: '#FFD700', coffee: '#4A2810', tobacco: '#8B6040', smoky: '#808080', aquatic: '#4682B4', green: '#228B22', clean: '#87CEEB', coconut: '#F5E6C8', saffron: '#FF8C00', boozy: '#B8860B', incense: '#A0522D', earthy: '#556B2F', balsamic: '#A0522D', cherry: '#DC143C', animalic: '#808080', honey: '#FFD700', patchouli: '#556B2F', chocolate: '#6B3410', tea: '#228B22', resinous: '#A0522D', caramel: '#D2691E', iris: '#DDA0DD', lavender: '#9370DB', cinnamon: '#D2691E', almond: '#D2B48C', tropical: '#FFA500', metallic: '#C0C0C0', mineral: '#A09080' };
  var c = colors[props.name.toLowerCase()] || '#9B8EC4';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 90, textAlign: 'right', fontSize: 12, color: '#78716C', textTransform: 'capitalize' }}>{props.name}</div>
      <div style={{ flex: 1, height: 10, background: '#F0ECF4', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: props.strength + '%', height: '100%', background: c, borderRadius: 5 }} />
      </div>
    </div>
  );
}

function BuyLink(props) {
  var urls = {
    FragranceNet: 'https://www.fragrancenet.com/search?q=' + props.query + '&utm_source=thedrydown',
    ScentSplit: 'https://www.scentsplit.com/search?q=' + props.query + '&ref=thedrydown',
    Amazon: 'https://www.amazon.com/s?k=' + props.query + '&tag=thedrydown-20',
    Sephora: 'https://www.sephora.com/search?keyword=' + props.query + '&utm_source=thedrydown',
    Notino: 'https://www.notino.com/search/?q=' + props.query + '&utm_source=thedrydown',
  };
  return (
    <a href={urls[props.name]} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #E8E4ED', textDecoration: 'none' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{props.name}</span>
      <span style={{ fontSize: 11, color: '#9B8EC4' }}>{props.sublabel}</span>
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
    setResult(null);
    setError(null);
    setImageFile(file);
    var r = new FileReader();
    r.onload = function(e) { setImage(e.target.result); };
    r.readAsDataURL(file);
  }, []);

  var analyze = async function() {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setPhase('Reading the label...');
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
        setError("Could not identify this fragrance. Try a clearer photo showing the label text.");
        setLoading(false);
        return;
      }
      setPhase('Searching local database...');
      await new Promise(function(r) { setTimeout(r, 300); });
      var match = findLocalPerfume(data.brand, data.fragrance);
      if (!match) {
        setPhase('Searching full database...');
        await new Promise(function(r) { setTimeout(r, 300); });
        match = await findSupabasePerfume(data.brand, data.fragrance);
      }
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
    setLoading(false);
    setPhase('');
  };

  var reset = function() {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setPhase('');
  };

  var p = result ? result.perfume : null;
  var searchQuery = p ? encodeURIComponent(p.name + ' ' + p.brand) : (result && result.identified ? encodeURIComponent(result.identified.fragrance + ' ' + result.identified.brand) : '');

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #E8E4ED' }}>
        <a href="/" style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, fontWeight: 400, color: '#1A1A1A', textDecoration: 'none' }}>the <em style={{ fontStyle: 'italic', color: '#9B8EC4' }}>dry</em> down</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#78716C', textDecoration: 'none', textTransform: 'uppercase' }}>Directory</a>
          <a href="/brands" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#78716C', textDecoration: 'none', textTransform: 'uppercase' }}>Brands</a>
          <a href="/notes" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#78716C', textDecoration: 'none', textTransform: 'uppercase' }}>Notes</a>
          <a href="/about" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#78716C', textDecoration: 'none', textTransform: 'uppercase' }}>About</a>
          <a href="/scanner" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#9B8EC4', textDecoration: 'none', textTransform: 'uppercase', padding: '6px 16px', border: '1.5px solid #9B8EC4', borderRadius: 6 }}>Scanner</a>
          <a href="/feedback" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: '#FFFFFF', textDecoration: 'none', textTransform: 'uppercase', padding: '6px 16px', background: '#1A1A1A', borderRadius: 6 }}>Feedback</a>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
        <a href="/" style={{ display: 'inline-block', fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', color: '#A8A29E', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 28 }}>Back to Directory</a>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 48, fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>Fragrance <em style={{ fontStyle: 'italic', color: '#9B8EC4', fontWeight: 400 }}>scanner</em></h1>
          <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>Take a photo of any perfume bottle. Instantly get notes, accords, and where to buy</p>
        </div>

        {!image && (
          <div
            onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
            onDragLeave={function() { setDragOver(false); }}
            onDrop={function(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={function() { fileRef.current && fileRef.current.click(); }}
            style={{ border: '2px dashed ' + (dragOver ? '#9B8EC4' : '#D4D0DC'), borderRadius: 14, padding: '52px 32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(155,142,196,0.06)' : '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
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

        {image && !result && (
          <div>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #E8E4ED', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <img src={image} alt="Uploaded" style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'cover' }} />
              {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, color: '#9B8EC4', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{phase}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: 13, borderRadius: 10, border: '1px solid #E8E4ED', background: '#FFFFFF', color: '#78716C', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Retake</button>
              <button onClick={analyze} disabled={loading} style={{ flex: 2, padding: 13, borderRadius: 10, border: 'none', background: loading ? '#E8E4ED' : '#1A1A1A', color: loading ? '#78716C' : '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Analyzing...' : 'Identify fragrance'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(220,120,120,0.04)', border: '1px solid rgba(220,120,120,0.3)', borderRadius: 14, padding: 22, marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#C85050', marginBottom: 12, lineHeight: 1.6 }}>{error}</p>
            <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(220,120,120,0.3)', color: '#C85050', fontSize: 12, cursor: 'pointer' }}>Try another photo</button>
          </div>
        )}

        {result && p && (
          <div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 40 }}>
              <div style={{ width: 140, height: 180, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #E8E4ED' }}>
                <img src={image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(232,168,124,0.2)', color: '#D4824A', border: '1px solid rgba(232,168,124,0.3)' }}>{p.family}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.concentration}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.gender}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F2F7', color: '#78716C', border: '1px solid #E8E4ED' }}>{p.year}</span>
                </div>
                <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 36, fontWeight: 400, color: '#1A1A1A', margin: '0 0 6px', lineHeight: 1.1 }}>{p.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <a href="/brands" style={{ fontSize: 14, color: '#78716C', textDecoration: 'underline', textUnderlineOffset: 2 }}>{p.brand}</a>
                  <span style={{ color: '#D4D0DC' }}>|</span>
                  <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: '#9B8EC4', fontWeight: 500 }}>AED {p.priceLow}-{p.priceHigh}</span>
                  <span style={{ color: '#D4D0DC' }}>|</span>
                  <StarRating rating={p.rating} />
                </div>
              </div>
            </div>

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

            <a href={'/perfume/' + result.slug} style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 10, background: '#1A1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 12 }}>
              View full profile on The Dry Down
            </a>
            <button onClick={reset} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #E8E4ED', background: '#FFFFFF', color: '#78716C', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Scan another fragrance
            </button>
          </div>
        )}

        {result && result.partial && (
          <div>
            <div style={{ background: 'rgba(155,142,196,0.04)', border: '1px solid rgba(155,142,196,0.25)', borderRadius: 14, padding: 22, marginBottom: 14 }}>
              <p style={{ fontSize: 14, color: '#1A1A1A', margin: '0 0 4px' }}>Identified as <strong>{result.identified.brand} {result.identified.fragrance}</strong>{result.identified.concentration !== 'unknown' ? ' (' + result.identified.concentration + ')' : ''}</p>
              <p style={{ fontSize: 12, color: '#9B8EC4', margin: 0 }}>This fragrance is not in our database yet but we have automatically logged your request. We will add it soon!</p>
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

      <footer style={{ textAlign: 'center', padding: '32px 16px', borderTop: '1px solid #E8E4ED', marginTop: 40 }}>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: '#1A1A1A', marginBottom: 4 }}>the <em style={{ color: '#9B8EC4' }}>dry</em> down</div>
        <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 4 }}>A fragrance directory built for the community.</div>
        <div style={{ fontSize: 11, color: '#A8A29E' }}>1000+ fragrances | 140+ brands | Dubai</div>
        <div style={{ fontSize: 10, color: '#D4D0DC', marginTop: 8 }}>2026 The Dry Down</div>
      </footer>
    </div>
  );
}
