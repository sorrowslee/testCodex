import * as PIXI from 'pixi.js';
// Expose PIXI globally for pixi5-dragonbones which expects a global PIXI.
(window as any).PIXI = PIXI;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

// webpack require context for all DragonBones assets so they are included in
// the bundle. The resources are loaded at runtime via PIXI's loader.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBonesContext = (require as any).context('../../assets', true, /dragonBones\/.*\.(json|png)$/);

export class ResourceManager {
  private static loadedGames: Record<string, boolean> = {};
  private static loadedImages: Record<string, boolean> = {};

  public static preloadDragonBones(gameCode: string): Promise<void> {
    if (this.loadedGames[gameCode]) {
      return Promise.resolve();
    }

    const resources = dragonBonesContext
      .keys()
      .filter((key: string) => key.includes(`/${gameCode}/dragonBones/`));

    if (resources.length === 0) {
      this.loadedGames[gameCode] = true;
      return Promise.resolve();
    }

    const loader = new PIXI.Loader();
    resources.forEach((key: string) => {
      const url = dragonBonesContext(key);
      loader.add(key, url);
    });

    return new Promise(resolve => {
      loader.load((l, res) => {
        const factory = dragonBones.PixiFactory.factory;
        const groups: Record<string, { ske?: any; texJson?: any; texPng?: PIXI.Texture }> = {};

        resources.forEach((key: string) => {
          const r = res[key];
          const match = key.match(/dragonBones\/(.+?)_(ske|tex)\.(json|png)$/);
          if (!match || !r) return;
          const name = match[1];
          const type = match[2];
          groups[name] = groups[name] || {};

          if (type === 'tex' && key.endsWith('.json')) {
            groups[name].texJson = r.data;
          } else if (type === 'tex' && key.endsWith('.png')) {
            groups[name].texPng = r.texture;
          } else if (type === 'ske') {
            groups[name].ske = r.data;
          }
        });

        Object.entries(groups).forEach(([name, g]) => {
          if (g.texJson && g.texPng) {
            factory.parseTextureAtlasData(g.texJson, g.texPng.baseTexture ?? g.texPng, name);
          }
        });

        Object.entries(groups).forEach(([name, g]) => {
          if (g.ske) {
            factory.parseDragonBonesData(g.ske, name);
          }
        });

        this.loadedGames[gameCode] = true;
        resolve();
      });
    });
  }

  public static preloadGameImages(gameCode: string): Promise<void> {
    if (this.loadedImages[gameCode]) {
      return Promise.resolve();
    }

    const jsonUrl = `assets/${gameCode}/image/${gameCode}.json`;
    const pngUrl = `assets/${gameCode}/image/${gameCode}.png`;

    return Promise.all([
      fetch(jsonUrl).then(r => r.json()),
      new Promise<PIXI.Texture>(res => {
        const tex = PIXI.Texture.from(pngUrl);
        if (tex.baseTexture.valid) {
          res(tex);
        } else {
          tex.baseTexture.once('loaded', () => res(tex));
        }
      })
    ])
      .then(([jsonData, texture]) => {
        // 將 Egret 格式轉換為 PIXI 格式
        const convertedData = this.convertEgretToPIXI(jsonData);
        
        return new Promise<void>((resolve, reject) => {
          const sheet = new PIXI.Spritesheet(texture.baseTexture, convertedData);
          
          sheet.parse((textures) => {
            console.log(`Successfully parsed ${Object.keys(textures).length} textures for ${gameCode}`);
            this.loadedImages[gameCode] = true;
            resolve();
          });
        });
      })
      .catch((error) => {
        console.error(`Failed to load images for ${gameCode}:`, error);
        this.loadedImages[gameCode] = true;
        throw error;
      });
  }

  // 新增格式轉換方法
  private static convertEgretToPIXI(egretData: any): any {
    const pixiData = {
      frames: {} as { [key: string]: any },
      meta: {
        image: egretData.file,
        format: "RGBA8888",
        size: { w: 0, h: 0 } // 這個會在後面計算
      }
    };

    // 轉換每個 frame
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
        trimmed: egretFrame.offX !== 0 || egretFrame.offY !== 0 || 
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

  /**
   * 安全地取得 texture，包含錯誤處理
   */
  public static getTexture(textureName: string): PIXI.Texture {
    const texture = PIXI.utils.TextureCache[textureName];
    return texture;
  }

  /**
   * 檢查遊戲資源是否已載入
   */
  public static isGameLoaded(gameCode: string): boolean {
    return !!this.loadedImages[gameCode];
  }

  /**
   * 清除特定遊戲的載入狀態（用於重新載入）
   */
  public static clearGameLoadStatus(gameCode: string): void {
    delete this.loadedImages[gameCode];
  }

  // Deprecated helper kept for backwards compatibility. The current build
  // copies the entire `assets` folder to `dist`, so game code can simply
  // reference assets via relative URLs without using webpack's require context.
  // DragonBones files can be accessed under
  // `assets/<gameCode>/dragonBones/<name>_ske.json` and similar paths.
  public static getDragonBonesPaths(
    gameCode: string,
    resName: string
  ): { ske: string; texJson: string; texPng: string } {
    const base = `assets/${gameCode}/dragonBones/`;
    return {
      ske: `${base}${resName}_ske.json`,
      texJson: `${base}${resName}_tex.json`,
      texPng: `${base}${resName}_tex.png`
    } as const;
  }
}
