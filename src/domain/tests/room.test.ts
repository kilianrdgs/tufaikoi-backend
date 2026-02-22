import { describe, expect, it } from "vitest";
import { Player } from "../player";
import { Room } from "../room";

describe("Room", () => {
	describe("addPlayer", () => {
		it("Assign first player as host", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");

			room.addPlayer(player1);

			expect(room.getHostId()).toBe("player-1");
			expect(player1.roomId).toBe("1234");
		});

		it("Does not change host when second player joins", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			expect(room.getHostId()).toBe("player-1");
		});

		it("Throws error if room is not in WAITING state", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			const player3 = new Player("player-3", "usertest3");

			room.addPlayer(player1);
			room.addPlayer(player2);
			room.startGame(player1);

			expect(() => room.addPlayer(player3)).toThrow("Room is locked");
		});

		it("Throws error if player already in room", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");

			room.addPlayer(player1);

			expect(() => room.addPlayer(player1)).toThrow("Player already in room");
		});
	});
	describe("removePlayer", () => {
		it("Does nothing if player not in room", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");

			room.removePlayer(player1);

			expect(room.getHostId()).toBeNull();
		});

		it("Removes non-host player correctly", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			room.removePlayer(player2);

			expect(room.getHostId()).toBe("player-1");
			expect(player2.roomId).toBeNull();
		});

		it("Reassigns host when current host leaves", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			room.removePlayer(player1);

			expect(room.getHostId()).toBe("player-2");
			expect(player1.roomId).toBeNull();
		});

		it("Sets host to null when last player leaves", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");

			room.addPlayer(player1);

			room.removePlayer(player1);

			expect(room.getHostId()).toBeNull();
			expect(room.isEmpty()).toBe(true);
		});
	});
	describe("startGame", () => {
		it("Starts game when host and at least 2 players", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			room.startGame(player1);

			expect(room.getState()).toBe("PLAYING");
		});

		it("throws if non-host tries to start", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			expect(() => room.startGame(player2)).toThrow(
				"Only host can start the game",
			);
		});

		it("Throws if less than 2 players", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");

			room.addPlayer(player1);

			expect(() => room.startGame(player1)).toThrow("not enough players");
		});

		it("throws if state is not WAITING", () => {
			const room = new Room("1234");
			const player1 = new Player("player-1", "usertest");
			const player2 = new Player("player-2", "usertest2");

			room.addPlayer(player1);
			room.addPlayer(player2);

			room.startGame(player1);

			expect(() => room.startGame(player1)).toThrow("Invalid state transition");
		});
	});
});
