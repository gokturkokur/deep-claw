import Phaser from 'phaser';
import { SaveManager, safeStore } from '../systems/Save';
import { AudioManager } from '../systems/AudioManager';
import { services } from '../services';
import { detectLang, setLang } from '../i18n';

/** Creates the shared services, waits for the bundled font, then starts loading. */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    services.save = new SaveManager(safeStore());
    services.audio = new AudioManager(this.game, services.save);
    setLang(services.save.data.settings.lang ?? detectLang());

    if (new URLSearchParams(location.search).get('debug') === '1') {
      (window as unknown as Record<string, unknown>).__game = this.game;
      (window as unknown as Record<string, unknown>).__dc = { game: this.game, services };
    }

    const go = () => this.scene.start('Preload');
    let started = false;
    const once = () => {
      if (started) return;
      started = true;
      go();
    };
    // Wait (max 2.5 s) for the bundled font so no text is ever drawn with a fallback font.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      Promise.all([fonts.load('40px "Lilita One"'), fonts.load('40px "Lilita One"', 'ğşıİçöüĞŞÇÖÜ')]).then(once, once);
      window.setTimeout(once, 2500);
    } else once();
  }
}
