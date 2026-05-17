import { analyzePosition, scoreMove } from "../ai/analyze-position";
import {
  applyMove,
  createInitialBoard,
  formatSquare,
  getContinuingCaptures,
  squareKey,
} from "../engine/board";
import type { Player, Square } from "../engine/types";
import type { PlayedMove } from "../storage/match-service";

export type CoachSummary = {
  accuracy: number;
  headline: string;
  keyMoment: string;
  improvement: string;
  captureCount: number;
  promotionCount: number;
  longestCapture: number;
  bestMoveCount: number;
  mistakeCount: number;
  blunderCount: number;
  missedCaptureCount: number;
  biggestSwing: string;
  puzzleTheme: string;
};

type MoveGrade = {
  moveNumber: number;
  played: PlayedMove;
  bestMove: PlayedMove | null;
  loss: number;
  label: "best" | "good" | "inaccuracy" | "mistake" | "blunder";
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
  const grades = gradeRedMoves(moves);
  const bestMoveCount = grades.filter((grade) => grade.label === "best").length;
  const mistakeCount = grades.filter((grade) => grade.label === "mistake").length;
  const blunderCount = grades.filter((grade) => grade.label === "blunder").length;
  const missedCaptureCount = grades.filter(
    (grade) =>
      (grade.bestMove?.captured?.length ?? 0) > (grade.played.captured?.length ?? 0),
  ).length;
  const biggestMistake = [...grades].sort((a, b) => b.loss - a.loss)[0];
  const averageLoss = grades.length
    ? grades.reduce((total, grade) => total + grade.loss, 0) / grades.length
    : 0;

  const accuracy = clamp(
    94 -
      averageLoss / 22 -
      mistakeCount * 5 -
      blunderCount * 9 -
      missedCaptureCount * 4 +
      bestMoveCount * 2 +
      captureCount * 2 +
      promotionCount * 6 -
      quietEdgeMoves * 3 +
      (winner === "red" ? 4 : -6),
    48,
    96,
  );
  const keyCapture = redCaptures[0];
  const keyMoment = biggestMistake?.loss > 120
    ? `Move ${biggestMistake.moveNumber}: ${formatSquare(biggestMistake.played.from)}-${formatSquare(biggestMistake.played.to)} gave up the most value. ${biggestMistake.bestMove ? `The engine preferred ${formatSquare(biggestMistake.bestMove.from)}-${formatSquare(biggestMistake.bestMove.to)}.` : ""}`
    : keyCapture
      ? `Move to ${formatSquare(keyCapture.to)} won ${keyCapture.captured?.length ?? 1} piece${(keyCapture.captured?.length ?? 1) > 1 ? "s" : ""}.`
      : "No red captures appeared; the game was decided by space and tempo.";
  const puzzleTheme =
    missedCaptureCount > 0
      ? "Forced captures"
      : blunderCount > 0
        ? "Move safety"
        : promotionCount > 0
          ? "King conversion"
          : "Central development";

  return {
    accuracy,
    headline:
      blunderCount > 0
        ? "One tactical miss decided the critical phase."
        : winner === "red"
          ? "You kept the forced tactics under control."
          : "Black converted the critical phase.",
    keyMoment,
    improvement:
      missedCaptureCount > 0
        ? "Check every forced capture before making a quiet move."
        : biggestMistake?.bestMove?.promoted
          ? "Push promotion threats when the route is clear."
          : quietEdgeMoves > 1
        ? "Bring one edge piece back toward the center before trading."
        : "Keep central pieces connected before starting long trades.",
    captureCount,
    promotionCount,
    longestCapture,
    bestMoveCount,
    mistakeCount,
    blunderCount,
    missedCaptureCount,
    biggestSwing: biggestMistake
      ? `${biggestMistake.label} on move ${biggestMistake.moveNumber}`
      : "No major swing found",
    puzzleTheme,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function gradeRedMoves(moves: PlayedMove[]): MoveGrade[] {
  let board = createInitialBoard();
  let turn: Player = "red";
  let forcedSquare: Square | null = null;
  const grades: MoveGrade[] = [];

  moves.forEach((move, index) => {
    if (move.player !== turn) {
      return;
    }

    if (move.player === "red") {
      const analysis = analyzePosition(board, "red", {
        depth: 3,
        deadlineMs: 120,
        forcedSquare,
      });
      const playedScore = scoreMove(board, "red", move, {
        depth: 3,
        deadlineMs: 120,
        forcedSquare,
      });
      const bestScore = analysis.score;
      const loss = Math.max(0, bestScore - playedScore);
      const bestMove = analysis.bestMove
        ? { ...analysis.bestMove, player: "red" as const }
        : null;

      grades.push({
        moveNumber: index + 1,
        played: move,
        bestMove,
        loss,
        label: classifyLoss(loss, bestMove, move),
      });
    }

    const nextBoard = applyMove(board, move);
    const continuingCaptures = move.captured?.length
      ? getContinuingCaptures(nextBoard, move.to)
      : [];
    const mustContinue = continuingCaptures.some(
      (capture) => squareKey(capture.from) === squareKey(move.to),
    );

    board = nextBoard;
    forcedSquare = mustContinue ? move.to : null;
    turn = mustContinue ? turn : turn === "red" ? "black" : "red";
  });

  return grades;
}

function classifyLoss(
  loss: number,
  bestMove: PlayedMove | null,
  played: PlayedMove,
): MoveGrade["label"] {
  if (bestMove && sameMove(bestMove, played)) {
    return "best";
  }

  if (loss < 55) {
    return "good";
  }

  if (loss < 140) {
    return "inaccuracy";
  }

  if (loss < 280) {
    return "mistake";
  }

  return "blunder";
}

function sameMove(first: PlayedMove, second: PlayedMove) {
  return (
    squareKey(first.from) === squareKey(second.from) &&
    squareKey(first.to) === squareKey(second.to)
  );
}
