import {
  applyMove,
  evaluateBoard,
  getLegalMoves,
} from "@/features/game/engine/board";
import type { Board, Move, Player } from "@/features/game/engine/types";

export type AiDifficulty = "rookie" | "challenger" | "master";

export function selectAiMove(
  board: Board,
  player: Player,
  difficulty: AiDifficulty,
): Move | null {
  const moves = getLegalMoves(board, player);

  if (moves.length === 0) {
    return null;
  }

  if (difficulty === "rookie") {
    return moves[randomIndex(moves.length)];
  }

  if (difficulty === "challenger") {
    return selectChallengerMove(board, player, moves);
  }

  return selectMasterMove(board, player, moves);
}

function selectChallengerMove(board: Board, player: Player, moves: Move[]) {
  const captureMoves = moves.filter((move) => move.captured?.length);
  const promotionMoves = moves.filter((move) => promotes(board, player, move));
  const preferred = captureMoves.length ? captureMoves : promotionMoves;

  return (preferred.length ? preferred : moves)[
    randomIndex((preferred.length ? preferred : moves).length)
  ];
}

function selectMasterMove(board: Board, player: Player, moves: Move[]) {
  return moves
    .map((move) => ({
      move,
      score: evaluateBoard(applyMove(board, move), player),
    }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function promotes(board: Board, player: Player, move: Move) {
  const piece = board[move.from.row][move.from.col];

  return Boolean(
    piece &&
      !piece.king &&
      ((player === "red" && move.to.row === 0) ||
        (player === "black" && move.to.row === 7)),
  );
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}
