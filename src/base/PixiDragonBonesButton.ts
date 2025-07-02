import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';
import { ResourceManager } from './ResourceManager';

export class PixiDragonBonesButton extends PIXI.Container {
  private base: PIXI.Sprite;
  private effect: PixiDragonBones;
  private overlaySprites: PIXI.Sprite[] = [];

  constructor(
    gameCode: string,
    baseTextureName: string,
    texturesOnBase: string[],
    resName: string,
    armatureName: string
  ) {
    super();

    this.base = new PIXI.Sprite();
    this.base.anchor.set(0.5);
    this.addChild(this.base);

    this.loadBaseTexture(gameCode, baseTextureName);

    this.loadTexturesOnBase(gameCode, texturesOnBase);

    this.effect = new PixiDragonBones(gameCode, resName, armatureName);
    this.effect.visible = false;
    this.addChild(this.effect);
  }

  private async setEffectPosition(x:number, y:number): Promise<void> {

    if(this.effect == undefined) 
      return;

    this.effect.position.set(x, y);
  }

  public async play(): Promise<void> {
    this.overlaySprites.forEach(s => (s.visible = false));
    this.effect.visible = true;
    await this.effect.play();
  }

  public async stop(): Promise<void> {
    this.effect.visible = false;
    await this.effect.stop();
    this.overlaySprites.forEach(s => (s.visible = true));
  }

  public showEffect(): void {
    this.effect.visible = true;
  }

  public hideEffect(): void {
    this.effect.visible = false;
  }

  private async loadBaseTexture(
    gameCode: string,
    textureName: string
  ): Promise<void> {
    await ResourceManager.preloadGameImages(gameCode);
    const texture = ResourceManager.getTexture(textureName);
    if (texture) {
      this.base.texture = texture;
    }
  }

  private async loadTexturesOnBase(
    gameCode: string,
    textureNames: string[]
  ): Promise<void> {
    if (!textureNames || textureNames.length === 0) return;
    await ResourceManager.preloadGameImages(gameCode);
    textureNames.forEach(name => {
      const tex = ResourceManager.getTexture(name);
      if (tex) {
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        this.overlaySprites.push(sprite);
        this.addChild(sprite);
      }
    });
  }
}
