"use client";

import { FormEvent, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { useProfile } from "@/features/profile/use-profile";

type PasswordAction = "signin" | "signup";
type AuthModal = PasswordAction | null;

export function AuthStatus() {
  const ready = useMemo(() => hasSupabaseConfig(), []);
  const { user, profile } = useProfile();
  const [activeModal, setActiveModal] = useState<AuthModal>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    ready ? "Log in or sign up" : "Add .env.local keys",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openAuthModal(action: PasswordAction) {
    setActiveModal(action);
    setMessage(action === "signin" ? "Log in with password" : "Create account");
  }

  function closeAuthModal() {
    if (isSubmitting) {
      return;
    }

    setActiveModal(null);
    setPassword("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    action: PasswordAction,
  ) {
    event.preventDefault();

    if (!supabase || !email || !password) {
      setMessage("Enter email and password");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    if (action === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setMessage(error ? error.message : "Signed in");
      setActiveModal(error ? action : null);
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setMessage(
      error
        ? error.message
        : data.session
          ? "Account created"
          : "Account created. Check email to confirm your account.",
    );
    setActiveModal(error ? action : null);
    setIsSubmitting(false);
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setEmail("");
    setPassword("");
    setMessage("Signed out");
  }

  return (
    <div className="auth-status">
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
        <div className="auth-actions">
          <button
            className="button primary"
            onClick={() => openAuthModal("signin")}
            type="button"
          >
            Log in
          </button>
          <button
            className="button"
            onClick={() => openAuthModal("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>
      ) : null}
      {activeModal ? (
        <div className="auth-modal-backdrop" role="presentation">
          <form
            aria-labelledby="auth-modal-title"
            aria-modal="true"
            className="auth-dialog"
            onSubmit={(event) => handleSubmit(event, activeModal)}
            role="dialog"
          >
            <div className="auth-dialog-head">
              <h2 id="auth-modal-title">
                {activeModal === "signin" ? "Log in" : "Sign up"}
              </h2>
              <button
                aria-label="Close auth modal"
                className="button"
                disabled={isSubmitting}
                onClick={closeAuthModal}
                type="button"
              >
                Close
              </button>
            </div>
            <label className="field">
              <span>Email</span>
              <input
                autoFocus
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                type="password"
                value={password}
              />
            </label>
            <p className="muted-line" aria-live="polite">{message}</p>
            <button className="button primary" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Working"
                : activeModal === "signin"
                  ? "Log in"
                  : "Sign up"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
