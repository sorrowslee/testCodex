import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';

/**
 * ShowScore - displays a score overlay using a DragonBones background and
 * bitmap number graphics.
 */
export class ShowScore extends PIXI.Container {
  private static fontCache: Record<string, Record<string, PIXI.Texture>> = {};

  constructor(private app: PIXI.Application, private gameCode: string) {
    super();
  }

  /** Show the score using the provided DragonBones animation. */
  public async show(value: number, anim: PixiDragonBones): Promise<void> {
    const textures = await this.loadFontTextures();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    bg.interactive = true; // block interactions
    this.addChild(bg);

    anim.x = this.app.screen.width / 2;
    anim.y = this.app.screen.height / 2;
    // anim.pivot.set(anim.width / 2, anim.height / 2);
    this.addChild(anim);

    const numContainer = new PIXI.Container();
    const digits = value.toString().split('');
    let totalWidth = 0;
    const sprites: PIXI.Sprite[] = [];
    digits.forEach(d => {
      const tex = textures[d];
      if (!tex) return;
      const s = new PIXI.Sprite(tex);
      sprites.push(s);
      totalWidth += s.width;
    });
    let x = 0;
    let height = 0;
    sprites.forEach(s => {
      s.x = x;
      x += s.width;
      numContainer.addChild(s);
      if (s.height > height) height = s.height;
    });
    numContainer.pivot.set(totalWidth / 2, height / 2);
    numContainer.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2+ 10
    );
    this.addChild(numContainer);

    this.app.stage.addChild(this);
    await anim.play('Anim_Score', false);
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.app.stage.removeChild(this);
    anim.release();
    this.destroy({ children: true });
  }

  private async loadFontTextures(): Promise<Record<string, PIXI.Texture>> {
    if (ShowScore.fontCache[this.gameCode]) {
      return ShowScore.fontCache[this.gameCode];
    }

    const base = `assets/${this.gameCode}/font/${this.gameCode}_totalscore_font`;
    const [jsonData, texture] = await Promise.all([
      fetch(`${base}.fnt`).then(r => r.json()),
      new Promise<PIXI.Texture>(resolve => {
        const tex = PIXI.Texture.from(`${base}.png`);
        if (tex.baseTexture.valid) {
          resolve(tex);
        } else {
          tex.baseTexture.once('loaded', () => resolve(tex));
        }
      })
    ]);

    const sheetData = ShowScore.convertEgretToPIXI(jsonData);
    const sheet = new PIXI.Spritesheet(texture.baseTexture, sheetData);
    await new Promise(resolve => sheet.parse(() => resolve(undefined)));
    ShowScore.fontCache[this.gameCode] = sheet.textures;
    return sheet.textures;
  }

  // Convert Egret texture data to PIXI format.
  private static convertEgretToPIXI(egretData: any): any {
    const pixiData = {
      frames: {} as { [key: string]: any },
      meta: {
        image: egretData.file,
        format: 'RGBA8888',
        size: { w: 0, h: 0 }
      }
    };

    for (const [frameName, frameData] of Object.entries(egretData.frames)) {
      const egretFrame = frameData as any;
      pixiData.frames[frameName] = {
        frame: {
          x: egretFrame.x,
          y: egretFrame.y,
          w: egretFrame.w,
          h: egretFrame.h
        },
        rotated: false,
        trimmed:
          egretFrame.offX !== 0 ||
          egretFrame.offY !== 0 ||
          egretFrame.w !== egretFrame.sourceW ||
          egretFrame.h !== egretFrame.sourceH,
        spriteSourceSize: {
          x: egretFrame.offX || 0,
          y: egretFrame.offY || 0,
          w: egretFrame.w,
          h: egretFrame.h
        },
        sourceSize: {
          w: egretFrame.sourceW || egretFrame.w,
          h: egretFrame.sourceH || egretFrame.h
        }
      };
    }

    return pixiData;
  }
}

