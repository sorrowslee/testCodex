import * as PIXI from 'pixi.js';
import { AssetPaths, DefaultGameSettings, GameRuleSettings, GameAssetConfig } from '../setting';
import { BaseMapShip } from './BaseMapShip';

export abstract class BaseSlotGame {
  constructor(
    protected gameSettings: GameRuleSettings = DefaultGameSettings,
    protected assets: GameAssetConfig = AssetPaths.bjxb
  ) {
    this.rows = gameSettings.rows;
    this.cols = gameSettings.cols;
    this.reelWidth = gameSettings.blockWidth;
    this.reelHeight = gameSettings.blockHeight;
    this.hasBorder = !!assets.border;
    this.childPerCell = this.hasBorder ? 2 : 1;
  }

  protected app!: PIXI.Application;
  protected gameContainer!: PIXI.Container;
  protected reelContainer!: PIXI.Container;
  protected lineContainer!: PIXI.Container;
  protected reels: PIXI.Container[] = [];
  protected score = 0;
  protected scoreText!: PIXI.Text;
  protected button!: PIXI.Container;
  protected mapShip?: BaseMapShip;

  private activeTickers: PIXI.Ticker[] = [];
  private activeTimeouts: number[] = [];

  private registerTicker(t: PIXI.Ticker) {
    this.activeTickers.push(t);
  }

  private unregisterTicker(t: PIXI.Ticker) {
    const idx = this.activeTickers.indexOf(t);
    if (idx !== -1) this.activeTickers.splice(idx, 1);
  }

  private registerTimeout(id: number) {
    this.activeTimeouts.push(id);
  }

  // dimensions and reel config
  protected SCORE_AREA_HEIGHT = 100;
  protected APP_WIDTH = 1882;
  protected APP_HEIGHT = 1075;
  protected reelWidth!: number;
  protected reelHeight!: number;
  protected rows!: number;
  protected cols!: number;
  protected REEL_SCALE = 0.9;

  // spin configuration
  protected BASE_SPIN = 1000;
  protected SPIN_INCREMENT = 300;
  protected SPIN_SPEED = 300;
  protected BLUR_AMOUNT = 30;
  protected WIN_TIME = 3000;

  // border configuration
  protected hasBorder = false;
  protected childPerCell = 1;

  protected currentSymbols: string[] = [];

  protected abstract getBackgroundPath(): string;
  protected abstract getInitialSymbols(): string[];

