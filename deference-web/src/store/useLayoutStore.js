import { create } from 'zustand';

/**
 * Global store for managing application layout state.
 * Specifically handles the responsive sidebar and mobile overlay.
 */
const useLayoutStore = create((set) => ({
  // Phase 1 Purge: All sidebar states removed.
}));

export default useLayoutStore;
