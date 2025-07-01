import * as PIXI from 'pixi.js';
import { BjxbSlotGame } from './games/bjxb/BjxbSlotGame';
import { FfpSlotGame } from './games/ffp/FfpSlotGame';
import { AlpszmSlotGame } from './games/alpszm/AlpszmSlotGame';
import { Lobby } from './Lobby';
import { AssetPaths } from './setting';
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

    if (id === 'bjxb') {
      const game = new BjxbSlotGame();
      this.current = game;
      game.start('game');
      this.addBackButton(game.appInstance);
    } else if (id === 'ffp') {
      const game = new FfpSlotGame();
      this.current = game;
      game.start('game');
      this.addBackButton(game.appInstance);
    } else if (id === 'alpszm') {
      const game = new AlpszmSlotGame();
      this.current = game;
      game.start('game');
      this.addBackButton(game.appInstance);
    }
  }

  private addBackButton(app: PIXI.Application): void {
    const btn = PIXI.Sprite.from(AssetPaths.lobby.backBtn);
    btn.interactive = true;
    btn.buttonMode = true;
    btn.x = 20;
    btn.y = 20;
    btn.on('pointertap', () => this.showLobby());
    app.stage.addChild(btn);
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
