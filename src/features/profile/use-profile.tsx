"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile, type Profile } from "./profile-service";

const CACHE_KEY = "chackers:profile";
type ProfileCache = { userId: string; profile: Profile };

function readCache(): ProfileCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ProfileCache) : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, profile: Profile): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, profile }));
  } catch {}
}

function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export type ProfileState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (currentUser: User | null, silent = false) => {
    if (!supabase || !currentUser) {
      setUser(null);
      setProfile(null);
      clearCache();
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const nextProfile = await ensureProfile(currentUser.id, currentUser.email);
      setUser(currentUser);
      setProfile(nextProfile);
      if (nextProfile) {
        writeCache(currentUser.id, nextProfile);
      }
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Could not load profile",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(
    () => loadProfile(user, true),
    [user, loadProfile],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    async function loadInitialSession() {
      if (!supabase) {
        return;
      }

      // Show cached profile immediately while auth is verified in the background
      const cached = readCache();
      if (cached) {
        setProfile(cached.profile);
        setLoading(false);
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setProfile(null);
        clearCache();
        setLoading(false);
        return;
      }

      const isSameUser = Boolean(cached && cached.userId === data.user.id);
      void loadProfile(data.user, isSameUser);
    }

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is handled by loadInitialSession
      // TOKEN_REFRESHED doesn't require a profile reload
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }
      void loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  return (
    <ProfileContext.Provider value={{ user, profile, loading, error, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileState {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
