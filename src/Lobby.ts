import * as PIXI from 'pixi.js';
import { AssetPaths } from './setting';

// layout parameters for easy adjustments
const SCROLL_MARGIN = 400;          // horizontal margin for the scroll view
const SCROLL_Y = 0;               // vertical position of the scroll view
const VIEW_HEIGHT_OFFSET = 0;     // height = renderer.height - VIEW_HEIGHT_OFFSET

const ICON_COLUMNS = 2;             // how many icons per row
const ICON_SIZE = 300;              // width/height of each icon
const FIRST_ICON_Y_OFFSET = 50;     // offset for the first icon's y position
const ICON_ROW_EXTRA = 140;          // extra space between icon rows
const FIRST_ICON_X_RATIO = 0.6;     // starting x position as a ratio of column width
const ICON_X_DIFF_MULTIPLIER = 0.8;   // spacing multiplier between icons horizontally

export class Lobby {
  private app!: PIXI.Application;
  private scrollContainer!: PIXI.Container;
  private viewHeight = 0;

  constructor(private onGameSelected: (id: string) => void) {}

  public start(containerId: string = 'game'): void {
    this.app = new PIXI.Application({
      width: 1900,
      height: 1300,
      backgroundColor: 0x000000
    });
    const container = typeof containerId === 'string' ? document.getElementById(containerId)! : containerId;
    container.appendChild(this.app.view);

    const bg = PIXI.Sprite.from(AssetPaths.lobby.bg);
    const layoutBg = () => {
      const scale = Math.min(
        this.app.renderer.width / bg.texture.width,
        this.app.renderer.height / bg.texture.height,
        1
      );
      bg.anchor.set(0.5);
      bg.scale.set(scale);
      bg.x = this.app.renderer.width / 2;
      bg.y = this.app.renderer.height / 2;
      // ensure background stays behind scroll view
      this.app.stage.addChildAt(bg, 0);
    };
    if (bg.texture.baseTexture.valid) {
      layoutBg();
    } else {
      bg.texture.baseTexture.once('loaded', layoutBg);
    }

    const panelWidth = this.app.renderer.width - SCROLL_MARGIN * 2;
    this.viewHeight = this.app.renderer.height - VIEW_HEIGHT_OFFSET;

    const panel = new PIXI.Container();
    panel.x = SCROLL_MARGIN;
    panel.y = SCROLL_Y;
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
      { id: 'alpszm', name: '奧林帕斯', icon: AssetPaths.lobby.alpszm }
    ];

    const columns = ICON_COLUMNS;
    const iconSize = ICON_SIZE;
    const colWidth = panelWidth / columns;
    const rowHeight = iconSize + ICON_ROW_EXTRA;

    const firstIconX = colWidth * FIRST_ICON_X_RATIO;

    entries.forEach((entry, idx) => {
      const row = Math.floor(idx / columns);
      const col = idx % columns;

      const icon = PIXI.Sprite.from(entry.icon);
      icon.anchor.set(0.5);
      icon.width = iconSize;
      icon.height = iconSize;
      icon.x = firstIconX + col * colWidth * ICON_X_DIFF_MULTIPLIER;
      icon.y = row * rowHeight + iconSize / 2 + FIRST_ICON_Y_OFFSET;
      icon.interactive = true;
      icon.buttonMode = true;
      icon.on('pointerup', () => { if (!moved) this.onGameSelected(entry.id); });
      this.scrollContainer.addChild(icon);

      // 建立一個帶圓角的圖形遮罩
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawRoundedRect(0, 0, icon.width, icon.height, 20); // 20 是圓角半徑
      mask.endFill();
      // 位置與 icon 對齊
      mask.x = icon.x - icon.width / 2;
      mask.y = icon.y - icon.height / 2;
      this.scrollContainer.addChild(mask);
      icon.mask = mask;

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
    const contentHeight = rows * rowHeight + FIRST_ICON_Y_OFFSET;

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
      // Keep textures cached when destroying the lobby so returning to games
      // that share assets does not fail due to missing base textures
      this.app.destroy(true, { children: true });
    }
  }

  public get appInstance(): PIXI.Application {
    return this.app;
  }
}
