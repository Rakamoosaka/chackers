import { AuthStatus } from "@/features/auth/auth-status";
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
            <p>Blitz vs AI</p>
          </div>
          <AuthStatus />
        </div>
        <PlayScreen />
      </section>
    </main>
  );
}
