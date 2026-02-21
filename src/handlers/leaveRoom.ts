import { Player } from "../domain/player";
import { RoomManager } from "../roomManager";
import sendServerMessage from "../utils/sendServerMessage";

export default function handleLeaveRoom(
  player: Player,
  roomManager: RoomManager
) {
  //verifie si le joueur est bien dans la room
  if (!player.roomId) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Not in a room" },
    });
  }

  const room = roomManager.getRoom(player.roomId);

  if (!room) {
    return sendServerMessage(player.socket, {
      type: "ERROR",
      payload: { message: "Room not found" },
    });
  }

  room.removePlayer(player); //supprime le joueur de la room

  roomManager.removeRoomIfEmpty(room); //supprime la room si elle est vide

  //message retour
  return sendServerMessage(player.socket, {
    type: "ROOM_LEFT",
  });
}
