import WebSocket from "ws";
import type { Game } from "../domain/game";
import type { Room } from "../domain/room";

export default function broadcastRoomUpdate(
	room: Room,
	sockets: Map<string, WebSocket>,
	game?: Game,
) {
	const data = JSON.stringify({
		type: "ROOM_UPDATE",
		payload: {
			roomId: room.id,
			hostId: room.getHostId(),
			players: room.getPlayersDTO(),
			state: room.getState(),
			game: game ? game.getDTO() : null,
		},
	});

	for (const player of room.getPlayers()) {
		const socket = sockets.get(player.id);
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(data);
		}
	}
}
