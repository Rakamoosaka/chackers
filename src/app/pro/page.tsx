import { AppNav } from "@/components/layout/app-nav";
import { AuthStatus } from "@/features/auth/auth-status";
import { ProScreen } from "@/features/pro/pro-screen";

export default function ProPage() {
  return (
    <main className="app-shell">
      <AppNav current="Pro" />
      <section className="app-main" aria-label="Chackers pro screen">
        <div className="top-bar">
          <div>
            <h1>Pro</h1>
            <p>Coach, analytics, and skins roadmap</p>
          </div>
          <AuthStatus />
        </div>
        <ProScreen />
      </section>
    </main>
  );
}
