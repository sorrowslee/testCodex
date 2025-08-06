export class SoundPlayer {
  private static cache: Record<string, HTMLAudioElement> = {};

  public static play(file: string): void {
    let audio = this.cache[file];
    if (!audio) {
      audio = new Audio(file);
      this.cache[file] = audio;
    }
    audio.currentTime = 0;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    audio.play();
  }
}
