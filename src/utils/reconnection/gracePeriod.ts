import type { WebSocket } from "ws";
import type { GameManager } from "../../domain/gameManager";
import type { Player } from "../../domain/player";
import type { RoomManager } from "../../domain/roomManager";
import broadcastRoomUpdate from "../broadcastRoomUpdate";

const GRACE_PERIOD = 30000;

export default function startGracePeriod(
	player: Player,
	disconnectedPlayers: Map<string, { player: Player; timeout: NodeJS.Timeout }>,
	sockets: Map<string, WebSocket>,
	roomManager: RoomManager,
	gameManager: GameManager,
) {
	const roomId = player.roomId;
	if (!roomId) return;

	const timeout = setTimeout(() => {
		disconnectedPlayers.delete(player.id);
		const room = roomManager.getRoom(roomId);
		if (room) {
			const game = gameManager.getGame(room.id);
			room.removePlayer(player);
			broadcastRoomUpdate(room, sockets, game);
			console.log(
				`Player ${player.id} removed from room ${room.id} after grace period`,
			);
			if (room.isEmpty()) {
				gameManager.removeGame(room.id);
				roomManager.removeRoomIfEmpty(room);
			}
		}
	}, GRACE_PERIOD);

	disconnectedPlayers.set(player.id, { player, timeout });
}
