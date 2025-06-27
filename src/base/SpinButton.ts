import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';

export class SpinButton extends PIXI.Container {
  private armature: PixiDragonBones;
  private disabled = false;

  constructor(
    gameCode: string,
    resName: string,
    armatureName: string,
    private onPressed: () => void
  ) {
    super();

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
    await this.armature.play('Overlay', false);
    await this.armature.play('Down', false);
    if (this.onPressed) this.onPressed();
  }

  public reset(): void {
    this.disabled = false;
    this.armature.play('Up');
  }
}
