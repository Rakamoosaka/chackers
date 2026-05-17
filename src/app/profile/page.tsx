import { AppNav } from "@/components/layout/app-nav";
import { ProfileScreen } from "@/features/profile/profile-screen";

export default function ProfilePage() {
  return (
    <main className="app-shell">
      <AppNav current="Profile" />
      <section className="app-main" aria-label="Chackers profile screen">
        <ProfileScreen />
      </section>
    </main>
  );
}
