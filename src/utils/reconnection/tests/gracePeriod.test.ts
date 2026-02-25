import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameManager } from "../../../domain/gameManager";
import { Player } from "../../../domain/player";
import { RoomManager } from "../../../domain/roomManager";
import startGracePeriod from "../gracePeriod";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("startGracePeriod", () => {
	it("does nothing if player is not in a room", () => {
		const player = new Player("player-1", "Kilian");
		const disconnectedPlayers = new Map();
		const sockets = new Map();
		const roomManager = new RoomManager();
		const gameManager = new GameManager();

		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);

		expect(disconnectedPlayers.size).toBe(0);
	});

	it("adds player to disconnectedPlayers when in a room", () => {
		const player = new Player("player-1", "Kilian");
		const roomManager = new RoomManager();
		const gameManager = new GameManager();
		const room = roomManager.createRoom("room-1");

		if (!room) throw new Error("room should exist");

		room.addPlayer(player);

		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();
		const sockets = new Map();

		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);

		expect(disconnectedPlayers.has("player-1")).toBe(true);
	});

	it("removes player from room after grace period expires", () => {
		const player = new Player("player-1", "Kilian");
		const player2 = new Player("player-2", "Other");
		const roomManager = new RoomManager();
		const gameManager = new GameManager();
		const room = roomManager.createRoom("room-1");

		if (!room) throw new Error("room should exist");

		room.addPlayer(player);
		room.addPlayer(player2);

		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();
		const sockets = new Map();

		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);

		vi.advanceTimersByTime(30000);

		expect(disconnectedPlayers.has("player-1")).toBe(false);
		expect(player.roomId).toBeNull();
		expect(room.isEmpty()).toBe(false);
	});

	it("broadcasts room update immediately on disconnect", () => {
		const player = new Player("player-1", "Kilian");
		const player2 = new Player("player-2", "Other");
		const roomManager = new RoomManager();
		const gameManager = new GameManager();
		const room = roomManager.createRoom("room-1");

		if (!room) throw new Error("room should exist");

		room.addPlayer(player);
		room.addPlayer(player2);

		const mockSocket2 = {
			send: vi.fn(),
			readyState: 1,
		} as unknown as import("ws").WebSocket;

		const sockets = new Map<string, import("ws").WebSocket>();
		// player-1 socket already removed (like in index.ts close handler)
		sockets.set("player-2", mockSocket2);

		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();

		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);

		// player-2 should receive a ROOM_UPDATE immediately (before grace period expires)
		expect(mockSocket2.send).toHaveBeenCalledTimes(1);
		const message = JSON.parse(
			(mockSocket2.send as ReturnType<typeof vi.fn>).mock.calls[0][0],
		);
		expect(message.type).toBe("ROOM_UPDATE");
		expect(message.payload.players).toEqual([
			{ id: "player-1", username: "Kilian" },
			{ id: "player-2", username: "Other" },
		]);
	});

	it("removes room and game when last player disconnects after grace period", () => {
		const player = new Player("player-1", "Kilian");
		const roomManager = new RoomManager();
		const gameManager = new GameManager();
		const room = roomManager.createRoom("room-1");

		if (!room) throw new Error("room should exist");

		room.addPlayer(player);

		const disconnectedPlayers = new Map<
			string,
			{ player: Player; timeout: NodeJS.Timeout }
		>();
		const sockets = new Map();

		startGracePeriod(
			player,
			disconnectedPlayers,
			sockets,
			roomManager,
			gameManager,
		);

		vi.advanceTimersByTime(30000);

		expect(room.isEmpty()).toBe(true);
		expect(roomManager.getRoom("room-1")).toBeUndefined();
	});
});
