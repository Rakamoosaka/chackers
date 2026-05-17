import { AppNav } from "@/components/layout/app-nav";
import { WatchScreen } from "@/features/watch/watch-screen";

export default function WatchPage() {
  return (
    <main className="app-shell">
      <AppNav current="Watch" />
      <section className="app-main" aria-label="Chackers watch screen">
        <WatchScreen />
      </section>
    </main>
  );
}
