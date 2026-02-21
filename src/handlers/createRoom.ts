import { Player } from "../domain/player";
import { RoomManager } from "../roomManager";
import { ClientMessage } from "../types";
import generateRoomCode from "../utils/generateRoomCode";
import sendServerMessage from "../utils/sendServerMessage";

type StartGameMessage = Extract<ClientMessage, { type: "CREATE_ROOM" }>;

export default function handleCreateRoom(
  message: StartGameMessage,
  player: Player,
  roomManager: RoomManager
) {
  if (player.roomId) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Already in a room" },
    });
  }

  const roomId = generateRoomCode();
  const room = roomManager.createRoom(roomId); //création de l'objet room depuis roomManager

  if (!room) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Room creation failed" },
    });
  }

  player.username = message.payload.username;

  room.addPlayer(player); //ajout du joueur dans l'objet room

  return sendServerMessage(player.socket, {
    type: "ROOM_CREATED",
    payload: { roomId, username: player.username },
  });
}
