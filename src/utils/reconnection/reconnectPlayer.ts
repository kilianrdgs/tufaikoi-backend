import type { WebSocket } from "ws";
import type { GameManager } from "../../domain/gameManager";
import type { Player } from "../../domain/player";
import type { RoomManager } from "../../domain/roomManager";
import broadcastRoomUpdate from "../broadcastRoomUpdate";
import sendServerMessage from "../sendServerMessage";

export default function reconnectPlayer(
	playerId: string,
	socket: WebSocket,
	disconnectedPlayers: Map<string, { player: Player; timeout: NodeJS.Timeout }>,
	sockets: Map<string, WebSocket>,
	aliveStatus: Map<string, boolean>,
	roomManager: RoomManager,
	gameManager: GameManager,
): Player | null {
	const entry = disconnectedPlayers.get(playerId);
	if (!entry) {
		sendServerMessage(socket, {
			type: "ERROR",
			payload: { message: "No session to reconnect to" },
		});
		return null;
	}

	// Cancel grace period and restore socket
	clearTimeout(entry.timeout);
	disconnectedPlayers.delete(playerId);
	sockets.set(entry.player.id, socket);
	aliveStatus.set(entry.player.id, true);

	sendServerMessage(socket, {
		type: "CONNECTED",
		payload: { playerId: entry.player.id },
	});

	// Resend room state
	if (entry.player.roomId) {
		const room = roomManager.getRoom(entry.player.roomId);
		if (room) {
			const game = gameManager.getGame(room.id);
			broadcastRoomUpdate(room, sockets, game);
		}
	}

	return entry.player;
}
