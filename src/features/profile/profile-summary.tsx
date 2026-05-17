"use client";

import type { Profile } from "./profile-service";

export function ProfileSummary({
  profile,
  loading,
  error,
}: {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section className="panel-section">
        <h2>Profile</h2>
        <p className="muted-line">Loading profile</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel-section">
        <h2>Profile</h2>
        <p className="error-line">{error}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="panel-section">
        <h2>Profile</h2>
        <p className="muted-line">Sign in to save rating and match history.</p>
      </section>
    );
  }

  return (
    <section className="panel-section">
      <h2>Profile</h2>
      <div className="profile-grid">
        <Stat label="Rating" value={profile.rating.toString()} />
        <Stat label="League" value={profile.league} />
        <Stat label="Games" value={profile.games_played.toString()} />
        <Stat label="Plan" value={profile.is_pro ? "Pro" : "Free"} />
      </div>
    </section>
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
