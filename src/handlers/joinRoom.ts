import { Player } from "../domain/player";
import { RoomManager } from "../roomManager";
import { ClientMessage } from "../types";
import sendServerMessage from "../utils/sendServerMessage";

type StartGameMessage = Extract<ClientMessage, { type: "JOIN_ROOM" }>;

export default function handleJoinRoom(
  message: StartGameMessage,
  player: Player,
  roomManager: RoomManager
) {
  //vérifie que le joueuer n'est pas deja dans une room
  if (player.roomId) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Already in a room" },
    });
  }

  //vérifie que la room existe
  const room = roomManager.getRoom(message.payload.roomId);

  if (!room) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Room does not exist" },
    });
  }

  //mettre a jour le username
  player.username = message.payload.username;

  room.addPlayer(player);

  //message retour
  return sendServerMessage(player.socket, {
    type: "ROOM_JOINED",
    payload: {
      roomId: room.id,
      username: player.username,
    },
  });
}
