import { create } from 'zustand';

const useAssetStore = create((set) => ({
  assets: [],
  collections: [],
  boardAssets: [],
  fetchCollections: () => {}, // Deprecated: Use TanStack Query
  fetchBoardAssets: () => {}, // Deprecated: Use TanStack Query
  deleteCollection: () => {}, // Deprecated: Use TanStack Query
}));

export default useAssetStore;
