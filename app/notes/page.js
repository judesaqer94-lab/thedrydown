import { createClient } from '@supabase/supabase-js';
import NotesExplorer from './NotesExplorer';

const supabaseUrl = 'https://wydptxijqfqimsftgmlp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHB0eGlqcWZxaW1zZnRnbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjY1MDYsImV4cCI6MjA4OTMwMjUwNn0.5GvUiFYw1PHFSw92XT6_Ktst20w_dwN8FTz4GYTR4fY';
const supabase = createClient(supabaseUrl, supabaseKey);

export const metadata = {
  title: 'Fragrance Notes Explorer — Learn About Perfume Notes | The Dry Down',
  description: 'Explore hundreds of fragrance notes used in perfumery. Learn what each note smells like and discover perfumes that use them.',
};

export default async function NotesPage() {
  const { data: allPerfumes } = await supabase.from('perfumes').select('top_notes, heart_notes, base_notes').limit(2000);
  const noteMap = {};
  (allPerfumes || []).forEach(p => {
    const allNotes = `${p.top_notes || ''},${p.heart_notes || ''},${p.base_notes || ''}`.split(',').map(n => n.trim()).filter(Boolean);
    allNotes.forEach(n => { noteMap[n] = (noteMap[n] || 0) + 1; });
  });
  const notes = Object.entries(noteMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return <NotesExplorer notes={notes} />;
}
