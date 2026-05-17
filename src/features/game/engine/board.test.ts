import { describe, expect, it } from "vitest";
import {
  applyMove,
  createInitialBoard,
  getContinuingCaptures,
  getLegalMoves,
  getWinner,
} from "./board";
import type { Board } from "./types";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

describe("checkers engine", () => {
  it("creates the standard starting position", () => {
    const board = createInitialBoard();
    const redPieces = board.flat().filter((piece) => piece?.player === "red");
    const blackPieces = board.flat().filter((piece) => piece?.player === "black");

    expect(redPieces).toHaveLength(12);
    expect(blackPieces).toHaveLength(12);
  });

  it("generates legal opening moves", () => {
    const moves = getLegalMoves(createInitialBoard(), "red");

    expect(moves).toHaveLength(7);
    expect(moves.every((move) => !move.captured?.length)).toBe(true);
  });

  it("enforces capture priority", () => {
    const board = emptyBoard();
    board[5][0] = { player: "red", king: false };
    board[4][1] = { player: "black", king: false };
    board[5][4] = { player: "red", king: false };

    const moves = getLegalMoves(board, "red");

    expect(moves).toHaveLength(1);
    expect(moves[0].to).toEqual({ row: 3, col: 2 });
    expect(moves[0].captured).toEqual([{ row: 4, col: 1 }]);
  });

  it("promotes pieces that reach the back rank", () => {
    const board = emptyBoard();
    board[1][2] = { player: "red", king: false };

    const nextBoard = applyMove(board, {
      from: { row: 1, col: 2 },
      to: { row: 0, col: 1 },
    });

    expect(nextBoard[0][1]).toEqual({ player: "red", king: true });
  });

  it("finds continuing captures for multi-jump turns", () => {
    const board = emptyBoard();
    board[5][0] = { player: "red", king: false };
    board[4][1] = { player: "black", king: false };
    board[2][3] = { player: "black", king: false };

    const afterFirstCapture = applyMove(board, {
      from: { row: 5, col: 0 },
      to: { row: 3, col: 2 },
      captured: [{ row: 4, col: 1 }],
    });

    expect(getContinuingCaptures(afterFirstCapture, { row: 3, col: 2 })).toEqual([
      {
        from: { row: 3, col: 2 },
        to: { row: 1, col: 4 },
        captured: [{ row: 2, col: 3 }],
      },
    ]);
  });

  it("detects winner when the next player has no moves", () => {
    const board = emptyBoard();
    board[0][1] = { player: "red", king: false };
    board[7][0] = { player: "black", king: false };

    expect(getWinner(board, "red")).toBe("black");
  });
});
