import { create } from 'zustand';

const useAssetStore = create((set) => ({
  assets: [],
  // 향후 데이터 패칭 로직이 들어갈 자리
}));

export default useAssetStore;
