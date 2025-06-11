import * as PIXI from 'pixi.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new PIXI.Application({
    width: 7 * 128,
    height: 5 * 128 + 100,
    backgroundColor: 0x1099bb
  });

  document.getElementById('game')?.appendChild(app.view);

  const reelWidth = 128;
  const reelHeight = 128;
  const rows = 5;
  const cols = 7;

  // spin configuration
  const BASE_SPIN = 1000; // minimum spin time in ms for the first reel
  const SPIN_INCREMENT = 300; // additional spin time for each subsequent reel
  const SPIN_SPEED = 300; // symbol movement speed per frame
  const BLUR_AMOUNT = 30; // blur intensity while spinning

  const symbols = [
    'bag', 'bear_big', 'bear_small', 'cave', 'claws',
    'rifle', 'rock', 'salmon', 'seal', 'snow'
  ];

  const reelContainer = new PIXI.Container();
  app.stage.addChild(reelContainer);
  const reelMask = new PIXI.Graphics();
  reelMask.beginFill(0xffffff);
  reelMask.drawRect(0, 0, cols * reelWidth, rows * reelHeight);
  reelMask.endFill();
  reelMask.visible = false;
  app.stage.addChild(reelMask);
  reelContainer.mask = reelMask;

  const reels: any[] = [];

  for (let i = 0; i < cols; i++) {
    const rc = new PIXI.Container();
    rc.x = i * reelWidth;
    reelContainer.addChild(rc);
    reels.push(rc);
    for (let j = 0; j < rows; j++) {
      const symIndex = Math.floor(Math.random() * symbols.length);
      const texture = PIXI.Texture.from(`assets/symbols/${symbols[symIndex]}.png`);
      const border = PIXI.Sprite.from('assets/symbols/border.png');
      const symbol = new PIXI.Sprite(texture);
      symbol.name = symbols[symIndex];
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

  const button = new PIXI.Text('SPIN', {
    fill: 0xffffff,
    fontSize: 36,
    fontWeight: 'bold'
  });
  button.interactive = true;
  button.buttonMode = true;
  button.x = (cols * reelWidth - button.width) / 2;
  button.y = rows * reelHeight + 20;
  app.stage.addChild(button);

  let spinning = false;
  const WIN_TIME = 3000;
  const lineContainer = new PIXI.Container();
  app.stage.addChild(lineContainer);

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

  function showWin(lines: LineInfo[]) {
    const hitSprites: any[] = [];
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
      });
    });

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
    }, WIN_TIME);
  }

  function alignReel(reel: any) {
    reel.children.forEach((child: any, i: number) => {
      const row = Math.floor(i / 2);
      child.y = row * reelHeight + reelHeight / 2;
      child.x = reelWidth / 2;
    });
  }

  button.on('pointerdown', () => {
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
            const symIndex = Math.floor(Math.random() * symbols.length);
            sym.texture = PIXI.Texture.from(`assets/symbols/${symbols[symIndex]}.png`);
            sym.name = symbols[symIndex];
          }
        }
        if (elapsed > spinTimes[idx]) {
          alignReel(reel);
          reel.filters = [];
          ticker.destroy();
          if (idx === cols - 1) {
            const wins = findLines();
            if (wins.length > 0) {
              showWin(wins);
            } else {
              spinning = false;
            }
          }
        }
      });
      ticker.start();
    });
  });
});
