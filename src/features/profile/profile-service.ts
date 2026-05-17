import { supabase } from "@/lib/supabase/client";
import type { Database, League } from "@/types/database";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export function getLeague(rating: number): League {
  if (rating >= 1800) {
    return "Elite";
  }

  if (rating >= 1500) {
    return "Gold";
  }

  if (rating >= 1250) {
    return "Silver";
  }

  return "Bronze";
}

export async function ensureProfile(userId: string, email?: string | null) {
  if (!supabase) {
    return null;
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return existing;
  }

  const fallbackName = email?.split("@")[0] || "Chackers player";
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      name: fallbackName,
      city: "Almaty",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileAfterMatch(
  profile: Profile,
  didWin: boolean,
  ratingDelta: number,
) {
  if (!supabase) {
    return null;
  }

  const nextRating = profile.rating + ratingDelta;
  const nextProfile = {
    games_played: profile.games_played + 1,
    wins: profile.wins + (didWin ? 1 : 0),
    losses: profile.losses + (didWin ? 0 : 1),
    rating: nextRating,
    league: getLeague(nextRating),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(nextProfile)
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("leaderboard_entries").upsert(
    {
      profile_id: data.id,
      display_name: data.name,
      city: data.city,
      league: data.league,
      rating: data.rating,
      games_played: data.games_played,
      seeded: false,
    },
    { onConflict: "profile_id" },
  );

  return data;
}
