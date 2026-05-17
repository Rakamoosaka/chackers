import { AppNav } from "@/components/layout/app-nav";
import { AuthStatus } from "@/features/auth/auth-status";
import { ProfileScreen } from "@/features/profile/profile-screen";

export default function ProfilePage() {
  return (
    <main className="app-shell">
      <AppNav current="Profile" />
      <section className="app-main" aria-label="Chackers profile screen">
        <div className="top-bar">
          <div>
            <h1>Profile</h1>
            <p>Rating, history, and puzzle streak</p>
          </div>
          <AuthStatus />
        </div>
        <ProfileScreen />
      </section>
    </main>
  );
}
