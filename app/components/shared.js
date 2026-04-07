'use client';

import { useState, useEffect } from 'react';
import { FAMILY_COLORS, ACCENT } from '../lib/constants';

export function Stars({ value, size = 13 }) {
  return <span style={{ color: ACCENT, fontSize: size, letterSpacing: 2 }}>{"★".repeat(Math.floor(value))}{value % 1 >= 0.5 ? "½" : ""}<span style={{ color: "#D8D0C8" }}>{"★".repeat(5 - Math.ceil(value))}</span></span>;
}

export function Tag({ children, dark, active, onClick, style, color }) {
  const hasColor = color && !active && !dark;
  return (
    <span onClick={onClick}
      className="inline-block text-xs tracking-wide uppercase transition-all cursor-default"
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

export function PerfumeCard({ perfume: p, href }) {
  const fc = FAMILY_COLORS[p.family] || '#8C8378';
  return (
    <a href={href} className="cursor-pointer group transition-all block no-underline text-inherit" style={{ padding: '18px 0', borderBottom: '1px solid #D8D0C8', textDecoration: 'none' }}>
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
          <div className="font-serif text-2xl" style={{ letterSpacing: '-0.03em' }}>AED {p.priceLow || p.price_low}</div>
          <div className="mt-1"><Stars value={p.rating} size={11} /></div>
        </div>
      </div>
      <div className="text-xs text-stone mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
        {(p.top_notes || '').split(',').slice(0, 4).map(n => n.trim()).filter(Boolean).join(' · ')}
      </div>
    </a>
  );
}

/* ═══ HEADER ═══
 * Desktop: Directory · Brands · Notes · Blog   [Layering Lab]  [Scanner]
 * Mobile: Hamburger → full-screen slide-down menu
 * About + Feedback live in footer only (not in primary nav)
 */
export function Header({ current }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const NAV_LINKS = [
    { label: 'Directory', href: '/' },
    { label: 'Brands', href: '/brands' },
    { label: 'Notes', href: '/notes' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <>
      <header className="border-b sticky top-0 z-50" style={{ borderColor: '#F0F0F0', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/" className="no-underline text-inherit select-none" style={{ textDecoration: 'none' }}>
            <span className="font-serif text-2xl tracking-tight">The </span>
            <span className="font-serif text-2xl italic" style={{ color: ACCENT }}>Dry</span>
            <span className="font-serif text-2xl tracking-tight"> Down</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                className="text-xs uppercase tracking-widest font-medium transition-colors"
                style={{
                  color: current === link.label.toLowerCase() ? '#1A1A1A' : '#8C8378',
                  textDecoration: 'none',
                }}>
                {link.label}
              </a>
            ))}
            {/* Layering Lab — accent outlined button */}
            <a href="/layering-lab"
              className="text-xs uppercase tracking-widest font-medium transition-all"
              style={{
                color: current === 'layering' ? '#1A1A1A' : ACCENT,
                border: `1.5px solid ${ACCENT}`,
                padding: '6px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                background: current === 'layering' ? ACCENT + '12' : 'transparent',
              }}>
              Layering Lab
            </a>
            {/* Scanner — solid dark button */}
            <a href="/scanner"
              className="text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
              style={{
                background: '#1A1A1A',
                color: '#FAF8F5',
                padding: '6px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}>
              Scanner
            </a>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8"
            style={{ gap: '5px' }}
            aria-label="Toggle menu"
          >
            <span className="block h-px transition-all" style={{
              width: '20px',
              background: '#1A1A1A',
              transform: mobileOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
              transitionDuration: '0.3s',
            }} />
            <span className="block h-px transition-all" style={{
              width: '20px',
              background: '#1A1A1A',
              opacity: mobileOpen ? 0 : 1,
              transitionDuration: '0.3s',
            }} />
            <span className="block h-px transition-all" style={{
              width: '20px',
              background: '#1A1A1A',
              transform: mobileOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
              transitionDuration: '0.3s',
            }} />
          </button>
        </div>
      </header>

      {/* ═══ MOBILE MENU ═══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ top: '57px' }}>
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }}
            onClick={() => setMobileOpen(false)} />

          {/* Panel */}
          <div className="relative" style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E8E8E8',
            boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
            animation: 'mobileMenuIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div className="px-6 py-6">
              {/* Browse links */}
              <div className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: '#D8D0C8' }}>Explore</div>
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href}
                  className="block py-3.5 text-sm font-medium transition-colors"
                  style={{
                    color: current === link.label.toLowerCase() ? '#1A1A1A' : '#8C8378',
                    borderBottom: '1px solid #F5F5F5',
                    textDecoration: 'none',
                  }}>
                  {link.label}
                </a>
              ))}
              <a href="/about" className="block py-3.5 text-sm font-medium transition-colors"
                style={{ color: current === 'about' ? '#1A1A1A' : '#8C8378', borderBottom: '1px solid #F5F5F5', textDecoration: 'none' }}>
                About
              </a>
              <a href="/feedback" className="block py-3.5 text-sm font-medium transition-colors"
                style={{ color: '#8C8378', borderBottom: '1px solid #F5F5F5', textDecoration: 'none' }}>
                Feedback
              </a>

              {/* CTA buttons — side by side on mobile */}
              <div className="flex gap-3 pt-6">
                <a href="/layering-lab"
                  className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 transition-all"
                  style={{
                    color: ACCENT,
                    border: `1.5px solid ${ACCENT}`,
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}>
                  Layering Lab
                </a>
                <a href="/scanner"
                  className="flex-1 text-center text-xs uppercase tracking-widest font-medium py-3 transition-opacity"
                  style={{
                    background: '#1A1A1A',
                    color: '#FAF8F5',
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}>
                  Scanner
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* ═══ FOOTER ═══
 * Three columns: Explore (Directory, Brands, Notes, Blog), 
 * Tools (Layering Lab, Scanner), More (About, Feedback)
 */
export function Footer({ perfumeCount, brandCount }) {
  return (
    <footer className="border-t border-lite px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start flex-wrap gap-6">
          <div>
            <div className="mb-3">
              <span className="font-serif text-lg">the </span>
              <span className="font-serif text-lg italic" style={{ color: ACCENT }}>dry</span>
              <span className="font-serif text-lg"> down</span>
            </div>
            <p className="text-xs text-mid leading-relaxed max-w-xs">A fragrance directory built for the community. Discover notes, accords, reviews and your next signature scent.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3">Explore</div>
              <div className="flex flex-col gap-1.5">
                <a href="/" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Directory</a>
                <a href="/brands" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Brands</a>
                <a href="/notes" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Notes</a>
                <a href="/blog" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Blog</a>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3">Tools</div>
              <div className="flex flex-col gap-1.5">
                <a href="/layering-lab" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Layering Lab</a>
                <a href="/scanner" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Scanner</a>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-medium text-ink mb-3">More</div>
              <div className="flex flex-col gap-1.5">
                <a href="/about" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>About</a>
                <a href="/feedback" className="text-xs text-mid hover:text-ink transition-colors" style={{textDecoration:'none'}}>Feedback</a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-lite flex justify-between items-center">
          <div className="text-xs text-mid">{perfumeCount || '1000+'} fragrances · {brandCount || '140+'} brands · Dubai</div>
          <div className="text-xs text-mid">© 2026 The Dry Down</div>
        </div>
      </div>
    </footer>
  );
}
