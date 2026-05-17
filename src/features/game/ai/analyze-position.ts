import {
  applyMove,
  getContinuingCaptures,
  getLegalMoves,
  getWinner,
  squareKey,
} from "@/features/game/engine/board";
import type { Board, Move, Player, Square } from "@/features/game/engine/types";

type SearchState = {
  board: Board;
  player: Player;
  forcedSquare?: Square | null;
};

export type MoveAnalysis = {
  move: Move;
  score: number;
};

export type PositionAnalysis = {
  bestMove: Move | null;
  score: number;
  candidates: MoveAnalysis[];
};

export type AnalyzePositionOptions = {
  depth?: number;
  deadlineMs?: number;
  noise?: number;
  forcedSquare?: Square | null;
};

const WIN_SCORE = 100_000;
const DEFAULT_DEPTH = 4;
const DEFAULT_DEADLINE_MS = 250;

export function analyzePosition(
  board: Board,
  player: Player,
  options: AnalyzePositionOptions = {},
): PositionAnalysis {
  const depth = options.depth ?? DEFAULT_DEPTH;
  const deadline = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);
  const moves = getMovesForState({
    board,
    player,
    forcedSquare: options.forcedSquare,
  });

  if (!moves.length) {
    return {
      bestMove: null,
      score: -WIN_SCORE,
      candidates: [],
    };
  }

  const candidates = orderMoves(board, player, moves).map((move) => {
    const nextState = applySearchMove(board, player, move);
    const score =
      minimax(nextState, player, depth - 1, -WIN_SCORE, WIN_SCORE, deadline) +
      randomNoise(options.noise ?? 0);

    return { move, score };
  });

  candidates.sort((a, b) => b.score - a.score);

  return {
    bestMove: candidates[0]?.move ?? null,
    score: candidates[0]?.score ?? -WIN_SCORE,
    candidates,
  };
}

export function scoreMove(
  board: Board,
  player: Player,
  move: Move,
  options: AnalyzePositionOptions = {},
) {
  const depth = options.depth ?? DEFAULT_DEPTH;
  const deadline = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);
  const nextState = applySearchMove(board, player, move);

  return minimax(nextState, player, depth - 1, -WIN_SCORE, WIN_SCORE, deadline);
}

function minimax(
  state: SearchState,
  perspective: Player,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): number {
  const winner =
    state.forcedSquare || getLegalMoves(state.board, state.player).length > 0
      ? null
      : getWinner(state.board, state.player);

  if (winner) {
    if (winner === "draw") {
      return 0;
    }

    return winner === perspective ? WIN_SCORE + depth : -WIN_SCORE - depth;
  }

  if (depth <= 0 || Date.now() >= deadline) {
    return evaluatePosition(state.board, perspective);
  }

  const moves = getMovesForState(state);

  if (!moves.length) {
    return state.player === perspective ? -WIN_SCORE - depth : WIN_SCORE + depth;
  }

  const orderedMoves = orderMoves(state.board, state.player, moves);

  if (state.player === perspective) {
    let bestScore = -WIN_SCORE;
    let nextAlpha = alpha;

    for (const move of orderedMoves) {
      const score = minimax(
        applySearchMove(state.board, state.player, move),
        perspective,
        depth - 1,
        nextAlpha,
        beta,
        deadline,
      );
      bestScore = Math.max(bestScore, score);
      nextAlpha = Math.max(nextAlpha, score);

      if (beta <= nextAlpha || Date.now() >= deadline) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = WIN_SCORE;
  let nextBeta = beta;

  for (const move of orderedMoves) {
    const score = minimax(
      applySearchMove(state.board, state.player, move),
      perspective,
      depth - 1,
      alpha,
      nextBeta,
      deadline,
    );
    bestScore = Math.min(bestScore, score);
    nextBeta = Math.min(nextBeta, score);

    if (nextBeta <= alpha || Date.now() >= deadline) {
      break;
    }
  }

  return bestScore;
}

function applySearchMove(board: Board, player: Player, move: Move): SearchState {
  const nextBoard = applyMove(board, move);
  const continuingCaptures = move.captured?.length
    ? getContinuingCaptures(nextBoard, move.to)
    : [];

  if (continuingCaptures.length) {
    return {
      board: nextBoard,
      player,
      forcedSquare: move.to,
    };
  }

  return {
    board: nextBoard,
    player: opponentOf(player),
    forcedSquare: null,
  };
}

function getMovesForState(state: SearchState) {
  const moves = getLegalMoves(state.board, state.player);
  const forcedSquare = state.forcedSquare;

  if (!forcedSquare) {
    return moves;
  }

  return moves.filter((move) => squareKey(move.from) === squareKey(forcedSquare));
}

function orderMoves(board: Board, player: Player, moves: Move[]) {
  return [...moves].sort(
    (a, b) => moveOrderingScore(board, player, b) - moveOrderingScore(board, player, a),
  );
}

function moveOrderingScore(board: Board, player: Player, move: Move) {
  const captureValue = (move.captured?.length ?? 0) * 100;
  const promotionValue = promotes(board, player, move) ? 60 : 0;
  const centerValue = isCenter(move.to) ? 12 : 0;
  const exposurePenalty = canOpponentCapture(applyMove(board, move), player) ? 30 : 0;

  return captureValue + promotionValue + centerValue - exposurePenalty;
}

function evaluatePosition(board: Board, perspective: Player) {
  const opponent = opponentOf(perspective);
  const perspectiveMoves = getLegalMoves(board, perspective);
  const opponentMoves = getLegalMoves(board, opponent);
  let score = 0;

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece) {
        return;
      }

      const ownerSign = piece.player === perspective ? 1 : -1;
      const advancement = piece.player === "red" ? 7 - rowIndex : rowIndex;
      const promotionDistance = piece.player === "red" ? rowIndex : 7 - rowIndex;
      const value =
        (piece.king ? 520 : 310) +
        advancement * 14 +
        (isCenter({ row: rowIndex, col: colIndex }) ? 34 : 0) +
        (isEdge({ row: rowIndex, col: colIndex }) ? 12 : 0) +
        (isBackRank(piece.player, rowIndex) && !piece.king ? 22 : 0) -
        (!piece.king ? promotionDistance * 4 : 0);

      score += ownerSign * value;
    });
  });

  score += perspectiveMoves.length * 12;
  score -= opponentMoves.length * 12;
  score += countCaptures(perspectiveMoves) * 85;
  score -= countCaptures(opponentMoves) * 95;

  return score;
}

function countCaptures(moves: Move[]) {
  return moves.reduce((total, move) => total + (move.captured?.length ?? 0), 0);
}

function canOpponentCapture(board: Board, player: Player) {
  return getLegalMoves(board, opponentOf(player)).some((move) => move.captured?.length);
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

function isCenter(square: Square) {
  return square.col >= 2 && square.col <= 5 && square.row >= 2 && square.row <= 5;
}

function isEdge(square: Square) {
  return square.col === 0 || square.col === 7;
}

function isBackRank(player: Player, row: number) {
  return (player === "red" && row === 7) || (player === "black" && row === 0);
}

function opponentOf(player: Player): Player {
  return player === "red" ? "black" : "red";
}

function randomNoise(amount: number) {
  return amount ? (Math.random() - 0.5) * amount : 0;
}
