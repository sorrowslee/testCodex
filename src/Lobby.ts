import * as PIXI from 'pixi.js';
import { AssetPaths } from './setting';

export class Lobby {
  private app!: PIXI.Application;
  private scrollContainer!: PIXI.Container;
  private viewHeight = 0;

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

    const margin = 150;
    const panelWidth = this.app.renderer.width - margin * 2;
    this.viewHeight = this.app.renderer.height - 400;

    const panel = new PIXI.Container();
    panel.x = margin;
    panel.y = 200;
    this.app.stage.addChild(panel);

    const bgPanel = new PIXI.Graphics();
    bgPanel.beginFill(0x000000, 0.5);
    bgPanel.drawRoundedRect(0, 0, panelWidth, this.viewHeight, 20);
    bgPanel.endFill();
    const DSF = (PIXI.filters as any).DropShadowFilter;
    if (DSF) {
      bgPanel.filters = [new DSF({
        distance: 4,
        blur: 4,
        alpha: 0.7,
        color: 0x000000
      })];
    }
    panel.addChild(bgPanel);

    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(0, 0, panelWidth, this.viewHeight, 20);
    mask.endFill();
    panel.addChild(mask);

    this.scrollContainer = new PIXI.Container();
    this.scrollContainer.mask = mask;
    panel.addChild(this.scrollContainer);

    // variables used for drag and click detection
    let dragging = false;
    let moved = false;
    let startY = 0;

    const entries = [
      { id: 'bjxb', name: '雪山尋寶', icon: AssetPaths.lobby.bjxb }
    ];

    const columns = 2;
    const iconSize = 170;
    const colWidth = panelWidth / columns;
    const rowHeight = iconSize + 60;

    entries.forEach((entry, idx) => {
      const row = Math.floor(idx / columns);
      const col = idx % columns;

      const icon = PIXI.Sprite.from(entry.icon);
      icon.anchor.set(0.5);
      icon.width = iconSize;
      icon.height = iconSize;
      icon.x = colWidth * col + colWidth / 2;
      icon.y = row * rowHeight + iconSize / 2 + 20;
      icon.interactive = true;
      icon.buttonMode = true;
      icon.on('pointerup', () => { if (!moved) this.onGameSelected(entry.id); });
      this.scrollContainer.addChild(icon);

      const labelStyle = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 36,
        fontWeight: 'bold',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4
      });
      const label = new PIXI.Text(entry.name, labelStyle);
      label.anchor.set(0.5, 0);
      label.x = icon.x;
      label.y = icon.y + icon.height / 2 + 10;
      label.interactive = true;
      label.buttonMode = true;
      label.on('pointerup', () => { if (!moved) this.onGameSelected(entry.id); });
      this.scrollContainer.addChild(label);
    });

    const rows = Math.ceil(entries.length / columns);
    const contentHeight = rows * rowHeight + 20;

    // simple vertical dragging for scrollContainer with click detection
    const minY = Math.min(this.viewHeight - contentHeight, 0);

    const animateTo = (target: number) => {
      const startPos = this.scrollContainer.y;
      const delta = target - startPos;
      const duration = 500;
      const startTime = Date.now();
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this.scrollContainer.y = startPos + delta * easeOutBack(progress);
        if (progress === 1) {
          ticker.stop();
          ticker.destroy();
        }
      });
      ticker.start();
    };

    const applyBounds = () => {
      if (this.scrollContainer.y > 0) {
        animateTo(0);
      } else if (this.scrollContainer.y < minY) {
        animateTo(minY);
      }
    };

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
      if (dragging) {
        dragging = false;
        applyBounds();
      }
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
