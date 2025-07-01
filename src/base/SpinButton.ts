import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';
import { ResourceManager } from './ResourceManager';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

export class SpinButton extends PIXI.Container {
  private spinIcon: PIXI.Sprite;
  private stopIcon: PIXI.Sprite;
  private upArmature: PixiDragonBones;
  private overlayArmature: PixiDragonBones;
  private disabled = false;

  constructor(
    gameCode: string,
    resName: string,
    armatureName: string,
    private onPressed: () => void
  ) {
    super();

    this.spinIcon = new PIXI.Sprite();
    this.stopIcon = new PIXI.Sprite();
    [this.spinIcon, this.stopIcon].forEach(s => {
      s.anchor.set(0.5);
      s.scale.set(1.1);
    });
    this.stopIcon.visible = false;

    this.loadTextures(gameCode, resName);

    this.upArmature = new PixiDragonBones(gameCode, resName, armatureName);
    this.overlayArmature = new PixiDragonBones(gameCode, resName, armatureName);
    this.overlayArmature.visible = false;
    this.addChild(this.overlayArmature);
    this.addChild(this.upArmature);
    this.addChild(this.spinIcon);
    this.addChild(this.stopIcon);

    this.interactive = true;
    this.buttonMode = true;
    this.on('pointerdown', () => this.handleClick());

    this.upArmature.play('Up').then(() => this.emit('loaded'));
  }

  private async handleClick(): Promise<void> {
    if (this.disabled) return;
    this.disabled = true;
    this.spinIcon.visible = false;
    this.stopIcon.visible = true;
    this.overlayArmature.visible = true;
    this.upArmature.visible = false;

    // 等待播放龍骨動畫
    await PixiDragonBones.play(this.overlayArmature, 'Overlay', 1)

    // 播放完後，繼續播放上層動畫
    this.upArmature.visible = true;

    if (this.onPressed) this.onPressed();
  }

  public reset(): void {
    this.disabled = false;
    this.spinIcon.visible = true;
    this.stopIcon.visible = false;
    this.overlayArmature.stop();
    this.overlayArmature.visible = false;
    this.upArmature.play('Up');
  }

  private async loadTextures(gameCode: string, resName: string): Promise<void> {
    await ResourceManager.preloadDragonBones(gameCode);
    const factory = dragonBones.PixiFactory.factory;
    const getSprite = (name: string): PIXI.Sprite =>
      factory.getTextureDisplay(name, resName) as PIXI.Sprite;
    this.spinIcon.texture = getSprite('Btn_Spin/Spin').texture;
    this.stopIcon.texture = getSprite('Btn_Spin/Stop').texture;
  }
}
