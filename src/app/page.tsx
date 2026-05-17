import { PlayScreen } from "@/features/game/play-screen";
import { AppNav } from "@/components/layout/app-nav";

export default function Home() {
  return (
    <main className="app-shell">
      <AppNav current="Play" />
      <section className="app-main" aria-label="Chackers play screen">
        <div className="top-bar">
          <div>
            <h1>Chackers</h1>
            <p>Play vs AI or local two-player</p>
          </div>
        </div>
        <PlayScreen />
      </section>
    </main>
  );
}
