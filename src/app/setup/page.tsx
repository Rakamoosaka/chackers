import { AppNav } from "@/components/layout/app-nav";
import { SetupScreen } from "@/features/setup/setup-screen";

export default function SetupPage() {
  return (
    <main className="app-shell">
      <AppNav current="Setup" />
      <section className="app-main" aria-label="Chackers setup screen">
        <div className="top-bar">
          <div>
            <h1>Setup</h1>
            <p>Supabase health and demo readiness</p>
          </div>
        </div>
        <SetupScreen />
      </section>
    </main>
  );
}
