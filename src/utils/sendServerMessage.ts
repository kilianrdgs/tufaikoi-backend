import { WebSocket } from "ws";
import { ServerMessage } from "../types";

export default function sendServerMessage(
  socket: WebSocket,
  message: ServerMessage
) {
  socket.send(JSON.stringify(message));
}
