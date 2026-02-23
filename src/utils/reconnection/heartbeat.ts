import type { WebSocket } from "ws";

const HEARTBEAT_INTERVAL = 10000;

export default function startHeartbeat(
	sockets: Map<string, WebSocket>,
	aliveStatus: Map<string, boolean>,
) {
	return setInterval(() => {
		for (const [playerId, socket] of sockets) {
			if (aliveStatus.get(playerId) === false) {
				socket.terminate();
				continue;
			}
			aliveStatus.set(playerId, false);
			socket.ping();
		}
	}, HEARTBEAT_INTERVAL);
}
