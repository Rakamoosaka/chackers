import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/features/profile/profile-service";

export async function savePuzzleSolved(profile: Profile, puzzleKey: string) {
  if (!supabase) {
    return profile;
  }

  const { data: existingRows, error: selectError } = await supabase
    .from("puzzle_progress")
    .select("id")
    .eq("user_id", profile.id)
    .eq("puzzle_key", puzzleKey)
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  const existing = existingRows?.[0];

  if (existing) {
    const { error } = await supabase
      .from("puzzle_progress")
      .update({ attempts: 1 })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    return profile;
  }

  const { error: insertError } = await supabase.from("puzzle_progress").insert({
    user_id: profile.id,
    puzzle_key: puzzleKey,
    attempts: 1,
  });

  if (insertError) {
    throw insertError;
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .update({ puzzle_streak: profile.puzzle_streak + 1 })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (profileError) {
    throw profileError;
  }

  return data;
}
