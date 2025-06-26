import * as PIXI from 'pixi.js';

// Minimal typings for dragonBones global provided by pixi5-dragonbones
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const dragonBones: any;

/**
 * PixiDragonBones
 * A lightweight DragonBones wrapper for Pixi.js 5.x
 */
export class PixiDragonBones extends PIXI.Container {
  private armatureDisplay?: any;
  private loadPromise: Promise<void>;
  constructor(
    private gameCode: string,
    private resName: string,
    private armatureName: string
  ) {
    super();
    this.loadPromise = this.loadResources();
  }

  private loadResources(): Promise<void> {
    return new Promise(resolve => {
      const basePath = `assets/${this.gameCode}/dragonBones/`;
      const skePath = `${basePath}${this.resName}_ske.json`;
      const texJsonPath = `${basePath}${this.resName}_tex.json`;
      const texPngPath = `${basePath}${this.resName}_tex.png`;

      const loader = new PIXI.Loader();
      loader
        .add('ske', skePath)
        .add('texJson', texJsonPath)
        .add('texPng', texPngPath)
        .load((l, r) => {
          try {

            if(r != undefined && r.ske != undefined && r.texJson != undefined && r.texPng != undefined) {
      
              const factory = dragonBones.PixiFactory.factory;
              factory.parseDragonBonesData(r.ske.data);
              factory.parseTextureAtlasData(r.texJson.data, r.texPng.texture);
              this.armatureDisplay = factory.buildArmatureDisplay(this.armatureName);
              if (this.armatureDisplay) {
                this.addChild(this.armatureDisplay);
              } else {
                // eslint-disable-next-line no-console
                console.warn(`Armature ${this.armatureName} not found in ${this.resName}`);
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load dragonbones resources', e);
          }
          resolve();
        });
    });
  }

  public async play(animName?: string, loop = true): Promise<void> {
    await this.loadPromise;
    if (!this.armatureDisplay || !this.armatureDisplay.animation) return;
    const name = animName || this.armatureDisplay.animation.lastAnimationName;
    const playTimes = loop ? 0 : 1;
    this.armatureDisplay.animation.play(name, playTimes);
  }

  public async stop(): Promise<void> {
    await this.loadPromise;
    if (this.armatureDisplay && this.armatureDisplay.animation) {
      this.armatureDisplay.animation.stop();
    }
  }

  public release(): void {
    if (this.armatureDisplay) {
      if (this.armatureDisplay.animation) {
        this.armatureDisplay.animation.stop();
      }
      this.armatureDisplay.destroy({ children: true, texture: false });
      this.armatureDisplay = undefined;
    }
    this.removeChildren();
  }
}
