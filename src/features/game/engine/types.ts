export type Player = "red" | "black";

export type Piece = {
  player: Player;
  king: boolean;
};

export type Square = {
  row: number;
  col: number;
};

export type Board = Array<Array<Piece | null>>;

export type Move = {
  from: Square;
  to: Square;
  captured?: Square[];
  promoted?: boolean;
};
