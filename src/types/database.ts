export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type League = "Bronze" | "Silver" | "Gold" | "Elite";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          name?: string;
          city?: string;
          rating?: number;
          league?: League;
          games_played?: number;
          wins?: number;
          losses?: number;
          puzzle_streak?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
    };
  };
};
