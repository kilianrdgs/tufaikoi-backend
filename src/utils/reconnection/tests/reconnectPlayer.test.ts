import { describe, expect, it, vi } from "vitest";
import { GameManager } from "../../../domain/gameManager";
import { Player } from "../../../domain/player";
import { RoomManager } from "../../../domain/roomManager";
import reconnectPlayer from "../reconnectPlayer";

function createMockSocket() {
	return { send: vi.fn(), readyState: 1 } as unknown as import("ws").WebSocket;
}

describe("reconnectPlayer", () => {
	it("returns null and sends error if player is not in disconnectedPlayers", () => {
		const socket = createMockSocket();
		const disconnectedPlayers = new Map();
		const sockets = new Map();
		const aliveStatus = new Map();
		const roomManager = new RoomManager();
		const gameManager = new GameManager();

		const result = reconnectPlayer(
			"unknown-id",
			socket,
			disconnectedPlayers,
			sockets,
			aliveStatus,
			roomManager,
			gameManager,
		);

		expect(result).toBeNull();
		expect(socket.send).toHaveBeenCalledWith(
			JSON.stringify({
				type: "ERROR",
				payload: { message: "No session to reconnect to" },
			}),
		);
	});

	it("cancels grace period timer and restores player", () => {
		const socket = createMockSocket();
		const player = new Player("player-1", "Kilian");
		const timeout = setTimeout(() => {}, 30000);
		const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();
		disconnectedPlayers.set("player-1", { player, timeout });

		const sockets = new Map<string, import("ws").WebSocket>();
		const aliveStatus = new Map<string, boolean>();
		const roomManager = new RoomManager();
		const gameManager = new GameManager();

		const result = reconnectPlayer(
			"player-1",
			socket,
			disconnectedPlayers,
			sockets,
			aliveStatus,
			roomManager,
			gameManager,
		);

		expect(result).toBe(player);
		expect(disconnectedPlayers.has("player-1")).toBe(false);
		expect(sockets.get("player-1")).toBe(socket);
		expect(aliveStatus.get("player-1")).toBe(true);
		expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);

		expect(socket.send).toHaveBeenCalledWith(
			JSON.stringify({
				type: "CONNECTED",
				payload: { playerId: "player-1" },
			}),
		);

		clearTimeoutSpy.mockRestore();
		clearTimeout(timeout);
	});

	it("broadcasts room update when player was in a room", () => {
		const socket = createMockSocket();
		const player = new Player("player-1", "Kilian");
		const roomManager = new RoomManager();
		const gameManager = new GameManager();

		const room = roomManager.createRoom("room-1");

		if (!room) throw new Error("room should exist");

		room.addPlayer(player);

		const timeout = setTimeout(() => {}, 30000);
		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();
		disconnectedPlayers.set("player-1", { player, timeout });

		const sockets = new Map<string, import("ws").WebSocket>();
		sockets.set("player-1", socket);

		const aliveStatus = new Map<string, boolean>();

		reconnectPlayer(
			"player-1",
			socket,
			disconnectedPlayers,
			sockets,
			aliveStatus,
			roomManager,
			gameManager,
		);

		// socket.send is called twice: once for CONNECTED, once for ROOM_UPDATE broadcast
		expect(socket.send).toHaveBeenCalledTimes(2);

		const roomUpdateCall = JSON.parse(
			(socket.send as ReturnType<typeof vi.fn>).mock.calls[1][0],
		);
		expect(roomUpdateCall.type).toBe("ROOM_UPDATE");
		expect(roomUpdateCall.payload.roomId).toBe("room-1");
		expect(roomUpdateCall.payload.players).toEqual([
			{ id: "player-1", username: "Kilian" },
		]);

		clearTimeout(timeout);
	});
});
