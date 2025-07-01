import * as PIXI from 'pixi.js';
// Expose PIXI globally for pixi5-dragonbones which expects a global PIXI.
(window as any).PIXI = PIXI;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

// webpack require context for all dragonBones assets
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBonesContext = (require as any).context('../../assets', true, /dragonBones\/.*\.(json|png)$/);
// webpack require context for game image atlases
// eslint-disable-next-line @typescript-eslint/no-var-requires
const imageContext = (require as any).context('../../assets', true, /image\/.*\.(json|png)$/);

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

    const jsonKey = `./${gameCode}/image/${gameCode}.json`;
    const pngKey = `./${gameCode}/image/${gameCode}.png`;

    const keys = imageContext.keys();
    if (!keys.includes(jsonKey) || !keys.includes(pngKey)) {
      this.loadedImages[gameCode] = true;
      return Promise.resolve();
    }

    const loader = new PIXI.Loader();
    loader.add(jsonKey, imageContext(jsonKey));
    loader.add(pngKey, imageContext(pngKey));

    return new Promise(resolve => {
      loader.load((l, res) => {
        const jsonData = res[jsonKey]?.data;
        const texture = res[pngKey]?.texture;
        if (jsonData && texture) {
          // Some atlas JSON files in this project use a non-standard
          // "file" field instead of the expected meta.image property.
          // Pixi's Spritesheet loader expects json.meta.image to exist,
          // so provide it if missing to avoid runtime errors.
          if (!jsonData.meta) {
            jsonData.meta = { image: jsonData.file };
          } else if (!jsonData.meta.image && jsonData.file) {
            jsonData.meta.image = jsonData.file;
          }

          const sheet = new PIXI.Spritesheet(
            texture.baseTexture ?? texture,
            jsonData
          );
          sheet.parse(() => {
            this.loadedImages[gameCode] = true;
            resolve();
          });
        } else {
          this.loadedImages[gameCode] = true;
          resolve();
        }
      });
    });
  }

  public static getDragonBonesPaths(
    gameCode: string,
    resName: string
  ): { ske: string; texJson: string; texPng: string } {
    const base = `./${gameCode}/dragonBones/`;
    const skeKey = `${base}${resName}_ske.json`;
    const texJsonKey = `${base}${resName}_tex.json`;
    const texPngKey = `${base}${resName}_tex.png`;
    return {
      ske: dragonBonesContext(skeKey),
      texJson: dragonBonesContext(texJsonKey),
      texPng: dragonBonesContext(texPngKey)
    } as const;
  }
}
