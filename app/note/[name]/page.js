import { createClient } from '@supabase/supabase-js';
import NoteDetail from './NoteDetail';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Note descriptions for education
const NOTE_INFO = {
  "saffron": { description: "One of the most expensive spices in the world, saffron adds a warm, honeyed, leathery quality to fragrances. It's a signature note in many Middle Eastern perfumes and adds instant richness and depth.", category: "Spice", origin: "Crocus sativus flower, primarily Iran" },
  "oud": { description: "Also known as agarwood, oud is formed when Aquilaria trees become infected with mold. The resulting resin creates one of the most prized and expensive raw materials in perfumery — smoky, animalic, and deeply complex.", category: "Wood", origin: "Southeast Asia, Middle East" },
  "vanilla": { description: "Derived from the vanilla orchid, this warm, sweet, creamy note is one of the most universally loved in perfumery. It adds comfort, sweetness, and sensuality to fragrances.", category: "Gourmand", origin: "Vanilla planifolia orchid, Madagascar" },
  "rose": { description: "The queen of flowers in perfumery. Different varieties — Turkish, Bulgarian, Damascene, Centifolia — each bring distinct facets from honeyed and jammy to fresh and dewy.", category: "Floral", origin: "Various regions, notably Turkey, Bulgaria, Morocco" },
  "jasmine": { description: "Rich, intoxicating, and narcotic. Jasmine is one of the most important floral notes, adding sensuality and depth. Jasmine Sambac is sweeter, while Grandiflorum is more classical.", category: "Floral", origin: "India, Egypt, Morocco" },
  "bergamot": { description: "A citrus fruit that provides the bright, slightly bitter, aromatic opening found in many fragrances. It's the backbone of the fresh citrus opening in countless perfumes.", category: "Citrus", origin: "Calabria, Italy" },
  "patchouli": { description: "An earthy, woody, slightly sweet note that adds depth and longevity. It's a key ingredient in chypre and oriental fragrances, and pairs beautifully with vanilla and rose.", category: "Woody", origin: "Indonesia, Philippines" },
  "sandalwood": { description: "Creamy, warm, milky — sandalwood is one of the most versatile base notes. Mysore sandalwood from India is considered the finest, though Australian sandalwood is now more common.", category: "Wood", origin: "India, Australia" },
  "amber": { description: "Not a single ingredient but a blend typically made from labdanum, benzoin, and vanilla. Amber adds warmth, sweetness, and a golden, resinous quality to the base of a fragrance.", category: "Resin", origin: "Blend of natural resins" },
  "musk": { description: "Originally from the musk deer, modern musks are synthetic and come in many varieties — white musk (clean, soapy), skin musk (warm, intimate), and animalic musk (sensual, deep).", category: "Animalic", origin: "Synthetic (historically from musk deer)" },
  "tonka bean": { description: "Sweet, warm, and almond-like with hints of vanilla and caramel. Tonka bean contains coumarin, which gives it a distinctive warm, hay-like sweetness that's become a modern perfumery staple.", category: "Gourmand", origin: "South America" },
  "cedar": { description: "Clean, dry, and pencil-shaving woody. Virginia cedar is sharp and dry, while Atlas cedar is warmer and more aromatic. A foundational woody note in many fragrances.", category: "Wood", origin: "North America, Morocco" },
  "vetiver": { description: "Earthy, smoky, and green with a grounding quality. Haitian vetiver is smoky and deep, while Java vetiver is cleaner. It adds sophistication and masculinity to fragrances.", category: "Woody", origin: "Haiti, Java, India" },
  "iris": { description: "Powdery, elegant, and expensive. Iris (orris root) is one of the most costly perfume ingredients, requiring years of aging. It adds a sophisticated, lipstick-like powdery quality.", category: "Floral", origin: "Italy, Morocco" },
  "tuberose": { description: "Intensely heady, creamy, and narcotic. Tuberose is one of the most powerful white florals, adding a rich, almost indolic quality. It's both beautiful and animalic.", category: "Floral", origin: "India, Morocco" },
  "coffee": { description: "Rich, roasted, and slightly bitter. Coffee adds a gourmand warmth and modern edge to fragrances, pairing beautifully with vanilla, leather, and spices.", category: "Gourmand", origin: "Various tropical regions" },
  "leather": { description: "Smoky, animalic, and luxurious. Leather notes in perfumery can range from clean suede to dark, tarry birch tar. It adds sophistication and a sense of luxury.", category: "Animalic", origin: "Synthetic accords, birch tar" },
  "incense": { description: "Smoky, sacred, and meditative. Incense notes evoke temples and ceremony, adding a mystical, resinous quality. Olibanum (frankincense) is the most classic incense material.", category: "Resin", origin: "Oman, Somalia" },
  "pink pepper": { description: "Bright, spicy, and slightly fruity with a rosy sparkle. Not actually related to black pepper — it comes from the Schinus molle tree and adds a modern, lively sparkle to openings.", category: "Spice", origin: "South America" },
  "lavender": { description: "Aromatic, herbal, and calming. A cornerstone of fougère fragrances and men's perfumery. French lavender is the most prized, offering a clean, slightly camphorous aroma.", category: "Aromatic", origin: "Provence, France" },
  "tobacco": { description: "Warm, sweet, and slightly honeyed. Tobacco notes in perfumery evoke dried tobacco leaves, adding a cozy, sophisticated warmth that pairs wonderfully with vanilla and spices.", category: "Aromatic", origin: "Various" },
};

