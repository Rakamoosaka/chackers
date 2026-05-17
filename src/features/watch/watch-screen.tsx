"use client";

import { MessageCircle, SmilePlus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  applyMoveWithMetadata,
  createInitialBoard,
  formatSquare,
  squareKey,
} from "@/features/game/engine/board";
import type { Board, Move } from "@/features/game/engine/types";

const replayMoves: Move[] = [
  { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } },
  { from: { row: 2, col: 1 }, to: { row: 3, col: 0 } },
  { from: { row: 5, col: 2 }, to: { row: 4, col: 3 } },
  { from: { row: 2, col: 3 }, to: { row: 3, col: 2 } },
  { from: { row: 4, col: 3 }, to: { row: 2, col: 1 }, captured: [{ row: 3, col: 2 }] },
];

const chatLines = [
  { name: "Aruzhan", body: "Red forced the center open." },
  { name: "Miras", body: "Black needs the left edge back." },
  { name: "Dana", body: "That capture is the turning point." },
];

export function WatchScreen() {
  const [step, setStep] = useState(3);
  const [reactionCount, setReactionCount] = useState(18);
  const board = useMemo(() => buildReplayBoard(step), [step]);

  return (
    <div className="watch-page">
      <section className="game-column">
        <div className="match-strip">
          <div className="timer-box" data-active="true">
            <span className="timer-label">Live</span>
            <strong className="timer-value">247</strong>
          </div>
          <div className="turn-box">Almaty Finals replay</div>
          <div className="timer-box" data-active="false">
            <span className="timer-label">Move</span>
            <strong className="timer-value">{step + 1}</strong>
          </div>
        </div>

        <div className="board" role="grid" aria-label="Watch party replay board">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const square = { row: rowIndex, col: colIndex };
              const key = squareKey(square);

              return (
                <div
                  aria-label={`${formatSquare(square)} ${piece ? `${piece.player} piece` : "empty"}`}
                  className={[
                    "square",
                    (rowIndex + colIndex) % 2 === 0 ? "light" : "dark",
                  ].join(" ")}
                  key={key}
                  role="gridcell"
                >
                  {piece ? (
                    <span className={`piece ${piece.player} ${piece.king ? "king" : ""}`} />
                  ) : null}
                </div>
              );
            }),
          )}
        </div>

        <div className="board-actions">
          <button
            className="button"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Previous
          </button>
          <button
            className="button arcade"
            disabled={step >= replayMoves.length}
            onClick={() => setStep((current) => Math.min(replayMoves.length, current + 1))}
            type="button"
          >
            Next move
          </button>
        </div>
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Watch party</h2>
          <p className="coach-note">
            Seeded live replay surface for the demo. Production live matches can reuse the room board model.
          </p>
        </section>
        <section className="panel-section">
          <h2>Reactions</h2>
          <button
            className="button"
            onClick={() => setReactionCount((current) => current + 1)}
            type="button"
          >
            <SmilePlus size={18} />
            {reactionCount} reactions
          </button>
        </section>
        <section className="panel-section">
          <h2>Chat</h2>
          <div className="chat-list">
            {chatLines.map((line) => (
              <div className="chat-line" key={`${line.name}-${line.body}`}>
                <MessageCircle size={16} />
                <p>
                  <strong>{line.name}</strong> {line.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function buildReplayBoard(step: number): Board {
  return replayMoves.slice(0, step).reduce((board, move) => {
    return applyMoveWithMetadata(board, move).board;
  }, createInitialBoard());
}
