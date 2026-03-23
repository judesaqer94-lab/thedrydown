'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const ACCENT = '#9B8EC4';

export default function AdminDashboard() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState('images');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, with_image, no_image
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Auth check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('key') === 'admin') setAuth(true);
  }, []);

  // Load perfumes
  useEffect(() => {
    if (!auth) return;
    async function load() {
      const { data } = await supabase.from('perfumes').select('id, name, brand, family, gender, concentration, image_url, brand_type, rating').order('brand', { ascending: true });
      if (data) setPerfumes(data);
      setLoading(false);
    }
    load();
  }, [auth]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Save image URL
  const saveImageUrl = useCallback(async (id, url) => {
    setSaving(true);
    const { error } = await supabase.from('perfumes').update({ image_url: url || null }).eq('id', id);
    if (!error) {
      setPerfumes(prev => prev.map(p => p.id === id ? { ...p, image_url: url || null } : p));
      showToast('Image saved!');
      setEditingId(null);
      setEditUrl('');
    } else {
      showToast('Error: ' + error.message);
    }
    setSaving(false);
  }, [showToast]);

  // Stats
  const stats = useMemo(() => {
    const total = perfumes.length;
    const withImage = perfumes.filter(p => p.image_url).length;
    const brands = [...new Set(perfumes.map(p => p.brand))].length;
    const families = {};
    const brandTypes = {};
    perfumes.forEach(p => {
      families[p.family] = (families[p.family] || 0) + 1;
      brandTypes[p.brand_type || 'Unknown'] = (brandTypes[p.brand_type] || 0) + 1;
    });
    return { total, withImage, noImage: total - withImage, brands, families, brandTypes };
  }, [perfumes]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = perfumes;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s));
    }
    if (filter === 'with_image') list = list.filter(p => p.image_url);
    if (filter === 'no_image') list = list.filter(p => !p.image_url);
    return list;
  }, [perfumes, search, filter]);

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#FAF9F6' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '2rem', marginBottom: 8 }}>Admin Access Required</h1>
          <p style={{ color: '#8C8378', fontSize: 14 }}>Add <code>?key=admin</code> to the URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#FAF9F6' }}>
        <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.5rem', color: '#8C8378' }}>Loading perfumes...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', fontFamily: 'Inter, sans-serif', color: '#2C2825' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#2C2825', color: '#FAF9F6', padding: '10px 20px', fontSize: 13, zIndex: 999, borderRadius: 2 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: '1px solid #E8E4DE', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 18 }}>the </span>
          <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, fontStyle: 'italic', color: ACCENT }}>dry</span>
          <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 18 }}> down</span>
          <span style={{ fontSize: 11, color: '#8C8378', marginLeft: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Dashboard</span>
        </div>
        <a href="/" style={{ fontSize: 12, color: '#8C8378', textDecoration: 'none' }}>← Back to Site</a>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Perfumes', value: stats.total, color: '#2C2825' },
            { label: 'With Images', value: stats.withImage, color: '#7B9B78' },
            { label: 'Missing Images', value: stats.noImage, color: '#D4915B' },
            { label: 'Brands', value: stats.brands, color: ACCENT },
          ].map((s, i) => (
            <div key={i} style={{ border: '1px solid #E8E4DE', padding: 20 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C8378', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Coverage Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C8378' }}>Image Coverage</span>
            <span style={{ fontSize: 13, fontFamily: 'EB Garamond, serif' }}>{stats.total > 0 ? Math.round(stats.withImage / stats.total * 100) : 0}%</span>
          </div>
          <div style={{ height: 6, background: '#E8E4DE', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.withImage / stats.total * 100) : 0}%`, background: ACCENT, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Family Breakdown */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C8378', marginBottom: 12 }}>By Family</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(stats.families).sort((a, b) => b[1] - a[1]).map(([family, count]) => (
              <span key={family} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E8E4DE', color: '#8C8378' }}>
                {family} <strong style={{ color: '#2C2825' }}>{count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E8E4DE', marginBottom: 24 }}>
          {['images', 'bulk'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '12px 24px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
                border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
                color: tab === t ? '#2C2825' : '#8C8378', fontWeight: tab === t ? 600 : 400,
              }}>
              {t === 'images' ? 'Image Manager' : 'Bulk Tools'}
            </button>
          ))}
        </div>

        {/* Image Manager Tab */}
        {tab === 'images' && (
          <div>
            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or brand..."
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #E8E4DE', background: 'transparent', fontSize: 13, outline: 'none' }}
              />
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #E8E4DE', background: 'transparent', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All ({perfumes.length})</option>
                <option value="no_image">Missing Images ({stats.noImage})</option>
                <option value="with_image">Has Images ({stats.withImage})</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: '#8C8378', marginBottom: 16 }}>
              Showing {filtered.length} perfumes
            </div>

            {/* Perfume List */}
            <div>
              {filtered.slice(0, 100).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid #E8E4DE' }}>
                  {/* Thumbnail */}
                  <div style={{ width: 48, height: 48, background: '#F2F0E8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4 }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 18, color: '#D8D0C8' }}>?</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontFamily: 'EB Garamond, serif' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#8C8378' }}>{p.brand} · {p.family} · {p.concentration}</div>
                  </div>

                  {/* Edit */}
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={editUrl} onChange={e => setEditUrl(e.target.value)}
                        placeholder="Paste image URL..."
                        style={{ width: 300, padding: '6px 10px', border: '1px solid #E8E4DE', fontSize: 12, outline: 'none' }}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveImageUrl(p.id, editUrl)}
                      />
                      <button onClick={() => saveImageUrl(p.id, editUrl)} disabled={saving}
                        style={{ padding: '6px 14px', fontSize: 11, background: '#2C2825', color: '#FAF9F6', border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                        Save
                      </button>
                      <button onClick={() => { setEditingId(null); setEditUrl(''); }}
                        style={{ padding: '6px 14px', fontSize: 11, border: '1px solid #E8E4DE', background: 'none', cursor: 'pointer', color: '#8C8378' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {p.image_url && (
                        <span style={{ fontSize: 11, color: '#7B9B78' }}>✓</span>
                      )}
                      <button onClick={() => { setEditingId(p.id); setEditUrl(p.image_url || ''); }}
                        style={{ padding: '6px 14px', fontSize: 11, border: '1px solid #E8E4DE', background: 'none', cursor: 'pointer', color: '#8C8378' }}>
                        {p.image_url ? 'Edit' : '+ Add Image'}
                      </button>
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(p.name + ' ' + p.brand + ' perfume bottle')}&tbm=isch`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ padding: '6px 14px', fontSize: 11, border: '1px solid #E8E4DE', background: 'none', cursor: 'pointer', color: '#8C8378', textDecoration: 'none' }}>
                        Search
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length > 100 && (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#8C8378' }}>
                  Showing first 100 of {filtered.length} · Use search to narrow down
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Tools Tab */}
        {tab === 'bulk' && (
          <div>
            <div style={{ border: '1px solid #E8E4DE', padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, marginBottom: 8 }}>How to Add Images</h3>
              <div style={{ fontSize: 13, color: '#8C8378', lineHeight: 1.8 }}>
                <p style={{ marginBottom: 12 }}><strong style={{ color: '#2C2825' }}>Option 1: One at a time</strong> — Go to the Image Manager tab, click "Search" next to any perfume, find a bottle image on Google, right-click → "Copy image address", then paste it in.</p>
                <p style={{ marginBottom: 12 }}><strong style={{ color: '#2C2825' }}>Option 2: Supabase dashboard</strong> — Go to your <a href="https://supabase.com/dashboard/project/wydptxijqfqimsftgmlp/editor" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Supabase table editor</a>, find perfumes, and paste URLs directly into the image_url column.</p>
                <p style={{ marginBottom: 12 }}><strong style={{ color: '#2C2825' }}>Option 3: Bulk SQL</strong> — Run SQL in Supabase to update many at once:</p>
                <pre style={{ background: '#F2F0E8', padding: 16, fontSize: 12, overflow: 'auto', marginBottom: 12 }}>
{`UPDATE perfumes SET image_url = 'https://example.com/image.jpg'
WHERE name = 'Baccarat Rouge 540' AND brand = 'Maison Francis Kurkdjian';`}
                </pre>
                <p><strong style={{ color: '#2C2825' }}>Tip:</strong> Use images from retailer sites (Sephora, FragranceNet) — they have clean bottle shots with white backgrounds that look best on your site.</p>
              </div>
            </div>

            <div style={{ border: '1px solid #E8E4DE', padding: 24 }}>
              <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, marginBottom: 8 }}>Tracking & Analytics</h3>
              <div style={{ fontSize: 13, color: '#8C8378', lineHeight: 1.8 }}>
                <p style={{ marginBottom: 12 }}>Your Supabase dashboard IS your CMS. Here's what you can track:</p>
                <p style={{ marginBottom: 8 }}><strong style={{ color: '#2C2825' }}>Perfume data</strong> — <a href="https://supabase.com/dashboard/project/wydptxijqfqimsftgmlp/editor" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Table Editor</a> — edit any perfume, add/remove notes, update prices</p>
                <p style={{ marginBottom: 8 }}><strong style={{ color: '#2C2825' }}>Reviews</strong> — check the reviews table to see what users are saying</p>
                <p style={{ marginBottom: 8 }}><strong style={{ color: '#2C2825' }}>Submissions</strong> — see what perfumes users are suggesting</p>
                <p style={{ marginBottom: 8 }}><strong style={{ color: '#2C2825' }}>Votes</strong> — see which perfumes get the most votes</p>
                <p style={{ marginBottom: 12 }}><strong style={{ color: '#2C2825' }}>Site traffic</strong> — add <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Vercel Analytics</a> (free) or <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Google Analytics</a> to track visitors, page views, and where your traffic comes from</p>
                <p style={{ fontSize: 12, padding: '10px 14px', background: '#F2F0E8' }}>To add Vercel Analytics: go to your Vercel dashboard → your project → Analytics tab → Enable. It's one click and free on the hobby plan.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}