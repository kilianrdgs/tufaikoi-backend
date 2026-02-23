import { describe, expect, it } from "vitest";
import { playersTestList } from "../../types";
import { GameManager } from "../gameManager";

describe("GameManager", () => {
	describe("createGame", () => {
		it("Should create and store a game for a room", () => {
			const manager = new GameManager();

			const game = manager.createGame("1234", playersTestList, "question");

			expect(game).toBeDefined();
			expect(manager.getGame("1234")).toBe(game);
		});

		it("Throw if a game already exists for the room", () => {
			const manager = new GameManager();

			manager.createGame("1234", playersTestList, "question");

			expect(() =>
				manager.createGame("1234", playersTestList, "question"),
			).toThrow("Game already exists for this room");
		});
	});
	describe("getGame", () => {
		it("Should return undefined for unknown roomId", () => {
			const manager = new GameManager();

			expect(manager.getGame("unknown")).toBeUndefined();
		});
	});
	describe("removeGame", () => {
		it("Should remove a game", () => {
			const manager = new GameManager();

			manager.createGame("1234", playersTestList, "question");

			manager.removeGame("1234");

			expect(manager.getGame("1234")).toBeUndefined();
		});

		it("Should not throw when removing non-existing game", () => {
			const manager = new GameManager();

			expect(() => manager.removeGame("1234")).not.toThrow();
		});
	});
});
