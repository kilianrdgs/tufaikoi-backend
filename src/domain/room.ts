import WebSocket from "ws";
import type { ServerMessage } from "../types";
import type { Player } from "./player";

export class Room {
  public players = new Map<string, Player>();

  constructor(public id: string) {}

  addPlayer(player: Player) {
    if (this.players.has(player.id)) {
      throw new Error("Player already in room");
    }
    this.players.set(player.id, player);
    player.roomId = this.id;

    this.notifyRoomUpdate();
  }

  removePlayer(player: Player) {
    if (!this.players.has(player.id)) {
      throw new Error("Player not in room");
    }

    this.players.delete(player.id);
    player.roomId = null;

    this.notifyRoomUpdate();
  }

  getPlayersDTO() {
    return Array.from(this.players.values()).map((player) => ({
      id: player.id,
      username: player.username,
    }));
  }

  broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);

    for (const player of this.players.values()) {
      if (player.socket.readyState === WebSocket.OPEN) {
        console.log(`Sending message ${player.username}: ${data}`);
        player.socket.send(data);
      }
    }
  }

  private notifyRoomUpdate() {
    this.broadcast({
      type: "ROOM_UPDATE",
      payload: {
        players: this.getPlayersDTO(),
      },
    });
  }
}
