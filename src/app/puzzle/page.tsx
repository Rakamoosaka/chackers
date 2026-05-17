import { AppNav } from "@/components/layout/app-nav";
import { PuzzleScreen } from "@/features/puzzles/puzzle-screen";

export default function PuzzlePage() {
  return (
    <main className="app-shell">
      <AppNav current="Puzzle" />
      <section className="app-main" aria-label="Chackers puzzle screen">
        <PuzzleScreen />
      </section>
    </main>
  );
}
