import Phaser from 'phaser';
import type { SoundKey } from '../assets/manifest';
import type { SaveManager } from './Save';

/** Plays music and sound effects with separate, persisted volumes. */
export class AudioManager {
  private music: Phaser.Sound.BaseSound | null = null;
  private musicKey: SoundKey | null = null;
  private loops = new Map<SoundKey, Phaser.Sound.BaseSound>();
  private hidden = false;

  constructor(
    private readonly game: Phaser.Game,
    private readonly save: SaveManager,
  ) {
    const onVis = () => this.setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', () => this.setHidden(true));
    window.addEventListener('focus', () => this.setHidden(document.hidden));
  }

  private get sound(): Phaser.Sound.BaseSoundManager {
    return this.game.sound;
  }

  get musicVolume(): number {
    return this.save.data.settings.music;
  }
  get sfxVolume(): number {
    return this.save.data.settings.sfx;
  }

  /** Mute everything (and pause the music) while the page or app is in the background. */
  setHidden(hidden: boolean): void {
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    this.sound.mute = hidden;
    if (hidden) this.sound.pauseAll();
    else this.sound.resumeAll();
  }

  sfx(key: SoundKey, volume = 1, rate = 1): void {
    const v = this.sfxVolume * volume;
    if (v <= 0.001 || this.hidden) return;
    if (!this.game.cache.audio.exists(key)) return;
    this.sound.play(key, { volume: v, rate });
  }

  /** Start / stop a looping effect (the winch ratchet). */
  loop(key: SoundKey, on: boolean, volume = 0.5): void {
    let s = this.loops.get(key);
    if (on) {
      if (!this.game.cache.audio.exists(key)) return;
      if (!s) {
        s = this.sound.add(key, { loop: true, volume: this.sfxVolume * volume });
        this.loops.set(key, s);
      }
      (s as Phaser.Sound.WebAudioSound).setVolume(this.sfxVolume * volume);
      if (!s.isPlaying) s.play();
    } else if (s && s.isPlaying) {
      s.stop();
    }
  }

  playMusic(key: SoundKey): void {
    if (this.musicKey === key && this.music) {
      this.applyVolumes();
      return;
    }
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
    this.musicKey = key;
    if (!this.game.cache.audio.exists(key)) return;
    this.music = this.sound.add(key, { loop: true, volume: this.musicVolume * 0.6 });
    this.music.play();
  }

  stopMusic(): void {
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
    this.musicKey = null;
  }

  setMusicVolume(v: number): void {
    this.save.data.settings.music = v;
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.save.data.settings.sfx = v;
  }

  applyVolumes(): void {
    if (this.music) (this.music as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume * 0.6);
  }

  vibrate(ms: number): void {
    if (!this.save.data.settings.vibration) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* not supported */
    }
  }
}
