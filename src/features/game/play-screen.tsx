"use client";

import { Flag, Link2, RotateCcw, StepBack } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LeaderboardPanel } from "@/features/leaderboard/leaderboard-panel";
import { ProfileSummary } from "@/features/profile/profile-summary";
import { useProfile } from "@/features/profile/use-profile";
import { analyzeGame } from "./coach/analyze-game";
import { selectAiMove, type AiDifficulty } from "./ai/select-move";
import {
  applyMoveWithMetadata,
  createInitialBoard,
  formatSquare,
  getContinuingCaptures,
  getLegalMoves,
  getWinner,
  squareKey,
} from "./engine/board";
import type { Board, GameWinner, Move, Player, Square } from "./engine/types";
import {
  saveCompletedMatch,
  type PlayedMove,
} from "./storage/match-service";
import { RecentMatchesPanel } from "./storage/recent-matches-panel";
import type { TimeControl } from "@/types/database";

type GameMode = "ai" | "local";

type PlayerClocks = Record<Player, number>;

type GameSnapshot = {
  board: Board;
  turn: Player;
  forcedPiece: Square | null;
  winner: GameWinner;
  moveLog: string[];
  lastMove: Move | null;
  clocks: PlayerClocks;
  matchStarted: boolean;
};

const timeControls: Record<TimeControl, { label: string; seconds: number; increment: number }> = {
  bullet: { label: "Bullet 1+1", seconds: 60, increment: 1 },
  blitz: { label: "Blitz 5+1", seconds: 300, increment: 1 },
  rapid: { label: "Rapid 10+0", seconds: 600, increment: 0 },
};

