export type ClientMessage =
  | { type: "CREATE_ROOM"; payload: { username: string } }
  | { type: "JOIN_ROOM"; payload: { roomId: string; username: string } }
  | { type: "LEAVE_ROOM" }
  | { type: "START_GAME" };

export type ServerMessage =
  | {
      type: "ROOM_UPDATE";
      payload: {
        roomId: string;
        hostId: string | null;
        players: { id: string; username: string }[];
        state: RoomState;
        game: GameDTO | null;
      };
    }
  | {
      type: "ERROR";
      payload: { message: string };
    };

export type RoomState = "WAITING" | "IN_GAME";

export type GameState = "PLAYING" | "FINISHED";

export type GameDTO = {
  state: GameState;
  currentRound: number;
  maxRounds: number;
};
