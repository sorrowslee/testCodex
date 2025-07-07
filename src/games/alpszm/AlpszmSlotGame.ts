import * as PIXI from 'pixi.js';
import { BaseSlotGame } from '../../base/BaseSlotGame';
import { PixiDragonBonesButton } from '../../base/PixiDragonBonesButton';
import { PixiSpinButton } from '../../base/PixiSpinButton';
import { AlpszmSlotGameUISetting } from './AlpszmSlotGame_uiSetting';
import { AssetPaths, GameRuleSettings, AlpszmGameSettings } from '../../setting';
import { ResourceManager } from '../../base/ResourceManager';
import { GameDescription, GameDescriptionConfig } from '../../base/GameDescription';
import { SlotLineMgr } from '../../base/PixiSlotLineMgr';

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

const RULES_PAGES = [
  'alpszm_game_description_rules_page1.jpg',
  'alpszm_game_description_rules_page2.jpg',
  'alpszm_game_description_rules_page3.jpg',
  'alpszm_game_description_rules_page4.jpg'
];

const GUIDE_PAGES = [
  'alpszm_game_description_guide_page1.jpg',
  'alpszm_game_description_guide_page2.jpg',
  'alpszm_game_description_guide_page3.jpg'
];

const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [0, 2, 2, 1, 0],
  [2, 0, 0, 1, 2],
  [1, 0, 2, 0, 1]
];

const DESCRIPTION_CONFIG: GameDescriptionConfig = {
  gameCode: 'alpszm',
  rulesPages: RULES_PAGES,
  guidePages: GUIDE_PAGES,
  rulesButton: {
    normal: 'alpszm_game_description_rules_button_normal',
    press: 'alpszm_game_description_rules_button_press'
  },
  guideButton: {
    normal: 'alpszm_game_description_guide_button_normal',
    press: 'alpszm_game_description_guide_button_press'
  },
  closeButton: {
    normal: 'alpszm_game_description_close_button_normal',
    press: 'alpszm_game_description_close_button_press'
  }
};

export class AlpszmSlotGame extends BaseSlotGame {
  constructor(settings: GameRuleSettings = AlpszmGameSettings) {
    super(settings, AssetPaths.alpszm, [...SYMBOLS]);
    this.useTextureBlur = true;
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
  private autoBtn!: PixiDragonBonesButton;
  private autoMode = false;
  private betMaxBtn!: PIXI.Sprite;
  private menuBtn!: PIXI.Sprite;
  private menuPanel!: PIXI.Container;
  private infoBtn!: PIXI.Sprite;
  private effectBtn!: PIXI.Sprite;
  private musicBtn!: PIXI.Sprite;
  private exitBtn!: PIXI.Sprite;
  private descriptionView?: GameDescription;
  private effectOn = true;
  private musicOn = true;

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

    this.autoBtn = new PixiDragonBonesButton(
      'alpszm',
      'alpszm_hang_up_button_normal',
      ['alpszm_hang_up_icon_normal'],
      'alpszm_a',
      'Anim_Btn_Auto'
    );
    this.autoBtn.name = 'alpszm_effect_auto';
    this.autoBtn.scale.set(AlpszmSlotGameUISetting.autoButton.scale);
    this.autoBtn.x = AlpszmSlotGameUISetting.autoButton.x;
    this.autoBtn.y = AlpszmSlotGameUISetting.autoButton.y;
    this.autoBtn.interactive = true;
    this.autoBtn.buttonMode = true;
    this.autoBtn.on('pointerdown', () => this.toggleAutoMode());
    this.autoBtn.stop();
    this.gameContainer.addChild(this.autoBtn);

    this.betMaxBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_bet_max_button_normal')
    );
    this.betMaxBtn.anchor.set(0.5);
    this.betMaxBtn.scale.set(AlpszmSlotGameUISetting.betMaxButton.scale);
    this.betMaxBtn.x = AlpszmSlotGameUISetting.betMaxButton.x;
    this.betMaxBtn.y = AlpszmSlotGameUISetting.betMaxButton.y;
    this.betMaxBtn.interactive = true;
    this.betMaxBtn.buttonMode = true;
    this.betMaxBtn.on('pointerdown', () => {
      this.betMaxBtn.texture = ResourceManager.getTexture(
        'alpszm_bet_max_button_press'
      );
    });
    const resetBetMaxTexture = () => {
      this.betMaxBtn.texture = ResourceManager.getTexture(
        'alpszm_bet_max_button_normal'
      );
    };
    this.betMaxBtn.on('pointerup', () => {
      resetBetMaxTexture();
      this.onBetMax();
    });
    this.betMaxBtn.on('pointerupoutside', resetBetMaxTexture);
    this.gameContainer.addChild(this.betMaxBtn);

