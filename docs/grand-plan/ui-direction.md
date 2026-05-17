# UI Direction

## Role Of This Document

This file defines the Chackers product UX: screen structure, gameplay priorities, and interaction behavior.

It does not replace the shared design standards:

- [Uncodixfy](../../Uncodixfy.md) is the quality filter for avoiding generic AI-looking UI.
- [Sega](../standards/sega.md) is the arcade visual design layer for Chackers.

When implementing UI, apply them in this order:

1. Gameplay clarity and product workflow.
2. Uncodixfy quality filter.
3. Sega visual system.
4. Accessibility and readability.

## Experience Principle

The first screen should be the actual product, not a landing page.

The user should immediately understand:

- whose turn it is
- how much time is left
- which moves are legal
- what mode they are playing
- what changed after the last move
- how to restart, undo, or switch mode

The app should feel like a real competitive platform from the first second.

## Primary App Layout

### Desktop

Use a three-zone layout:

- **Navigation:** compact top or left navigation for Play, Puzzle, Leaderboard, Watch, Profile, Pro.
- **Game area:** dominant board with turn state, timer, and captured pieces close to the board.
- **Context panel:** move list, AI Coach hint, match settings, room status, or puzzle details depending on screen.

The board must be the visual anchor. Secondary panels should support the game, not compete with it.

### Mobile

Use a game-first layout:

- board near the top
- timer and turn state always visible
- primary actions near the bottom
- secondary panels behind tabs, drawers, or compact sections

Avoid layouts where the user must scroll away from the board to make a move.

## Key Screens

### Play

Purpose: start and finish real games quickly.

Primary elements:

- board
- player names
- timers
- current turn
- captured pieces
- legal move highlights
- move list
- AI difficulty
- time control: Rapid, Blitz, Bullet
- restart
- undo
- theme/skin selector

Product notes:

- The default mode should be quick to start, ideally Blitz vs AI.
- Legal move hints should be visible without cluttering the board.
- AI Coach hint should be compact during the game and detailed after the game.

### Multiplayer Room

Purpose: make "play with a friend by link" feel real.

Primary elements:

- room code
- invite link
- copy button
- player slots
- room status
- ready/start state
- synced board state through Supabase Realtime

Product notes:

- The user should see clear feedback after creating a room.
- If the second player is not connected, show a useful waiting state.
- If realtime sync is incomplete during the demo, keep backend room creation real and explain the sync roadmap in README.

### Puzzles

Purpose: create daily retention and tactical learning.

Primary elements:

- daily puzzle
- streak
- difficulty
- side to move
- goal
- feedback after each move
- next puzzle control

Product notes:

- Puzzle state should be saved to the backend.
- Anonymous fallback can use LocalStorage until login.
- Puzzle success should feed the profile/streak loop.

### Leaderboard

Purpose: make progress social and local.

Primary elements:

- global rank
- city filter
- league filter
- current player row
- seeded players mixed with real backend player data

Product notes:

- City leaderboard should include Almaty as a strong demo example.
- The current player should always be easy to find.
- Ratings should match the profile and match history.

### Watch

Purpose: demonstrate the future social layer.

Primary elements:

- featured live match cards
- replay board
- spectator count
- seeded chat
- emoji reactions

Product notes:

- This can remain a prototype surface for the deadline.
- Do not let this screen consume time before Play, AI, backend persistence, and leaderboard work.

### Profile

Purpose: show progression and give the user a reason to return.

Primary elements:

- rating
- league
- city
- games played
- win rate
- recent matches
- puzzle streak
- recent coach insights

Product notes:

- Profile data should come from Supabase.
- Local cached profile can appear while backend data loads.

### Pro

Purpose: show business thinking without blocking the core product.

Primary elements:

- unlimited AI Coach
- advanced analytics preview
- premium skins
- disabled/mock payment action

Product notes:

- Pro should be clear and credible, not a fake checkout.
- Stripe integration is roadmap unless the core product is finished early.

## Board Interaction

Use click/tap-to-move as the stable default:

1. Tap a piece.
2. Show legal moves.
3. Tap a highlighted destination.
4. Apply move.

Drag-and-drop is optional only after click-to-move is solid.

Required board feedback:

- selected piece
- legal destinations
- capture destinations
- last move
- king pieces
- invalid move feedback
- current player turn

## AI Coach UX

During the game:

- show one compact hint or warning
- avoid long analysis that distracts from play

After the game:

- show accuracy estimate
- identify missed captures
- identify risky moves
- explain one or two key turning points
- suggest one concrete improvement

Coach feedback should sound specific, not generic.

## Skins UX

Sega provides the primary visual identity, but skins can change the board treatment.

Recommended skins:

- Classic: tournament-readable board.
- Neon: arcade/cyber variant.
- Nomad: Kazakh ornament inspired accents.
- Minimal: highest readability variant.

Skins must never reduce board readability or piece recognition.

## Implementation Triage

If UI time is short, protect this order:

1. Play screen.
2. Responsive board.
3. Timers and turn state.
4. Legal move highlights.
5. Backend-backed profile/history.
6. AI Coach report.
7. Leaderboard.
8. Multiplayer room flow.
9. Puzzles.
10. Watch and Pro surfaces.
