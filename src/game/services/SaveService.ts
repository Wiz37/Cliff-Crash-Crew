import { Preferences } from '@capacitor/preferences';

export interface SaveData {
  stars: number;
  bestScore: number;
  selectedVehicle: string;
  unlockedVehicles: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const STORAGE_KEY = 'cliff-crash-crew-save-v2';
const DEFAULT_SAVE: SaveData = {
  stars: 0,
  bestScore: 0,
  selectedVehicle: 'buggy',
  unlockedVehicles: ['buggy'],
  soundEnabled: true,
  musicEnabled: true,
};

function sanitize(value: Partial<SaveData> | null): SaveData {
  const unlocked = Array.isArray(value?.unlockedVehicles) ? value.unlockedVehicles.filter((id): id is string => typeof id === 'string') : ['buggy'];
  if (!unlocked.includes('buggy')) unlocked.unshift('buggy');
  return {
    stars: Number.isFinite(value?.stars) ? Math.max(0, Math.floor(value?.stars ?? 0)) : 0,
    bestScore: Number.isFinite(value?.bestScore) ? Math.max(0, Math.floor(value?.bestScore ?? 0)) : 0,
    selectedVehicle: typeof value?.selectedVehicle === 'string' ? value.selectedVehicle : 'buggy',
    unlockedVehicles: [...new Set(unlocked)],
    soundEnabled: value?.soundEnabled !== false,
    musicEnabled: value?.musicEnabled !== false,
  };
}

function loadLocal(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw) as Partial<SaveData>) : { ...DEFAULT_SAVE };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export class SaveService {
  private static state: SaveData = loadLocal();

  static get(): SaveData {
    return {
      ...this.state,
      unlockedVehicles: [...this.state.unlockedVehicles],
    };
  }

  static update(patch: Partial<SaveData>): SaveData {
    this.state = sanitize({ ...this.state, ...patch });
    const serialized = JSON.stringify(this.state);
    localStorage.setItem(STORAGE_KEY, serialized);
    void Preferences.set({ key: STORAGE_KEY, value: serialized }).catch(() => undefined);
    return this.get();
  }

  static addStars(amount: number): SaveData {
    return this.update({ stars: this.state.stars + Math.max(0, Math.floor(amount)) });
  }

  static spendStars(amount: number): boolean {
    const cost = Math.max(0, Math.floor(amount));
    if (this.state.stars < cost) return false;
    this.update({ stars: this.state.stars - cost });
    return true;
  }

  static unlockVehicle(id: string): SaveData {
    if (this.state.unlockedVehicles.includes(id)) return this.get();
    return this.update({ unlockedVehicles: [...this.state.unlockedVehicles, id], selectedVehicle: id });
  }

  static async hydrateNative(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (!value) return;
      const nativeSave = sanitize(JSON.parse(value) as Partial<SaveData>);
      if (nativeSave.bestScore >= this.state.bestScore || nativeSave.stars >= this.state.stars) {
        this.state = nativeSave;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nativeSave));
      }
    } catch {
      // Local storage remains the source of truth when native preferences are unavailable.
    }
  }
}
