'use client';

import { useState } from 'react';
import { Header, Footer } from '../components/shared';
import { supabase } from '../../lib/supabase';

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', email: '', type: 'suggestion', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('feedback').insert({
        name: form.name || 'Anonymous',
        email: form.email || null,
        type: form.type,
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Header current="feedback" />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="animate-fade-up">

          <div className="mb-12 text-center">
            <h1 className="font-serif text-5xl leading-none mb-4" style={{ letterSpacing: '-0.03em' }}>
              Share Your <span className="italic" style={{ color: '#9B8EC4' }}>Feedback</span>
            </h1>
            <p className="text-stone text-sm max-w-md mx-auto leading-relaxed">
              The Dry Down is built for the community. Tell us what's working, what's broken, 
              or what you'd love to see next.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-16 border border-faint">
              <div className="font-serif text-3xl mb-3" style={{ color: '#9B8EC4' }}>Thank you!</div>
              <p className="text-sm text-stone mb-6">Your feedback has been received. We read every submission.</p>
              <a href="/" className="text-xs uppercase tracking-widest font-medium no-underline" style={{ color: '#9B8EC4' }}>
                ← Back to Directory
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone font-medium block mb-2">
                  Name <span className="normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full p-3 border border-faint bg-transparent text-sm focus:border-ink focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone font-medium block mb-2">
                  Email <span className="normal-case tracking-normal font-normal">(optional — only if you'd like a reply)</span>
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  type="email"
                  className="w-full p-3 border border-faint bg-transparent text-sm focus:border-ink focus:outline-none transition-colors"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone font-medium block mb-2">
                  Type of feedback
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'suggestion', label: 'Feature Suggestion' },
                    { value: 'bug', label: 'Bug Report' },
                    { value: 'missing', label: 'Missing Perfume' },
                    { value: 'pricing', label: 'Wrong Price' },
                    { value: 'general', label: 'General' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className="px-4 py-2 text-xs uppercase tracking-widest font-medium transition-all"
                      style={{
                        background: form.type === opt.value ? '#1A1A1A' : 'transparent',
                        color: form.type === opt.value ? '#FAF8F5' : '#8C8378',
                        border: `1px solid ${form.type === opt.value ? '#1A1A1A' : '#D8D0C8'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone font-medium block mb-2">
                  Your message
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder={
                    form.type === 'bug' ? "What happened? What did you expect to happen?" :
                    form.type === 'missing' ? "Which perfume is missing? Include brand and name." :
                    form.type === 'pricing' ? "Which perfume has the wrong price? What should it be?" :
                    "What would make The Dry Down better for you?"
                  }
                  rows={5}
                  className="w-full p-3 border border-faint bg-transparent text-sm resize-y focus:border-ink focus:outline-none transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!form.message.trim() || submitting}
                className="w-full py-3 text-xs uppercase tracking-widest font-medium transition-opacity"
                style={{
                  background: form.message.trim() ? '#1A1A1A' : '#D8D0C8',
                  color: '#FAF8F5',
                  opacity: submitting ? 0.5 : 1,
                  border: 'none',
                  cursor: form.message.trim() ? 'pointer' : 'default',
                }}
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