export async function generateMetadata({ params }) {
  const { name } = await params;
  const noteName = decodeURIComponent(name);
  const displayName = noteName.charAt(0).toUpperCase() + noteName.slice(1);
  const info = NOTE_INFO[noteName.toLowerCase()];
  
  return {
    title: `${displayName} in Perfumery — What Does ${displayName} Smell Like? | The Dry Down`,
    description: info 
      ? `${info.description.slice(0, 150)} Discover all perfumes featuring ${noteName} as a note.`
      : `Explore perfumes featuring ${displayName}. Find fragrances with ${displayName} notes, learn what it smells like, and discover your next scent.`,
    keywords: `${noteName}, ${noteName} perfume, ${noteName} note, fragrance notes, what does ${noteName} smell like`,
    alternates: { canonical: `https://www.thedrydown.io/note/${encodeURIComponent(noteName.toLowerCase())}` },
  };
}

export default async function NotePage({ params }) {
  const { name } = await params;
  const noteName = decodeURIComponent(name);
  const displayName = noteName.charAt(0).toUpperCase() + noteName.slice(1);

  // Fetch all perfumes
  const { data: allPerfumes } = await supabase.from('perfumes').select('*').limit(2000);

  // Find perfumes with this note
  const matching = (allPerfumes || []).filter(p => {
    const allNotes = `${p.top_notes},${p.heart_notes},${p.base_notes}`.toLowerCase();
    return allNotes.includes(noteName.toLowerCase());
  });

  // Categorize by position
  const inTop = matching.filter(p => (p.top_notes || '').toLowerCase().includes(noteName.toLowerCase()));
  const inHeart = matching.filter(p => (p.heart_notes || '').toLowerCase().includes(noteName.toLowerCase()));
  const inBase = matching.filter(p => (p.base_notes || '').toLowerCase().includes(noteName.toLowerCase()));

  const info = NOTE_INFO[noteName.toLowerCase()];

  // Find commonly paired notes
  const pairedNotes = {};
  matching.forEach(p => {
    const allNotes = `${p.top_notes},${p.heart_notes},${p.base_notes}`.split(',').map(n => n.trim().toLowerCase()).filter(Boolean);
    allNotes.forEach(n => {
      if (n !== noteName.toLowerCase()) {
        pairedNotes[n] = (pairedNotes[n] || 0) + 1;
      }
    });
  });
  const topPaired = Object.entries(pairedNotes).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${displayName} in Perfumery`,
    "description": info?.description || `Learn about ${displayName} as a fragrance note.`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <NoteDetail 
        noteName={displayName} 
        info={info} 
        matching={matching} 
        inTop={inTop} 
        inHeart={inHeart} 
        inBase={inBase}
        topPaired={topPaired}
      />
    </>
  );
}
