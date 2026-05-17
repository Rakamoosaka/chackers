# Development Timeline

## Phase 1: Project Foundation

Goal: create the app shell and backend foundation before building product features.

Deliverables:

- Next.js + TypeScript app.
- Tailwind configured.
- Base layout and navigation.
- Sega and Uncodixfy standards wired into UI decisions.
- Supabase project connected through environment variables.
- Supabase client configured.
- Auth flow scaffolded.

Exit criteria:

- App runs locally.
- Supabase connection works.
- User can reach the main app shell.

## Phase 2: Backend Schema And Persistence

Goal: make the project backend-backed from the beginning, not LocalStorage-first.

Deliverables:

- `profiles` table.
- `matches` table.
- `match_moves` table.
- `leaderboard_entries` table.
- `puzzle_progress` table.
- `rooms` table.
- `room_players` table.
- `room_messages` table if chat/reactions are included.
- Minimal RLS policies.
- Seed data for leaderboard and demo users.

Exit criteria:

- A user profile can be created or loaded.
- Match records can be saved.
- Leaderboard data can be read.
- Room records can be created.

## Phase 3: Checkers Engine

Goal: build the reliable rules core before adding advanced product layers.

Deliverables:

- Board representation.
- Initial 8x8 setup.
- Legal diagonal movement.
- Capture generation.
- Multi-capture if feasible.
- King promotion.
- Turn switching.
- Winner detection.
- Board evaluation helper for AI and Coach.

Exit criteria:

- Invalid moves are rejected.
- Captures work.
- Promotion works.
- Game can end with a winner.

## Phase 4: Play Screen UX

Goal: create the main playable experience.

Deliverables:

- Responsive board.
- Click/tap-to-move interaction.
- Selected piece state.
- Legal move highlights.
- Capture highlights.
- Last move highlight.
- Timers for Rapid, Blitz, and Bullet.
- Restart and undo.
- Move list.
- Local two-player mode.

Exit criteria:

- A full local game can be played.
- Board is usable on desktop and mobile.
- Turn, timer, and legal moves are always clear.

## Phase 5: AI Opponent

Goal: make the app useful for solo play.

Deliverables:

- AI mode.
- Rookie difficulty: random legal move.
- Challenger difficulty: prefers captures and promotions.
- Master difficulty: shallow minimax if time allows.
- AI move delay for natural pacing.
- AI games saved to backend match history.

Exit criteria:

- User can complete a game against AI.
- AI always returns legal moves.
- Match result is persisted.

## Phase 6: Player Progression

Goal: turn the game into a platform with persistence and progression.

Deliverables:

- Backend-backed profile.
- Rating snapshot.
- Elo-style rating updates.
- League badges: Bronze, Silver, Gold, Elite.
- Match history.
- Win/loss stats.
- Theme and skin preference with LocalStorage fallback.

Exit criteria:

- Profile reflects played games.
- Match history survives refresh/login.
- Leaderboard can use profile rating.

## Phase 7: AI Coach

Goal: make Chackers feel differentiated as a learning product.

Deliverables:

- Move history analysis.
- Missed capture detection.
- Risky move detection.
- Promotion opportunity detection.
- Material swing detection.
- Compact in-game hint.
- Post-game Coach report.
- Accuracy estimate.

Exit criteria:

- Completed games produce useful Coach feedback.
- Coach report references specific game moments.
- Feedback is readable and not generic.

## Phase 8: Puzzles And Leaderboard

Goal: add retention and social proof.

Deliverables:

- Daily puzzle screen.
- Curated static puzzle positions.
- Backend-backed puzzle streak.
- Global leaderboard.
- City leaderboard.
- Almaty demo ranking.
- Current player highlighted.
- League/city filters.

Exit criteria:

- Puzzle progress is saved.
- Leaderboard mixes seeded rows with real profile data.
- Current player is visible in rankings.

## Phase 9: Friend-Link Multiplayer

Goal: ship the "play with a friend by link" product flow using Supabase Realtime.

Deliverables:

- Create room action.
- Generated room code.
- Invite link.
- Join room by link.
- Player slots.
- Room status.
- Board state persisted in `rooms`.
- Supabase Realtime subscription for room updates.
- Fallback waiting/simulated state only if realtime sync becomes unstable.

Exit criteria:

- Room can be created and opened by link.
- Room state is stored in Supabase.
- Realtime updates are attempted through Supabase Realtime.
- Demo can show the multiplayer flow without pretending it is a finished production system.

## Phase 10: Watch, Pro, And Skins

Goal: show product vision and business thinking without risking the core product.

Deliverables:

- Watch Party prototype.
- Simulated live match replay.
- Spectator count.
- Emoji reactions.
- Seeded chat.
- Pro screen.
- AI Coach upgrade positioning.
- Analytics preview.
- Skin selector.

Exit criteria:

- Watch and Pro screens communicate the future product direction.
- These screens do not block Play, backend, AI, Coach, leaderboard, or multiplayer.

## Phase 11: Polish And Verification

Goal: make the prototype feel stable and demo-ready.

Deliverables:

- Mobile layout pass.
- Board sizing pass.
- Empty states.
- Loading states.
- Error states for backend failures.
- Keyboard and pointer usability checks.
- Basic accessibility checks.
- Manual rule verification.
- Supabase data verification.

Exit criteria:

- Core demo path works after refresh.
- Backend data persists.
- UI follows Uncodixfy and Sega standards.
- No major overlap, clipping, or unreadable text on mobile.

## Phase 12: README And Demo Prep

Goal: present Chackers as a product, not just a coding task.

Deliverables:

- README with product problem/solution.
- Feature list grouped by product value.
- Tech stack with Supabase Auth/Postgres/Realtime.
- Architecture notes.
- Honest scope statement.
- Product metrics.
- Roadmap.
- Deployment notes.
- Screenshots if possible.
- Vercel deployment.

Exit criteria:

- README explains what is real, what is prototype, and what comes next.
- Demo script can be followed without improvising.
- Deployment URL works.

## Deadline Triage

If behind schedule, cut in this order:

1. Watch Party depth.
2. Pro cosmetics.
3. Master AI.
4. Room chat/reactions.
5. Advanced puzzle variants.
6. Extra skins.

Protect in this order:

1. Legal playable checkers.
2. Responsive Play screen.
3. Supabase auth/profile/history/leaderboard.
4. AI opponent.
5. AI Coach, even if simplified.
6. City leaderboard.
7. Friend-link room creation and persistence.
8. README product narrative.
