"use client";

import { RecentMatchesPanel } from "@/features/game/storage/recent-matches-panel";
import { useProfile } from "./use-profile";

export function ProfileScreen() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div className="profile-page">
        <section className="game-column">
          <p className="muted-line">Loading profile</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <section className="game-column">
          <p className="error-line">{error}</p>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <section className="game-column">
          <h2>Sign in required</h2>
          <p className="coach-note">
            Log in or sign up in the top bar to create your profile, save games, and build a puzzle streak.
          </p>
        </section>
      </div>
    );
  }

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.wins / profile.games_played) * 100)
      : 0;

  return (
    <div className="profile-page">
      <section className="game-column">
        <div className="profile-header">
          <div>
            <h2>{profile.name}</h2>
            <p className="muted-line">{profile.city}</p>
          </div>
          <strong>{profile.league}</strong>
        </div>

        <div className="profile-grid profile-grid-wide">
          <Stat label="Rating" value={profile.rating.toString()} />
          <Stat label="Games" value={profile.games_played.toString()} />
          <Stat label="Wins" value={profile.wins.toString()} />
          <Stat label="Losses" value={profile.losses.toString()} />
          <Stat label="Win rate" value={`${winRate}%`} />
          <Stat label="Puzzle streak" value={profile.puzzle_streak.toString()} />
        </div>
      </section>

      <aside className="context-panel">
        <RecentMatchesPanel profileId={profile.id} refreshKey={0} />
        <section className="panel-section">
          <h2>Next goal</h2>
          <p className="coach-note">{getNextGoal(profile.rating)}</p>
        </section>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getNextGoal(rating: number) {
  if (rating < 1250) {
    return "Reach 1250 to enter Silver.";
  }

  if (rating < 1500) {
    return "Reach 1500 to enter Gold.";
  }

  if (rating < 1800) {
    return "Reach 1800 to enter Elite.";
  }

  return "Defend Elite rating and keep the streak alive.";
}
