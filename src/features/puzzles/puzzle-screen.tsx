"use client";

import { RotateCcw, StepForward } from "lucide-react";
import { useMemo, useState } from "react";
import {
  applyMoveWithMetadata,
  formatSquare,
  getLegalMoves,
  squareKey,
} from "@/features/game/engine/board";
import type { Board, Move, Square } from "@/features/game/engine/types";
import { useProfile } from "@/features/profile/use-profile";
import {
  createPuzzleBoard,
  dailyPuzzles,
  type DailyPuzzle,
} from "./puzzle-data";
import { savePuzzleSolved } from "./puzzle-service";

export function PuzzleScreen() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = dailyPuzzles[puzzleIndex];
  const [board, setBoard] = useState<Board>(() => createPuzzleBoard(puzzle));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [feedback, setFeedback] = useState("Solve the line for red.");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const { profile, refreshProfile } = useProfile();

  const legalMoves = useMemo(
    () => getLegalMoves(board, puzzle.sideToMove),
    [board, puzzle.sideToMove],
  );
  const selectedMoves = selected
    ? legalMoves.filter((move) => squareKey(move.from) === squareKey(selected))
    : [];
  const solved = step >= puzzle.solution.length;

  async function handleSquareClick(square: Square) {
    if (solved) {
      return;
    }

    const piece = board[square.row][square.col];
    const chosenMove = selectedMoves.find(
      (move) => squareKey(move.to) === squareKey(square),
    );

    if (chosenMove) {
      await playPuzzleMove(chosenMove);
      return;
    }

    if (piece?.player === puzzle.sideToMove) {
      setSelected(square);
      setFeedback("Choose the tactical destination.");
      return;
    }

    setSelected(null);
    setFeedback("Select one of red's active pieces.");
  }

  async function playPuzzleMove(move: Move) {
    const expectedMove = puzzle.solution[step];

    if (!isSameMove(move, expectedMove)) {
      setFeedback("That move is legal, but it misses the puzzle tactic.");
      setSelected(null);
      return;
    }

    const { board: nextBoard } = applyMoveWithMetadata(board, move);
    const nextStep = step + 1;

    setBoard(nextBoard);
    setStep(nextStep);
    setSelected(null);

    if (nextStep < puzzle.solution.length) {
      setFeedback("Good. Continue the capture chain.");
      return;
    }

    setFeedback("Solved. Streak saved when signed in.");

    if (profile && savedKey !== puzzle.key) {
      setSavedKey(puzzle.key);
      await savePuzzleSolved(profile, puzzle.key);
      await refreshProfile();
    }
  }

  function resetPuzzle(nextPuzzle = puzzle) {
    setBoard(createPuzzleBoard(nextPuzzle));
    setStep(0);
    setSelected(null);
    setFeedback(`Solve the line for ${nextPuzzle.sideToMove}.`);
  }

  function nextPuzzle() {
    const nextIndex = (puzzleIndex + 1) % dailyPuzzles.length;
    const next = dailyPuzzles[nextIndex];

    setPuzzleIndex(nextIndex);
    resetPuzzle(next);
  }

  return (
    <div className="puzzle-layout">
      <section className="game-column" aria-label="Daily puzzle board">
        <div className="match-strip">
          <PuzzleMeta puzzle={puzzle} />
          <div className="turn-box">
            {solved ? "Puzzle solved" : `${puzzle.sideToMove} to move`}
          </div>
          <div className="timer-box" data-active="true">
            <span className="timer-label">Streak</span>
            <strong className="timer-value">{profile?.puzzle_streak ?? 0}</strong>
          </div>
        </div>

        <div className="board" role="grid" aria-label="Daily checkers puzzle">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const square = { row: rowIndex, col: colIndex };
              const key = squareKey(square);
              const legalMove = selectedMoves.find(
                (move) => squareKey(move.to) === key,
              );
              const isSelected = selected && squareKey(selected) === key;

              return (
                <button
                  aria-label={`${formatSquare(square)} ${piece ? `${piece.player} piece` : "empty"}`}
                  className={[
                    "square",
                    (rowIndex + colIndex) % 2 === 0 ? "light" : "dark",
                    isSelected ? "selected" : "",
                    legalMove ? (legalMove.captured?.length ? "capture" : "legal") : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={key}
                  onClick={() => handleSquareClick(square)}
                  role="gridcell"
                  type="button"
                >
                  {piece ? (
                    <span className={`piece ${piece.player} ${piece.king ? "king" : ""}`} />
                  ) : null}
                </button>
              );
            }),
          )}
        </div>

        <div className="board-actions">
          <button className="button arcade" onClick={() => resetPuzzle()} type="button">
            <RotateCcw size={18} />
            Reset
          </button>
          <button className="button" onClick={nextPuzzle} type="button">
            <StepForward size={18} />
            Next puzzle
          </button>
        </div>
      </section>

      <aside className="context-panel" aria-label="Puzzle details">
        <section className="panel-section">
          <h2>{puzzle.title}</h2>
          <p className="coach-note">{puzzle.goal}</p>
          <p className="muted-line">{feedback}</p>
        </section>
        <section className="panel-section">
          <h2>Line</h2>
          <div className="move-list">
            {puzzle.solution.map((move, index) => (
              <div data-current={index === step} key={`${puzzle.key}-${index}`}>
                <span>{index + 1}</span>
                <p>
                  {formatSquare(move.from)}x{formatSquare(move.to)}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel-section">
          <h2>Progress</h2>
          <div className="profile-grid">
            <div className="stat-line">
              <span>Difficulty</span>
              <strong>{puzzle.difficulty}</strong>
            </div>
            <div className="stat-line">
              <span>Step</span>
              <strong>
                {Math.min(step + 1, puzzle.solution.length)} / {puzzle.solution.length}
              </strong>
            </div>
            <div className="stat-line">
              <span>Profile streak</span>
              <strong>{profile?.puzzle_streak ?? 0}</strong>
            </div>
            <div className="stat-line">
              <span>Save</span>
              <strong>{profile ? "Backend" : "Sign in"}</strong>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function PuzzleMeta({ puzzle }: { puzzle: DailyPuzzle }) {
  return (
    <div className="timer-box" data-active="false">
      <span className="timer-label">{puzzle.difficulty}</span>
      <strong className="timer-value">Daily</strong>
    </div>
  );
}

function isSameMove(move: Move, expectedMove: Move) {
  return (
    squareKey(move.from) === squareKey(expectedMove.from) &&
    squareKey(move.to) === squareKey(expectedMove.to)
  );
}