    // menu button
    this.menuBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_normal')
    );
    this.menuBtn.anchor.set(0.5);
    this.menuBtn.scale.set(AlpszmSlotGameUISetting.menuButton.scale);
    this.menuBtn.x = AlpszmSlotGameUISetting.menuButton.x;
    this.menuBtn.y = AlpszmSlotGameUISetting.menuButton.y;
    this.menuBtn.interactive = true;
    this.menuBtn.buttonMode = true;
    this.menuBtn.on('pointerdown', () => {
      this.menuBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_press'
      );
    });
    const resetMenuTex = () => {
      this.menuBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_normal'
      );
    };
    this.menuBtn.on('pointerup', () => {
      resetMenuTex();
      this.toggleMenu();
    });
    this.menuBtn.on('pointerupoutside', resetMenuTex);
    this.gameContainer.addChild(this.menuBtn);

    // menu panel setup
    this.menuPanel = new PIXI.Container();
    const panelBg = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_bg')
    );
    panelBg.anchor.set(0.5);
    this.menuPanel.addChild(panelBg);
    this.menuPanel.x = AlpszmSlotGameUISetting.menuPanel.x;
    this.menuPanel.y = AlpszmSlotGameUISetting.menuPanel.y;
    this.menuPanel.visible = false;
    this.gameContainer.addChild(this.menuPanel);

    // info button
    this.infoBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_panel_gameinfo_button_normal')
    );
    this.infoBtn.anchor.set(0.5);
    this.infoBtn.position.set(
      AlpszmSlotGameUISetting.infoButton.x,
      AlpszmSlotGameUISetting.infoButton.y
    );
    this.infoBtn.interactive = true;
    this.infoBtn.buttonMode = true;
    this.infoBtn.on('pointerdown', () => {
      this.infoBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_panel_gameinfo_button_press'
      );
    });
    const resetInfoTex = () => {
      this.infoBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_panel_gameinfo_button_normal'
      );
    };
    this.infoBtn.on('pointerup', () => {
      resetInfoTex();
      this.onInfoPressed();
    });
    this.infoBtn.on('pointerupoutside', resetInfoTex);
    this.menuPanel.addChild(this.infoBtn);

    // effect button
    this.effectBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_panel_effect_button_on')
    );
    this.effectBtn.anchor.set(0.5);
    this.effectBtn.position.set(
      AlpszmSlotGameUISetting.effectButton.x,
      AlpszmSlotGameUISetting.effectButton.y
    );
    this.effectBtn.interactive = true;
    this.effectBtn.buttonMode = true;
    this.effectBtn.on('pointerup', () => {
      this.effectOn = !this.effectOn;
      this.effectBtn.texture = ResourceManager.getTexture(
        this.effectOn
          ? 'alpszm_system_menu_panel_effect_button_on'
          : 'alpszm_system_menu_panel_effect_button_off'
      );
      this.onEffectToggle(this.effectOn);
    });
    this.menuPanel.addChild(this.effectBtn);

    // music button
    this.musicBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_panel_music_button_on')
    );
    this.musicBtn.anchor.set(0.5);
    this.musicBtn.position.set(
      AlpszmSlotGameUISetting.musicButton.x,
      AlpszmSlotGameUISetting.musicButton.y
    );
    this.musicBtn.interactive = true;
    this.musicBtn.buttonMode = true;
    this.musicBtn.on('pointerup', () => {
      this.musicOn = !this.musicOn;
      this.musicBtn.texture = ResourceManager.getTexture(
        this.musicOn
          ? 'alpszm_system_menu_panel_music_button_on'
          : 'alpszm_system_menu_panel_music_button_off'
      );
      this.onMusicToggle(this.musicOn);
    });
    this.menuPanel.addChild(this.musicBtn);

    // exit button
    this.exitBtn = new PIXI.Sprite(
      ResourceManager.getTexture('alpszm_system_menu_panel_exit_button_normal')
    );
    this.exitBtn.anchor.set(0.5);
    this.exitBtn.position.set(
      AlpszmSlotGameUISetting.exitButton.x,
      AlpszmSlotGameUISetting.exitButton.y
    );
    this.exitBtn.interactive = true;
    this.exitBtn.buttonMode = true;
    this.exitBtn.on('pointerdown', () => {
      this.exitBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_panel_exit_button_press'
      );
    });
    const resetExitTex = () => {
      this.exitBtn.texture = ResourceManager.getTexture(
        'alpszm_system_menu_panel_exit_button_normal'
      );
    };
    this.exitBtn.on('pointerup', () => {
      resetExitTex();
      this.onExit();
    });
    this.exitBtn.on('pointerupoutside', resetExitTex);
    this.menuPanel.addChild(this.exitBtn);
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
    this.checkAutoSpin();
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
      } else {
        this.checkAutoSpin();
      }
    }
  }

  private toggleAutoMode() {
    this.autoMode = !this.autoMode;
    if (this.autoMode) {
      this.autoBtn.play();
      this.checkAutoSpin();
    } else {
      this.autoBtn.stop();
    }
  }

  private checkAutoSpin() {
    if (this.autoMode && !this.spinning && !this.inHotSpin) {
      this.spin(() => {
        this.onSpinEnd();
      });
    }
  }

  private onBetMax(): void {
    // TODO: implement bet max logic
  }

  private toggleMenu(): void {
    this.menuPanel.visible = !this.menuPanel.visible;
  }

  private onInfoPressed(): void {
    if (this.descriptionView) return;
    this.menuPanel.visible = false;
    this.descriptionView = new GameDescription(DESCRIPTION_CONFIG, () => {
      if (this.descriptionView) {
        this.app.stage.removeChild(this.descriptionView);
        this.descriptionView.destroy({ children: true });
        this.descriptionView = undefined;
      }
    });
    const x = (this.APP_WIDTH - 720) / 2;
    const y = (this.APP_HEIGHT - 1280) / 2;
    this.descriptionView.x = x;
    this.descriptionView.y = y;
    this.app.stage.addChild(this.descriptionView);
  }

  private onEffectToggle(on: boolean): void {
    // TODO: handle effect toggle
  }

  private onMusicToggle(on: boolean): void {
    // TODO: handle music toggle
  }

  private onExit(): void {
    // same behavior as the back button
    window.location.reload();
  }

  private isWild(name: string): boolean {
    return name === 'alpszm_W1' || name === 'alpszm_W2' || name === 'WILD';
  }

  private getPlateResult(): string[][] {
    const plate: string[][] = [];
    for (let c = 0; c < this.cols; c++) {
      plate[c] = [];
      for (let r = 0; r < this.rows; r++) {
        const sprite = this.reels[c].children[r * this.childPerCell] as any;
        plate[c][r] = sprite.name || '';
      }
    }
    return plate;
  }

  protected findLines(): { lineIndex: number; cells: { r: number; c: number }[] }[] {
    const grid = this.gridState();
    const wins: { lineIndex: number; cells: { r: number; c: number }[] }[] = [];

    PAYLINES.forEach((line, idx) => {
      let baseSymbol: string | null = null;
      const cells: { r: number; c: number }[] = [];
      for (let c = 0; c < this.cols; c++) {
        const r = line[c];
        const symbol = grid[r][c].name;
        if (baseSymbol === null && !this.isWild(symbol)) {
          baseSymbol = symbol;
        }
        if (baseSymbol === null) {
          cells.push({ r, c });
          continue;
        }
        if (symbol === baseSymbol || this.isWild(symbol)) {
          cells.push({ r, c });
        } else {
          break;
        }
      }
      if (baseSymbol !== null && cells.length >= 3) {
        wins.push({ lineIndex: idx, cells });
      }
    });

    return wins;
  }

  protected showWin(
    lines: { lineIndex: number; cells: { r: number; c: number }[] }[],
    onDone: () => void
  ) {
    if (this.mapShip) {
      this.mapShip.moveBy(lines.length);
    }

    const plate = this.getPlateResult();
    const winning_list = lines.map(l => l.cells.map(c => [c.r, c.c]));
    const winning_line_index_list = lines.map(l => l.lineIndex);

    const uniqueCells = new Set<string>();
    lines.forEach(l => {
      l.cells.forEach(c => uniqueCells.add(`${c.r}-${c.c}`));
    });
    const gained = uniqueCells.size * this.gameSettings.scorePerBlock;
    if (gained > 0) {
      this.score += gained;
    }

    SlotLineMgr.Set_Winning(plate, winning_list as any, [], winning_line_index_list);
    SlotLineMgr.Set_TotalLine();

    const timeoutId = window.setTimeout(() => {
      SlotLineMgr.Clear_AniGroup_All();
      this.onSpinEnd();
      onDone();
    }, this.WIN_TIME);
    (this as any).registerTimeout(timeoutId);
  }
}

