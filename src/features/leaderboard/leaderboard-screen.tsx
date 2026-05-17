"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { League } from "@/types/database";
import { useProfile } from "@/features/profile/use-profile";
import {
  getLeaderboardEntries,
  type LeaderboardEntry,
} from "./leaderboard-service";

type LeaderboardState = {
  entries: LeaderboardEntry[];
  status: string;
};

type LeaderboardAction =
  | { type: "loading" }
  | { type: "loaded"; entries: LeaderboardEntry[] }
  | { type: "failed"; message: string };

const cities = ["All", "Almaty", "Astana", "Shymkent"];
const leagues: Array<League | "All"> = ["All", "Bronze", "Silver", "Gold", "Elite"];

export function LeaderboardScreen() {
  const [city, setCity] = useState("All");
  const [league, setLeague] = useState<League | "All">("All");
  const [{ entries, status }, dispatch] = useReducer(leaderboardReducer, {
    entries: [],
    status: "Loading leaderboard",
  });
  const { profile } = useProfile();

  useEffect(() => {
    let active = true;
    dispatch({ type: "loading" });

    getLeaderboardEntries({ city, league, limit: 20 })
      .then((nextEntries) => {
        if (!active) {
          return;
        }

        dispatch({ type: "loaded", entries: nextEntries });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        dispatch({
          type: "failed",
          message:
            error instanceof Error ? error.message : "Could not load leaderboard.",
        });
      });

    return () => {
      active = false;
    };
  }, [city, league]);

  const currentRank = useMemo(() => {
    if (!profile) {
      return null;
    }

    const index = entries.findIndex((entry) => entry.profile_id === profile.id);

    return index >= 0 ? index + 1 : null;
  }, [entries, profile]);

  return (
    <div className="leaderboard-page">
      <section className="game-column">
        <div className="leaderboard-toolbar">
          <label className="field">
            <span>City</span>
            <select onChange={(event) => setCity(event.target.value)} value={city}>
              {cities.map((nextCity) => (
                <option key={nextCity} value={nextCity}>
                  {nextCity}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>League</span>
            <select
              onChange={(event) => setLeague(event.target.value as League | "All")}
              value={league}
            >
              {leagues.map((nextLeague) => (
                <option key={nextLeague} value={nextLeague}>
                  {nextLeague}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="leaderboard-table" role="table" aria-label="Leaderboard">
          <div className="leaderboard-table-head" role="row">
            <span>Rank</span>
            <span>Player</span>
            <span>City</span>
            <span>League</span>
            <span>Games</span>
            <span>Rating</span>
          </div>
          {entries.map((entry, index) => (
            <div
              className="leaderboard-table-row"
              data-current={entry.profile_id === profile?.id}
              key={entry.id}
              role="row"
            >
              <span>{index + 1}</span>
              <strong>{entry.display_name}</strong>
              <span>{entry.city}</span>
              <span>{entry.league}</span>
              <span>{entry.games_played}</span>
              <strong>{entry.rating}</strong>
            </div>
          ))}
          {!entries.length ? <p className="muted-line">{status}</p> : null}
        </div>
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Your rank</h2>
          <div className="profile-grid">
            <div className="stat-line">
              <span>Rank</span>
              <strong>{currentRank ? `#${currentRank}` : "Unranked"}</strong>
            </div>
            <div className="stat-line">
              <span>Rating</span>
              <strong>{profile?.rating ?? 1200}</strong>
            </div>
            <div className="stat-line">
              <span>City</span>
              <strong>{profile?.city ?? "Almaty"}</strong>
            </div>
            <div className="stat-line">
              <span>League</span>
              <strong>{profile?.league ?? "Bronze"}</strong>
            </div>
          </div>
        </section>
        <section className="panel-section">
          <h2>City race</h2>
          <p className="coach-note">
            Almaty is seeded for the demo and real signed-in players join the same table after saved games.
          </p>
        </section>
      </aside>
    </div>
  );
}

function leaderboardReducer(
  state: LeaderboardState,
  action: LeaderboardAction,
): LeaderboardState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "Loading leaderboard" };
    case "loaded":
      return {
        entries: action.entries,
        status: action.entries.length ? "" : "No players in this filter.",
      };
    case "failed":
      return { entries: [], status: action.message };
  }
}
