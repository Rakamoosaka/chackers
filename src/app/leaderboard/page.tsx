import { AppNav } from "@/components/layout/app-nav";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";

export default function LeaderboardPage() {
  return (
    <main className="app-shell">
      <AppNav current="Leaderboard" />
      <section className="app-main" aria-label="Chackers leaderboard screen">
        <LeaderboardScreen />
      </section>
    </main>
  );
}
