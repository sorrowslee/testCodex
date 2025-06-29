import * as PIXI from 'pixi.js';
import { BaseSlotGame } from '../../base/BaseSlotGame';
import { AssetPaths, BjxbGameSettings, GameRuleSettings } from '../../setting';

export class BjxbSlotGame extends BaseSlotGame {
  constructor(settings: GameRuleSettings = BjxbGameSettings) {
    super(settings, AssetPaths.bjxb);
  }
  private hunter?: PIXI.AnimatedSprite;
  private hotSpinText!: PIXI.Text;
  private inHotSpin = false;
  private hotSpinsLeft = 0;
  private nextHotSpinScore = this.gameSettings.hotSpinThresholdMultiple;
  // Symbols are referenced by number strings (e.g. '001')
  private normalSymbols = Array.from({ length: AssetPaths.bjxb.symbolCount }, (_, i) =>
    (i + 1).toString().padStart(3, '0')
  );
  private hotSymbols = this.normalSymbols.slice(0, this.gameSettings.hotSpinSymbolTypeCount);

  protected getBackgroundPath(): string {
    return AssetPaths.bjxb.bg;
  }

  protected getInitialSymbols(): string[] {
    return this.normalSymbols;
  }

  public start(containerId: string = 'game'): void {
    super.start(containerId);
    const GAME_WIDTH = this.cols * this.reelWidth;
    const HUNTER_SCALE = 1;
    const HUNTER_X_OFFSET = 250;
    const HUNTER_Y_OFFSET = this.SCORE_AREA_HEIGHT + 190;

    if (this.assets.animations?.hunter) {
      const hunterFrames: PIXI.Texture[] = [];
      for (let i = 1; i <= this.assets.animations.hunter; i++) {
        hunterFrames.push(
          PIXI.Texture.from(this.assets.animationFrame('hunter', i))
        );
      }
      this.hunter = new PIXI.AnimatedSprite(hunterFrames);
      this.hunter.animationSpeed = 0.1667;
      this.hunter.loop = true;
      this.hunter.anchor.set(0.5);
      this.hunter.scale.set(HUNTER_SCALE);
      this.hunter.x = this.gameContainer.x + GAME_WIDTH + HUNTER_X_OFFSET;
      this.hunter.y =
        this.gameContainer.y + this.SCORE_AREA_HEIGHT + HUNTER_Y_OFFSET +
        (this.rows * this.reelHeight) / 2;
      this.hunter.gotoAndStop(0);
      this.app.stage.addChild(this.hunter);
    }

    this.hotSpinText = new PIXI.Text('', {
      fill: 0xff0000,
      fontSize: 48,
      fontWeight: 'bold',
      stroke: 0x333333,
      strokeThickness: 6
    });
    this.hotSpinText.x = 20;
    this.hotSpinText.y = 20;
    this.hotSpinText.visible = false;
    this.gameContainer.addChild(this.hotSpinText);
  }

  protected onSpinEnd(): void {
    if (this.mapShipEndTriggered) {
      this.mapShipEndTriggered = false;
      this.startHotSpin();
    } else {
      this.checkHotSpin();
    }
  }


  protected startHotSpin() {
    if (this.hunter) {
      this.hunter.play();
    }
    this.inHotSpin = true;
    this.hotSpinsLeft = 3;
    this.hotSpinText.visible = true;
    this.hotSpinText.text = `Hot Spin!! ${this.hotSpinsLeft}`;
    this.button.interactive = false;
    this.button.alpha = 0.5;
    this.currentSymbols = this.hotSymbols;
    this.populateReels(this.currentSymbols);
    this.spin(() => {
      this.hotSpinsLeft--;
      if (this.hotSpinsLeft > 0) {
        this.hotSpinText.text = `Hot Spin!! ${this.hotSpinsLeft}`;
      }
      this.checkHotSpin();
    });
  }

  private endHotSpin() {
    if (this.hunter) {
      this.hunter.gotoAndStop(0);
    }
    this.inHotSpin = false;
    this.hotSpinText.visible = false;
    this.hotSpinText.text = '';
    this.currentSymbols = this.normalSymbols;
    this.populateReels(this.currentSymbols);
    this.button.interactive = true;
    this.button.alpha = 1;
    if ((this.button as any).reset) {
      (this.button as any).reset();
    }
    this.nextHotSpinScore =
      Math.floor(this.score / this.gameSettings.hotSpinThresholdMultiple) *
        this.gameSettings.hotSpinThresholdMultiple +
      this.gameSettings.hotSpinThresholdMultiple;
    if (this.mapShip) {
      this.mapShip.reset();
    }
  }

  private checkHotSpin() {
    if (this.inHotSpin) {
      if (this.hotSpinsLeft > 0) {
        this.spin(() => {
          this.hotSpinsLeft--;
          if (this.hotSpinsLeft > 0) {
            this.hotSpinText.text = `Hot Spin!! ${this.hotSpinsLeft}`;
          }
          this.checkHotSpin();
        });
      } else {
        this.endHotSpin();
      }
    } else {
      if (!this.gameSettings.mapShip && this.score >= this.nextHotSpinScore) {
        this.startHotSpin();
      }
    }
  }
}

