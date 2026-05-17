# Technical Architecture

## Recommended Stack

- **Frontend:** Next.js + React + TypeScript.
- **Styling:** Tailwind CSS.
- **State:** Zustand or React state + reducers.
- **Backend:** Supabase.
- **Database:** Supabase Postgres.
- **Auth:** Supabase Auth.
- **Realtime:** Supabase Realtime for rooms/multiplayer.
- **Local cache:** LocalStorage only for fallback and UX continuity.
- **Deployment:** Vercel.

## Why This Stack

- Fast to ship.
- Easy to deploy.
- TypeScript helps prevent rule-engine bugs.
- Supabase gives auth, database, and realtime without building a custom backend from scratch.
- LocalStorage remains useful for unfinished games, theme settings, and anonymous fallback.

## Suggested Structure

Use a simple feature-based structure instead of overengineering full FSD:

```txt
src/
  app/
  components/
    board/
    layout/
    panels/
  features/
    game/
      engine/
      ai/
      coach/
      storage/
    auth/
    puzzles/
    leaderboard/
    multiplayer/
    profile/
    pro/
  lib/
  types/
```

## Core Modules

### Game Engine

Responsible for:

- board representation
- legal move generation
- capture detection
- king promotion
- winner detection
- move application
- board evaluation

The engine should be UI-independent and testable.

### AI

Responsible for:

- selecting moves by difficulty
- evaluating board positions
- producing realistic opponent behavior

Difficulty logic:

- Rookie: random legal move.
- Challenger: capture first, then promotion, then random.
- Master: minimax depth 2 or 3, depending on performance.

### Coach

Responsible for:

- analyzing move history
- detecting missed opportunities
- generating post-game insights
- producing an accuracy estimate

### Storage

Responsible for:

- save/load profile
- save/load game history
- save/load settings
- save/load puzzle streak

Backend is the source of truth. LocalStorage is only a cache/fallback layer.

### Multiplayer

For the one-day build, multiplayer should have a real backend room model:

- create invite link
- show room code
- join room by link
- persist room state
- use Supabase Realtime for room updates
- simulate second player joining only as a fallback

Production version:

- Supabase Realtime rooms
- authoritative room state
- reconnect handling
- spectator state
- room chat/reactions

## Data Model Sketch

### Player Profile

```ts
type PlayerProfile = {
  id: string;
  name: string;
  city: string;
  rating: number;
  league: "Bronze" | "Silver" | "Gold" | "Elite";
  gamesPlayed: number;
  wins: number;
  losses: number;
  puzzleStreak: number;
};
```

### Match Record

```ts
type MatchRecord = {
  id: string;
  mode: "local" | "ai";
  timeControl: "bullet" | "blitz" | "rapid";
  opponent: string;
  result: "win" | "loss" | "draw";
  ratingDelta: number;
  moves: MoveRecord[];
  coachSummary: CoachSummary;
  createdAt: string;
};
```

### Move Record

```ts
type MoveRecord = {
  from: Square;
  to: Square;
  captured?: Square[];
  promoted?: boolean;
  evaluationBefore?: number;
  evaluationAfter?: number;
};
```

## Backend Persistence Plan

Supabase should store:

- profiles
- matches
- match_moves
- leaderboard_entries
- puzzle_progress
- rooms
- room_players
- room_messages

LocalStorage should store:

- unfinished local game state
- anonymous temporary profile
- theme preference
- cached recent matches

## Supabase Schema

- `profiles`
- `matches`
- `match_moves`
- `leaderboard_entries`
- `rooms`
- `room_players`
- `puzzle_progress`
- `room_messages`

Minimum security:

- Users can read public leaderboard data.
- Users can insert/update only their own profile.
- Users can insert their own matches.
- Room participants can read/update their room.

## Testing Plan

Minimum useful tests:

- legal diagonal moves
- invalid moves rejected
- capture moves generated
- promotion works
- winner detection works
- AI returns a legal move

If test setup is too slow, manually verify these scenarios and document them in README.
