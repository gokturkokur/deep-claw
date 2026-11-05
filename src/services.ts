import type { AudioManager } from './systems/AudioManager';
import type { SaveManager } from './systems/Save';

/** Shared singletons, created once in the Boot scene. */
export const services = {
  save: null as unknown as SaveManager,
  audio: null as unknown as AudioManager,
};
