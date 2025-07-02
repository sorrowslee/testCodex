import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';
import { ResourceManager } from './ResourceManager';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

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

    this.base = new PIXI.Sprite();
    this.base.anchor.set(0.5);
    this.addChild(this.base);

    this.loadBaseTexture(gameCode, resName, baseTextureName);

    this.effect = new PixiDragonBones(gameCode, resName, armatureName);
    this.effect.visible = false;
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
    this.effect.visible = true;
    await this.centerEffect();
    await this.effect.play();
  }

  public async stop(): Promise<void> {
    this.effect.visible = false;
    await this.effect.stop();
  }

  public showEffect(): void {
    this.effect.visible = true;
  }

  public hideEffect(): void {
    this.effect.visible = false;
  }

  private async loadBaseTexture(
    gameCode: string,
    resName: string,
    textureName: string
  ): Promise<void> {
    await ResourceManager.preloadDragonBones(gameCode);
    const factory = dragonBones.PixiFactory.factory;
    const sprite = factory.getTextureDisplay(textureName, resName) as PIXI.Sprite;
    this.base.texture = sprite.texture;
  }
}
