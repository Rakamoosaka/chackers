import { AppNav } from "@/components/layout/app-nav";
import { SetupScreen } from "@/features/setup/setup-screen";

export default function SetupPage() {
  return (
    <main className="app-shell">
      <AppNav current="Setup" />
      <section className="app-main" aria-label="Chackers setup screen">
        <SetupScreen />
      </section>
    </main>
  );
}
