import type { WebSocket } from "ws";
import type { GameManager } from "../domain/gameManager";
import type { Player } from "../domain/player";
import type { RoomManager } from "../domain/roomManager";
import broadcastRoomUpdate from "../utils/broadcastRoomUpdate";
import { questions } from "../utils/questions";
import sendServerMessage from "../utils/sendServerMessage";

export default function handleStartGame(
	player: Player,
	roomManager: RoomManager,
	gameManager: GameManager,
	sockets: Map<string, WebSocket>,
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

	const state = room.startGame(player);

	if (state !== "IN_GAME") {
		return sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "Cannot start game" },
		});
	}

	const players = Array.from(room.getPlayers()).map((p) => ({
		id: p.id,
		username: p.username,
	}));

	const game = gameManager.createGame(room.id, players, questions[0]);

	broadcastRoomUpdate(room, sockets, game);
}
