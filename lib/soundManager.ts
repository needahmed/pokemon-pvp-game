/**
 * Sound Manager for handling game audio
 */

class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Load sound preference from localStorage if available
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('soundEnabled');
      const savedVolume = localStorage.getItem('soundVolume');
      
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }
      
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
      }
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public play(soundPath: string, options?: { volume?: number; loop?: boolean }): void {
    if (!this.enabled) return;

    try {
      let audio = this.audioCache.get(soundPath);
      
      if (!audio) {
        audio = new Audio(soundPath);
        this.audioCache.set(soundPath, audio);
      }

      audio.volume = options?.volume ?? this.volume;
      audio.loop = options?.loop ?? false;
      
      // Reset audio to beginning if already playing
      audio.currentTime = 0;
      
      audio.play().catch((error) => {
        console.warn('Failed to play sound:', soundPath, error);
      });
    } catch (error) {
      console.error('Error playing sound:', soundPath, error);
    }
  }

  public stop(soundPath: string): void {
    const audio = this.audioCache.get(soundPath);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  public stopAll(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', String(enabled));
    }
    
    if (!enabled) {
      this.stopAll();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', String(this.volume));
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public preload(soundPaths: string[]): void {
    soundPaths.forEach((path) => {
      if (!this.audioCache.has(path)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.audioCache.set(path, audio);
      }
    });
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();

// Common sound paths
export const SOUNDS = {
  MOVE_SELECT: '/sounds/move-select.mp3',
  POKEMON_HURT: '/sounds/pokemon-hurt.mp3',
  POKEMON_FAINT: '/sounds/pokemon-faint.mp3',
  BATTLE_START: '/sounds/battle-start.mp3',
  BATTLE_END: '/sounds/battle-end.mp3',
  SWITCH_POKEMON: '/sounds/switch.mp3',
  CRITICAL_HIT: '/sounds/critical-hit.mp3',
  SUPER_EFFECTIVE: '/sounds/super-effective.mp3',
};
