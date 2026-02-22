import WebSocket from "ws";
import type { Room } from "../domain/room";

export default function broadcastRoomUpdate(
	room: Room,
	sockets: Map<string, WebSocket>,
) {
	const data = JSON.stringify({
		type: "ROOM_UPDATE",
		payload: {
			roomId: room.id,
			hostId: room.getHostId(),
			players: room.getPlayersDTO(),
			game: {
				state: room.getState(),
			},
		},
	});

	for (const player of room.getPlayers()) {
		const socket = sockets.get(player.id);
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(data);
		}
	}
}
