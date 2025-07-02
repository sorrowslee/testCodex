import * as PIXI from 'pixi.js';
import { BaseSlotGame } from '../../base/BaseSlotGame';
import { PixiDragonBonesButton } from '../../base/PixiDragonBonesButton';
import { PixiSpinButton } from '../../base/PixiSpinButton';
import { AlpszmSlotGameUISetting } from './AlpszmSlotGame_uiSetting';
import { AssetPaths, GameRuleSettings, AlpszmGameSettings } from '../../setting';

const SYMBOLS = [
  'alpszm_A',
  'alpszm_E',
  'alpszm_J',
  'alpszm_K',
  'alpszm_N',
  'alpszm_Q',
  'alpszm_SA',
  'alpszm_SB',
  'alpszm_SC',
  'alpszm_SD',
  'alpszm_T',
  'alpszm_W1',
  'alpszm_W2'
] as const;

export class AlpszmSlotGame extends BaseSlotGame {
  constructor(settings: GameRuleSettings = AlpszmGameSettings) {
    super(settings, AssetPaths.alpszm, [...SYMBOLS]);
  }
  private hunter?: PIXI.AnimatedSprite;
  private hotSpinText!: PIXI.Text;
  private inHotSpin = false;
  private hotSpinsLeft = 0;
  private nextHotSpinScore = this.gameSettings.hotSpinThresholdMultiple;
  private normalSymbols = [...SYMBOLS];
  private hotSymbols = SYMBOLS.slice(
    0,
    this.gameSettings.hotSpinSymbolTypeCount
  );

  protected getBackgroundPath(): string {
    return AssetPaths.alpszm.bg;
  }

  protected getInitialSymbols(): string[] {
    return this.normalSymbols;
  }

  protected createSpinButton(gameCode: string, bottomBg: PIXI.Sprite | null): PIXI.Container {
    const btn = new PixiSpinButton(gameCode, `${gameCode}_a`, 'Anim_Btn_Spin', () => {
      this.spin(() => {
        if (btn) btn.reset();
        this.onSpinEnd();
      });
    });
    const layoutBtn = () => {
      if (bottomBg) {
        btn.scale.set(AlpszmSlotGameUISetting.spinButton.scale);
        btn.x = bottomBg.width / 2 + AlpszmSlotGameUISetting.spinButton.offsetX;
        btn.y = bottomBg.y - bottomBg.height / 2 + AlpszmSlotGameUISetting.spinButton.offsetY;
      }
    };
    btn.on('loaded', layoutBtn);
    if (btn.width > 0) layoutBtn();
    return btn;
  }

  protected initUIs(
    gameCode: string,
    topBg: PIXI.Sprite | null,
    midBg: PIXI.Sprite | null,
    bottomBg: PIXI.Sprite | null
  ): void {
    super.initUIs(gameCode, topBg, midBg, bottomBg);

    const GAME_WIDTH = this.cols * this.cellWidth;
    const HUNTER_SCALE = AlpszmSlotGameUISetting.hunter.scale;
    const HUNTER_X_OFFSET = AlpszmSlotGameUISetting.hunter.xOffset;
    const HUNTER_Y_OFFSET = this.SCORE_AREA_HEIGHT + AlpszmSlotGameUISetting.hunter.yOffset;

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
        (this.rows * this.cellHeight) / 2;
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
    this.hotSpinText.x = AlpszmSlotGameUISetting.hotSpinText.x;
    this.hotSpinText.y = AlpszmSlotGameUISetting.hotSpinText.y;
    this.hotSpinText.visible = false;
    this.gameContainer.addChild(this.hotSpinText);

    const autoBtn = new PixiDragonBonesButton(
      'alpszm',
      'Btn_Spin/Get',
      'alpszm_a',
      'Anim_Btn_Auto'
    );
    autoBtn.name = 'alpszm_effect_auto';
    autoBtn.scale.set(AlpszmSlotGameUISetting.autoButton.scale);
    autoBtn.x = AlpszmSlotGameUISetting.autoButton.x;
    autoBtn.y = AlpszmSlotGameUISetting.autoButton.y;
    autoBtn.play();
    this.gameContainer.addChild(autoBtn);
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
    const btn = this.button as any;
    if (typeof btn.reset === 'function') {
      btn.reset();
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

