const STORAGE_KEY = 'atpl_law_userdata';
const CURRENT_VERSION = 1;

export function getDefaultUserData() {
  return {
    version: CURRENT_VERSION,
    exportedAt: null,
    regulations: {},
    links: {},
    notes: {},
  };
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultUserData();
    const parsed = JSON.parse(raw);
    return migrateIfNeeded(parsed);
  } catch (e) {
    console.error('Failed to load user data:', e);
    return getDefaultUserData();
  }
}

export function saveToStorage(userData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}

function migrateIfNeeded(data) {
  if (!data.version) {
    data.version = CURRENT_VERSION;
  }
  if (!data.regulations) data.regulations = {};
  if (!data.links) data.links = {};
  if (!data.notes) data.notes = {};
  return data;
}
