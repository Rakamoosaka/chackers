import type { Board, Move, Player, Square } from "./types";

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
  const captures: Move[] = [];
  const quietMoves: Move[] = [];

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece || piece.player !== player) {
        return;
      }

      const from = { row: rowIndex, col: colIndex };
      const directions = getDirections(piece.player, piece.king);

      directions.forEach(([rowStep, colStep]) => {
        const adjacent = { row: rowIndex + rowStep, col: colIndex + colStep };
        const landing = {
          row: rowIndex + rowStep * 2,
          col: colIndex + colStep * 2,
        };

        if (isInside(adjacent) && !board[adjacent.row][adjacent.col]) {
          quietMoves.push({ from, to: adjacent });
        }

        if (
          isInside(adjacent) &&
          isInside(landing) &&
          board[adjacent.row][adjacent.col]?.player !== player &&
          board[adjacent.row][adjacent.col] &&
          !board[landing.row][landing.col]
        ) {
          captures.push({ from, to: landing, captured: [adjacent] });
        }
      });
    });
  });

  return captures.length > 0 ? captures : quietMoves;
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

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
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
