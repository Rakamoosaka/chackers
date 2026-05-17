"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useReducer } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

type CheckStatus = "checking" | "ok" | "fail";

type HealthCheck = {
  label: string;
  status: CheckStatus;
  detail: string;
};

type SetupState = {
  checks: HealthCheck[];
  loading: boolean;
};

const initialChecks: HealthCheck[] = [
  { label: "Environment keys", status: "checking", detail: "Checking client config" },
  { label: "Auth session", status: "checking", detail: "Checking Supabase Auth" },
  { label: "Profiles table", status: "checking", detail: "Checking public.profiles" },
  { label: "Leaderboard table", status: "checking", detail: "Checking public.leaderboard_entries" },
  { label: "Rooms table", status: "checking", detail: "Checking public.rooms" },
  { label: "Room chat table", status: "checking", detail: "Checking public.room_messages" },
];

export function SetupScreen() {
  const [{ checks, loading }, dispatch] = useReducer(setupReducer, {
    checks: initialChecks,
    loading: true,
  });

  useEffect(() => {
    void runChecks();
  }, []);

  async function runChecks() {
    dispatch({ type: "loading" });

    if (!hasSupabaseConfig() || !supabase) {
      dispatch({
        type: "loaded",
        checks: initialChecks.map((check) => ({
          ...check,
          status: check.label === "Environment keys" ? "fail" : "checking",
          detail:
            check.label === "Environment keys"
              ? "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
              : "Skipped until env keys exist",
        })),
      });
      return;
    }

    const nextChecks: HealthCheck[] = [
      {
        label: "Environment keys",
        status: "ok",
        detail: "Client Supabase keys are present",
      },
      await checkAuthSession(),
      await checkTable("Profiles table", "profiles"),
      await checkTable("Leaderboard table", "leaderboard_entries"),
      await checkTable("Rooms table", "rooms"),
      await checkTable("Room chat table", "room_messages"),
    ];

    dispatch({ type: "loaded", checks: nextChecks });
  }

  return (
    <div className="setup-page">
      <section className="game-column">
        <div className="profile-header">
          <div>
            <h2>Backend health</h2>
            <p className="muted-line">Read-only checks for demo setup.</p>
          </div>
          <button className="button" disabled={loading} onClick={runChecks} type="button">
            <RefreshCw size={18} />
            Recheck
          </button>
        </div>

        <div className="setup-check-list">
          {checks.map((check) => (
            <div className="setup-check-row" data-status={check.status} key={check.label}>
              {check.status === "ok" ? (
                <CheckCircle2 size={18} />
              ) : check.status === "fail" ? (
                <XCircle size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Expected setup</h2>
          <p className="coach-note">
            Run `supabase/schema.sql` first, then `supabase/seed.sql` for demo leaderboard rows.
          </p>
        </section>
        <section className="panel-section">
          <h2>Auth testing</h2>
          <p className="muted-line">
            Use the sidebar email and password form. Enable the Email provider in Supabase Auth before testing sign-up.
          </p>
        </section>
      </aside>
    </div>
  );
}

async function checkAuthSession(): Promise<HealthCheck> {
  if (!supabase) {
    return {
      label: "Auth session",
      status: "fail",
      detail: "Supabase client is not configured",
    };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return {
      label: "Auth session",
      status: "fail",
      detail: error.message,
    };
  }

  return {
    label: "Auth session",
    status: "ok",
    detail: data.session ? "Signed-in session found" : "Auth reachable; no active session",
  };
}

async function checkTable(
  label: string,
  table:
    | "profiles"
    | "leaderboard_entries"
    | "rooms"
    | "room_messages",
): Promise<HealthCheck> {
  if (!supabase) {
    return {
      label,
      status: "fail",
      detail: "Supabase client is not configured",
    };
  }

  const { error, count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    label,
    status: error ? "fail" : "ok",
    detail: error ? error.message : `${count ?? 0} rows readable`,
  };
}

function setupReducer(
  state: SetupState,
  action:
    | { type: "loading" }
    | { type: "loaded"; checks: HealthCheck[] },
): SetupState {
  switch (action.type) {
    case "loading":
      return { checks: initialChecks, loading: true };
    case "loaded":
      return { checks: action.checks, loading: false };
  }
}
