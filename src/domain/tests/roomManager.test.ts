import { describe, expect, it } from "vitest";
import { Player } from "../player";
import { RoomManager } from "../roomManager";

describe("RoomManager", () => {
	describe("createRoom", () => {
		it("Creates a new room", () => {
			const manager = new RoomManager();

			const room = manager.createRoom("1234");

			expect(room).not.toBeNull();
			expect(manager.getRoom("1234")).toBe(room);
		});

		it("Returns null if room already exists", () => {
			const manager = new RoomManager();

			manager.createRoom("1234");
			const secondRoom = manager.createRoom("1234");

			expect(secondRoom).toBeNull();
		});
	});

	describe("removeRoomIfEmpty", () => {
		it("Removes room if empty", () => {
			const manager = new RoomManager();
			const room = manager.createRoom("1234");

			if (!room) throw new Error("room should exist");

			manager.removeRoomIfEmpty(room);

			expect(manager.getRoom("1234")).toBeUndefined();
		});

		it("Does not remove room if not empty", () => {
			const manager = new RoomManager();
			const room = manager.createRoom("1234");

			if (!room) throw new Error("room should exist");

			const player1 = new Player("player-1", "usertest");
			room.addPlayer(player1);
			manager.removeRoomIfEmpty(room);

			expect(manager.getRoom("1234")).toBeDefined();
		});
	});
});
