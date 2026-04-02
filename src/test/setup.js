// Provide a minimal localStorage mock for Zustand persist middleware
const storage = {}
globalThis.localStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, value) => { storage[key] = String(value) },
  removeItem: (key) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  get length() { return Object.keys(storage).length },
  key: (i) => Object.keys(storage)[i] ?? null,
}
