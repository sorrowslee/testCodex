import * as PIXI from 'pixi.js';

/**
 * PixiDragonBones
 * Lightweight DragonBones replacement built on basic Pixi classes.
 * This class parses DragonBones JSON files and builds sprites/animations
 * using only Pixi.Sprite and Pixi.AnimatedSprite.
 */
export class PixiDragonBones extends PIXI.Container {
  private loadPromise: Promise<void>;
  private slotSprites: Record<string, PIXI.Sprite | PIXI.AnimatedSprite> = {};

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
            if (
              r !== undefined &&
              r.ske !== undefined &&
              r.texJson !== undefined &&
              r.texPng !== undefined
            ) {
              // build texture dictionary from texJson
              const textures: Record<string, PIXI.Texture> = {};
              const baseTex = r.texPng.texture.baseTexture;
              const subTextures = r.texJson.data.SubTexture as Array<{
                name: string;
                x: number;
                y: number;
                width: number;
                height: number;
              }>;
              subTextures.forEach(st => {
                const rect = new PIXI.Rectangle(st.x, st.y, st.width, st.height);
                textures[st.name] = new PIXI.Texture(baseTex, rect);
              });

              // select armature
              const armatures = r.ske.data.armature || [];
              const armature =
                armatures.find((a: any) => a.name === this.armatureName) ||
                armatures[0];
              if (!armature || !armature.skin || !armature.skin[0]) {
                // eslint-disable-next-line no-console
                console.warn('Invalid dragonBones data for', this.armatureName);
                resolve();
                return;
              }

              const slots = armature.skin[0].slot || [];
              slots.forEach((slot: any) => {
                const frameNames = (slot.display || []).map((d: any) => d.path || d.name);
                const frames = frameNames
                  .map((fn: string) => textures[fn])
                  .filter((t): t is PIXI.Texture => !!t);
                if (frames.length === 0) return;
                let sprite: PIXI.Sprite | PIXI.AnimatedSprite;
                if (frames.length === 1) {
                  sprite = new PIXI.Sprite(frames[0]);
                } else {
                  const anim = new PIXI.AnimatedSprite(frames);
                  anim.animationSpeed = 1 / frames.length;
                  anim.loop = true;
                  anim.play();
                  sprite = anim;
                }
                sprite.anchor.set(0.5);
                this.slotSprites[slot.name] = sprite;
                this.addChild(sprite);
              });
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load dragonbones resources', e);
          }
          resolve();
        });
    });
  }

  public async play(_animName?: string, loop = true): Promise<void> {
    await this.loadPromise;
    Object.values(this.slotSprites).forEach(s => {
      if (s instanceof PIXI.AnimatedSprite) {
        s.loop = loop;
        s.gotoAndPlay(0);
      }
    });
  }

  public async stop(): Promise<void> {
    await this.loadPromise;
    Object.values(this.slotSprites).forEach(s => {
      if (s instanceof PIXI.AnimatedSprite) {
        s.stop();
      }
    });
  }

  public release(): void {
    Object.values(this.slotSprites).forEach(s => s.destroy());
    this.slotSprites = {};
    this.removeChildren();
  }
}
