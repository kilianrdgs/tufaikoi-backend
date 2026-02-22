import crypto from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { GameManager } from "./domain/gameManager";
import { Player } from "./domain/player";
import { RoomManager } from "./domain/roomManager";
import handleMessage from "./messageHandler";
import broadcastRoomUpdate from "./utils/broadcastRoomUpdate";

// ------------------------------ Server Setup ------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server and WebSocket server
const server = createServer(app);
const ws = new WebSocketServer({ server });

// In-memory storage for rooms and player sockets
const roomManager = new RoomManager();
const gameManager = new GameManager();
const sockets = new Map<string, WebSocket>();
// ------------------------------------------------------------------

// Handle new WebSocket connections
ws.on("connection", (socket) => {
	const player = new Player(crypto.randomUUID(), "usertest");
	sockets.set(player.id, socket);

	// Listen for incoming messages from the client
	socket.on("message", (raw) => {
		handleMessage(raw, player, roomManager, gameManager, sockets);
	});
	// ------------------------------------------------------------------

	// Handle socket errors and disconnections
	socket.on("error", (error) => {
		console.error(`Socket error for player ${player.id}:`, error.message);
	});
	// ------------------------------------------------------------------

	// When a client disconnects, remove them from their room and clean up resources
	socket.on("close", () => {
		sockets.delete(player.id);

		if (player.roomId) {
			const room = roomManager.getRoom(player.roomId);
			if (room) {
				const game = gameManager.getGame(room.id);
				room.removePlayer(player);
				broadcastRoomUpdate(room, sockets, game);
				if (room.isEmpty()) {
					gameManager.removeGame(room.id);
					roomManager.removeRoomIfEmpty(room);
				}
			}
		}
	});
	// ------------------------------------------------------------------
});

// Basic HTTP route for testing
app.get("/", (_req, res) => {
	res.send("Hello, World!");
});

// Start the server
server.listen(PORT, () => {
	console.log(`---- Server is running on port: ${PORT} ----`);
});
// ------------------------------------------------------------------
