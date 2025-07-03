import * as PIXI from 'pixi.js';
import { AlpszmSlotGame } from './games/alpszm/AlpszmSlotGame';
import { Lobby } from './Lobby';
import { ResourceManager } from './base/ResourceManager';

class SceneManager {
  private current: { destroy(): void; appInstance: PIXI.Application } | null = null;

  public showLobby(): void {
    this.cleanup();
    const lobby = new Lobby(id => { void this.startGame(id); });
    this.current = lobby;
    lobby.start('game');
  }

  private async startGame(id: string): Promise<void> {
    this.cleanup();
    await ResourceManager.preloadGameImages(id);
    await ResourceManager.preloadDragonBones(id);

    if (id === 'alpszm') {
      const game = new AlpszmSlotGame();
      this.current = game;
      game.start('game');
    }
  }

  private cleanup(): void {
    if (this.current) {
      this.current.destroy();
      this.current = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const manager = new SceneManager();
  manager.showLobby();
});
