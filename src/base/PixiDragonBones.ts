import * as PIXI from 'pixi.js';
import { ResourceManager } from './ResourceManager';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');
// Some versions of pixi5-dragonbones expect PIXI on window
(window as any).PIXI = PIXI;

/**
 * PixiDragonBones
 * Lightweight DragonBones replacement built on basic Pixi classes.
 * This class parses DragonBones JSON files and builds sprites/animations
 * using only Pixi.Sprite and Pixi.AnimatedSprite.
 */
export class PixiDragonBones extends PIXI.Container {
  private buildPromise: Promise<void>;
  private armatureDisplay?: any;

  constructor(
    private gameCode: string,
    private resName: string,
    private armatureName: string
  ) {
    super();
    this.buildPromise = this.build();
  }

  private async build(): Promise<void> {
    await ResourceManager.preloadDragonBones(this.gameCode);
    const factory = dragonBones.PixiFactory.factory;
    this.armatureDisplay = factory.buildArmatureDisplay(
      this.armatureName,
      this.resName
    );
    if (this.armatureDisplay) {
      this.addChild(this.armatureDisplay);
    }
  }

  public async play(animName?: string, loop = true): Promise<void> {
    await this.buildPromise;
    if (this.armatureDisplay) {
      const name =
        animName || this.armatureDisplay.animation.animationNames[0] || '';
      this.armatureDisplay.animation.play(name, loop ? 0 : 1);
    }
  }

  public async stop(): Promise<void> {
    await this.buildPromise;
    this.armatureDisplay?.animation.stop();
  }

  public release(): void {
    if (this.armatureDisplay) {
      this.armatureDisplay.destroy();
      this.armatureDisplay = undefined;
    }
    this.removeChildren();
  }
}
