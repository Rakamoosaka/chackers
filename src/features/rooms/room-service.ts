import { createInitialBoard } from "@/features/game/engine/board";
import type { Board } from "@/features/game/engine/types";
import { supabase } from "@/lib/supabase/client";
import type { Database, Json, PlayerColor } from "@/types/database";
import type { Profile } from "@/features/profile/profile-service";

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
export type RoomMessage = Database["public"]["Tables"]["room_messages"]["Row"];

export type RoomSnapshot = {
  room: Room;
  players: RoomPlayer[];
};

export async function createRoom(profile: Profile): Promise<RoomSnapshot> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const code = createRoomCode();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code,
      host_id: profile.id,
      board_state: createInitialBoard() as Json,
      turn: "red",
    })
    .select("*")
    .single();

  if (roomError) {
    throw roomError;
  }

  const { error: playerError } = await supabase.from("room_players").insert({
    room_id: room.id,
    user_id: profile.id,
    seat: "red",
    display_name: profile.name,
  });

  if (playerError) {
    throw playerError;
  }

  return getRoomByCode(room.code);
}

export async function getRoomByCode(code: string): Promise<RoomSnapshot> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedCode = code.trim().toUpperCase();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (roomError) {
    throw roomError;
  }

  if (!room) {
    throw new Error("Room not found.");
  }

  return {
    room,
    players: await getRoomPlayers(room.id),
  };
}

export async function joinRoomAsBlack(
  room: Room,
  profile: Profile,
): Promise<RoomSnapshot> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const players = await getRoomPlayers(room.id);
  const existingSeat = players.find((player) => player.user_id === profile.id);

  if (existingSeat) {
    return { room, players };
  }

  if (players.some((player) => player.seat === "black")) {
    throw new Error("Black seat is already taken.");
  }

  const { error } = await supabase.from("room_players").insert({
    room_id: room.id,
    user_id: profile.id,
    seat: "black",
    display_name: profile.name,
  });

  if (error) {
    throw error;
  }

  await supabase.from("rooms").update({ status: "active" }).eq("id", room.id);

  return getRoomByCode(room.code);
}

export async function updateRoomBoard({
  room,
  board,
  turn,
}: {
  room: Room;
  board: Board;
  turn: PlayerColor;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({
      board_state: board as Json,
      turn,
    })
    .eq("id", room.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getRoomPlayers(roomId: string) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function getPlayerForSeat(
  players: RoomPlayer[],
  seat: PlayerColor,
) {
  return players.find((player) => player.seat === seat);
}

export async function getRoomMessages(roomId: string) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("room_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(30);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function sendRoomMessage({
  room,
  profile,
  body,
}: {
  room: Room;
  profile: Profile | null;
  body: string;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return null;
  }

  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      room_id: room.id,
      user_id: profile?.id ?? null,
      display_name: profile?.name ?? "Spectator",
      body: trimmedBody,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
