import { Header, Footer } from '../components/shared';

export const metadata = {
  title: 'About — The Dry Down',
  description: 'The Dry Down is a community-built fragrance directory. Learn about our mission to help you discover your next signature scent.',
  alternates: { canonical: 'https://www.thedrydown.io/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header current="about" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="animate-fade-up">

          {/* Hero */}
          <div className="mb-16 text-center">
            <h1 className="font-serif text-5xl leading-none mb-4" style={{ letterSpacing: '-0.03em' }}>
              About <span className="italic" style={{ color: '#9B8EC4' }}>The Dry Down</span>
            </h1>
            <p className="text-stone text-sm max-w-lg mx-auto leading-relaxed">
              A fragrance directory built for people who care about what they smell like.
            </p>
          </div>

          {/* Story */}
          <div className="space-y-8 text-sm leading-relaxed text-stone">
            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">What is The Dry Down?</h2>
              <p>
                The Dry Down is a curated fragrance directory designed to help you discover, compare, and understand perfumes. 
                We break down every fragrance into its DNA — top notes, heart notes, base notes, accords, seasons, occasions, 
                and performance — so you can make informed decisions before buying.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">Why "The Dry Down"?</h2>
              <p>
                In perfumery, the dry down is the final phase of a fragrance — what remains after the opening notes 
                have faded. It's the true character of a scent, the part that lingers on your skin for hours. 
                We named our directory after this concept because we believe in going deeper than first impressions. 
                We want to show you the full picture of every fragrance, not just the top notes.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">What makes us different?</h2>
              <p>
                Most fragrance sites overwhelm you with thousands of perfumes and no way to navigate them meaningfully. 
                We focus on what actually matters to fragrance lovers:
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Smart Similarity', desc: 'Our 7-dimension algorithm matches fragrances by accords, notes, seasons, occasions, and performance — not just basic keywords.' },
                  { title: 'Note Encyclopedia', desc: '190+ fragrance notes explained in plain language — what they smell like, where they come from, and how perfumers use them.' },
                  { title: 'AED Pricing', desc: 'Real prices in AED with links to buy from trusted retailers. No guessing, no currency conversion needed.' },
                  { title: 'Community Reviews', desc: 'Real reviews from real people. Vote on gender, occasion, and performance to help others discover their next scent.' },
                ].map(item => (
                  <div key={item.title} className="border border-faint p-4">
                    <div className="text-xs uppercase tracking-widest font-medium text-ink mb-2">{item.title}</div>
                    <p className="text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">Built by a fragrance lover</h2>
              <p>
                The Dry Down started as a personal project — born out of frustration with existing fragrance tools 
                that didn't serve the community well enough. It's built with Next.js, Supabase, and data from the 
                Fragella API, and it's constantly evolving based on community feedback.
              </p>
              <p className="mt-3">
                Have a suggestion? Found a bug? Want to see a feature? 
                <a href="/feedback" className="no-underline ml-1" style={{ color: '#9B8EC4', borderBottom: '1px solid #9B8EC440' }}>
                  Share your feedback →
                </a>
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">The numbers</h2>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { number: '1,000+', label: 'Fragrances' },
                  { number: '140+', label: 'Brands' },
                  { number: '190+', label: 'Notes explained' },
                ].map(stat => (
                  <div key={stat.label} className="text-center border border-faint p-5">
                    <div className="font-serif text-3xl text-ink" style={{ color: '#9B8EC4' }}>{stat.number}</div>
                    <div className="text-xs text-stone mt-1 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center border-t border-faint pt-12">
            <p className="font-serif text-2xl text-ink mb-4">Ready to explore?</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/" className="px-6 py-3 bg-ink text-paper text-xs uppercase tracking-widest font-medium no-underline hover:opacity-80 transition-opacity" style={{ color: '#FAF8F5' }}>
                Browse Directory
              </a>
              <a href="/feedback" className="px-6 py-3 border border-ink text-ink text-xs uppercase tracking-widest font-medium no-underline hover:bg-cream transition-colors">
                Share Feedback
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
