import { useState, useCallback, useRef } from 'react';

/**
 * useMultiSelect: Apple Finder 스타일의 다중 선택 및 드래그(Marquee) 로직을 담당하는 Headless Hook
 * 
 * @param {Array} items - 데이터를 포함한 배열 (각 항목은 id 속성을 가져야 함)
 * @param {string} type - 'asset' | 'collection' | 'bookmark' 등 현재 선택 컨텍스트 타입
 * @param {function} setActiveContext - 전역 상태(activeContext) 업데이트 함수
 * @param {boolean} isEditMode - 편집 모드 여부 (마스터 스위치)
 */
export const useMultiSelect = (items, type, setActiveContext, isEditMode) => {
  const [anchorIndex, setAnchorIndex] = useState(null);

  /**
   * handleSelect: 클릭 이벤트 또는 범위 선택 시 다중 선택 로직 수행
   * (Pure Logic: React Native 등 타 플랫폼에서도 이벤트 객체의 modifier key 정보만 넘겨주면 동작 가능)
   */
  const handleSelect = useCallback((e, item, index) => {
    setActiveContext(prev => {
      const isDifferentType = !prev || prev.type !== type;
      let nextItems = isDifferentType ? new Set() : new Set(prev.items);
      const itemId = String(item.id);

      if (e.metaKey || e.ctrlKey) {
        if (nextItems.has(itemId)) nextItems.delete(itemId);
        else nextItems.add(itemId);
        setAnchorIndex(index);
      } 
      else if (e.shiftKey && anchorIndex !== null) {
        nextItems = new Set();
        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);
        for (let i = start; i <= end; i++) {
          if (items[i]) nextItems.add(String(items[i].id));
        }
      } 
      else {
        nextItems = new Set([itemId]);
        setAnchorIndex(index);
      }

      return { type, items: nextItems };
    });
  }, [items, type, setActiveContext, anchorIndex]);

  return {
    handleSelect,
    anchorIndex,
    setAnchorIndex
  };
};
