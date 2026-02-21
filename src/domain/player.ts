import type { WebSocket } from "ws";

export class Player {
	constructor(
		public id: string,
		public socket: WebSocket,
		public username: string,
		public roomId: string | null = null,
	) {}
}
