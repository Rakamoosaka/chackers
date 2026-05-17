"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile, type Profile } from "./profile-service";

type ProfileState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

export function useProfile(): ProfileState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!supabase || !currentUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextProfile = await ensureProfile(
        currentUser.id,
        currentUser.email,
      );

      setUser(currentUser);
      setProfile(nextProfile);
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

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadProfile(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  return {
    user,
    profile,
    loading,
    error,
    refreshProfile: async () => loadProfile(user),
  };
}
