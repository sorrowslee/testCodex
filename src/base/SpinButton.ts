import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';
import { ResourceManager } from './ResourceManager';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dragonBones = require('pixi5-dragonbones');

export class SpinButton extends PIXI.Container {
  private base: PIXI.Sprite;
  private spinIcon: PIXI.Sprite;
  private stopIcon: PIXI.Sprite;
  private armature: PixiDragonBones;
  private disabled = false;

  constructor(
    gameCode: string,
    resName: string,
    armatureName: string,
    private onPressed: () => void
  ) {
    super();

    this.base = new PIXI.Sprite();
    this.spinIcon = new PIXI.Sprite();
    this.stopIcon = new PIXI.Sprite();
    [this.base, this.spinIcon, this.stopIcon].forEach(s => {
      s.anchor.set(0.5);
      s.scale.set(1.1);
    });
    this.stopIcon.visible = false;
    this.addChild(this.base);
    this.addChild(this.spinIcon);
    this.addChild(this.stopIcon);

    this.loadTextures(gameCode, resName);

    this.armature = new PixiDragonBones(gameCode, resName, armatureName);
    this.addChild(this.armature);

    this.interactive = true;
    this.buttonMode = true;
    this.on('pointerdown', () => this.handleClick());

    this.armature.play('Up').then(() => this.emit('loaded'));
  }

  private async handleClick(): Promise<void> {
    if (this.disabled) return;
    this.disabled = true;
    this.spinIcon.visible = false;
    this.stopIcon.visible = true;
    await this.armature.play('Overlay', false);
    await this.armature.play('Down', false);
    if (this.onPressed) this.onPressed();
  }

  public reset(): void {
    this.disabled = false;
    this.spinIcon.visible = true;
    this.stopIcon.visible = false;
    this.armature.play('Up');
  }

  private async loadTextures(gameCode: string, resName: string): Promise<void> {
    await ResourceManager.preloadDragonBones(gameCode);
    const factory = dragonBones.PixiFactory.factory;
    const getSprite = (name: string): PIXI.Sprite =>
      factory.getTextureDisplay(name, resName) as PIXI.Sprite;
    this.base.texture = getSprite('Btn_Spin/Get').texture;
    this.spinIcon.texture = getSprite('Btn_Spin/Spin').texture;
    this.stopIcon.texture = getSprite('Btn_Spin/Stop').texture;
  }
}
