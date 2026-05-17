# Feature Scope

## MVP Scope For One Day

### Must Ship

- 8x8 playable checkers board.
- Legal move validation.
- Captures.
- Multi-capture if feasible.
- King promotion.
- Turn switching.
- Winner detection.
- Possible move highlights.
- Undo/restart.
- Local two-player mode.
- AI opponent mode.
- Responsive layout for desktop and phone.
- Backend persistence:
  - authentication
  - profile
  - match history
  - settings
  - puzzle streak
  - rating snapshot
- LocalStorage fallback/cache:
  - current unfinished match
  - anonymous pre-login session
  - theme setting
- Light/dark themes.
- README with product framing.

### Should Ship

- AI difficulty levels:
  - Rookie: random legal move.
  - Challenger: prefers captures and promotions.
  - Master: shallow minimax with board evaluation.
- Timed modes:
  - Rapid: 10 minutes.
  - Blitz: 5 minutes.
  - Bullet: 1 minute.
- Elo-style rating changes after AI/local match.
- League badges:
  - Bronze
  - Silver
  - Gold
  - Elite
- Daily puzzle screen with 3 curated positions.
- AI Coach summary after game:
  - best move missed
  - risky move
  - capture opportunity
  - promotion opportunity
  - accuracy percentage estimate

### Nice To Ship If Time Allows

- Watch Party prototype:
  - list of live matches
  - open a simulated match replay
  - emoji reactions
  - read-only board playback
- Friend-link multiplayer prototype:
  - create room button
  - shareable invite link UI
  - room code display
  - local/simulated second player fallback
- City leaderboard:
  - mock cities: Almaty, Astana, Shymkent, Atyrau
  - current player appears in the list
  - filters by city and league
  - persists real user rating through backend
- Pro modal:
  - unlimited AI Coach
  - advanced analytics
  - premium board skins
  - Stripe button as disabled/mock "coming soon"
- Cosmetic skins:
  - Classic
  - Neon
  - Nomad/Kazakh ornament inspired
  - Minimal

## Features To Avoid In The One-Day Build

These are impressive but likely too risky for the deadline:

- Real production multiplayer.
- Full custom WebSocket infrastructure.
- Real Stripe checkout.
- Perfect tournament system.
- Complex drag-and-drop edge cases before click-to-move is stable.

Backend is required. Use Supabase to avoid spending the whole day building auth, database, and realtime infrastructure from scratch.

## Major Feature Details

### Competitive Modes

Modes should make the game feel alive:

- **Bullet:** 1-minute high-pressure games.
- **Blitz:** 5-minute default competitive mode.
- **Rapid:** 10-minute slower learning mode.
- **Puzzle Rush:** solve as many tactical checkers puzzles as possible.

### AI Opponent

Difficulty logic:

- **Rookie:** random legal move.
- **Challenger:** capture first, then promotion, then random.
- **Master:** minimax depth 2 or 3, depending on performance.

### AI Coach

The AI Coach is the most important "great level" feature because it turns the app from a board into a learning product.

Coach output examples:

- "You missed a capture chain on move 14."
- "This move gave your opponent a direct path to promotion."
- "Your strongest phase was the opening: 86% accuracy."
- "Try controlling the long diagonal before trading pieces."

Implementation for one day:

- Track every move.
- Evaluate board before and after each move.
- Detect simple mistakes:
  - ignored capture
  - moved into capture
  - missed promotion
  - lost material
  - failed to continue multi-capture
- Generate readable feedback from rules, not from an external LLM.

This is deterministic, fast, free, and demo-friendly.

### Daily Puzzles

Daily puzzles create retention. For the prototype, use curated static puzzles and persist streaks in the backend, with LocalStorage as fallback for anonymous users.

Puzzle card data:

- title
- difficulty
- board position
- side to move
- target result, for example "win a piece" or "promote in 2"
- solution move sequence

### Friend-Link Multiplayer

The full version should support playing with a friend by link using Supabase Realtime.

For the one-day prototype, implement the room data model in the backend and use Supabase Realtime:

- "Create room" action.
- Generated invite link.
- Room code.
- Waiting-for-friend state.
- Join room by link.
- Persist current room state.
- Fallback option to simulate friend joining if realtime is not completed.
- Explanation in README that production hardening is the next multiplayer step.

If realtime becomes risky, keep the backend room flow real and document realtime sync as the next step.

### City Leaderboard

This gives the app a local social layer. For the demo, seed realistic mock players and include the current player.

Filters:

- Global
- Kazakhstan
- Almaty
- Astana
- University mode

README should state seeded demo rows are mixed with real backend player data for the prototype.

### Watch Party

Real-time multiplayer is expensive for one day. Instead, build a "Watch" screen that simulates the final UX:

- featured live match cards
- animated board replay
- spectator count
- emoji reactions
- mini chat with seeded messages

This proves product vision without risking broken networking.
