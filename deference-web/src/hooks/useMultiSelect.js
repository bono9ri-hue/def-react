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
  const [dragBox, setDragBox] = useState(null);
  const cachedRectsRef = useRef([]); // 드래그 성능 최적화를 위한 좌표 캐싱

  /**
   * handleSelect: 클릭 이벤트 또는 범위 선택 시 다중 선택 로직 수행
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

  /**
   * onMouseDown: 통합 마우스 핸들러 (개별 클릭 및 드래그 시작)
   */
  const onMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    if (e.button !== 0) return;

    // 1. 개별 아이템 클릭 체크 (버튼 등 상호작용 요소 제외)
    const itemEl = e.target.closest('[data-selectable-id]');
    if (itemEl && !e.target.closest('button, input, a')) {
      const id = itemEl.getAttribute('data-selectable-id');
      const item = items.find(i => String(i.id) === id);
      const index = items.findIndex(i => String(i.id) === id);
      if (item) {
        handleSelect(e, item, index);
        return;
      }
    }

    // 2. 드래그 시작 (빈 공간 또는 아이템 외곽)
    if (e.target.closest('button, input, a')) return;

    const startX = e.clientX;
    const startY = e.clientY;

    // 선택 가능한 요소들 좌표 캐싱
    const selectableNodes = document.querySelectorAll(`[data-selectable-type="${type}"]`);
    cachedRectsRef.current = Array.from(selectableNodes).map(node => ({
      id: node.getAttribute('data-selectable-id'),
      rect: node.getBoundingClientRect()
    }));

    const handleMouseMove = (mmE) => {
      const currentDragBox = { x1: startX, y1: startY, x2: mmE.clientX, y2: mmE.clientY };
      setDragBox(currentDragBox);

      const xmin = Math.min(startX, mmE.clientX);
      const xmax = Math.max(startX, mmE.clientX);
      const ymin = Math.min(startY, mmE.clientY);
      const ymax = Math.max(startY, mmE.clientY);

      setActiveContext(prev => {
        const isAdditive = mmE.shiftKey || mmE.metaKey || mmE.ctrlKey;
        const isSubtractive = mmE.altKey;
        const baseItems = (isAdditive || isSubtractive) ? new Set(prev?.items) : new Set();
        
        const newInBox = new Set();
        cachedRectsRef.current.forEach(({ id, rect }) => {
          const midX = rect.left + rect.width / 2;
          const midY = rect.top + rect.height / 2;
          if (midX >= xmin && midX <= xmax && midY >= ymin && midY <= ymax) {
            newInBox.add(id);
          }
        });

        if (isSubtractive) {
          newInBox.forEach(id => baseItems.delete(id));
        } else {
          newInBox.forEach(id => baseItems.add(id));
        }

        return { type, items: baseItems };
      });
    };

    const handleMouseUp = () => {
      setDragBox(null);
      cachedRectsRef.current = [];
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [items, type, setActiveContext, isEditMode, handleSelect]);

  return {
    onMouseDown,
    dragBox,
    anchorIndex,
    setAnchorIndex
  };
};