export function PlayScreen() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<Player>("red");
  const [mode, setMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<AiDifficulty>("challenger");
  const [timeControl, setTimeControl] = useState<TimeControl>("blitz");
  const [clocks, setClocks] = useState<PlayerClocks>(() =>
    createClocks("blitz"),
  );
  const [selected, setSelected] = useState<Square | null>(null);
  const [forcedPiece, setForcedPiece] = useState<Square | null>(null);
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [playedMoves, setPlayedMoves] = useState<PlayedMove[]>([]);
  const [history, setHistory] = useState<GameSnapshot[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [winner, setWinner] = useState<GameWinner>(null);
  const [matchStarted, setMatchStarted] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Sign in to save games.");
  const [matchHistoryKey, setMatchHistoryKey] = useState(0);
  const savedMatchKeyRef = useRef<string | null>(null);
  const { profile, loading: profileLoading, error: profileError, refreshProfile } =
    useProfile();

  const legalMoves = useMemo(() => {
    const moves = getLegalMoves(board, turn);

    if (!forcedPiece) {
      return moves;
    }

    return moves.filter((move) => squareKey(move.from) === squareKey(forcedPiece));
  }, [board, forcedPiece, turn]);
  const selectedMoves = selected
    ? legalMoves.filter((move) => squareKey(move.from) === squareKey(selected))
    : [];
  const isAiThinking = mode === "ai" && turn === "black" && !winner;
  const isTimedGame = mode === "local";
  const displayedSaveStatus =
    winner && !profile ? "Sign in to save this result." : saveStatus;
  const coachSummary =
    winner && winner !== "draw" ? analyzeGame(playedMoves, winner) : null;

  const commitMove = useCallback((move: Move) => {
    setHistory((current) => [
      {
        board,
        turn,
        forcedPiece,
        winner,
        moveLog,
        lastMove,
        clocks,
        matchStarted,
      },
      ...current,
    ]);

    const { board: nextBoard, move: moveWithMetadata } = applyMoveWithMetadata(
      board,
      move,
    );
    const continuingCaptures = moveWithMetadata.captured?.length
      ? getContinuingCaptures(nextBoard, move.to)
      : [];
    const mustContinue = continuingCaptures.length > 0;
    const nextTurn = mustContinue ? turn : turn === "red" ? "black" : "red";
    const nextWinner = mustContinue ? null : getWinner(nextBoard, nextTurn);
    const notation = `${turn === "red" ? "Red" : "Black"} ${formatSquare(move.from)}${move.captured?.length ? "x" : "-"}${formatSquare(move.to)}`;

    setBoard(nextBoard);
    setMoveLog((current) => [notation, ...current]);
    setPlayedMoves((current) => [...current, { ...moveWithMetadata, player: turn }]);
    setMatchStarted(true);
    if (isTimedGame) {
      setClocks((current) => ({
        ...current,
        [turn]: current[turn] + timeControls[timeControl].increment,
      }));
    }
    setTurn(nextTurn);
    setForcedPiece(mustContinue ? move.to : null);
    setLastMove(move);
    setWinner(nextWinner);
    setSelected(null);
  }, [
    board,
    clocks,
    forcedPiece,
    isTimedGame,
    lastMove,
    matchStarted,
    moveLog,
    timeControl,
    turn,
    winner,
  ]);

  useEffect(() => {
    const matchKey = `${winner}-${playedMoves.length}`;

    if (
      !winner ||
      winner === "draw" ||
      savedMatchKeyRef.current === matchKey
    ) {
      return;
    }

    if (!profile) {
      return;
    }

    async function persistMatch() {
      if (!profile || !winner || winner === "draw") {
        return;
      }

      savedMatchKeyRef.current = matchKey;
      setSaveStatus("Saving match");

      try {
        await saveCompletedMatch({
          profile,
          mode,
          timeControl,
          opponent: mode === "ai" ? `${difficulty} AI` : "Local player",
          winner,
          moves: playedMoves,
        });

        setSaveStatus("Match saved");
        setMatchHistoryKey((current) => current + 1);
        void refreshProfile();
      } catch (error) {
        savedMatchKeyRef.current = null;
        setSaveStatus(
          error instanceof Error ? error.message : "Match save failed",
        );
      }
    }

    void persistMatch();
  }, [
    difficulty,
    mode,
    playedMoves,
    profile,
    refreshProfile,
    timeControl,
    winner,
  ]);

  useEffect(() => {
    if (!isAiThinking) {
      return;
    }

    const timer = window.setTimeout(() => {
      const aiMove = selectAiMove(board, "black", difficulty);

      if (aiMove) {
        commitMove(aiMove);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [board, commitMove, difficulty, isAiThinking]);

  useEffect(() => {
    if (winner || !isTimedGame || !matchStarted) {
      return;
    }

    const timer = window.setInterval(() => {
      setClocks((current) => {
        if (current[turn] <= 0) {
          return current;
        }

        const nextRemaining = Math.max(0, current[turn] - 1);

        if (nextRemaining === 0) {
          const timeoutWinner = turn === "red" ? "black" : "red";
          setWinner(timeoutWinner);
          setSelected(null);
          setForcedPiece(null);
          setMoveLog((log) => [
            `${timeoutWinner === "red" ? "Red" : "Black"} wins on time`,
            ...log,
          ]);
        }

        return {
          ...current,
          [turn]: nextRemaining,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isTimedGame, matchStarted, turn, winner]);

  function handleSquareClick(square: Square) {
    if (winner || isAiThinking) {
      return;
    }

    const piece = board[square.row][square.col];
    const chosenMove = selectedMoves.find(
      (move) => squareKey(move.to) === squareKey(square),
    );

    if (chosenMove) {
      commitMove(chosenMove);
      return;
    }

    if (
      piece?.player === turn &&
      (!forcedPiece || squareKey(forcedPiece) === squareKey(square))
    ) {
      setSelected(square);
      return;
    }

    setSelected(null);
  }

  function restart() {
    resetGame(timeControl);
  }

  function resetGame(nextTimeControl: TimeControl) {
    setBoard(createInitialBoard());
    setTurn("red");
    setClocks(createClocks(nextTimeControl));
    setSelected(null);
    setForcedPiece(null);
    setMoveLog([]);
    setPlayedMoves([]);
    setHistory([]);
    setLastMove(null);
    setWinner(null);
    setMatchStarted(false);
    savedMatchKeyRef.current = null;
    setSaveStatus(profile ? "Ready to save completed games." : "Sign in to save games.");
  }

  function undo() {
    const [previous, ...rest] = history;

    if (!previous) {
      return;
    }

    setBoard(previous.board);
    setTurn(previous.turn);
    setForcedPiece(previous.forcedPiece);
    setWinner(previous.winner);
    setMoveLog(previous.moveLog);
    setClocks(previous.clocks);
    setMatchStarted(previous.matchStarted);
    setPlayedMoves((current) => current.slice(0, -1));
    setLastMove(previous.lastMove);
    setHistory(rest);
    setSelected(null);
    savedMatchKeyRef.current = null;
  }

  function resign() {
    if (winner || isAiThinking) {
      return;
    }

    const resigningPlayer = turn;
    const nextWinner = resigningPlayer === "red" ? "black" : "red";

    setHistory((current) => [
      {
        board,
        turn,
        forcedPiece,
        winner,
        moveLog,
        lastMove,
        clocks,
        matchStarted,
      },
      ...current,
    ]);
    setWinner(nextWinner);
    setSelected(null);
    setForcedPiece(null);
    setMoveLog((current) => [
      `${resigningPlayer === "red" ? "Red" : "Black"} resigns`,
      ...current,
    ]);
  }

  function handleModeChange(nextMode: GameMode) {
    setMode(nextMode);
    restart();
  }

  function handleTimeControlChange(nextTimeControl: TimeControl) {
    setTimeControl(nextTimeControl);
    resetGame(nextTimeControl);
  }

  return (
    <div className="play-layout">
      <section className="game-column" aria-label="Game board">
        <div className="match-strip">
          <TimerBox
            label="Red"
            time={isTimedGame ? formatClock(clocks.red) : "Untimed"}
            active={isTimedGame && matchStarted && turn === "red" && !winner}
          />
          <div className="turn-box">
            {winner
              ? `${winner === "red" ? "Red" : "Black"} wins`
              : !matchStarted
                ? "Move a piece to start the game."
                : forcedPiece
                ? "Capture chain"
                : isAiThinking
                  ? "Black AI thinking"
                  : turn === "red"
                    ? "Red to move"
                    : "Black to move"}
          </div>
          <TimerBox
            label={mode === "ai" ? "Black AI" : "Black"}
            time={isTimedGame ? formatClock(clocks.black) : "Untimed"}
            active={isTimedGame && matchStarted && turn === "black" && !winner}
          />
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
              const isLastMove =
                lastMove &&
                (squareKey(lastMove.from) === key || squareKey(lastMove.to) === key);

              return (
                <button
                  aria-label={`${formatSquare(square)} ${piece ? `${piece.player} piece` : "empty"}`}
                  className={[
                    "square",
                    (rowIndex + colIndex) % 2 === 0 ? "light" : "dark",
                    isSelected ? "selected" : "",
                    isLastMove ? "last-move" : "",
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
          <button
            className="button"
            disabled={history.length === 0 || isAiThinking}
            onClick={undo}
            type="button"
          >
            <StepBack size={18} />
            Undo
          </button>
          <button
            className="button danger"
            disabled={Boolean(winner) || isAiThinking}
            onClick={resign}
            type="button"
          >
            <Flag size={18} />
            Resign
          </button>
        </div>
      </section>

      <aside className="context-panel" aria-label="Match details">
        <section className="panel-section">
          <h2>Match</h2>
          <div className="settings-grid">
            <label className="field">
              <span>Mode</span>
              <select
                onChange={(event) => handleModeChange(event.target.value as GameMode)}
                value={mode}
              >
                <option value="ai">Vs AI</option>
                <option value="local">Local two-player</option>
              </select>
            </label>
            <label className="field">
              <span>AI level</span>
              <select
                disabled={mode !== "ai"}
                onChange={(event) => setDifficulty(event.target.value as AiDifficulty)}
                value={difficulty}
              >
                <option value="rookie">Rookie</option>
                <option value="challenger">Challenger</option>
                <option value="master">Master</option>
              </select>
            </label>
            {mode === "local" ? (
              <label className="field">
                <span>Time control</span>
                <select
                  onChange={(event) =>
                    handleTimeControlChange(event.target.value as TimeControl)
                  }
                  value={timeControl}
                >
                  <option value="bullet">{timeControls.bullet.label}</option>
                  <option value="blitz">{timeControls.blitz.label}</option>
                  <option value="rapid">{timeControls.rapid.label}</option>
                </select>
              </label>
            ) : null}
          </div>
        </section>

        <section className="panel-section">
          <h2>Friend room</h2>
          <p className="muted-line">Create an invite link and claim seats through Supabase.</p>
          <a className="button" href="/room">
            <Link2 size={18} />
            Open room
          </a>
        </section>

        <section className="panel-section">
          <h2>Moves</h2>
          <div className="move-list">
            {moveLog.length ? (
              moveLog.map((move, index) => (
                <div key={`${move}-${index}`}>
                  <span>{moveLog.length - index}</span>
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
          {coachSummary ? (
            <div className="coach-report">
              <div>
                <strong>{coachSummary.accuracy}%</strong>
                <span>accuracy</span>
              </div>
              <p>{coachSummary.headline}</p>
              <p>{coachSummary.keyMoment}</p>
              <p>{coachSummary.improvement}</p>
            </div>
          ) : (
            <p className="coach-note">
              {forcedPiece
                ? "Continue the capture chain with the same piece."
                : legalMoves.some((move) => move.captured?.length)
                  ? "A capture is available and must be played."
                  : "Develop pieces toward the center before chasing edge trades."}
            </p>
          )}
          <p className="muted-line">{displayedSaveStatus}</p>
        </section>

        <ProfileSummary
          error={profileError}
          loading={profileLoading}
          profile={profile}
        />
        <RecentMatchesPanel
          profileId={profile?.id}
          refreshKey={matchHistoryKey}
        />
        <LeaderboardPanel currentProfileId={profile?.id} />
      </aside>
    </div>
  );
}

function createClocks(timeControl: TimeControl): PlayerClocks {
  return {
    red: timeControls[timeControl].seconds,
    black: timeControls[timeControl].seconds,
  };
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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
