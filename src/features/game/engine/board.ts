import type { Board, GameWinner, Move, Player, Square } from "./types";

export function createInitialBoard(): Board {
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => {
      if ((row + col) % 2 === 0) {
        return null;
      }

      if (row < 3) {
        return { player: "black", king: false };
      }

      if (row > 4) {
        return { player: "red", king: false };
      }

      return null;
    }),
  );
}

export function squareKey(square: Square) {
  return `${square.row}-${square.col}`;
}

export function formatSquare(square: Square) {
  const file = String.fromCharCode(97 + square.col);
  return `${file}${8 - square.row}`;
}

export function getLegalMoves(board: Board, player: Player): Move[] {
  const allMoves = getAllPieceMoves(board, player);
  const captures = allMoves.filter((move) => move.captured?.length);

  return captures.length > 0 ? captures : allMoves;
}

export function getPieceMoves(board: Board, from: Square): Move[] {
  const piece = board[from.row]?.[from.col];

  if (!piece) {
    return [];
  }

  const moves: Move[] = [];
  const directions = getDirections(piece.player, piece.king);

  directions.forEach(([rowStep, colStep]) => {
    const adjacent = { row: from.row + rowStep, col: from.col + colStep };
    const landing = {
      row: from.row + rowStep * 2,
      col: from.col + colStep * 2,
    };

    if (isInside(adjacent) && !board[adjacent.row][adjacent.col]) {
      moves.push({ from, to: adjacent });
    }

    if (
      isInside(adjacent) &&
      isInside(landing) &&
      board[adjacent.row][adjacent.col]?.player !== piece.player &&
      board[adjacent.row][adjacent.col] &&
      !board[landing.row][landing.col]
    ) {
      moves.push({ from, to: landing, captured: [adjacent] });
    }
  });

  return moves;
}

export function getContinuingCaptures(board: Board, from: Square): Move[] {
  return getPieceMoves(board, from).filter((move) => move.captured?.length);
}

export function applyMove(board: Board, move: Move): Board {
  const nextBoard = cloneBoard(board);
  const piece = nextBoard[move.from.row][move.from.col];

  if (!piece) {
    return nextBoard;
  }

  nextBoard[move.from.row][move.from.col] = null;
  move.captured?.forEach((square) => {
    nextBoard[square.row][square.col] = null;
  });

  const promoted =
    !piece.king &&
    ((piece.player === "red" && move.to.row === 0) ||
      (piece.player === "black" && move.to.row === 7));

  nextBoard[move.to.row][move.to.col] = {
    ...piece,
    king: piece.king || promoted,
  };

  return nextBoard;
}

export function applyMoveWithMetadata(board: Board, move: Move) {
  const movingPiece = board[move.from.row]?.[move.from.col];
  const nextBoard = applyMove(board, move);
  const promoted = Boolean(
    movingPiece &&
      !movingPiece.king &&
      ((movingPiece.player === "red" && move.to.row === 0) ||
        (movingPiece.player === "black" && move.to.row === 7)),
  );

  return {
    board: nextBoard,
    move: {
      ...move,
      promoted,
    },
  };
}

export function getWinner(board: Board, nextPlayer: Player): GameWinner {
  const redPieces = countPieces(board, "red");
  const blackPieces = countPieces(board, "black");

  if (redPieces === 0) {
    return "black";
  }

  if (blackPieces === 0) {
    return "red";
  }

  if (getLegalMoves(board, nextPlayer).length === 0) {
    return nextPlayer === "red" ? "black" : "red";
  }

  return null;
}

export function evaluateBoard(board: Board, perspective: Player) {
  let score = 0;

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece) {
        return;
      }

      const advancement =
        piece.player === "red" ? 7 - rowIndex : rowIndex;
      const centerBonus =
        colIndex >= 2 && colIndex <= 5 && rowIndex >= 2 && rowIndex <= 5 ? 1 : 0;
      const value = (piece.king ? 5 : 3) + advancement * 0.2 + centerBonus * 0.3;

      score += piece.player === perspective ? value : -value;
    });
  });

  return Math.round(score * 10);
}

function getAllPieceMoves(board: Board, player: Player): Move[] {
  return board.flatMap((row, rowIndex) =>
    row.flatMap((piece, colIndex) => {
      if (!piece || piece.player !== player) {
        return [];
      }

      return getPieceMoves(board, { row: rowIndex, col: colIndex });
    }),
  );
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function countPieces(board: Board, player: Player) {
  return board.reduce(
    (total, row) =>
      total + row.filter((piece) => piece?.player === player).length,
    0,
  );
}

function isInside(square: Square) {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

function getDirections(player: Player, king: boolean) {
  if (king) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  return player === "red"
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
}
