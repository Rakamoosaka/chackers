# Claude Instructions

## Uncodixify UI Standard

Use [Uncodixfy.md](./Uncodixfy.md) whenever you design, implement, or revise UI in this repository.
Use [Sega](./docs/standards/sega.md) as the Chackers arcade design-system layer when branded game UI is needed.

The goal is to avoid generic AI-generated UI and produce normal, functional, human-designed product interfaces.

Apply both standards in this order:

1. Preserve gameplay clarity and the actual user workflow.
2. Use Uncodixify to remove generic AI-looking UI patterns.
3. Use Sega for arcade typography, hard edges, colors, buttons, and game-specific visual identity.
4. Let accessibility and readability override both when there is a conflict.

Follow these rules:

- Do not use decorative gradients, glows, blur haze, glassmorphism, or floating card shells.
- Do not overuse pill shapes, oversized radii, dramatic shadows, or fake premium styling.
- Do not create marketing hero sections inside application screens.
- Do not add decorative charts, badges, labels, or panels unless they serve a real product purpose.
- Prefer simple layout, clear hierarchy, practical spacing, subtle borders, and readable typography.
- Build the real workflow first.

Sega usage:

- Use Sega on the board area, match controls, buttons, mode selectors, badges, and game surfaces.
- Keep Sega styling restrained enough that the interface still feels usable, not ornamental.

For Chackers:

- Keep the board and game state visually dominant.
- Make timers, turn status, move hints, and actions easy to scan.
- Keep AI Coach, leaderboard, multiplayer, and Pro surfaces functional and restrained.
