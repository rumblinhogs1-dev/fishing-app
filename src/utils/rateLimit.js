export function createCooldown(ms = 3000) {
  let lastCall = 0;

  return {
    check() {
      const now = Date.now();
      if (now - lastCall < ms) {
        const remaining = Math.ceil((ms - (now - lastCall)) / 1000);
        throw new Error(`Please wait ${remaining}s before trying again.`);
      }
      lastCall = now;
    },
    reset() {
      lastCall = 0;
    },
  };
}
