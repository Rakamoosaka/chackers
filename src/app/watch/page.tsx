import { AppNav } from "@/components/layout/app-nav";
import { AuthStatus } from "@/features/auth/auth-status";
import { WatchScreen } from "@/features/watch/watch-screen";

export default function WatchPage() {
  return (
    <main className="app-shell">
      <AppNav current="Watch" />
      <section className="app-main" aria-label="Chackers watch screen">
        <div className="top-bar">
          <div>
            <h1>Watch Party</h1>
            <p>Seeded live match replay and reactions</p>
          </div>
          <AuthStatus />
        </div>
        <WatchScreen />
      </section>
    </main>
  );
}
