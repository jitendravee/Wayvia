"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // No backend wired up yet — this is a UI-only stub. Swap in a real
    // subscribe call here (API route, email provider, etc.) when ready.
    setSubmitted(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="block font-display text-[14px] font-semibold text-ink">Get travel ideas in your inbox</span>
      <p className="mt-1.5 font-sans text-[12.5px] leading-relaxed text-ink-muted">
        Tips, guides and smarter travel ideas straight to your inbox.
      </p>

      {submitted ? (
        <p className="mt-3.5 rounded-lg bg-signal-green-soft px-3 py-2.5 font-sans text-[12.5px] font-medium text-signal-green">
          You&rsquo;re subscribed — welcome aboard!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3.5 flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-sans text-[13px] text-ink outline-none placeholder:text-ink-dim focus:border-violet focus:ring-2 focus:ring-violet-ring"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-violet py-2.5 font-display text-[13px] font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            Subscribe
          </button>
        </form>
      )}

      <p className="mt-2.5 font-sans text-[10.5px] text-ink-dim">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
