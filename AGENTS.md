# Agent Instructions

## Uncodixify UI Standard

When building or changing UI in this repository, follow [Uncodixfy.md](./Uncodixfy.md) as the source of truth.
Use [Sega](./docs/standards/sega.md) as the visual design-system layer for game UI when a branded arcade direction is needed.

## How To Use Both

Apply them in this order:

1. Product workflow and gameplay clarity.
2. Uncodixify as the quality filter: remove generic AI-looking UI and decorative filler.
3. Sega as the brand layer: use its arcade typography, hard edges, color tokens, and component rules.
4. Accessibility and readability override both when there is a conflict.

Before making UI decisions:

1. Read `Uncodixfy.md`.
2. Read `docs/standards/sega.md` if implementing branded game UI.
3. Avoid generic AI-looking UI patterns.
4. Prefer normal, functional, human-designed interfaces.
5. Keep layouts practical, readable, and product-specific.

Core rules:

- No generic dark SaaS dashboard look.
- No decorative gradients, glows, blur haze, glassmorphism, or floating shells.
- No oversized rounded corners, pill overload, dramatic shadows, or fake premium styling.
- No landing-page hero treatment inside app screens.
- No decorative metric cards or fake charts unless they serve a real product purpose.
- Use restrained spacing, clear hierarchy, simple borders, and functional controls.
- Build the actual product screen first, not marketing filler.

Sega usage:

- Use Sega for the Chackers game surface, board-adjacent controls, arcade-style buttons, and branded states.
- Do not let Sega decoration reduce board clarity, timer readability, or control usability.
- Where Sega suggests expressive styling and Uncodixify warns against excess, keep the Sega token but simplify the treatment.

For Chackers specifically:

- The Play screen should feel like a real competitive checkers product, not a generated dashboard.
- Prioritize board clarity, timers, legal move hints, match status, and useful controls.
- Social, leaderboard, coach, and Pro sections should be compact and functional.
