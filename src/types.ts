export type ClientMessage =
  | { type: "CREATE_ROOM" }
  | { type: "JOIN_ROOM"; payload: { roomId: string; username: string } }
  | { type: "LEAVE_ROOM" };

export type ServerMessage =
  | { type: "ROOM_CREATED"; payload: { roomId: string } }
  | { type: "ROOM_JOINED"; payload: { roomId: string; username: string } }
  | { type: "ROOM_LEFT" }
  | { type: "ERROR"; payload: { message: string } };
