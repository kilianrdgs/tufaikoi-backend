import { Room } from "./room";

export class RoomManager {
	private rooms = new Map<string, Room>();

	createRoom(roomId: string): Room | null {
		if (this.rooms.has(roomId)) {
			return null;
		}
		const room = new Room(roomId);
		this.rooms.set(roomId, room);
		return room;
	}

	getRoom(roomId: string): Room | undefined {
		return this.rooms.get(roomId);
	}

	removeRoomIfEmpty(room: Room) {
		if (room.isEmpty()) {
			this.rooms.delete(room.id);
		}
	}
}
