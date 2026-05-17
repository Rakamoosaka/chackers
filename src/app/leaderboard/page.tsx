import { AppNav } from "@/components/layout/app-nav";
import { AuthStatus } from "@/features/auth/auth-status";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";

export default function LeaderboardPage() {
  return (
    <main className="app-shell">
      <AppNav current="Leaderboard" />
      <section className="app-main" aria-label="Chackers leaderboard screen">
        <div className="top-bar">
          <div>
            <h1>Leaderboard</h1>
            <p>Global and city rankings</p>
          </div>
          <AuthStatus />
        </div>
        <LeaderboardScreen />
      </section>
    </main>
  );
}
