import * as PIXI from 'pixi.js';

// webpack require context for all dragonBones assets
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBonesContext = (require as any).context('../../assets', true, /dragonBones\/.*\.(json|png)$/);

export class ResourceManager {
  private static loadedGames: Record<string, boolean> = {};

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
      loader.load(() => {
        this.loadedGames[gameCode] = true;
        resolve();
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
