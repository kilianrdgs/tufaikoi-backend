import { Player } from "./player";

export class Room {
  public players = new Map<string, Player>();

  constructor(public id: string) {}

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    player.roomId = this.id;
  }

  removePlayer(player: Player) {
    this.players.delete(player.id);
    player.roomId = null;
  }
}
