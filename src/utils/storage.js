const STORAGE_KEY = 'fishing-log-catches';

export function loadCatches() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCatches(catches) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(catches));
}
