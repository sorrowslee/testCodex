import * as PIXI from 'pixi.js';
import { BaseSlotGame } from '../../base/BaseSlotGame';
import { AssetPaths, GameRuleSettings, FfpGameSettings } from '../../setting';

export class FfpSlotGame extends BaseSlotGame {
  constructor(settings: GameRuleSettings = FfpGameSettings) {
    super(settings, AssetPaths.ffp);
  }
  private hunter!: PIXI.AnimatedSprite;
  private hotSpinText!: PIXI.Text;
  private inHotSpin = false;
  private hotSpinsLeft = 0;
  private nextHotSpinScore = this.gameSettings.hotSpinThresholdMultiple;
  // Symbols are referenced by number strings (e.g. '001')
  private normalSymbols = Array.from({ length: AssetPaths.ffp.symbolCount }, (_, i) =>
    (i + 1).toString().padStart(3, '0')
  );
  private hotSymbols = this.normalSymbols.slice(0, this.gameSettings.hotSpinSymbolTypeCount);

  protected getBackgroundPath(): string {
    return AssetPaths.ffp.bg;
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

    const hunterFrames: PIXI.Texture[] = [];
    for (let i = 1; i <= AssetPaths.ffp.animations.hunter; i++) {
      hunterFrames.push(
        PIXI.Texture.from(AssetPaths.ffp.animationFrame('hunter', i))
      );
    }
    this.hunter = new PIXI.AnimatedSprite(hunterFrames);
    this.hunter.animationSpeed = 0.1667;
    this.hunter.loop = true;
    this.hunter.anchor.set(0.5);
    this.hunter.scale.set(HUNTER_SCALE);
    this.hunter.x = this.gameContainer.x + GAME_WIDTH + HUNTER_X_OFFSET;
    this.hunter.y = this.gameContainer.y + this.SCORE_AREA_HEIGHT + HUNTER_Y_OFFSET +
      (this.rows * this.reelHeight) / 2;
    this.hunter.gotoAndStop(0);
    this.app.stage.addChild(this.hunter);

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
    this.checkHotSpin();
  }

  private startHotSpin() {
    this.hunter.play();
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
    this.hunter.gotoAndStop(0);
    this.inHotSpin = false;
    this.hotSpinText.visible = false;
    this.hotSpinText.text = '';
    this.currentSymbols = this.normalSymbols;
    this.populateReels(this.currentSymbols);
    this.button.interactive = true;
    this.button.alpha = 1;
    this.nextHotSpinScore =
      Math.floor(this.score / this.gameSettings.hotSpinThresholdMultiple) *
        this.gameSettings.hotSpinThresholdMultiple +
      this.gameSettings.hotSpinThresholdMultiple;
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
      if (this.score >= this.nextHotSpinScore) {
        this.startHotSpin();
      }
    }
  }
}

