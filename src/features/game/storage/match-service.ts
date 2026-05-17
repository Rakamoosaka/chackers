import { supabase } from "@/lib/supabase/client";
import type { Database, MatchMode, MatchResult, TimeControl } from "@/types/database";
import { analyzeGame } from "../coach/analyze-game";
import { formatSquare } from "../engine/board";
import type { Move, Player } from "../engine/types";
import {
  updateProfileAfterMatch,
  type Profile,
} from "@/features/profile/profile-service";

export type PlayedMove = Move & {
  player: Player;
};

export type RecentMatch = Database["public"]["Tables"]["matches"]["Row"];

export async function saveCompletedMatch({
  profile,
  mode,
  timeControl,
  opponent,
  winner,
  moves,
}: {
  profile: Profile;
  mode: MatchMode;
  timeControl: TimeControl;
  opponent: string;
  winner: Player;
  moves: PlayedMove[];
}) {
  if (!supabase) {
    return null;
  }

  const didWin = winner === "red";
  const ratingDelta = didWin ? 18 : -14;
  const result: MatchResult = didWin ? "win" : "loss";
  const coachSummary = analyzeGame(moves, winner);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_id: profile.id,
      mode,
      time_control: timeControl,
      opponent,
      result,
      rating_delta: ratingDelta,
      coach_summary: coachSummary,
    })
    .select("*")
    .single();

  if (matchError) {
    throw matchError;
  }

  if (moves.length) {
    const { error: movesError } = await supabase.from("match_moves").insert(
      moves.map((move, index) => ({
        match_id: match.id,
        move_number: index + 1,
        player: move.player,
        from_square: formatSquare(move.from),
        to_square: formatSquare(move.to),
        captured: move.captured?.map(formatSquare) ?? [],
        promoted: Boolean(move.promoted),
      })),
    );

    if (movesError) {
      throw movesError;
    }
  }

  return updateProfileAfterMatch(profile, didWin, ratingDelta);
}

export async function getRecentMatches(profileId: string): Promise<RecentMatch[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return data ?? [];
}
