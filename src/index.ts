import "dotenv/config";
import crypto from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { GameManager } from "./domain/gameManager";
import { Player } from "./domain/player";
import { RoomManager } from "./domain/roomManager";
import handleMessage from "./messageHandler";
import startGracePeriod from "./utils/reconnection/gracePeriod";
import startHeartbeat from "./utils/reconnection/heartbeat";
import reconnectPlayer from "./utils/reconnection/reconnectPlayer";
import sendServerMessage from "./utils/sendServerMessage";

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
const aliveStatus = new Map<string, boolean>();
const disconnectedPlayers = new Map<
	string,
	{ player: Player; timeout: NodeJS.Timeout }
>();
// ------------------------------------------------------------------

// Handle new WebSocket connections
ws.on("connection", (socket) => {
	let player = new Player(crypto.randomUUID());
	sockets.set(player.id, socket);
	aliveStatus.set(player.id, true);

	sendServerMessage(socket, {
		type: "CONNECTED",
		payload: { playerId: player.id },
	});

	socket.on("pong", () => {
		aliveStatus.set(player.id, true);
	});

	// Listen for incoming messages from the client
	socket.on("message", (raw) => {
		const message = JSON.parse(raw.toString());

		if (message.type === "RECONNECT") {
			const result = reconnectPlayer(
				message.payload.playerId,
				socket,
				disconnectedPlayers,
				sockets,
				aliveStatus,
				roomManager,
				gameManager,
			);
			if (result) {
				sockets.delete(player.id);
				aliveStatus.delete(player.id);
				player = result;
			}
			return;
		}

		handleMessage(raw, player, roomManager, gameManager, sockets);
	});
	// ------------------------------------------------------------------

	// Handle socket errors and disconnections
	socket.on("error", (error) => {
		console.error(`Socket error for player ${player.id}:`, error.message);
	});
	// ------------------------------------------------------------------

	// When a client disconnects, start grace period before removing from room
	socket.on("close", () => {
		sockets.delete(player.id);
		aliveStatus.delete(player.id);
		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);
	});
	// ------------------------------------------------------------------
});

// HEARTBEAT - detect dead connections
const heartbeat = startHeartbeat(sockets, aliveStatus);

ws.on("close", () => {
	clearInterval(heartbeat);
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
