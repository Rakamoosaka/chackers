"use client";

import { RotateCcw, StepBack } from "lucide-react";
import { useMemo, useState } from "react";
import {
  applyMove,
  createInitialBoard,
  formatSquare,
  getLegalMoves,
  squareKey,
} from "./engine/board";
import type { Board, Move, Player, Square } from "./engine/types";

const initialMoveList = [
  "Red opens with c3-b4",
  "Black answers f6-g5",
  "Red controls the center",
];

export function PlayScreen() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<Player>("red");
  const [selected, setSelected] = useState<Square | null>(null);
  const [moves, setMoves] = useState<string[]>(initialMoveList);

  const legalMoves = useMemo(() => getLegalMoves(board, turn), [board, turn]);
  const selectedMoves = selected
    ? legalMoves.filter((move) => squareKey(move.from) === squareKey(selected))
    : [];

  function handleSquareClick(square: Square) {
    const piece = board[square.row][square.col];
    const chosenMove = selectedMoves.find(
      (move) => squareKey(move.to) === squareKey(square),
    );

    if (chosenMove) {
      commitMove(chosenMove);
      return;
    }

    if (piece?.player === turn) {
      setSelected(square);
      return;
    }

    setSelected(null);
  }

  function commitMove(move: Move) {
    setBoard((current) => applyMove(current, move));
    setMoves((current) => [
      `${turn === "red" ? "Red" : "Black"} ${formatSquare(move.from)}-${formatSquare(move.to)}`,
      ...current,
    ]);
    setTurn((current) => (current === "red" ? "black" : "red"));
    setSelected(null);
  }

  function restart() {
    setBoard(createInitialBoard());
    setTurn("red");
    setSelected(null);
    setMoves([]);
  }

  return (
    <div className="play-layout">
      <section className="game-column" aria-label="Game board">
        <div className="match-strip">
          <TimerBox label="Red" time="05:00" active={turn === "red"} />
          <div className="turn-box">{turn === "red" ? "Red to move" : "Black to move"}</div>
          <TimerBox label="Black AI" time="05:00" active={turn === "black"} />
        </div>

        <div className="board" role="grid" aria-label="Checkers board">
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
          <button className="button arcade" onClick={restart} type="button">
            <RotateCcw size={18} />
            Restart
          </button>
          <button className="button" disabled type="button">
            <StepBack size={18} />
            Undo
          </button>
        </div>
      </section>

      <aside className="context-panel" aria-label="Match details">
        <section className="panel-section">
          <h2>Match</h2>
          <div className="settings-grid">
            <label className="field">
              <span>Mode</span>
              <select defaultValue="ai">
                <option value="ai">Vs AI</option>
                <option value="local">Local two-player</option>
              </select>
            </label>
            <label className="field">
              <span>AI level</span>
              <select defaultValue="challenger">
                <option value="rookie">Rookie</option>
                <option value="challenger">Challenger</option>
                <option value="master">Master</option>
              </select>
            </label>
            <label className="field">
              <span>Time control</span>
              <select defaultValue="blitz">
                <option value="bullet">Bullet 1+0</option>
                <option value="blitz">Blitz 5+0</option>
                <option value="rapid">Rapid 10+0</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel-section">
          <h2>Moves</h2>
          <div className="move-list">
            {moves.length ? (
              moves.map((move, index) => (
                <div key={`${move}-${index}`}>
                  <span>{moves.length - index}</span>
                  <p>{move}</p>
                </div>
              ))
            ) : (
              <div>
                <span>0</span>
                <p>No moves yet</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel-section">
          <h2>Coach</h2>
          <p className="coach-note">
            Develop pieces toward the center before chasing edge trades. Captures are
            enforced when available.
          </p>
        </section>
      </aside>
    </div>
  );
}

function TimerBox({
  label,
  time,
  active,
}: {
  label: string;
  time: string;
  active: boolean;
}) {
  return (
    <div className="timer-box" data-active={active}>
      <span className="timer-label">{label}</span>
      <strong className="timer-value">{time}</strong>
    </div>
  );
}
