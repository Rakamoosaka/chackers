import { AppNav } from "@/components/layout/app-nav";
import { ProScreen } from "@/features/pro/pro-screen";

export default function ProPage() {
  return (
    <main className="app-shell">
      <AppNav current="Pro" />
      <section className="app-main" aria-label="Chackers pro screen">
        <ProScreen />
      </section>
    </main>
  );
}
