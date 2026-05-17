import { PlayScreen } from "@/features/game/play-screen";
import { AppNav } from "@/components/layout/app-nav";

export default function Home() {
  return (
    <main className="app-shell">
      <AppNav current="Play" />
      <section className="app-main" aria-label="Chackers play screen">
        <PlayScreen />
      </section>
    </main>
  );
}
