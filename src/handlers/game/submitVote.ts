import type { WebSocket } from "ws";
import type { GameManager } from "../../domain/gameManager";
import type { Player } from "../../domain/player";
import type { RoomManager } from "../../domain/roomManager";
import broadcastRoomUpdate from "../../utils/broadcastRoomUpdate";
import sendServerMessage from "../../utils/sendServerMessage";

export default function handleSubmitVote(
	player: Player,
	roomManager: RoomManager,
	gameManager: GameManager,
	sockets: Map<string, WebSocket>,
	answerIndex: number,
) {
	const socket = sockets.get(player.id);
	if (!socket) return;

	if (!player.roomId) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Not in a room" },
		});
	}

	const room = roomManager.getRoom(player.roomId);

	if (!room) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Room not found" },
		});
	}

	const game = gameManager.getGame(room.id);
	if (!game) {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Game not found" },
		});
	}

	game.submitVote(player.id, answerIndex);
	broadcastRoomUpdate(room, sockets, game);
}
