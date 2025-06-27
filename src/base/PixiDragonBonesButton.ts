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

  private async setEffectPosition(x:number, y:number): Promise<void> {

    if(this.effect == undefined) 
      return;

    this.effect.position.set(x, y);
  }

  private async centerEffect(): Promise<void> {

    if(this.effect == undefined ||
        this.base == undefined) 
      return;

    this.effect.position.set(this.base.width / 2, this.base.height / 2);
  }

  public async play(): Promise<void> {
    await this.centerEffect();
    await this.effect.play();
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
