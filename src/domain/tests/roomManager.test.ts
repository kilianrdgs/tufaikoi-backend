import { describe, expect, it } from "vitest";
import { Room } from "../room";
import { RoomManager } from "../roomManager";
import { Player } from "../player";

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

    it("Removes room if empty", () => {
      const manager = new RoomManager();

      const room = manager.createRoom("1234");

      manager.removeRoomIfEmpty(room!);

      expect(manager.getRoom("1234")).toBeUndefined();
    });

    it("Does not remove room if not empty", () => {
      const manager = new RoomManager();
      const room = manager.createRoom("1234");
      const player1 = new Player("player-1", "usertest");

      room!.addPlayer(player1);
      manager.removeRoomIfEmpty(room!);

      expect(manager.getRoom("1234")).toBeDefined();
    });
  });
});
