"use client";

import { Flag, Link2, Lock, RotateCcw, StepBack, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProfileSummary } from "@/features/profile/profile-summary";
import { useProfile } from "@/features/profile/use-profile";
import { GetPro } from "@/features/pro/get-pro";
import { FREE_COACH_REPORT_LIMIT, useProAccess } from "@/features/pro/pro-access";
import {
  createRoom,
  finishRoom,
  getPlayerForSeat,
  getRoomByCode,
  getRoomPlayers,
  joinRoomAsOpponent,
  updateRoomBoard,
  type RoomSnapshot,
} from "@/features/rooms/room-service";
import { supabase } from "@/lib/supabase/client";
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
import type { TimeControl } from "@/types/database";

type GameMode = "ai" | "local" | "friend";

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
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [roomStatus, setRoomStatus] = useState("Create an invite to play a friend.");
  const [roomLoading, setRoomLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const savedMatchKeyRef = useRef<string | null>(null);
  const [activeCoachReportKey, setActiveCoachReportKey] = useState<string | null>(
    null,
  );
  const loadedInviteCodeRef = useRef<string | null>(null);
  const confirmedNavigationRef = useRef(false);
  const { profile, loading: profileLoading, error: profileError, refreshProfile } =
    useProfile();
  const {
    canUseSkin,
    coachReportsRemaining,
    coachReportsUsed,
    isPro,
    pieceSkins,
    recordCoachReport,
    selectedSkin,
    setSelectedSkin,
  } = useProAccess();
  const playerSeat = useMemo(() => {
    if (!profile || !roomSnapshot) {
      return null;
    }

    return (
      roomSnapshot.players.find((player) => player.user_id === profile.id)?.seat ??
      null
    );
  }, [profile, roomSnapshot]);
  const roomHasBothPlayers = Boolean(
    roomSnapshot &&
      getPlayerForSeat(roomSnapshot.players, "red") &&
      getPlayerForSeat(roomSnapshot.players, "black"),
  );
  const roomReady = Boolean(
    mode === "friend" &&
      roomSnapshot &&
      roomSnapshot.room.status === "active" &&
      roomHasBothPlayers,
  );
  const activeFriendGame = Boolean(roomReady && !winner);
  const shouldFlipBoard = mode === "friend" && playerSeat === "black";
  const displayedSquares = useMemo(
    () => getDisplayedSquares(shouldFlipBoard),
    [shouldFlipBoard],
  );
  const activeFriendGameRef = useRef(activeFriendGame);
  const roomSnapshotRef = useRef(roomSnapshot);

  const legalMoves = useMemo(() => {
    if (mode === "friend" && (!roomReady || playerSeat !== turn)) {
      return [];
    }

    const moves = getLegalMoves(board, turn);

    if (!forcedPiece) {
      return moves;
    }

    return moves.filter((move) => squareKey(move.from) === squareKey(forcedPiece));
  }, [board, forcedPiece, mode, playerSeat, roomReady, turn]);
  const selectedMoves = selected
    ? legalMoves.filter((move) => squareKey(move.from) === squareKey(selected))
    : [];
  const isAiThinking = mode === "ai" && turn === "black" && !winner;
  const isTimedGame = mode === "local";
  const displayedSaveStatus =
    winner && !profile ? "Sign in to save this result." : saveStatus;
  const coachSummary =
    winner && winner !== "draw" ? analyzeGame(playedMoves, winner) : null;
  const coachReportKey = coachSummary
    ? `${winner}-${playedMoves.length}-${playedMoves.at(-1)?.to.row ?? "none"}-${playedMoves.at(-1)?.to.col ?? "none"}`
    : null;
  const canShowCoachReport =
    Boolean(coachSummary) &&
    (isPro || activeCoachReportKey === coachReportKey || coachReportsUsed < FREE_COACH_REPORT_LIMIT);

  useEffect(() => {
    activeFriendGameRef.current = activeFriendGame;
    roomSnapshotRef.current = roomSnapshot;
  }, [activeFriendGame, roomSnapshot]);

  useEffect(() => {
    if (!coachSummary || !coachReportKey || activeCoachReportKey === coachReportKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isPro || recordCoachReport()) {
        setActiveCoachReportKey(coachReportKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    activeCoachReportKey,
    coachReportKey,
    coachSummary,
    isPro,
    recordCoachReport,
  ]);

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
      mode === "friend" ||
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
          mode: mode === "friend" ? "local" : mode,
          timeControl,
          opponent: mode === "ai" ? `${difficulty} AI` : "Local player",
          winner,
          moves: playedMoves,
        });

        setSaveStatus("Match saved");
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
    if (profileLoading) {
      return;
    }

    const code = new URLSearchParams(window.location.search)
      .get("code")
      ?.toUpperCase();

    if (!code || loadedInviteCodeRef.current === code) {
      return;
    }

    if (!profile) {
      const timer = window.setTimeout(() => {
        setRoomStatus("Sign in to join the invite.");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    if (profile) {
      loadedInviteCodeRef.current = code;
      void joinInviteFromUrl(code);
      return;
    }

    async function joinInviteFromUrl(inviteCode: string) {
      if (!profile) {
        return;
      }

      setRoomLoading(true);
      setMode("friend");
      setBoard(createInitialBoard());
      setTurn("red");
      setClocks(createClocks(timeControl));
      setSelected(null);
      setForcedPiece(null);
      setMoveLog([]);
      setPlayedMoves([]);
      setHistory([]);
      setLastMove(null);
      setWinner(null);
      setMatchStarted(false);
      setRoomSnapshot(null);
      setRoomStatus("Joining invite.");
      savedMatchKeyRef.current = null;

      try {
        const existingRoom = await getRoomByCode(inviteCode);
        const nextSnapshot = await joinRoomAsOpponent(existingRoom.room, profile);
        const nextBoard = parseRoomBoard(nextSnapshot.room.board_state);

        setRoomSnapshot(nextSnapshot);
        setBoard(nextBoard.length ? nextBoard : createInitialBoard());
        setTurn(nextSnapshot.room.turn);
        setMatchStarted(nextSnapshot.room.status === "active");
        setRoomStatus(
          nextSnapshot.room.status === "active"
            ? "Joined. Red moves first."
            : "Joined. Waiting for friend.",
        );
      } catch (error) {
        setRoomStatus(error instanceof Error ? error.message : "Could not join invite.");
      } finally {
        setRoomLoading(false);
      }
    }
  }, [profile, profileLoading, timeControl]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!activeFriendGameRef.current || confirmedNavigationRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!activeFriendGameRef.current) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (!link?.href || link.target || link.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(link.href);

      if (
        nextUrl.origin !== window.location.origin ||
        nextUrl.pathname === window.location.pathname
      ) {
        return;
      }

      event.preventDefault();

      if (!window.confirm("Leaving this game will surrender it. Leave game?")) {
        return;
      }

      const snapshot = roomSnapshotRef.current;
      confirmedNavigationRef.current = true;

      if (!snapshot) {
        window.location.href = link.href;
        return;
      }

      void finishRoom(snapshot.room).finally(() => {
        window.location.href = link.href;
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (!supabase || !roomSnapshot?.room.id) {
      return;
    }

    const client = supabase;
    const roomId = roomSnapshot.room.id;
    const channel = client
      .channel(`play-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const nextRoom = payload.new as RoomSnapshot["room"];
          const nextBoard = parseRoomBoard(nextRoom.board_state);

          setRoomSnapshot((current) =>
            current ? { ...current, room: nextRoom } : current,
          );
          if (nextBoard.length) {
            setBoard(nextBoard);
          }
          setTurn(nextRoom.turn);
          setSelected(null);
          setMatchStarted(nextRoom.status === "active");
          setRoomStatus(
            nextRoom.status === "finished" ? "Room finished." : "Board synced.",
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const players = await getRoomPlayers(roomId);
          setRoomSnapshot((current) =>
            current ? { ...current, players } : current,
          );
          setRoomStatus(
            getPlayerForSeat(players, "red") && getPlayerForSeat(players, "black")
              ? "Both players joined. Red moves first."
              : "Waiting for friend to join.",
          );
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [roomSnapshot?.room.id]);

  useEffect(() => {
    if (!isAiThinking) {
      return;
    }

    const timer = window.setTimeout(() => {
      const aiMove = selectAiMove(board, "black", difficulty, forcedPiece);

      if (aiMove) {
        commitMove(aiMove);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [board, commitMove, difficulty, forcedPiece, isAiThinking]);

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

    if (mode === "friend") {
      if (!roomSnapshot || !playerSeat || playerSeat === "spectator") {
        setRoomStatus("Join a room seat before moving.");
        return;
      }

      if (!roomReady) {
        setRoomStatus("Waiting for friend to join.");
        return;
      }

      if (playerSeat !== turn) {
        setRoomStatus("Wait for your turn.");
        return;
      }
    }

    const piece = board[square.row][square.col];
    const chosenMove = selectedMoves.find(
      (move) => squareKey(move.to) === squareKey(square),
    );

    if (chosenMove) {
      if (mode === "friend") {
        void commitRoomMove(chosenMove);
        return;
      }

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
    setRoomSnapshot(null);
    setRoomStatus("Create an invite to play a friend.");
    setActiveCoachReportKey(null);
    savedMatchKeyRef.current = null;
    setSaveStatus(profile ? "Ready to save completed games." : "Sign in to save games.");
  }

  async function surrenderFriendGame() {
    if (roomSnapshot) {
      try {
        await finishRoom(roomSnapshot.room);
      } catch {
        setRoomStatus("Left locally. Could not update room status.");
      }
    }
  }

  async function leaveFriendRoom() {
    confirmedNavigationRef.current = true;
    await surrenderFriendGame();
    confirmedNavigationRef.current = false;
    setMode("ai");
    resetGame(timeControl);
    setJoinCode("");
    setShowJoinForm(false);
    window.history.replaceState(null, "", "/");
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

  async function handleModeChange(nextMode: GameMode) {
    if (nextMode === mode) {
      return;
    }

    if (
      activeFriendGame &&
      nextMode !== "friend" &&
      !window.confirm("Changing mode will surrender this game. Leave game?")
    ) {
      return;
    }

    if (activeFriendGame && nextMode !== "friend") {
      confirmedNavigationRef.current = true;
      await surrenderFriendGame();
      confirmedNavigationRef.current = false;
    }

    setMode(nextMode);
    if (nextMode !== "friend") {
      setRoomSnapshot(null);
      setRoomStatus("Create an invite to play a friend.");
    }
    restart();
  }

  function handleTimeControlChange(nextTimeControl: TimeControl) {
    setTimeControl(nextTimeControl);
    resetGame(nextTimeControl);
  }

  async function handleCreateInvite() {
    if (!profile) {
      setRoomStatus("Sign in before creating an invite.");
      return;
    }

    setRoomLoading(true);
    setMode("friend");
    resetGame(timeControl);
    setRoomStatus("Creating invite.");

    try {
      const nextSnapshot = await createRoom(profile);
      const nextBoard = parseRoomBoard(nextSnapshot.room.board_state);

      setRoomSnapshot(nextSnapshot);
      setBoard(nextBoard.length ? nextBoard : createInitialBoard());
      setTurn(nextSnapshot.room.turn);
      setMatchStarted(false);
      window.history.replaceState(null, "", `/?code=${nextSnapshot.room.code}`);
      setJoinCode("");
      setShowJoinForm(false);
      setRoomStatus(
        `Invite ready. You are ${formatSeat(nextSnapshot.players.find((player) => player.user_id === profile.id)?.seat)}.`,
      );
    } catch (error) {
      setRoomStatus(error instanceof Error ? error.message : "Could not create invite.");
    } finally {
      setRoomLoading(false);
    }
  }

  async function handleJoinInvite() {
    const code = joinCode.trim().toUpperCase();

    if (!profile) {
      setRoomStatus("Sign in before joining an invite.");
      return;
    }

    if (!code) {
      setRoomStatus("Enter an invite code.");
      return;
    }

    setRoomLoading(true);
    setMode("friend");
    resetGame(timeControl);
    setRoomStatus("Joining invite.");

    try {
      const existingRoom = await getRoomByCode(code);
      const nextSnapshot = await joinRoomAsOpponent(existingRoom.room, profile);
      const nextBoard = parseRoomBoard(nextSnapshot.room.board_state);

      setRoomSnapshot(nextSnapshot);
      setBoard(nextBoard.length ? nextBoard : createInitialBoard());
      setTurn(nextSnapshot.room.turn);
      setMatchStarted(nextSnapshot.room.status === "active");
      window.history.replaceState(null, "", `/?code=${nextSnapshot.room.code}`);
      setShowJoinForm(false);
      setRoomStatus(
        nextSnapshot.room.status === "active"
          ? "Joined. Red moves first."
          : "Joined. Waiting for friend.",
      );
    } catch (error) {
      setRoomStatus(error instanceof Error ? error.message : "Could not join invite.");
    } finally {
      setRoomLoading(false);
    }
  }

  async function copyInviteCode() {
    if (!roomSnapshot?.room.code) {
      return;
    }

    await navigator.clipboard.writeText(roomSnapshot.room.code);
    setRoomStatus("Invite code copied.");
  }

  async function commitRoomMove(move: Move) {
    if (!roomSnapshot || !playerSeat || playerSeat !== turn || !roomReady) {
      setRoomStatus("Wait for your turn.");
      return;
    }

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

    setRoomStatus("Syncing move.");

    try {
      const nextRoom = await updateRoomBoard({
        room: roomSnapshot.room,
        board: nextBoard,
        turn: nextTurn,
        status: nextWinner ? "finished" : "active",
      });

      setBoard(nextBoard);
      setMoveLog((current) => [notation, ...current]);
      setPlayedMoves((current) => [...current, { ...moveWithMetadata, player: turn }]);
      setMatchStarted(true);
      setTurn(nextTurn);
      setForcedPiece(mustContinue ? move.to : null);
      setLastMove(move);
      setWinner(nextWinner);
      setSelected(null);
      setRoomSnapshot((current) =>
        current ? { ...current, room: nextRoom } : current,
      );
      setRoomStatus(
        nextWinner
          ? formatWinner(nextWinner)
          : mustContinue
            ? "Continue the capture chain."
            : "Move synced.",
      );
    } catch (error) {
      setRoomStatus(error instanceof Error ? error.message : "Could not sync move.");
    }
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
              ? formatWinner(winner)
              : mode === "friend" && roomSnapshot?.room.status === "finished"
                ? "Room finished"
              : mode === "friend" && !roomReady
                ? "Waiting for friend"
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

        <div
          className="board"
          data-skin={selectedSkin}
          role="grid"
          aria-label="Checkers board"
        >
          {displayedSquares.map((square) => {
            const piece = board[square.row][square.col];
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
                  (square.row + square.col) % 2 === 0 ? "light" : "dark",
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
          })}
        </div>

        <div className="board-actions">
          <button className="button primary" onClick={restart} type="button">
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
                onChange={(event) =>
                  void handleModeChange(event.target.value as GameMode)
                }
                value={mode}
              >
                <option value="ai">Vs AI</option>
                <option value="local">Local two-player</option>
                <option value="friend">Play a friend</option>
              </select>
            </label>
            {mode === "ai" ? (
              <label className="field">
                <span>AI level</span>
                <select
                  onChange={(event) => setDifficulty(event.target.value as AiDifficulty)}
                  value={difficulty}
                >
                  <option value="rookie">Rookie</option>
                  <option value="challenger">Challenger</option>
                  <option value="master">Master</option>
                </select>
              </label>
            ) : null}
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
          <h2>Play a friend</h2>
          <p className="muted-line">{roomStatus}</p>
          {roomReady ? (
            <button
              className="button danger"
              onClick={() => void leaveFriendRoom()}
              type="button"
            >
              Leave
            </button>
          ) : (
            <>
              <div className="friend-actions">
                <button
                  className="button"
                  disabled={roomLoading || !profile}
                  onClick={handleCreateInvite}
                  type="button"
                >
                  <Link2 size={18} />
                  {roomLoading ? "Working" : "Invite"}
                </button>
                <button
                  className="button"
                  disabled={roomLoading || !profile}
                  onClick={() => setShowJoinForm((current) => !current)}
                  type="button"
                >
                  <UserPlus size={18} />
                  Join
                </button>
              </div>
              {showJoinForm ? (
                <div className="friend-join-form">
                  <input
                    aria-label="Invite code"
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    value={joinCode}
                  />
                  <button
                    className="button primary"
                    disabled={roomLoading || !joinCode.trim()}
                    onClick={handleJoinInvite}
                    type="button"
                  >
                    Join
                  </button>
                </div>
              ) : null}
            </>
          )}
          {roomSnapshot && !roomReady ? (
            <div className="room-card">
              <button
                className="invite-code-button"
                onClick={copyInviteCode}
                type="button"
              >
                <span>Invite code</span>
                <strong>{roomSnapshot.room.code}</strong>
              </button>
              <div className="seat-row" data-filled={Boolean(playerSeat)}>
                <span>Your side</span>
                <strong>{formatSeat(playerSeat)}</strong>
              </div>
            </div>
          ) : null}
          {roomSnapshot && roomReady ? (
            <div className="seat-row" data-filled={Boolean(playerSeat)}>
              <span>Your side</span>
              <strong>{formatSeat(playerSeat)}</strong>
            </div>
          ) : null}
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
          {coachSummary && canShowCoachReport ? (
            <div className="coach-report">
              <div>
                <strong>{coachSummary.accuracy}%</strong>
                <span>accuracy</span>
              </div>
              <p>{coachSummary.headline}</p>
              <p>{coachSummary.keyMoment}</p>
              <p>{coachSummary.improvement}</p>
              <div className="coach-stats" aria-label="Coach move grades">
                <span>{coachSummary.bestMoveCount} best</span>
                <span>{coachSummary.mistakeCount} mistakes</span>
                <span>{coachSummary.blunderCount} blunders</span>
                <span>{coachSummary.puzzleTheme}</span>
              </div>
            </div>
          ) : coachSummary ? (
            <div className="coach-report coach-locked">
              <div>
                <Lock size={18} />
                <strong>Pro</strong>
              </div>
              <p>Daily free coach reports are used.</p>
              <p>Start fake Pro to unlock this post-game report.</p>
              <GetPro label="Get Pro" />
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
          <p className="muted-line">
            {isPro
              ? "AI Coach is unlimited with Pro."
              : `${coachReportsRemaining} of ${FREE_COACH_REPORT_LIMIT} free coach reports left today.`}
          </p>
          <p className="muted-line">{displayedSaveStatus}</p>
        </section>

        <section className="panel-section">
          <h2>Piece skins</h2>
          <div className="skin-list">
            {pieceSkins.map((skin) => {
              const locked = !canUseSkin(skin.id);

              return (
                <button
                  className="skin-row"
                  data-current={selectedSkin === skin.id}
                  disabled={locked}
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin.id)}
                  type="button"
                >
                  <span className={`skin-swatch ${skin.id}`} />
                  <strong>{skin.name}</strong>
                  {locked ? (
                    <span className="skin-lock">
                      <Lock size={14} />
                      Pro
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {!isPro ? <GetPro label="Unlock skins" /> : null}
        </section>

        <ProfileSummary
          error={profileError}
          loading={profileLoading}
          profile={profile}
        />
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

function formatSeat(seat: string | null | undefined) {
  if (seat === "red") {
    return "Red";
  }

  if (seat === "black") {
    return "Black";
  }

  return "Waiting";
}

function formatWinner(winner: Exclude<GameWinner, null>) {
  if (winner === "draw") {
    return "Draw";
  }

  return `${winner === "red" ? "Red" : "Black"} wins`;
}

function getDisplayedSquares(flip: boolean): Square[] {
  const squares = Array.from({ length: 64 }, (_, index) => ({
    row: Math.floor(index / 8),
    col: index % 8,
  }));

  return flip ? squares.reverse() : squares;
}

function parseRoomBoard(value: unknown): Board {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((row) =>
    Array.isArray(row)
      ? row.map((piece) => {
          if (!piece || typeof piece !== "object" || Array.isArray(piece)) {
            return null;
          }

          if (piece.player !== "red" && piece.player !== "black") {
            return null;
          }

          return {
            player: piece.player,
            king: piece.king === true,
          };
        })
      : [],
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
