import type { Board, Move, Player, Square } from "@/features/game/engine/types";

type PieceSetup = Square & {
  player: Player;
  king?: boolean;
};

export type DailyPuzzle = {
  key: string;
  title: string;
  difficulty: "Bronze" | "Silver" | "Gold";
  sideToMove: Player;
  goal: string;
  pieces: PieceSetup[];
  solution: Move[];
};

export const dailyPuzzles: DailyPuzzle[] = [
  {
    key: "daily-bridge-capture",
    title: "Bridge Capture",
    difficulty: "Bronze",
    sideToMove: "red",
    goal: "Find the forced capture.",
    pieces: [
      { row: 5, col: 0, player: "red" },
      { row: 4, col: 1, player: "black" },
      { row: 2, col: 3, player: "black" },
      { row: 1, col: 6, player: "black" },
      { row: 6, col: 5, player: "red" },
    ],
    solution: [
      {
        from: { row: 5, col: 0 },
        to: { row: 3, col: 2 },
        captured: [{ row: 4, col: 1 }],
      },
    ],
  },
  {
    key: "daily-double-track",
    title: "Double Track",
    difficulty: "Silver",
    sideToMove: "red",
    goal: "Chain the capture and keep the turn.",
    pieces: [
      { row: 5, col: 2, player: "red" },
      { row: 4, col: 3, player: "black" },
      { row: 2, col: 5, player: "black" },
      { row: 6, col: 7, player: "red" },
      { row: 1, col: 0, player: "black" },
    ],
    solution: [
      {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 },
        captured: [{ row: 4, col: 3 }],
      },
      {
        from: { row: 3, col: 4 },
        to: { row: 1, col: 6 },
        captured: [{ row: 2, col: 5 }],
      },
    ],
  },
  {
    key: "daily-crown-race",
    title: "Crown Race",
    difficulty: "Gold",
    sideToMove: "red",
    goal: "Win material and crown the runner.",
    pieces: [
      { row: 2, col: 1, player: "red" },
      { row: 1, col: 2, player: "black" },
      { row: 5, col: 4, player: "black" },
      { row: 6, col: 7, player: "red" },
      { row: 3, col: 6, player: "black" },
    ],
    solution: [
      {
        from: { row: 2, col: 1 },
        to: { row: 0, col: 3 },
        captured: [{ row: 1, col: 2 }],
      },
    ],
  },
];

export function createPuzzleBoard(puzzle: DailyPuzzle): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );

  puzzle.pieces.forEach((piece) => {
    board[piece.row][piece.col] = {
      player: piece.player,
      king: Boolean(piece.king),
    };
  });

  return board;
}