  public start(containerId: string = 'game'): void {
    const GAME_WIDTH = this.cols * this.reelWidth;
    const GAME_HEIGHT = this.rows * this.reelHeight + 100 + this.SCORE_AREA_HEIGHT;
    this.currentSymbols = this.getInitialSymbols();

    this.app = new PIXI.Application({
      width: this.APP_WIDTH,
      height: this.APP_HEIGHT,
      backgroundColor: 0x000000
    });
    const container = typeof containerId === 'string' ? document.getElementById(containerId)! : containerId;
    container.appendChild(this.app.view);

    // ensure game container exists before subclasses run additional setup
    this.gameContainer = new PIXI.Container();
    this.gameContainer.x = (this.APP_WIDTH - GAME_WIDTH) / 2;
    this.gameContainer.y = (this.APP_HEIGHT - GAME_HEIGHT) / 2;
    this.app.stage.addChild(this.gameContainer);

    const bgCodeMatch = /assets\/(.*?)\//.exec(this.assets.bg);
    const gameCode = bgCodeMatch ? bgCodeMatch[1] : '';

    const finishInit = (midBg: PIXI.Sprite | null) => {
      if (this.gameSettings.mapShip) {
        this.mapShip = new BaseMapShip(this.app, gameCode);
        this.mapShip.init().then(() => {
          if (!this.gameSettings.singleBackground && midBg) {
            this.mapShip!.setPosition(0, midBg.y - this.mapShip!.height);
          }
        });
      }


      this.reelContainer = new PIXI.Container();
      let scale = this.REEL_SCALE;
      if (this.gameSettings.reelWidth) {
        scale = this.gameSettings.reelWidth / (this.cols * this.reelWidth);
      }
      if (this.gameSettings.reelHeight) {
        const hScale =
          this.gameSettings.reelHeight / (this.rows * this.reelHeight);
        scale = Math.min(scale, hScale);
      }
      this.REEL_SCALE = scale;
      this.reelContainer.scale.set(this.REEL_SCALE);

      let defaultX =
        (GAME_WIDTH - this.cols * this.reelWidth * this.REEL_SCALE) / 2;
      let defaultY = this.SCORE_AREA_HEIGHT;
      if (!this.gameSettings.singleBackground && midBg) {
        const midX = midBg.x - this.gameContainer.x;
        const midY = midBg.y - this.gameContainer.y;
        defaultX =
          midX +
          (midBg.width - this.cols * this.reelWidth * this.REEL_SCALE) / 2;
        defaultY =
          midY +
          (midBg.height - this.rows * this.reelHeight * this.REEL_SCALE) / 2;
      }
      this.reelContainer.x =
        this.gameSettings.reelX !== undefined
          ? this.gameSettings.reelX
          : defaultX;
      this.reelContainer.y =
        this.gameSettings.reelY !== undefined
          ? this.gameSettings.reelY
          : defaultY;
      this.gameContainer.addChild(this.reelContainer);

      // score display
      this.scoreText = new PIXI.Text('Score: 0', {
        fill: 0xffe066,
        fontSize: 48,
        fontWeight: 'bold',
        stroke: 0x333333,
        strokeThickness: 6
      });
      this.scoreText.anchor.set(0.5, 0);
      this.scoreText.x = (this.cols * this.reelWidth) / 2;
      this.scoreText.y = 20;
      this.gameContainer.addChild(this.scoreText);

      const reelMask = new PIXI.Graphics();
      reelMask.beginFill(0xffffff);
      reelMask.drawRect(
        0,
        0,
        this.cols * this.reelWidth,
        this.rows * this.reelHeight
      );
      reelMask.endFill();
      this.reelContainer.addChild(reelMask);
      this.reelContainer.mask = reelMask;

      for (let i = 0; i < this.cols; i++) {
        const rc = new PIXI.Container();
        rc.x = i * this.reelWidth;
        this.reelContainer.addChild(rc);
        this.reels.push(rc);
        for (let j = 0; j < this.rows; j++) {
          const symIndex = Math.floor(
            Math.random() * this.currentSymbols.length
          );
          const symbolName = this.currentSymbols[symIndex];
          const texture = PIXI.Texture.from(
            this.assets.symbol(Number(symbolName))
          );
          const symbol = new PIXI.Sprite(texture);
          symbol.name = symbolName;
          symbol.anchor.set(0.5);
          symbol.x = this.reelWidth / 2;
          symbol.y = j * this.reelHeight + this.reelHeight / 2;
          rc.addChild(symbol);
          if (this.hasBorder && this.assets.border) {
            const border = PIXI.Sprite.from(this.assets.border);
            border.anchor.set(0.5);
            border.x = this.reelWidth / 2;
            border.y = symbol.y;
            rc.addChild(border);
          }
        }
      }

      this.button = new PIXI.Container();
      const btnBgWidth = 160;
      const btnBgHeight = 60;
      const buttonBg = new PIXI.Graphics();
      buttonBg.beginFill(0xffe066);
      buttonBg.lineStyle(2, 0xffffff);
      buttonBg.drawRoundedRect(0, 0, btnBgWidth, btnBgHeight, 10);
      buttonBg.endFill();
      const buttonText = new PIXI.Text('SPIN', {
        fill: 0x000000,
        fontSize: 36,
        fontWeight: 'bold'
      });
      buttonText.anchor.set(0.5);
      buttonText.position.set(btnBgWidth / 2, btnBgHeight / 2);
      this.button.addChild(buttonBg);
      this.button.addChild(buttonText);
      this.button.interactive = true;
      this.button.buttonMode = true;
      this.button.x = (this.cols * this.reelWidth - btnBgWidth) / 2;
      this.button.y = this.rows * this.reelHeight + 20 + this.SCORE_AREA_HEIGHT;
      this.gameContainer.addChild(this.button);

      this.lineContainer = new PIXI.Container();
      this.lineContainer.x = this.reelContainer.x;
      this.lineContainer.y = this.reelContainer.y;
      this.lineContainer.scale.set(this.REEL_SCALE);
      this.gameContainer.addChild(this.lineContainer);

      this.button.on('pointerdown', () => {
        this.spin(() => {
          this.onSpinEnd();
        });
      });
    };

    if (this.gameSettings.singleBackground) {
      const background = PIXI.Sprite.from(this.getBackgroundPath());
      background.width = this.APP_WIDTH;
      background.height = this.APP_HEIGHT;
      this.app.stage.addChild(background);
      finishInit(null);
    } else {
      const top = PIXI.Sprite.from(this.assets.bgTop);
      const mid = PIXI.Sprite.from(this.assets.bgMid);
      const bottom = PIXI.Sprite.from(this.assets.bgBottom);

      const layout = () => {
        const scale = Math.min(this.APP_WIDTH / top.texture.width, 1);
        [top, mid, bottom].forEach(s => {
          s.scale.set(scale);
          s.x = (this.APP_WIDTH - top.texture.width * scale) / 2;
        });
        top.y = 0;
        mid.y = top.height;
        bottom.y = mid.y + mid.height;
        this.app.stage.addChild(top);
        this.app.stage.addChild(mid);
        this.app.stage.addChild(bottom);
        finishInit(mid);
      };

      if (top.texture.baseTexture.valid) {
        layout();
      } else {
        top.texture.baseTexture.once('loaded', layout);
      }
    }

    // old code removed; logic moved to finishInit
  }

