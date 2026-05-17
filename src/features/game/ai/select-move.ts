import { getLegalMoves, squareKey } from "@/features/game/engine/board";
import type { Board, Move, Player, Square } from "@/features/game/engine/types";
import { analyzePosition } from "./analyze-position";

export type AiDifficulty = "rookie" | "challenger" | "master";

export function selectAiMove(
  board: Board,
  player: Player,
  difficulty: AiDifficulty,
  forcedSquare?: Square | null,
): Move | null {
  const allMoves = getLegalMoves(board, player);
  const moves = forcedSquare
    ? allMoves.filter((move) => squareKey(move.from) === squareKey(forcedSquare))
    : allMoves;

  if (moves.length === 0) {
    return null;
  }

  if (difficulty === "rookie") {
    return moves[randomIndex(moves.length)];
  }

  if (difficulty === "challenger") {
    return selectChallengerMove(board, player, moves, forcedSquare);
  }

  return selectMasterMove(board, player, forcedSquare);
}

function selectChallengerMove(
  board: Board,
  player: Player,
  moves: Move[],
  forcedSquare?: Square | null,
) {
  const analysis = analyzePosition(board, player, {
    depth: 2,
    deadlineMs: 120,
    noise: 40,
    forcedSquare,
  });
  const analyzedMoves = analysis.candidates
    .filter((candidate) => moves.some((move) => sameMove(move, candidate.move)))
    .slice(0, 3);
  const preferred = analyzedMoves.length
    ? analyzedMoves.map((candidate) => candidate.move)
    : moves;

  return preferred[randomIndex(preferred.length)];
}

function selectMasterMove(
  board: Board,
  player: Player,
  forcedSquare?: Square | null,
) {
  return analyzePosition(board, player, {
    depth: 5,
    deadlineMs: 280,
    forcedSquare,
  }).bestMove;
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function sameMove(first: Move, second: Move) {
  return (
    squareKey(first.from) === squareKey(second.from) &&
    squareKey(first.to) === squareKey(second.to)
  );
}
