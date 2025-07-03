import * as PIXI from 'pixi.js';
import { ResourceManager } from './ResourceManager';

export interface DescriptionButtonTextures {
  normal: string;
  press: string;
}

export interface GameDescriptionConfig {
  /** game code for asset path */
  gameCode: string;
  /** file names of rules pages inside assets/<gameCode>/description */
  rulesPages: string[];
  /** file names of guide pages inside assets/<gameCode>/description */
  guidePages: string[];
  /** textures for rules button */
  rulesButton: DescriptionButtonTextures;
  /** textures for guide button */
  guideButton: DescriptionButtonTextures;
  /** textures for close button */
  closeButton: DescriptionButtonTextures;
  /** optional custom top background image path */
  topBg?: string;
}

export class GameDescription extends PIXI.Container {
  private readonly PAGE_WIDTH = 720;
  private readonly PAGE_HEIGHT = 1280;

  private rulesContainer: PIXI.Container;
  private guideContainer: PIXI.Container;
  private topBg: PIXI.Sprite;
  private rulesBtn: PIXI.Sprite;
  private guideBtn: PIXI.Sprite;
  private closeBtn: PIXI.Sprite;

  private activeContainer: PIXI.Container;
  private scrollPos = { rules: 0, guide: 0 };
  private dragging = false;
  private dragStartY = 0;
  private startContainerY = 0;

  constructor(private config: GameDescriptionConfig, onClose: () => void) {
    super();

    this.rulesContainer = this.createPageContainer(config.rulesPages);
    this.guideContainer = this.createPageContainer(config.guidePages);
    this.guideContainer.visible = false;
    this.addChild(this.rulesContainer);
    this.addChild(this.guideContainer);
    this.activeContainer = this.rulesContainer;

    const topPath =
      config.topBg ??
      `assets/${config.gameCode}/description/${config.gameCode}_game_description_top.jpg`;
    this.topBg = PIXI.Sprite.from(topPath);
    this.addChild(this.topBg);

    this.rulesBtn = new PIXI.Sprite(ResourceManager.getTexture(config.rulesButton.press));
    this.rulesBtn.anchor.set(0.5);
    this.rulesBtn.x = 220;
    this.rulesBtn.y = 105;
    this.rulesBtn.interactive = true;
    this.rulesBtn.buttonMode = true;
    this.rulesBtn.on('pointertap', () => this.showRules());
    this.addChild(this.rulesBtn);

    this.guideBtn = new PIXI.Sprite(ResourceManager.getTexture(config.guideButton.normal));
    this.guideBtn.anchor.set(0.5);
    this.guideBtn.x = 500;
    this.guideBtn.y = 105;
    this.guideBtn.interactive = true;
    this.guideBtn.buttonMode = true;
    this.guideBtn.on('pointertap', () => this.showGuide());
    this.addChild(this.guideBtn);

    this.closeBtn = new PIXI.Sprite(ResourceManager.getTexture(config.closeButton.normal));
    this.closeBtn.anchor.set(0.5);
    this.closeBtn.x = this.PAGE_WIDTH - this.closeBtn.width / 2 - 10;
    this.closeBtn.y = this.closeBtn.height / 2 + 10;
    this.closeBtn.interactive = true;
    this.closeBtn.buttonMode = true;
    this.closeBtn
      .on('pointerdown', () => {
        this.closeBtn.texture = ResourceManager.getTexture(config.closeButton.press);
      })
      .on('pointerup', () => {
        this.closeBtn.texture = ResourceManager.getTexture(config.closeButton.normal);
        onClose();
      })
      .on('pointerupoutside', () => {
        this.closeBtn.texture = ResourceManager.getTexture(config.closeButton.normal);
      });
    this.addChild(this.closeBtn);

    this.hitArea = new PIXI.Rectangle(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT);
    this.interactive = true;
    this.on('pointerdown', this.onDragStart, this);
    this.on('pointermove', this.onDragMove, this);
    this.on('pointerup', this.onDragEnd, this);
    this.on('pointerupoutside', this.onDragEnd, this);
  }

  private createPageContainer(pages: string[]): PIXI.Container {
    const container = new PIXI.Container();
    pages.forEach((p, i) => {
      const sprite = PIXI.Sprite.from(`assets/${this.config.gameCode}/description/${p}`);
      sprite.y = i * this.PAGE_HEIGHT;
      container.addChild(sprite);
    });
    return container;
  }

  private getMaxScroll(container: PIXI.Container): number {
    const totalHeight = container.children.length * this.PAGE_HEIGHT;
    return Math.max(0, totalHeight - this.PAGE_HEIGHT);
  }

  private onDragStart(e: PIXI.InteractionEvent): void {
    this.dragging = true;
    this.dragStartY = e.data.global.y;
    this.startContainerY = this.activeContainer.y;
  }

  private onDragMove(e: PIXI.InteractionEvent): void {
    if (!this.dragging) return;
    const dy = e.data.global.y - this.dragStartY;
    const max = this.getMaxScroll(this.activeContainer);
    let newY = this.startContainerY + dy;
    if (newY > 0) newY = 0;
    if (newY < -max) newY = -max;
    this.activeContainer.y = newY;
  }

  private onDragEnd(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const max = this.getMaxScroll(this.activeContainer);
    const current = -this.activeContainer.y;
    const index = Math.round(current / this.PAGE_HEIGHT);
    const y = -index * this.PAGE_HEIGHT;
    this.activeContainer.y = y;
    if (this.activeContainer === this.rulesContainer) {
      this.scrollPos.rules = y;
    } else {
      this.scrollPos.guide = y;
    }
  }

  private showRules(): void {
    if (this.activeContainer === this.rulesContainer) return;
    this.scrollPos.guide = this.activeContainer.y;
    this.activeContainer.visible = false;
    this.activeContainer = this.rulesContainer;
    this.activeContainer.visible = true;
    this.activeContainer.y = this.scrollPos.rules;
    this.rulesBtn.texture = ResourceManager.getTexture(this.config.rulesButton.press);
    this.guideBtn.texture = ResourceManager.getTexture(this.config.guideButton.normal);
  }

  private showGuide(): void {
    if (this.activeContainer === this.guideContainer) return;
    this.scrollPos.rules = this.activeContainer.y;
    this.activeContainer.visible = false;
    this.activeContainer = this.guideContainer;
    this.activeContainer.visible = true;
    this.activeContainer.y = this.scrollPos.guide;
    this.rulesBtn.texture = ResourceManager.getTexture(this.config.rulesButton.normal);
    this.guideBtn.texture = ResourceManager.getTexture(this.config.guideButton.press);
  }
}

