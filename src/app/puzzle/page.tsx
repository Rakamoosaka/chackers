import { AppNav } from "@/components/layout/app-nav";
import { PuzzleScreen } from "@/features/puzzles/puzzle-screen";

export default function PuzzlePage() {
  return (
    <main className="app-shell">
      <AppNav current="Puzzle" />
      <section className="app-main" aria-label="Chackers puzzle screen">
        <div className="top-bar">
          <div>
            <h1>Daily Puzzle</h1>
            <p>Curated tactics with streak progress</p>
          </div>
        </div>
        <PuzzleScreen />
      </section>
    </main>
  );
}
