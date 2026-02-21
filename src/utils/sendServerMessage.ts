import type { WebSocket } from "ws";
import type { ServerMessage } from "../types";

export default function sendServerMessage(
	socket: WebSocket,
	message: ServerMessage,
) {
	socket.send(JSON.stringify(message));
}
