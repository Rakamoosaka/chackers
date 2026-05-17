import { formatSquare } from "../engine/board";
import type { Player } from "../engine/types";
import type { PlayedMove } from "../storage/match-service";

export type CoachSummary = {
  accuracy: number;
  headline: string;
  keyMoment: string;
  improvement: string;
  captureCount: number;
  promotionCount: number;
  longestCapture: number;
};

export function analyzeGame(moves: PlayedMove[], winner: Player): CoachSummary {
  const redMoves = moves.filter((move) => move.player === "red");
  const redCaptures = redMoves.filter((move) => move.captured?.length);
  const captureCount = redCaptures.reduce(
    (total, move) => total + (move.captured?.length ?? 0),
    0,
  );
  const longestCapture = Math.max(
    0,
    ...redCaptures.map((move) => move.captured?.length ?? 0),
  );
  const promotionCount = redMoves.filter((move) => move.promoted).length;
  const quietEdgeMoves = redMoves.filter(
    (move) =>
      !move.captured?.length &&
      (move.to.col === 0 || move.to.col === 7),
  ).length;

  const accuracy = clamp(
    72 +
      captureCount * 4 +
      promotionCount * 6 -
      quietEdgeMoves * 3 +
      (winner === "red" ? 8 : -8),
    48,
    96,
  );
  const keyCapture = redCaptures[0];
  const keyMoment = keyCapture
    ? `Move to ${formatSquare(keyCapture.to)} won ${keyCapture.captured?.length ?? 1} piece${(keyCapture.captured?.length ?? 1) > 1 ? "s" : ""}.`
    : "No red captures appeared; the game was decided by space and tempo.";

  return {
    accuracy,
    headline:
      winner === "red"
        ? "You kept the forced tactics under control."
        : "Black converted the critical phase.",
    keyMoment,
    improvement:
      quietEdgeMoves > 1
        ? "Bring one edge piece back toward the center before trading."
        : "Keep central pieces connected before starting long trades.",
    captureCount,
    promotionCount,
    longestCapture,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
