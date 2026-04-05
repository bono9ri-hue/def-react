import { create } from 'zustand';

const useAssetStore = create((set) => ({
  assets: [],
  collections: [],
  boardAssets: [],
  selectedAssetId: null,
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),
  fetchCollections: () => {}, // Deprecated: Use TanStack Query
  fetchBoardAssets: () => {}, // Deprecated: Use TanStack Query
  deleteCollection: () => {}, // Deprecated: Use TanStack Query
}));

export default useAssetStore;
