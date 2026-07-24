import { DEFAULT_SETTINGS } from './constants';
import type { ConnectionStore, Profile, Settings } from './types';

const SETTINGS_KEY = 'image-generator-connection';

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createProfile(name = '默认配置', settings: Settings = DEFAULT_SETTINGS): Profile {
  return { id: createId(), name, ...settings };
}

export function normalizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const settings = { ...DEFAULT_SETTINGS, ...(input || {}) };
  if (settings.model === 'gpt-image-1' || settings.model === 'firefly-gpt-image-2') settings.model = 'gpt-image-2';
  return settings;
}

export function loadConnectionStore(): ConnectionStore {
  if (typeof window === 'undefined') {
    const profile = createProfile();
    return { profiles: [profile], activeId: profile.id };
  }

  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (raw && Array.isArray(raw.profiles) && raw.profiles.length > 0) {
      const profiles = raw.profiles.map((item: Partial<Profile>, index: number) => ({
        id: typeof item.id === 'string' && item.id ? item.id : createId(),
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `配置 ${index + 1}`,
        ...normalizeSettings(item),
      }));
      const activeId = profiles.some((item: Profile) => item.id === raw.activeId) ? raw.activeId : profiles[0].id;
      return { profiles, activeId };
    }

    if (raw && typeof raw === 'object') {
      const profile = createProfile('默认配置', normalizeSettings(raw));
      return { profiles: [profile], activeId: profile.id };
    }
  } catch {
    // fall through
  }

  const profile = createProfile();
  return { profiles: [profile], activeId: profile.id };
}

export function persistConnectionStore(store: ConnectionStore) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(store));
}

export function getActiveProfile(store: ConnectionStore) {
  return store.profiles.find((item) => item.id === store.activeId) || store.profiles[0];
}

export function toSettings(profile: Profile): Settings {
  return {
    apiBaseUrl: profile.apiBaseUrl,
    apiKey: profile.apiKey,
    model: profile.model,
  };
}
