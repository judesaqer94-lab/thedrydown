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
  fetch('https://script.google.com/macros/s/AKfycbxvSNZV1aDcw90DGPnFWUDosW4RDI7SQrRLI2DnxFCsx4fFNZ-PMw0u4mm2Rc1h13FmoQ/exec', {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand: identified.brand, fragrance: identified.fragrance, concentration: identified.concentration, confidence: identified.confidence, timestamp: new Date().toISOString() }),
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
        <a href="/" style={{ display: 'inline-block', fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', color: '#A8A29E', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 28 }}>← Back to Directory</a>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 48, fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>Fragrance <em style={{ fontStyle: 'italic', color: '#9B8EC4', fontWeight: 400 }}>scanner</em></h1>
          <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>Take a photo of any perfume bottle · Instantly get notes, accords, and where to buy</p>
        </div>

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

        {image && !result && (
          <div className="animate-fade-up">
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #E8E4ED', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <img src={image} alt="Uploaded" style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'cover' }} />
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
                  <div style={{ position: 'absolute', left: '8%', right: '8%', height: 2, background: 'linear-gradient(90deg, transparent, #9B8EC4, transparent)', animation: 'scanLine 2.2s ease-in-out infinite', boxShadow: '0 0 16px rgba(155,1
