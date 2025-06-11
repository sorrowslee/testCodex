import * as PIXI from 'pixi.js';

document.addEventListener('DOMContentLoaded', () => {
  const SCORE_AREA_HEIGHT = 100;
  const APP_WIDTH = 1882;
  const APP_HEIGHT = 1075;
  const GAME_WIDTH = 7 * 128;
  const GAME_HEIGHT = 5 * 128 + 100 + SCORE_AREA_HEIGHT;

  const app = new PIXI.Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    backgroundColor: 0x000000
  });

  document.getElementById('game')?.appendChild(app.view);

  const background = PIXI.Sprite.from('assets/bg/bg.png');
  background.width = APP_WIDTH;
  background.height = APP_HEIGHT;
  app.stage.addChild(background);

  const gameContainer = new PIXI.Container();
  gameContainer.x = (APP_WIDTH - GAME_WIDTH) / 2;
  gameContainer.y = (APP_HEIGHT - GAME_HEIGHT) / 2;
  app.stage.addChild(gameContainer);

  const reelWidth = 128;
  const reelHeight = 128;
  const rows = 5;
  const cols = 7;
  const REEL_SCALE = 0.9;

  // spin configuration
  const BASE_SPIN = 1000; // minimum spin time in ms for the first reel
  const SPIN_INCREMENT = 300; // additional spin time for each subsequent reel
  const SPIN_SPEED = 300; // symbol movement speed per frame
  const BLUR_AMOUNT = 30; // blur intensity while spinning

  const normalSymbols = [
    'bag', 'bear_big', 'bear_small', 'cave', 'claws',
    'rifle', 'rock', 'salmon', 'seal', 'snow'
  ];
  const hotSymbols = normalSymbols.slice(0, 5);
  let currentSymbols = normalSymbols;

  const reelContainer = new PIXI.Container();
  reelContainer.y = SCORE_AREA_HEIGHT;
  reelContainer.scale.set(REEL_SCALE);
  reelContainer.x = (GAME_WIDTH - cols * reelWidth * REEL_SCALE) / 2;
  gameContainer.addChild(reelContainer);

  let score = 0;
  const scoreText = new PIXI.Text('Score: 0', {
    fill: 0xffe066,
    fontSize: 48,
    fontWeight: 'bold',
    stroke: 0x333333,
    strokeThickness: 6
  });
  scoreText.anchor.set(0.5, 0);
  scoreText.x = (cols * reelWidth) / 2;
  scoreText.y = 20;
  gameContainer.addChild(scoreText);

  const hotSpinText = new PIXI.Text('', {
    fill: 0xff0000,
    fontSize: 48,
    fontWeight: 'bold',
    stroke: 0x333333,
    strokeThickness: 6
  });
  hotSpinText.x = 20;
  hotSpinText.y = 20;
  hotSpinText.visible = false;
  gameContainer.addChild(hotSpinText);
  const reelMask = new PIXI.Graphics();
  reelMask.beginFill(0xffffff);
  reelMask.drawRect(0, 0, cols * reelWidth, rows * reelHeight);
  reelMask.endFill();
  reelContainer.addChild(reelMask);
  reelContainer.mask = reelMask;

  const reels: any[] = [];

  function populateReels(symbolSet: string[]) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const idx = Math.floor(Math.random() * symbolSet.length);
        const sym = reels[c].children[r * 2] as any;
        const border = reels[c].children[r * 2 + 1] as any;
        sym.texture = PIXI.Texture.from(`assets/symbols/${symbolSet[idx]}.png`);
        sym.name = symbolSet[idx];
        sym.y = r * reelHeight + reelHeight / 2;
        border.y = sym.y;
      }
    }
  }

  for (let i = 0; i < cols; i++) {
    const rc = new PIXI.Container();
    rc.x = i * reelWidth;
    reelContainer.addChild(rc);
    reels.push(rc);
    for (let j = 0; j < rows; j++) {
      const symIndex = Math.floor(Math.random() * currentSymbols.length);
      const texture = PIXI.Texture.from(`assets/symbols/${currentSymbols[symIndex]}.png`);
      const border = PIXI.Sprite.from('assets/symbols/border.png');
      const symbol = new PIXI.Sprite(texture);
      symbol.name = currentSymbols[symIndex];
      symbol.anchor.set(0.5);
      border.anchor.set(0.5);
      symbol.x = reelWidth / 2;
      symbol.y = j * reelHeight + reelHeight / 2;
      border.x = reelWidth / 2;
      border.y = symbol.y;
      rc.addChild(symbol);
      rc.addChild(border);
    }
  }

  const button = new PIXI.Container();
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
  button.addChild(buttonBg);
  button.addChild(buttonText);
  button.interactive = true;
  button.buttonMode = true;
  button.x = (cols * reelWidth - btnBgWidth) / 2;
  button.y = rows * reelHeight + 20 + SCORE_AREA_HEIGHT;
  gameContainer.addChild(button);

  let spinning = false;
  let inHotSpin = false;
  let hotSpinsLeft = 0;
  let nextHotSpinScore = 100;
  const WIN_TIME = 3000;
  const lineContainer = new PIXI.Container();
  lineContainer.x = reelContainer.x;
  lineContainer.y = reelContainer.y;
  lineContainer.scale.set(REEL_SCALE);
  gameContainer.addChild(lineContainer);

  interface LineInfo {
    start: { r: number; c: number };
    end: { r: number; c: number };
    cells: { r: number; c: number }[];
  }

  function gridState() {
    const grid: { name: string; sprite: any }[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const sprite = reels[c].children[r * 2] as any;
        grid[r][c] = { name: sprite.name || '', sprite };
      }
    }
    return grid;
  }

  function findLines(): LineInfo[] {
    const grid = gridState();
    const lines: LineInfo[] = [];

    // horizontal
    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const start = c;
        const name = grid[r][c].name;
        while (c + 1 < cols && grid[r][c + 1].name === name) c++;
        const len = c - start + 1;
        if (len >= 3) {
          const cells = [] as { r: number; c: number }[];
          for (let i = 0; i < len; i++) cells.push({ r, c: start + i });
          lines.push({ start: { r, c: start }, end: { r, c }, cells });
        }
        c++;
      }
    }

    // vertical
    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const start = r;
        const name = grid[r][c].name;
        while (r + 1 < rows && grid[r + 1][c].name === name) r++;
        const len = r - start + 1;
        if (len >= 3) {
          const cells = [] as { r: number; c: number }[];
          for (let i = 0; i < len; i++) cells.push({ r: start + i, c });
          lines.push({ start: { r: start, c }, end: { r, c }, cells });
        }
        r++;
      }
    }

    // diagonal down-right
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const name = grid[r][c].name;
        if (!name) continue;
        if (r > 0 && c > 0 && grid[r - 1][c - 1].name === name) continue;
        let len = 1;
        while (r + len < rows && c + len < cols && grid[r + len][c + len].name === name) len++;
        if (len >= 3) {
          const cells = [] as { r: number; c: number }[];
          for (let i = 0; i < len; i++) cells.push({ r: r + i, c: c + i });
          lines.push({ start: { r, c }, end: { r: r + len - 1, c: c + len - 1 }, cells });
        }
      }
    }

    // diagonal up-right
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        const name = grid[r][c].name;
        if (!name) continue;
        if (r < rows - 1 && c > 0 && grid[r + 1][c - 1].name === name) continue;
        let len = 1;
        while (r - len >= 0 && c + len < cols && grid[r - len][c + len].name === name) len++;
        if (len >= 3) {
          const cells = [] as { r: number; c: number }[];
          for (let i = 0; i < len; i++) cells.push({ r: r - i, c: c + i });
          lines.push({ start: { r, c }, end: { r: r - len + 1, c: c + len - 1 }, cells });
        }
      }
    }

    return lines;
  }

  function cellPos(r: number, c: number) {
    return { x: c * reelWidth + reelWidth / 2, y: r * reelHeight + reelHeight / 2 };
  }

  function animateScore() {
    const start = Date.now();
    const duration = 600;
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const scale = 1 + 0.5 * Math.sin(progress * Math.PI);
      scoreText.scale.set(scale);
      if (progress === 1) {
        scoreText.scale.set(1);
        ticker.stop();
        ticker.destroy();
      }
    });
    ticker.start();
  }

  function showWin(lines: LineInfo[], onDone: () => void) {
    const hitSprites: any[] = [];
    const uniqueCells = new Set<string>();
    lines.forEach(l => {
      const sPos = cellPos(l.start.r, l.start.c);
      const ePos = cellPos(l.end.r, l.end.c);

      const jStart = PIXI.Sprite.from('assets/lines/line_joint.png');
      const jEnd = PIXI.Sprite.from('assets/lines/line_joint.png');
      jStart.anchor.set(0.5);
      jEnd.anchor.set(0.5);
      jStart.position.set(sPos.x, sPos.y);
      jEnd.position.set(ePos.x, ePos.y);

      const body = PIXI.Sprite.from('assets/lines/line_body.png');
      body.anchor.set(0.5);
      const dx = ePos.x - sPos.x;
      const dy = ePos.y - sPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      body.width = length;
      body.position.set((sPos.x + ePos.x) / 2, (sPos.y + ePos.y) / 2);
      body.rotation = Math.atan2(dy, dx);

      lineContainer.addChild(body, jStart, jEnd);

      l.cells.forEach(cell => {
        const sym = reels[cell.c].children[cell.r * 2] as any;
        const border = reels[cell.c].children[cell.r * 2 + 1] as any;
        if (!hitSprites.includes(sym)) {
          hitSprites.push(sym, border);
        }
        uniqueCells.add(`${cell.r}-${cell.c}`);
      });
    });

    const gained = uniqueCells.size * 10;
    if (gained > 0) {
      score += gained;
      scoreText.text = `Score: ${score}`;
      animateScore();
    }

    const pulseTicker = new PIXI.Ticker();
    pulseTicker.add(() => {
      const t = Date.now();
      const scale = 1 + 0.2 * (0.5 + 0.5 * Math.sin(t / 150));
      hitSprites.forEach(s => s.scale.set(scale));
    });
    pulseTicker.start();

    setTimeout(() => {
      pulseTicker.stop();
      pulseTicker.destroy();
      hitSprites.forEach(s => s.scale.set(1));
      lineContainer.removeChildren();
      spinning = false;
      onDone();
    }, WIN_TIME);
  }

  function alignReel(reel: any) {
    reel.children.forEach((child: any, i: number) => {
      const row = Math.floor(i / 2);
      child.y = row * reelHeight + reelHeight / 2;
      child.x = reelWidth / 2;
    });
  }

  function spin(onComplete: () => void) {
    if (spinning) return;
    spinning = true;
    const spinTimes: number[] = [];
    const blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = BLUR_AMOUNT;
    for (let i = 0; i < cols; i++) {
      spinTimes.push(BASE_SPIN + i * SPIN_INCREMENT); // stagger stop times
    }
    reels.forEach((reel, idx) => {
      const start = Date.now();
      reel.filters = [blurFilter];
      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        const elapsed = Date.now() - start;
        for (let i = 0; i < reel.children.length; i += 2) {
          const sym = reel.children[i] as any;
          const border = reel.children[i + 1] as any;
          sym.y += SPIN_SPEED * ticker.deltaTime;
          border.y = sym.y;
          if (sym.y >= rows * reelHeight + reelHeight / 2) {
            sym.y -= rows * reelHeight;
            border.y = sym.y;
            const symIndex = Math.floor(Math.random() * currentSymbols.length);
            sym.texture = PIXI.Texture.from(`assets/symbols/${currentSymbols[symIndex]}.png`);
            sym.name = currentSymbols[symIndex];
          }
        }
        if (elapsed > spinTimes[idx]) {
          alignReel(reel);
          reel.filters = [];
          ticker.destroy();
          if (idx === cols - 1) {
            const wins = findLines();
            if (wins.length > 0) {
              showWin(wins, onComplete);
            } else {
              spinning = false;
              onComplete();
            }
          }
        }
      });
      ticker.start();
    });
  }

  function startHotSpin() {
    inHotSpin = true;
    hotSpinsLeft = 3;
    hotSpinText.visible = true;
    hotSpinText.text = `Hot Spin!! ${hotSpinsLeft}`;
    button.interactive = false;
    button.alpha = 0.5;
    currentSymbols = hotSymbols;
    populateReels(currentSymbols);
    spin(() => {
      hotSpinsLeft--;
      if (hotSpinsLeft > 0) {
        hotSpinText.text = `Hot Spin!! ${hotSpinsLeft}`;
      }
      checkHotSpin();
    });
  }

  function endHotSpin() {
    inHotSpin = false;
    hotSpinText.visible = false;
    hotSpinText.text = '';
    currentSymbols = normalSymbols;
    populateReels(currentSymbols);
    button.interactive = true;
    button.alpha = 1;
    nextHotSpinScore = Math.floor(score / 100) * 100 + 100;
  }

  function checkHotSpin() {
    if (inHotSpin) {
      if (hotSpinsLeft > 0) {
        spin(() => {
          hotSpinsLeft--;
          if (hotSpinsLeft > 0) {
            hotSpinText.text = `Hot Spin!! ${hotSpinsLeft}`;
          }
          checkHotSpin();
        });
      } else {
        endHotSpin();
      }
    } else {
      if (score >= nextHotSpinScore) {
        startHotSpin();
      }
    }
  }

  button.on('pointerdown', () => {
    spin(() => {
      checkHotSpin();
    });
  });
});
