import './globals.css';

export const metadata = {
  title: 'The Dry Down — Fragrance Directory',
  description: 'Explore 1,025 perfumes from 144 brands. Discover notes, accords, reviews and your next signature scent.',
  keywords: 'perfume, fragrance, cologne, dupe, review, oud, arabic perfume, niche, designer',
  verification: {
    google: 'V-afyZCOAaS8ux6HfyZYEfeaVsjJkRXfEEdcYmLK77o',
  },
  openGraph: {
    title: 'The Dry Down — Fragrance Directory',
    description: 'Explore 1,025 perfumes from 144 brands.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
