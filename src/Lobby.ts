import * as PIXI from 'pixi.js';
import { AssetPaths } from './setting';

export class Lobby {
  private app!: PIXI.Application;
  private scrollContainer!: PIXI.Container;

  constructor(private onGameSelected: (id: string) => void) {}

  public start(containerId: string = 'game'): void {
    this.app = new PIXI.Application({
      width: 1882,
      height: 1075,
      backgroundColor: 0x000000
    });
    const container = typeof containerId === 'string' ? document.getElementById(containerId)! : containerId;
    container.appendChild(this.app.view);

    const title = new PIXI.Text('Lobby', {
      fill: 0xffffff,
      fontSize: 48,
      fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.position.set(this.app.renderer.width / 2, 60);
    this.app.stage.addChild(title);

    this.scrollContainer = new PIXI.Container();
    this.scrollContainer.x = this.app.renderer.width / 2;
    this.scrollContainer.y = 150;
    this.app.stage.addChild(this.scrollContainer);

    const entries = [
      { id: 'bjxb', name: '雪山尋寶', icon: AssetPaths.lobby.bjxb }
    ];

    const itemSpacing = 220;
    entries.forEach((entry, idx) => {
      const yPos = idx * itemSpacing;
      const icon = PIXI.Sprite.from(entry.icon);
      icon.anchor.set(0.5);
      icon.y = yPos;
      icon.interactive = true;
      icon.buttonMode = true;
      icon.on('pointertap', () => this.onGameSelected(entry.id));
      this.scrollContainer.addChild(icon);

      const label = new PIXI.Text(entry.name, { fill: 0xffffff, fontSize: 36 });
      label.anchor.set(0.5, 0);
      label.position.set(0, yPos + icon.height / 2 + 10);
      label.interactive = true;
      label.buttonMode = true;
      label.on('pointertap', () => this.onGameSelected(entry.id));
      this.scrollContainer.addChild(label);
    });

    // simple vertical dragging for scrollContainer
    let dragging = false;
    let startY = 0;
    this.scrollContainer.interactive = true;
    this.scrollContainer.on('pointerdown', e => {
      dragging = true;
      startY = e.data.global.y - this.scrollContainer.y;
    });
    this.scrollContainer.on('pointermove', e => {
      if (dragging) {
        this.scrollContainer.y = e.data.global.y - startY;
      }
    });
    const stopDragging = () => { dragging = false; };
    this.scrollContainer.on('pointerup', stopDragging);
    this.scrollContainer.on('pointerupoutside', stopDragging);
  }

  public destroy(): void {
    if (this.app) {
      const parent = this.app.view.parentNode;
      if (parent) parent.removeChild(this.app.view);
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
  }

  public get appInstance(): PIXI.Application {
    return this.app;
  }
}
