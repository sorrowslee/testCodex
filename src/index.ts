import * as PIXI from 'pixi.js';
import { BjxbSlotGame } from './games/bjxb/BjxbSlotGame';
import { Lobby } from './Lobby';
import { AssetPaths } from './setting';

class SceneManager {
  private current: { destroy(): void; appInstance: PIXI.Application } | null = null;

  public showLobby(): void {
    this.cleanup();
    const lobby = new Lobby(id => this.startGame(id));
    this.current = lobby;
    lobby.start('game');
  }

  private startGame(id: string): void {
    this.cleanup();
    if (id === 'bjxb') {
      const game = new BjxbSlotGame();
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
