import * as PIXI from 'pixi.js';
import { ResourceManager } from './ResourceManager';
// Some versions of pixi5-dragonbones expect PIXI on window. Assign before require.
(window as any).PIXI = PIXI;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

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

  // 龍骨動畫的播放可以用這個，真正實現了await功能，times = 1就播一次，times = 0就會無限播放，要注意使用
  // callback是可選的，當動畫播放完成時會調用
  static async play(
    armature: any,
    animName: string,
    times: number = 1,
    callback?: () => void
  ): Promise<void> {
    return new Promise(async (resolve) => {
      let display: any;

      if (armature instanceof PixiDragonBones) {
        await armature.buildPromise;
        display = armature.armatureDisplay;
      } else if (armature && armature.armatureDisplay) {
        display = armature.armatureDisplay;
      } else {
        display = armature;
      }

      if (!display) {
        if (callback) callback();
        resolve();
        return;
      }

      if (times === 0) {
        display.animation.play(animName, 0);
        if (callback) callback();
        resolve();
      } else {
        display.once('complete', () => {
          if (callback) callback();
          resolve();
        });
        display.animation.play(animName, times);
      }
    });
  }
}
