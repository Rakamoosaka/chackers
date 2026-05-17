export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type League = "Bronze" | "Silver" | "Gold" | "Elite";
export type MatchMode = "local" | "ai" | "room";
export type TimeControl = "bullet" | "blitz" | "rapid";
export type MatchResult = "win" | "loss" | "draw";
export type PlayerColor = "red" | "black";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          name: string;
          city: string;
          rating: number;
          league: League;
          games_played: number;
          wins: number;
          losses: number;
          puzzle_streak: number;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          name?: string;
          city?: string;
          rating?: number;
          league?: League;
          games_played?: number;
          wins?: number;
          losses?: number;
          puzzle_streak?: number;
        }
      >;
      matches: Table<
        {
          id: string;
          user_id: string;
          mode: MatchMode;
          time_control: TimeControl;
          opponent: string;
          result: MatchResult;
          rating_delta: number;
          coach_summary: Json | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          mode: MatchMode;
          time_control: TimeControl;
          opponent: string;
          result: MatchResult;
          rating_delta?: number;
          coach_summary?: Json | null;
        }
      >;
      match_moves: Table<
        {
          id: number;
          match_id: string;
          move_number: number;
          player: PlayerColor;
          from_square: string;
          to_square: string;
          captured: Json;
          promoted: boolean;
          evaluation_before: number | null;
          evaluation_after: number | null;
        },
        {
          match_id: string;
          move_number: number;
          player: PlayerColor;
          from_square: string;
          to_square: string;
          captured?: Json;
          promoted?: boolean;
          evaluation_before?: number | null;
          evaluation_after?: number | null;
        }
      >;
      leaderboard_entries: Table<
        {
          id: string;
          profile_id: string | null;
          display_name: string;
          city: string;
          league: League;
          rating: number;
          games_played: number;
          seeded: boolean;
          updated_at: string;
        },
        {
          id?: string;
          profile_id?: string | null;
          display_name: string;
          city?: string;
          league?: League;
          rating?: number;
          games_played?: number;
          seeded?: boolean;
        }
      >;
      puzzle_progress: Table<
        {
          id: string;
          user_id: string;
          puzzle_key: string;
          solved_on: string;
          attempts: number;
        },
        {
          id?: string;
          user_id: string;
          puzzle_key: string;
          solved_on?: string;
          attempts?: number;
        }
      >;
      rooms: Table<
        {
          id: string;
          code: string;
          host_id: string | null;
          status: "waiting" | "active" | "finished";
          board_state: Json;
          turn: PlayerColor;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          code: string;
          host_id?: string | null;
          status?: "waiting" | "active" | "finished";
          board_state: Json;
          turn?: PlayerColor;
        }
      >;
      room_players: Table<
        {
          id: string;
          room_id: string;
          user_id: string | null;
          seat: PlayerColor | "spectator";
          display_name: string;
          joined_at: string;
        },
        {
          id?: string;
          room_id: string;
          user_id?: string | null;
          seat: PlayerColor | "spectator";
          display_name: string;
        }
      >;
      room_messages: Table<
        {
          id: string;
          room_id: string;
          user_id: string | null;
          display_name: string;
          body: string;
          created_at: string;
        },
        {
          id?: string;
          room_id: string;
          user_id?: string | null;
          display_name: string;
          body: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
