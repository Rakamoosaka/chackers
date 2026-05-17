# Chackers

Competitive AI-powered checkers platform focused on fast play, coaching, progression, and social discovery.

## Problem

Most checkers websites feel outdated, isolated, and one-session. They let people play, but they do not create strong reasons to return, improve, compare progress, or invite friends.

## Solution

Chackers turns checkers into a competitive learning product:

- Play: legal checkers engine, AI opponent, timers, move hints, undo, and match saving.
- Learn: post-game AI Coach report and daily tactical puzzles.
- Progress: Supabase-backed profile, rating, league, match history, puzzle streak, and leaderboard.
- Social: friend-link room flow with Supabase room state and Realtime updates.
- Business: Pro roadmap surface for advanced coaching, analytics, and premium skins.

## Demo Flow

1. Open the app on the Play screen.
2. Play Blitz vs AI and show legal move highlights.
3. Show forced captures, timer behavior, and the move list.
4. Finish or reset into a saved match path.
5. Show the Coach report and recent match history.
6. Open Daily Puzzle and solve a tactic.
7. Open Leaderboard and filter by city or league.
8. Open Friend Room, create an invite link, and show room seats/board sync.
9. Open Watch Party prototype.
10. Open Pro and explain monetization.
11. Open Setup if you need to verify Supabase health during the demo.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Vitest
- Lucide icons

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Apply the database schema in `supabase/schema.sql` through the Supabase SQL editor.
Optionally run `supabase/seed.sql` to populate demo leaderboard rows.

For local auth testing, Supabase magic-link emails can hit rate limits. The app also supports email/password auth. In Supabase Dashboard, enable the Email provider; for immediate local sign-up, disable email confirmation while developing.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Architecture

- `src/features/game/engine`: board model, legal moves, captures, promotion, winner detection, evaluation.
- `src/features/game/ai`: AI move selection for Rookie, Challenger, and Master.
- `src/features/game/coach`: deterministic post-game coach summaries.
- `src/features/game/storage`: match persistence and recent match history.
- `src/features/profile`: Supabase profile creation, rating updates, and progression.
- `src/features/puzzles`: curated daily puzzles and puzzle streak persistence.
- `src/features/leaderboard`: global/city/league leaderboard reads with seeded fallback.
- `src/features/rooms`: friend-link rooms, player seats, board state, and Realtime subscriptions.
- `src/features/watch`: seeded Watch Party replay prototype.
- `src/features/pro`: monetization and premium-skin roadmap surface.
- `src/features/setup`: read-only Supabase health checks for demo readiness.

## Supabase Tables

- `profiles`
- `matches`
- `match_moves`
- `leaderboard_entries`
- `puzzle_progress`
- `rooms`
- `room_players`
- `room_messages`

RLS is enabled in the schema. Public reads are allowed where appropriate, and authenticated users manage their own profile, matches, puzzle progress, and room participation.

## Honest Scope

Functional:

- Checkers rules, captures, multi-capture, promotion, and winner detection.
- AI opponent.
- Timers and timeout wins.
- Supabase auth/profile creation.
- Match persistence and recent history.
- Rating and leaderboard updates.
- Daily puzzles with backend streak saving.
- Friend rooms with persisted board state and Realtime subscriptions.

Prototype or roadmap:

- Watch Party uses seeded replay data.
- Pro screen is a product/business surface, not a live Stripe checkout.
- Room chat exists in the schema but is not a full chat product yet.
- Multiplayer is suitable for demo flow, but production hardening would need conflict handling, disconnect handling, and stronger server-side move validation.

## Product Metrics

The product is designed around:

- game completion rate
- daily puzzle streaks
- repeat games per user
- AI Coach report opens
- room invite creation rate
- city leaderboard engagement
- Pro conversion intent

## Deployment

Recommended:

- Vercel for the Next.js frontend.
- Supabase for Auth, Postgres, and Realtime.
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.
- Run `supabase/schema.sql` before testing backend-backed flows.
- Run `supabase/seed.sql` if you want demo leaderboard rows in the database.
- Open `/setup` locally to verify that public tables are readable and Auth is reachable.
