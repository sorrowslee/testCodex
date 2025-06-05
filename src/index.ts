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
  const BASE_SPIN = 1500; // minimum spin time in ms for the first reel
  const SPIN_INCREMENT = 500; // additional spin time for each subsequent reel
  const SPIN_SPEED = 150; // symbol movement speed per frame
  const BLUR_AMOUNT = 10; // blur intensity while spinning

  const symbols = [
    'bag', 'bear_big', 'bear_small', 'cave', 'claws',
    'rifle', 'rock', 'salmon', 'seal', 'snow'
  ];

  const reels: PIXI.Container[] = [];

  for (let i = 0; i < cols; i++) {
    const rc = new PIXI.Container();
    rc.x = i * reelWidth;
    app.stage.addChild(rc);
    reels.push(rc);
    for (let j = 0; j < rows; j++) {
      const symIndex = Math.floor(Math.random() * symbols.length);
      const texture = PIXI.Texture.from(`assets/${symbols[symIndex]}.png`);
      const border = PIXI.Sprite.from('assets/border.png');
      const symbol = new PIXI.Sprite(texture);
      symbol.y = j * reelHeight;
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

  function alignReel(reel: PIXI.Container) {
    reel.children.forEach((child, i) => {
      const row = Math.floor(i / 2);
      child.y = row * reelHeight;
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
        reel.children.forEach(child => {
          child.y += SPIN_SPEED * ticker.deltaTime;
          if (child.y >= rows * reelHeight) {
            child.y -= rows * reelHeight;
          }
        });
        if (elapsed > spinTimes[idx]) {
          alignReel(reel);
          reel.filters = [];
          ticker.destroy();
          if (idx === cols - 1) spinning = false;
        }
      });
      ticker.start();
    });
  });
});
