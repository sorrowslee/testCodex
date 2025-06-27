import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';

export class PixiDragonBonesButton extends PIXI.Container {
  private base: PIXI.Sprite;
  private effect: PixiDragonBones;

  constructor(
    gameCode: string,
    baseTextureName: string,
    resName: string,
    armatureName: string
  ) {
    super();

    this.base = PIXI.Sprite.from(baseTextureName);
    this.base.anchor.set(0.5);
    this.addChild(this.base);

    this.effect = new PixiDragonBones(gameCode, resName, armatureName);
    this.addChild(this.effect);
  }

  private async centerEffect(): Promise<void> {
    const anyEffect = this.effect as any;
    if (anyEffect.buildPromise) {
      await anyEffect.buildPromise;
    }
    const display = anyEffect.armatureDisplay as PIXI.DisplayObject | undefined;
    if (display) {
      const bounds = display.getLocalBounds();
      display.pivot.set(bounds.width / 2, bounds.height / 2);
      display.position.set(0, 0);
    }
    this.effect.position.set(0, 0);
  }

  public async play(): Promise<void> {
    await this.effect.play();
    await this.centerEffect();
  }

  public async stop(): Promise<void> {
    await this.effect.stop();
  }

  public showEffect(): void {
    this.effect.visible = true;
  }

  public hideEffect(): void {
    this.effect.visible = false;
  }
}
