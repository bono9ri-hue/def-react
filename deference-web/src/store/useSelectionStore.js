import { create } from 'zustand';

export const useSelectionStore = create((set, get) => ({
  selectedItems: [],
  anchorId: null, // Shift 클릭의 기준점
  isEditMode: false,

  setEditMode: (mode) => set({ isEditMode: mode, selectedItems: [], anchorId: null }),
  
  // 1. 단일 선택 (Click)
  selectSingle: (item, context) => set({
    selectedItems: [{ id: String(item.id), type: item.type, context }],
    anchorId: String(item.id)
  }),

  // 2. 개별 토글 (Cmd/Ctrl + Click)
  toggleSingle: (item, context) => set((state) => {
    const exists = state.selectedItems.some(i => i.id === String(item.id));
    if (exists) {
      return { 
        selectedItems: state.selectedItems.filter(i => i.id !== String(item.id)),
        anchorId: String(item.id) // 해제해도 앵커는 갱신됨
      };
    } else {
      return { 
        selectedItems: [...state.selectedItems, { id: String(item.id), type: item.type, context }],
        anchorId: String(item.id)
      };
    }
  }),

  // 3. 범위 선택 (Shift + Click)
  selectRange: (targetItem, currentList, type, context) => set((state) => {
    if (!state.anchorId) {
      return { selectedItems: [{ id: String(targetItem.id), type, context }], anchorId: String(targetItem.id) };
    }
    
    const anchorIndex = currentList.findIndex(i => String(i.id) === state.anchorId);
    const targetIndex = currentList.findIndex(i => String(i.id) === String(targetItem.id));
    
    if (anchorIndex === -1 || targetIndex === -1) return state; // 안전 장치

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    
    // macOS UX: Shift 클릭 시 기존 선택을 초기화하고 Anchor~Target 범위만 선택함
    const rangeItems = currentList.slice(start, end + 1).map(i => ({ id: String(i.id), type, context }));
    return { selectedItems: rangeItems }; 
  }),

  // 4. 드래그 덮어쓰기 (Marquee)
  setMarqueeSelection: (items) => set({
    selectedItems: items,
    // 드래그 종료 시 가장 마지막 아이템을 앵커로 설정 (이후 Shift 클릭 대응)
    anchorId: items.length > 0 ? items[items.length - 1].id : null 
  }),

  clearSelection: () => set({ selectedItems: [], anchorId: null }),
}));
