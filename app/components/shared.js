'use client';

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

export function Header({ current }) {
  return (
    <header className="border-b border-lite px-6 py-4 sticky top-0 bg-paper z-50" style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.92)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <a href="/" className="no-underline text-inherit">
          <span className="font-serif text-lg">the </span>
          <span className="font-serif text-lg italic" style={{ color: ACCENT }}>dry</span>
          <span className="font-serif text-lg"> down</span>
        </a>
        <nav className="flex gap-6 items-center">
          {[
            { label: 'Directory', href: '/' },
            { label: 'Brands', href: '/brands' },
            { label: 'Notes', href: '/notes' },
            { label: 'About', href: '/about' },
          ].map(link => (
            <a key={link.label} href={link.href}
              className="text-xs uppercase tracking-widest font-medium transition-colors no-underline"
              style={{ color: current === link.label.toLowerCase() ? '#1A1A1A' : '#8C8378' }}>
              {link.label}
            </a>
          ))}
          <a href="/feedback" className="text-xs uppercase tracking-widest font-medium bg-ink text-paper px-4 py-2 hover:opacity-80 transition-opacity no-underline" style={{textDecoration:'none', color:'#FAF8F5'}}>Feedback</a>
        </nav>
      </div>
    </header>
  );
}

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
                <a href="/" className="text-xs text-mid hover:text-ink transition-colors no-underline">Directory</a>
                <a href="/brands" className="text-xs text-mid hover:text-ink transition-colors no-underline">Brands</a>
                <a href="/notes" className="text-xs text-mid hover:text-ink transition-colors no-underline">Notes</a>
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
