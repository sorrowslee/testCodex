import * as PIXI from 'pixi.js';

export class SpinButton extends PIXI.Container {
  private base: PIXI.Sprite;
  private spinIcon: PIXI.Sprite;
  private stopIcon: PIXI.Sprite;
  private idleAnim: PIXI.AnimatedSprite;
  private overlayAnim: PIXI.AnimatedSprite;
  private disabled = false;

  constructor(gameCode: string, private onPressed: () => void) {
    super();
    const prefix = `assets/${gameCode}/spinButton/`;
    this.base = PIXI.Sprite.from(`${prefix}Btn_Spin_Get.png`);
    this.spinIcon = PIXI.Sprite.from(`${prefix}Btn_Spin_Spin.png`);
    this.stopIcon = PIXI.Sprite.from(`${prefix}Btn_Spin_Stop.png`);
    [this.base, this.spinIcon, this.stopIcon].forEach(s => {
      s.anchor.set(0.5);
    });
    this.stopIcon.visible = false;
    this.addChild(this.base);
    this.addChild(this.spinIcon);
    this.addChild(this.stopIcon);

    const idleFrames: PIXI.Texture[] = [];
    for (let i = 0; i <= 23; i++) {
      idleFrames.push(
        PIXI.Texture.from(`${prefix}Btn_Spin_btn_spin_Up_Spine_Up_${i}.png`)
      );
    }
    this.idleAnim = new PIXI.AnimatedSprite(idleFrames);
    this.idleAnim.anchor.set(0.5);
    this.idleAnim.animationSpeed = 0.5;
    this.idleAnim.loop = true;
    this.idleAnim.play();
    this.addChild(this.idleAnim);

    const overlayFrames: PIXI.Texture[] = [];
    for (let i = 0; i <= 12; i++) {
      overlayFrames.push(
        PIXI.Texture.from(`${prefix}Btn_Spin_btn_spin_overlay_spin_overlay_${i}.png`)
      );
    }
    this.overlayAnim = new PIXI.AnimatedSprite(overlayFrames);
    this.overlayAnim.anchor.set(0.5);
    this.overlayAnim.loop = false;
    this.overlayAnim.visible = false;
    this.overlayAnim.animationSpeed = 0.5;
    this.overlayAnim.onComplete = () => {
      this.overlayAnim.visible = false;
    };
    this.addChild(this.overlayAnim);

    this.interactive = true;
    this.buttonMode = true;
    this.on('pointerdown', () => this.handleClick());

    if (this.base.texture.baseTexture.valid) {
      this.emit('loaded');
    } else {
      this.base.texture.baseTexture.once('loaded', () => this.emit('loaded'));
    }
  }

  private handleClick() {
    if (this.disabled) return;
    this.disabled = true;
    this.spinIcon.visible = false;
    this.stopIcon.visible = true;
    this.overlayAnim.visible = true;
    this.overlayAnim.gotoAndPlay(0);
    if (this.onPressed) this.onPressed();
  }

  public reset(): void {
    this.disabled = false;
    this.spinIcon.visible = true;
    this.stopIcon.visible = false;
    this.overlayAnim.stop();
    this.overlayAnim.visible = false;
  }
}
