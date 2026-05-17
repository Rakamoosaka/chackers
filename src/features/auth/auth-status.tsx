"use client";

import { FormEvent, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { useProfile } from "@/features/profile/use-profile";

type AuthMode = "magic" | "password";
type PasswordAction = "signin" | "signup";

export function AuthStatus() {
  const ready = useMemo(() => hasSupabaseConfig(), []);
  const { user, profile } = useProfile();
  const [mode, setMode] = useState<AuthMode>("magic");
  const [passwordAction, setPasswordAction] =
    useState<PasswordAction>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.href,
        },
      });

      setMessage(error ? error.message : "Check your email");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    if (passwordAction === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setMessage(error ? error.message : "Signed in");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    setMessage(
      error
        ? error.message
        : data.session
          ? "Account created"
          : "Account created. Check email if confirmation is enabled.",
    );

    if (!error && !data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setMessage(signInError ? signInError.message : "Account created and signed in");
    }
    setIsSubmitting(false);
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setEmail("");
    setPassword("");
    setMessage("Signed out");
  }

  return (
    <form className="auth-status" onSubmit={handleSubmit}>
      <div className="auth-summary">
        <span className={ready ? "auth-dot ready" : "auth-dot"} aria-hidden="true" />
        <div>
          <strong>
            {profile?.name ?? (ready ? "Supabase ready" : "Local setup")}
          </strong>
          <p aria-live="polite">{message}</p>
        </div>
      </div>
      {ready && user ? (
        <button className="button" onClick={handleSignOut} type="button">
          Sign out
        </button>
      ) : ready ? (
        <>
          <select
            aria-label="Sign-in method"
            onChange={(event) => {
              const nextMode = event.target.value as AuthMode;
              setMode(nextMode);
              setMessage(
                nextMode === "magic"
                  ? "Enter email for magic link"
                  : "Enter email and password",
              );
            }}
            value={mode}
          >
            <option value="magic">Magic link</option>
            <option value="password">Password</option>
          </select>
          <input
            aria-label="Email address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          {mode === "password" ? (
            <>
              <select
                aria-label="Password action"
                onChange={(event) =>
                  setPasswordAction(event.target.value as PasswordAction)
                }
                value={passwordAction}
              >
                <option value="signin">Sign in</option>
                <option value="signup">Create</option>
              </select>
              <input
                aria-label="Password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                type="password"
                value={password}
              />
            </>
          ) : null}
          <button className="button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Working" : "Sign in"}
          </button>
        </>
      ) : null}
    </form>
  );
}