  protected onSpinEnd(): void {
    // subclasses can override
  }

  protected populateReels(symbolSet: string[]): void {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const idx = Math.floor(Math.random() * symbolSet.length);
        const sym = this.reels[c].children[r * this.childPerCell] as any;
        const border = this.hasBorder
          ? (this.reels[c].children[r * this.childPerCell + 1] as any)
          : null;
        sym.texture = PIXI.Texture.from(
          this.assets.symbol(Number(symbolSet[idx]))
        );
        sym.name = symbolSet[idx];
        sym.y = r * this.reelHeight + this.reelHeight / 2;
        if (border) border.y = sym.y;
      }
    }
  }

  protected gridState() {
    const grid: { name: string; sprite: any }[][] = [];
    for (let r = 0; r < this.rows; r++) {
      grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const sprite = this.reels[c].children[r * this.childPerCell] as any;
        grid[r][c] = { name: sprite.name || '', sprite };
      }
    }
    return grid;
  }

  protected findLines() {
    const grid = this.gridState();
    const lines: any[] = [];
    const minLen = this.gameSettings.minMatch;
    const dirs = this.gameSettings.lineDirections;

    if (dirs.horizontal) {
      for (let r = 0; r < this.rows; r++) {
        let c = 0;
        while (c < this.cols) {
          const start = c;
          const name = grid[r][c].name;
          while (c + 1 < this.cols && grid[r][c + 1].name === name) c++;
          const len = c - start + 1;
          if (len >= minLen) {
            const cells = [] as { r: number; c: number }[];
            for (let i = 0; i < len; i++) cells.push({ r, c: start + i });
            lines.push({ start: { r, c: start }, end: { r, c }, cells });
          }
          c++;
        }
      }
    }

    if (dirs.vertical) {
      for (let c = 0; c < this.cols; c++) {
        let r = 0;
        while (r < this.rows) {
          const start = r;
          const name = grid[r][c].name;
          while (r + 1 < this.rows && grid[r + 1][c].name === name) r++;
          const len = r - start + 1;
          if (len >= minLen) {
            const cells = [] as { r: number; c: number }[];
            for (let i = 0; i < len; i++) cells.push({ r: start + i, c });
            lines.push({ start: { r: start, c }, end: { r, c }, cells });
          }
          r++;
        }
      }
    }

    if (dirs.diagonal) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const name = grid[r][c].name;
          if (!name) continue;
          if (r > 0 && c > 0 && grid[r - 1][c - 1].name === name) continue;
          let len = 1;
          while (r + len < this.rows && c + len < this.cols && grid[r + len][c + len].name === name) len++;
          if (len >= minLen) {
            const cells = [] as { r: number; c: number }[];
            for (let i = 0; i < len; i++) cells.push({ r: r + i, c: c + i });
            lines.push({ start: { r, c }, end: { r: r + len - 1, c: c + len - 1 }, cells });
          }
        }
      }

      for (let r = this.rows - 1; r >= 0; r--) {
        for (let c = 0; c < this.cols; c++) {
          const name = grid[r][c].name;
          if (!name) continue;
          if (r < this.rows - 1 && c > 0 && grid[r + 1][c - 1].name === name) continue;
          let len = 1;
          while (r - len >= 0 && c + len < this.cols && grid[r - len][c + len].name === name) len++;
          if (len >= minLen) {
            const cells = [] as { r: number; c: number }[];
            for (let i = 0; i < len; i++) cells.push({ r: r - i, c: c + i });
            lines.push({ start: { r, c }, end: { r: r - len + 1, c: c + len - 1 }, cells });
          }
        }
      }
    }

    return lines;
  }

  protected cellPos(r: number, c: number) {
    return { x: c * this.reelWidth + this.reelWidth / 2, y: r * this.reelHeight + this.reelHeight / 2 };
  }

  protected animateScore() {
    const start = Date.now();
    const duration = 600;
    const ticker = new PIXI.Ticker();
    this.registerTicker(ticker);
    ticker.add(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const scale = 1 + 0.5 * Math.sin(progress * Math.PI);
      this.scoreText.scale.set(scale);
      if (progress === 1) {
        this.scoreText.scale.set(1);
        ticker.stop();
        ticker.destroy();
        this.unregisterTicker(ticker);
      }
    });
    ticker.start();
  }

  protected showWin(lines: any[], onDone: () => void) {
    const hitSprites: any[] = [];
    const uniqueCells = new Set<string>();
    lines.forEach(l => {
      const sPos = this.cellPos(l.start.r, l.start.c);
      const ePos = this.cellPos(l.end.r, l.end.c);

      const jStart = PIXI.Sprite.from(this.assets.lines.joint);
      const jEnd = PIXI.Sprite.from(this.assets.lines.joint);
      jStart.anchor.set(0.5);
      jEnd.anchor.set(0.5);
      jStart.position.set(sPos.x, sPos.y);
      jEnd.position.set(ePos.x, ePos.y);

      const body = PIXI.Sprite.from(this.assets.lines.body);
      body.anchor.set(0.5);
      const dx = ePos.x - sPos.x;
      const dy = ePos.y - sPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      body.width = length;
      body.position.set((sPos.x + ePos.x) / 2, (sPos.y + ePos.y) / 2);
      body.rotation = Math.atan2(dy, dx);

      this.lineContainer.addChild(body, jStart, jEnd);

      l.cells.forEach((cell: any) => {
        const sym = this.reels[cell.c].children[
          cell.r * this.childPerCell
        ] as any;
        const border = this.hasBorder
          ? (this.reels[cell.c].children[cell.r * this.childPerCell + 1] as any)
          : null;
        if (!hitSprites.includes(sym)) {
          hitSprites.push(sym);
          if (border) hitSprites.push(border);
        }
        uniqueCells.add(`${cell.r}-${cell.c}`);
      });
    });

    const gained = uniqueCells.size * this.gameSettings.scorePerBlock;
    if (gained > 0) {
      this.score += gained;
      this.scoreText.text = `Score: ${this.score}`;
      this.animateScore();
    }

    const pulseTicker = new PIXI.Ticker();
    this.registerTicker(pulseTicker);
    pulseTicker.add(() => {
      const t = Date.now();
      const scale = 1 + 0.2 * (0.5 + 0.5 * Math.sin(t / 150));
      hitSprites.forEach(s => s.scale.set(scale));
    });
    pulseTicker.start();

    const timeoutId = window.setTimeout(() => {
      pulseTicker.stop();
      pulseTicker.destroy();
      this.unregisterTicker(pulseTicker);
      hitSprites.forEach(s => s.scale.set(1));
      this.lineContainer.removeChildren();
      this.onSpinEnd();
      onDone();
    }, this.WIN_TIME);
    this.registerTimeout(timeoutId);
  }

  protected alignReel(reel: PIXI.Container) {
    reel.children.forEach((child: any, i: number) => {
      const row = Math.floor(i / this.childPerCell);
      child.y = row * this.reelHeight + this.reelHeight / 2;
      child.x = this.reelWidth / 2;
    });
  }

  protected spinning = false;

  protected spin(onComplete: () => void) {
    if (this.spinning) return;
    this.spinning = true;
    const spinTimes: number[] = [];
    const blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = this.BLUR_AMOUNT;
    for (let i = 0; i < this.cols; i++) {
      spinTimes.push(this.BASE_SPIN + i * this.SPIN_INCREMENT);
    }
    this.reels.forEach((reel, idx) => {
      const start = Date.now();
      reel.filters = [blurFilter];
      const ticker = new PIXI.Ticker();
      this.registerTicker(ticker);
      ticker.add(() => {
        const elapsed = Date.now() - start;
        for (let i = 0; i < reel.children.length; i += this.childPerCell) {
          const sym = reel.children[i] as any;
          const border = this.hasBorder ? (reel.children[i + 1] as any) : null;
          sym.y += this.SPIN_SPEED * ticker.deltaTime;
          if (border) border.y = sym.y;
          if (sym.y >= this.rows * this.reelHeight + this.reelHeight / 2) {
            sym.y -= this.rows * this.reelHeight;
            if (border) border.y = sym.y;
            const symIndex = Math.floor(
              Math.random() * this.currentSymbols.length
            );
            const symbolName = this.currentSymbols[symIndex];
            sym.texture = PIXI.Texture.from(
              this.assets.symbol(Number(symbolName))
            );
            sym.name = symbolName;
          }
        }
        if (elapsed > spinTimes[idx]) {
          this.alignReel(reel);
          reel.filters = [];
          ticker.destroy();
          this.unregisterTicker(ticker);
          if (idx === this.cols - 1) {
            const wins = this.findLines();
            if (wins.length > 0) {
              this.showWin(wins, () => {
                this.spinning = false;
                onComplete();
              });
            } else {
              this.spinning = false;
              onComplete();
            }
          }
        }
      });
      ticker.start();
    });
  }

  public destroy(): void {
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];
    this.activeTickers.forEach(t => t.destroy());
    this.activeTickers = [];
    if (this.mapShip) {
      this.mapShip.destroy();
      this.mapShip = undefined;
    }
    if (this.app) {
      const parent = this.app.view.parentNode;
      if (parent) {
        parent.removeChild(this.app.view);
      }
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
  }

  public get appInstance(): PIXI.Application {
    return this.app;
  }
}

