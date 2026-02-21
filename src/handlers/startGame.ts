import { Player } from "../domain/player";
import { RoomManager } from "../roomManager";
import sendServerMessage from "../utils/sendServerMessage";

export default function handleStartGame(
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
}
