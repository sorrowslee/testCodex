import * as PIXI from 'pixi.js';

export class BaseMapShip {
  private container: PIXI.Container;
  private flag!: PIXI.Sprite;
  private winner!: PIXI.Sprite;
  private battles: PIXI.Sprite[] = [];
  private routes: { x: number; y: number }[] = [];
  private current = 0;
  private moveTime = 1000;
  private onReachedEnd?: () => void;

  constructor(private app: PIXI.Application, private gameCode: string) {
    this.container = new PIXI.Container();
  }

  public async init(): Promise<void> {
    const base = `assets/${this.gameCode}/map/${this.gameCode}_map_`;
    const routeResp = await fetch(`${base}routes.json`);
    const data = (await routeResp.json()) as { routes: { x: number; y: number }[] };
    this.routes = data.routes.map(p => ({ x: Number(p.x), y: Number(p.y) }));

    const reel = PIXI.Sprite.from(`${base}reel.png`);
    this.container.addChild(reel);

    const battleTex = PIXI.Texture.from(`${base}battle.png`);
    for (let i = 1; i < this.routes.length - 1; i++) {
      const b = new PIXI.Sprite(battleTex);
      b.anchor.set(0, 0.5);
      b.x = this.routes[i].x;
      b.y = this.routes[i].y;
      this.battles.push(b);
      this.container.addChild(b);
    }

    this.winner = PIXI.Sprite.from(`${base}winner.png`);
    this.winner.anchor.set(0, 0.1);
    this.winner.x = this.routes[this.routes.length - 1].x;
    this.winner.y = this.routes[this.routes.length - 1].y;
    this.container.addChild(this.winner);

    this.flag = PIXI.Sprite.from(`${base}flag.png`);
    this.flag.anchor.set(0.5, 0.8);
    this.flag.x = this.routes[0].x;
    this.flag.y = this.routes[0].y;
    this.container.addChild(this.flag);

    this.app.stage.addChild(this.container);
  }

  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  public get height(): number {
    return this.container.height;
  }

  public get width(): number {
    return this.container.width;
  }

  public setMoveTime(ms: number): void {
    this.moveTime = ms;
  }

  public setOnReachedEnd(cb: () => void): void {
    this.onReachedEnd = cb;
  }

  public reset(): void {
    this.current = 0;
    this.flag.x = this.routes[0].x;
    this.flag.y = this.routes[0].y;
  }

  public moveToNext(onDone?: () => void): void {
    if (this.current + 1 >= this.routes.length) {
      if (onDone) onDone();
      return;
    }
    this.current++;
    const startX = this.flag.x;
    const startY = this.flag.y;
    const endPos = this.routes[this.current];
    const start = Date.now();
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / this.moveTime, 1);
      this.flag.x = startX + (endPos.x - startX) * t;
      this.flag.y = startY + (endPos.y - startY) * t;
      if (t === 1) {
        ticker.stop();
        ticker.destroy();
        if (this.current === this.routes.length - 1 && this.onReachedEnd) {
          this.onReachedEnd();
        }
        if (onDone) onDone();
      }
    });
    ticker.start();
  }

  public moveBy(steps: number, onDone?: () => void): void {
    if (steps <= 0) {
      if (onDone) onDone();
      return;
    }
    this.moveToNext(() => this.moveBy(steps - 1, onDone));
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true, texture: true, baseTexture: true });
  }
}
