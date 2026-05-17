import { supabase } from "@/lib/supabase/client";
import type { Database, League } from "@/types/database";

export type LeaderboardEntry =
  Database["public"]["Tables"]["leaderboard_entries"]["Row"];

export type LeaderboardFilters = {
  city?: string;
  league?: League | "All";
  limit?: number;
};

const fallbackEntries: LeaderboardEntry[] = [
  {
    id: "seed-1",
    profile_id: null,
    display_name: "Aruzhan",
    city: "Almaty",
    league: "Gold",
    rating: 1560,
    games_played: 42,
    seeded: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-2",
    profile_id: null,
    display_name: "Miras",
    city: "Astana",
    league: "Silver",
    rating: 1390,
    games_played: 27,
    seeded: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-3",
    profile_id: null,
    display_name: "Dana",
    city: "Shymkent",
    league: "Bronze",
    rating: 1215,
    games_played: 16,
    seeded: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-4",
    profile_id: null,
    display_name: "Nurlan",
    city: "Almaty",
    league: "Silver",
    rating: 1440,
    games_played: 31,
    seeded: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-5",
    profile_id: null,
    display_name: "Aigerim",
    city: "Almaty",
    league: "Bronze",
    rating: 1180,
    games_played: 11,
    seeded: true,
    updated_at: new Date().toISOString(),
  },
];

export async function getLeaderboardEntries(filters: LeaderboardFilters = {}) {
  const { city, league = "All", limit = 8 } = filters;

  if (!supabase) {
    return filterFallbackEntries(fallbackEntries, filters);
  }

  let query = supabase
    .from("leaderboard_entries")
    .select("*")
    .order("rating", { ascending: false });

  if (city && city !== "All") {
    query = query.eq("city", city);
  }

  if (league && league !== "All") {
    query = query.eq("league", league);
  }

  const { data, error } = await query.limit(limit);

  if (error || !data?.length) {
    return filterFallbackEntries(fallbackEntries, filters);
  }

  return data;
}

function filterFallbackEntries(
  entries: LeaderboardEntry[],
  { city, league = "All", limit = 8 }: LeaderboardFilters,
) {
  return entries
    .filter((entry) => !city || city === "All" || entry.city === city)
    .filter((entry) => league === "All" || entry.league === league)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
