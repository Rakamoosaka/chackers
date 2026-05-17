"use client";

import { Copy, Link2, RefreshCw, UserPlus } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  applyMoveWithMetadata,
  formatSquare,
  getContinuingCaptures,
  getLegalMoves,
  squareKey,
} from "@/features/game/engine/board";
import type { Board, Move, Player, Square } from "@/features/game/engine/types";
import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import {
  createRoom,
  getPlayerForSeat,
  getRoomByCode,
  getRoomPlayers,
  joinRoomAsBlack,
  updateRoomBoard,
  type RoomSnapshot,
} from "./room-service";

type RoomState = {
  snapshot: RoomSnapshot | null;
  status: string;
  error: string | null;
  loading: boolean;
};

type RoomAction =
  | { type: "loading"; status: string }
  | { type: "loaded"; snapshot: RoomSnapshot; status: string }
  | { type: "failed"; message: string }
  | { type: "status"; status: string };

export function RoomScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [joinCode, setJoinCode] = useState(() => getInitialJoinCode());
  const [selected, setSelected] = useState<Square | null>(null);
  const [forcedPiece, setForcedPiece] = useState<Square | null>(null);
  const [{ snapshot, status, error, loading }, dispatch] = useReducer(
    roomReducer,
    {
      snapshot: null,
      status: "Create a room or enter an invite code.",
      error: null,
      loading: false,
    },
  );

  const inviteLink = useMemo(() => {
    if (!snapshot || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/room?code=${snapshot.room.code}`;
  }, [snapshot]);
  const board = useMemo(
    () => parseRoomBoard(snapshot?.room.board_state),
    [snapshot?.room.board_state],
  );
  const playerSeat = useMemo(() => {
    if (!profile || !snapshot) {
      return null;
    }

    return (
      snapshot.players.find((player) => player.user_id === profile.id)?.seat ??
      null
    );
  }, [profile, snapshot]);
  const legalMoves = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const moves = getLegalMoves(board, snapshot.room.turn);

    if (!forcedPiece) {
      return moves;
    }

    return moves.filter((move) => squareKey(move.from) === squareKey(forcedPiece));
  }, [board, forcedPiece, snapshot]);
  const selectedMoves = selected
    ? legalMoves.filter((move) => squareKey(move.from) === squareKey(selected))
    : [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      return;
    }

    void loadRoom(code);
  }, []);

  useEffect(() => {
    if (!supabase || !snapshot?.room.id) {
      return;
    }

    const client = supabase;
    const roomId = snapshot.room.id;
    const channel = client
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({
            type: "loaded",
            snapshot: {
              room: payload.new as RoomSnapshot["room"],
              players: snapshot.players,
            },
            status: "Board synced.",
          });
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
          dispatch({
            type: "loaded",
            snapshot: { room: snapshot.room, players },
            status: "Room updated.",
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [snapshot]);

  async function handleCreateRoom() {
    if (!profile) {
      dispatch({ type: "failed", message: "Sign in before creating a room." });
      return;
    }

    dispatch({ type: "loading", status: "Creating room" });

    try {
      const nextSnapshot = await createRoom(profile);
      window.history.replaceState(null, "", `/room?code=${nextSnapshot.room.code}`);
      setJoinCode(nextSnapshot.room.code);
      dispatch({
        type: "loaded",
        snapshot: nextSnapshot,
        status: "Room created. Send the invite link to a friend.",
      });
    } catch (roomError) {
      dispatch({
        type: "failed",
        message:
          roomError instanceof Error ? roomError.message : "Could not create room.",
      });
    }
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) {
      dispatch({ type: "failed", message: "Enter a room code." });
      return;
    }

    dispatch({ type: "loading", status: "Loading room" });

    try {
      const roomSnapshot = await getRoomByCode(joinCode);

      if (profile) {
        const joinedSnapshot = await joinRoomAsBlack(roomSnapshot.room, profile);
        dispatch({
          type: "loaded",
          snapshot: joinedSnapshot,
          status: "Joined room as black.",
        });
        return;
      }

      dispatch({
        type: "loaded",
        snapshot: roomSnapshot,
        status: "Room loaded. Sign in to join a seat.",
      });
    } catch (roomError) {
      dispatch({
        type: "failed",
        message:
          roomError instanceof Error ? roomError.message : "Could not join room.",
      });
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    dispatch({ type: "status", status: "Invite link copied." });
  }

  async function handleSquareClick(square: Square) {
    if (!snapshot) {
      return;
    }

    if (playerSeat !== snapshot.room.turn) {
      dispatch({ type: "status", status: "Wait for your turn." });
      return;
    }

    const piece = board[square.row][square.col];
    const chosenMove = selectedMoves.find(
      (move) => squareKey(move.to) === squareKey(square),
    );

    if (chosenMove) {
      await commitRoomMove(chosenMove);
      return;
    }

    if (
      piece?.player === snapshot.room.turn &&
      (!forcedPiece || squareKey(forcedPiece) === squareKey(square))
    ) {
      setSelected(square);
      dispatch({ type: "status", status: "Choose a highlighted destination." });
      return;
    }

    setSelected(null);
  }

  async function commitRoomMove(move: Move) {
    if (!snapshot) {
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
    const nextTurn = mustContinue
      ? snapshot.room.turn
      : snapshot.room.turn === "red"
        ? "black"
        : "red";

    dispatch({ type: "status", status: "Syncing move." });

    try {
      const room = await updateRoomBoard({
        room: snapshot.room,
        board: nextBoard,
        turn: nextTurn,
      });

      setSelected(null);
      setForcedPiece(mustContinue ? move.to : null);
      dispatch({
        type: "loaded",
        snapshot: { room, players: snapshot.players },
        status: mustContinue ? "Continue the capture chain." : "Move synced.",
      });
    } catch (roomError) {
      dispatch({
        type: "failed",
        message:
          roomError instanceof Error ? roomError.message : "Could not sync move.",
      });
    }
  }

  const redPlayer = snapshot
    ? getPlayerForSeat(snapshot.players, "red")
    : undefined;
  const blackPlayer = snapshot
    ? getPlayerForSeat(snapshot.players, "black")
    : undefined;

  return (
    <div className="room-page">
      <section className="game-column">
        <div className="room-hero">
          <div>
            <h2>Friend room</h2>
            <p className="muted-line">
              Room records and player seats are stored in Supabase.
            </p>
          </div>
          <button
            className="button arcade"
            disabled={loading || profileLoading}
            onClick={handleCreateRoom}
            type="button"
          >
            <Link2 size={18} />
            Create room
          </button>
        </div>

        <div className="room-join-row">
          <label className="field">
            <span>Invite code</span>
            <input
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              value={joinCode}
            />
          </label>
          <button
            className="button"
            disabled={loading}
            onClick={handleJoinRoom}
            type="button"
          >
            <UserPlus size={18} />
            Join
          </button>
        </div>

        {snapshot ? (
          <div className="room-card">
            <div className="room-code-line">
              <span>Room code</span>
              <strong>{snapshot.room.code}</strong>
            </div>
            <div className="room-link-line">
              <span>{inviteLink}</span>
              <button className="button" onClick={copyInviteLink} type="button">
                <Copy size={18} />
                Copy
              </button>
            </div>
          </div>
        ) : null}

        <p className={error ? "error-line" : "muted-line"}>{error ?? status}</p>

        {snapshot ? (
          <div className="room-board-wrap">
            <div className="match-strip">
              <div className="timer-box" data-active={snapshot.room.turn === "red"}>
                <span className="timer-label">Red</span>
                <strong className="timer-value">
                  {redPlayer?.display_name ?? "Open"}
                </strong>
              </div>
              <div className="turn-box">{snapshot.room.turn} to move</div>
              <div className="timer-box" data-active={snapshot.room.turn === "black"}>
                <span className="timer-label">Black</span>
                <strong className="timer-value">
                  {blackPlayer?.display_name ?? "Open"}
                </strong>
              </div>
            </div>

            <div className="board" role="grid" aria-label="Room checkers board">
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
                        legalMove
                          ? legalMove.captured?.length
                            ? "capture"
                            : "legal"
                          : "",
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
          </div>
        ) : null}
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Seats</h2>
          <div className="room-seats">
            <Seat label="Red" name={redPlayer?.display_name} />
            <Seat label="Black" name={blackPlayer?.display_name} />
          </div>
        </section>
        <section className="panel-section">
          <h2>Sync status</h2>
          <p className="coach-note">
            Player slots and board state update through Supabase Realtime.
          </p>
          <button
            className="button"
            disabled={!snapshot}
            onClick={() => snapshot && void loadRoom(snapshot.room.code)}
            type="button"
          >
            <RefreshCw size={18} />
            Refresh room
          </button>
        </section>
      </aside>
    </div>
  );

  async function loadRoom(code: string) {
    dispatch({ type: "loading", status: "Loading room" });

    try {
      const nextSnapshot = await getRoomByCode(code);
      dispatch({
        type: "loaded",
        snapshot: nextSnapshot,
        status: "Room loaded.",
      });
    } catch (roomError) {
      dispatch({
        type: "failed",
        message:
          roomError instanceof Error ? roomError.message : "Could not load room.",
      });
    }
  }
}

function getInitialJoinCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search)
    .get("code")
    ?.toUpperCase() ?? "";
}

function parseRoomBoard(value: Json | undefined): Board {
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
            player: piece.player as Player,
            king: piece.king === true,
          };
        })
      : [],
  );
}

function Seat({ label, name }: { label: string; name?: string }) {
  return (
    <div className="seat-row" data-filled={Boolean(name)}>
      <span>{label}</span>
      <strong>{name ?? "Waiting"}</strong>
    </div>
  );
}

function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, status: action.status, error: null };
    case "loaded":
      return {
        snapshot: action.snapshot,
        status: action.status,
        error: null,
        loading: false,
      };
    case "failed":
      return { ...state, error: action.message, loading: false };
    case "status":
      return { ...state, status: action.status, error: null };
  }
}
