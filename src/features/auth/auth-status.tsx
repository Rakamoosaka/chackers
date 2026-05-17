"use client";

import { FormEvent, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export function AuthStatus() {
  const ready = useMemo(() => hasSupabaseConfig(), []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    ready ? "Enter email for magic link" : "Add .env.local keys",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !email) {
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setMessage(error ? error.message : "Check your email");
    setIsSubmitting(false);
  }

  return (
    <form className="auth-status" onSubmit={handleSubmit}>
      <span className={ready ? "auth-dot ready" : "auth-dot"} aria-hidden="true" />
      <div>
        <strong>{ready ? "Supabase ready" : "Local setup"}</strong>
        <p aria-live="polite">{message}</p>
      </div>
      {ready ? (
        <>
          <input
            aria-label="Email address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <button className="button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending" : "Sign in"}
          </button>
        </>
      ) : null}
    </form>
  );
}
