import * as PIXI from 'pixi.js';
import { BaseSlotGame } from '../../base/BaseSlotGame';
import { PixiDragonBonesButton } from '../../base/PixiDragonBonesButton';
import { SpinButton } from '../../base/SpinButton';
import { AssetPaths, GameRuleSettings, AlpszmGameSettings } from '../../setting';

export class AlpszmSlotGame extends BaseSlotGame {
  private readonly customSymbols = [
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
  ];

  constructor(settings: GameRuleSettings = AlpszmGameSettings) {
    super(settings, AssetPaths.alpszm, this.customSymbols);
  }
  private hunter?: PIXI.AnimatedSprite;
  private hotSpinText!: PIXI.Text;
  private inHotSpin = false;
  private hotSpinsLeft = 0;
  private nextHotSpinScore = this.gameSettings.hotSpinThresholdMultiple;
  private normalSymbols = this.customSymbols;
  private hotSymbols = this.customSymbols.slice(
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
    const btn = new SpinButton(gameCode, `${gameCode}_a`, 'Anim_Btn_Spin', () => {
      this.spin(() => {
        if (btn) btn.reset();
        this.onSpinEnd();
      });
    });
    const layoutBtn = () => {
      if (bottomBg) {
        btn.x = bottomBg.width / 2 + 18;
        btn.y = bottomBg.y - bottomBg.height / 2 + 10;
      }
    };
    btn.on('loaded', layoutBtn);
    if (btn.width > 0) layoutBtn();
    return btn;
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

    const autoBtn = new PixiDragonBonesButton(
      'alpszm',
      'Btn_Spin/Get',
      'alpszm_a',
      'Anim_Btn_Auto'
    );
    autoBtn.name = 'alpszm_effect_auto';
    autoBtn.x = 560;
    autoBtn.y = 840;
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

