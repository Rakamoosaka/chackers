"use client";

import { useEffect, useState } from "react";
import {
  getLeaderboardEntries,
  type LeaderboardEntry,
} from "./leaderboard-service";

export function LeaderboardPanel({ currentProfileId }: { currentProfileId?: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboardEntries().then(setEntries).catch(() => setEntries([]));
  }, []);

  return (
    <section className="panel-section">
      <h2>Leaderboard</h2>
      <div className="leaderboard-list">
        {entries.slice(0, 5).map((entry, index) => (
          <div
            className="leaderboard-row"
            data-current={entry.profile_id === currentProfileId}
            key={entry.id}
          >
            <span>{index + 1}</span>
            <p>{entry.display_name}</p>
            <strong>{entry.rating}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
