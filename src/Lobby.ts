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

    const bg = PIXI.Sprite.from(AssetPaths.lobby.bg);
    bg.width = this.app.renderer.width;
    bg.height = this.app.renderer.height;
    this.app.stage.addChild(bg);

    this.scrollContainer = new PIXI.Container();
    this.scrollContainer.x = 0;
    // position the scroll container a bit lower so icons are not flush with the top
    this.scrollContainer.y = 250;

    this.app.stage.addChild(this.scrollContainer);

    // variables used for drag and click detection
    let dragging = false;
    let moved = false;
    let startY = 0;

    const entries = [
      { id: 'bjxb', name: '雪山尋寶', icon: AssetPaths.lobby.bjxb }
    ];

    const itemSpacing = 250;
    // place entries slightly left/right of center
    const leftX = this.app.renderer.width * 0.4;
    const rightX = this.app.renderer.width * 0.6;
    entries.forEach((entry, idx) => {
      const yPos = idx * itemSpacing;
      const icon = PIXI.Sprite.from(entry.icon);
      icon.anchor.set(0.5);
      icon.x = idx % 2 === 0 ? leftX : rightX;
      icon.y = yPos;
      icon.interactive = true;
      icon.buttonMode = true;
      icon.on('pointerup', () => { if (!moved) this.onGameSelected(entry.id); });
      this.scrollContainer.addChild(icon);

      const labelStyle = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 48,
        fontWeight: 'bold',
        align: 'center'
      });
      const label = new PIXI.Text(entry.name, labelStyle);
      label.anchor.set(0.5, 0);
      label.x = icon.x;
      label.y = yPos + icon.height / 2 + 10;
      label.interactive = true;
      label.buttonMode = true;
      label.on('pointerup', () => { if (!moved) this.onGameSelected(entry.id); });
      this.scrollContainer.addChild(label);
    });

    // simple vertical dragging for scrollContainer with click detection
    this.scrollContainer.interactive = true;
    this.scrollContainer.on('pointerdown', (e: any) => {
      dragging = true;
      moved = false;
      startY = e.data.global.y - this.scrollContainer.y;
    });
    this.scrollContainer.on('pointermove', (e: any) => {
      if (dragging) {
        const newY = e.data.global.y - startY;
        if (Math.abs(newY - this.scrollContainer.y) > 5) {
          moved = true;
        }
        this.scrollContainer.y = newY;
      }
    });
    const stopDragging = () => {
      dragging = false;
    };
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
