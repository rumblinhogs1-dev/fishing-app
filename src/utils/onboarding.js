const STORAGE_KEY = 'onboarding_v1';

const DEFAULT_STATE = {
  welcomed: false,
  dismissed: false,
  steps: {
    profile: false,
    firstCatch: false,
    fishId: false,
    exploredMap: false,
  },
  ts: Date.now(),
};

export function getOnboardingState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setOnboardingState(updates) {
  const current = getOnboardingState() || { ...DEFAULT_STATE };
  const next = { ...current, ...updates, ts: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function markStepComplete(stepKey) {
  const current = getOnboardingState() || { ...DEFAULT_STATE };
  const steps = { ...current.steps, [stepKey]: true };
  return setOnboardingState({ steps });
}

export function isAllComplete(state) {
  if (!state?.steps) return false;
  return Object.values(state.steps).every(Boolean);
}
