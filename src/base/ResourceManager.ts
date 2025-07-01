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
        if (!jsonData.meta) {
          jsonData.meta = { image: jsonData.file };
        } else if (!jsonData.meta.image && jsonData.file) {
          jsonData.meta.image = jsonData.file;
        }
        return new Promise<void>(resolve => {
          const sheet = new PIXI.Spritesheet(texture.baseTexture, jsonData);
          sheet.parse(() => {
            this.loadedImages[gameCode] = true;
            resolve();
          });
        });
      })
      .catch(() => {
        this.loadedImages[gameCode] = true;
      });
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
