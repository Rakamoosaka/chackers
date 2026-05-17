# Demo And README Strategy

## Demo Script

Use this flow during presentation:

1. Open app directly on Play screen.
2. Start Blitz vs AI.
3. Show legal move highlights and capture.
4. Promote a piece or show a prepared state with a king.
5. Finish or reset into a completed sample match.
6. Open AI Coach report.
7. Show match history and rating change.
8. Open Daily Puzzle and streak.
9. Open city leaderboard.
10. Create a friend invite link and show the multiplayer room flow.
11. Open Watch Party simulation.
12. Open Pro screen and explain monetization.

## README Structure

### Title

Chackers: Competitive AI-powered checkers platform.

### Problem

Most checkers websites are outdated, isolated, and do not create a reason to return.

### Solution

Chackers turns checkers into a fast competitive learning platform with AI coaching, daily puzzles, ranked progression, and social discovery.

### Features

Group features by product value:

- Play: rules, AI, timers, move hints.
- Learn: AI Coach, daily puzzles.
- Progress: Elo, leagues, history.
- Social: friend-link multiplayer prototype, city leaderboard, Watch Party prototype.
- Business: Pro plan, skins, future Stripe.

### Tech Stack

Explain the stack briefly:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Realtime for multiplayer rooms
- LocalStorage fallback/cache

### Architecture

Explain the modular structure:

- game engine
- AI
- coach
- backend persistence
- auth
- realtime room model
- product screens

### Product Thinking

Mention:

- retention loops
- monetization
- target users
- metrics
- roadmap

### Honest Scope

Be transparent:

- Core rules are real.
- AI, auth, profile, matches, and leaderboard persistence are functional.
- LocalStorage is only a fallback/cache layer.
- Friend-link multiplayer has a backend room model; realtime sync may be prototype-level depending on deadline.
- Watch Party and payments are roadmap/prototype items.

## README Tone

Do not write:

> I made a checkers game.

Write:

> I built a prototype of a competitive checkers platform focused on retention, learning, and social discovery.

## Screenshots

Add screenshots if there is time:

- Play screen.
- AI Coach report.
- Daily Puzzle.
- Leaderboard.
- Watch Party.

## Deployment Notes

Recommended deployment:

- Vercel for frontend.
- Supabase for auth, persistence, leaderboard data, and room state.
- Environment variables documented in README.
