"use client";

import { useEffect, useReducer } from "react";
import type { Json } from "@/types/database";
import { getRecentMatches, type RecentMatch } from "./match-service";

type CoachPreview = {
  accuracy?: number;
  headline?: string;
};

type MatchHistoryState = {
  matches: RecentMatch[];
  status: string;
};

type MatchHistoryAction =
  | { type: "loading" }
  | { type: "loaded"; matches: RecentMatch[] }
  | { type: "failed"; message: string };

export function RecentMatchesPanel({
  profileId,
  refreshKey,
}: {
  profileId?: string;
  refreshKey: number;
}) {
  const [{ matches, status }, dispatch] = useReducer(matchHistoryReducer, {
    matches: [],
    status: "Sign in to load match history.",
  });

  useEffect(() => {
    if (!profileId) {
      return;
    }

    let active = true;
    dispatch({ type: "loading" });

    getRecentMatches(profileId)
      .then((data) => {
        if (!active) {
          return;
        }

        dispatch({ type: "loaded", matches: data });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        dispatch({
          type: "failed",
          message:
            error instanceof Error ? error.message : "Could not load matches.",
        });
      });

    return () => {
      active = false;
    };
  }, [profileId, refreshKey]);

  const visibleMatches = profileId ? matches : [];
  const visibleStatus = profileId ? status : "Sign in to load match history.";

  return (
    <section className="panel-section">
      <h2>Recent matches</h2>
      <div className="match-history">
        {visibleMatches.map((match) => {
          const coach = parseCoachPreview(match.coach_summary);

          return (
            <article className="match-row" key={match.id}>
              <div>
                <strong>{match.result.toUpperCase()}</strong>
                <span>
                  {match.opponent} · {match.time_control}
                </span>
              </div>
              <div>
                <strong>{formatDelta(match.rating_delta)}</strong>
                <span>{coach.accuracy ? `${coach.accuracy}% accuracy` : match.mode}</span>
              </div>
              {coach.headline ? <p>{coach.headline}</p> : null}
            </article>
          );
        })}
        {!visibleMatches.length ? <p className="muted-line">{visibleStatus}</p> : null}
      </div>
    </section>
  );
}

function matchHistoryReducer(
  state: MatchHistoryState,
  action: MatchHistoryAction,
): MatchHistoryState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "Loading recent matches" };
    case "loaded":
      return {
        matches: action.matches,
        status: action.matches.length ? "" : "No saved matches yet.",
      };
    case "failed":
      return { matches: [], status: action.message };
  }
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function parseCoachPreview(value: Json | null): CoachPreview {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return {
    accuracy:
      typeof value.accuracy === "number" ? value.accuracy : undefined,
    headline:
      typeof value.headline === "string" ? value.headline : undefined,
  };
}
