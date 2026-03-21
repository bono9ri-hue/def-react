import { useState, useCallback, useRef } from 'react';

/**
 * useWebDragSelect: 데스크톱 웹 전용 마우스 드래그(Marquee) 및 DOM 하이라이팅을 담당하는 훅
 * (브라우저 DOM API에 직접 의존하며, 성능을 위해 Vanilla JS로 실시간 하이라이팅 제어)
 * 
 * @param {Array} items - 데이터를 포함한 배열
 * @param {string} type - 'asset' | 'collection' | 'bookmark' 등 선택 타입
 * @param {function} onSelectionComplete - 드래그 종료 시 호출될 콜백 (선택된 ID들의 Set 전달)
 * @param {function} onItemClick - 개별 아이템 클릭 시 호출될 콜백 (Core Hook의 handleSelect 연결용)
 * @param {boolean} isEditMode - 편집 모드 여부
 */
export const useWebDragSelect = (items, type, onSelectionComplete, onItemClick, isEditMode) => {
  const [dragBox, setDragBox] = useState(null);
  const cachedRectsRef = useRef([]); // 드래그 성능 최적화를 위한 좌표 캐싱
  const currentDragBoxRef = useRef(null); // 실시간 드래그 좌표 저장용

  const onMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    if (e.button !== 0) return; // 좌클릭만 허용

    // 1. 개별 아이템 클릭 확인 (상호작용 요소 제외)
    const itemEl = e.target.closest('[data-selectable-id]');
    if (itemEl && !e.target.closest('button, input, a')) {
      const id = itemEl.getAttribute('data-selectable-id');
      const item = items.find(i => String(i.id) === id);
      const index = items.findIndex(i => String(i.id) === id);
      if (item && onItemClick) {
        onItemClick(e, item, index);
        return;
      }
    }

    // 2. 드래그 시작 (빈 공간 또는 아이템 외곽)
    if (e.target.closest('button, input, a')) return;

    const startX = e.clientX;
    const startY = e.clientY;
    currentDragBoxRef.current = null;

    // 선택 가능한 요소들 좌표 및 Node 캐싱
    const selectableNodes = document.querySelectorAll(`[data-selectable-type="${type}"]`);
    cachedRectsRef.current = Array.from(selectableNodes).map(node => ({
        id: node.getAttribute('data-selectable-id'),
        rect: node.getBoundingClientRect(),
        node: node
    }));

    const handleMouseMove = (mmE) => {
        const xmin = Math.min(startX, mmE.clientX);
        const xmax = Math.max(startX, mmE.clientX);
        const ymin = Math.min(startY, mmE.clientY);
        const ymax = Math.max(startY, mmE.clientY);
        
        const box = { x1: startX, y1: startY, x2: mmE.clientX, y2: mmE.clientY, xmin, xmax, ymin, ymax };
        setDragBox({ x1: startX, y1: startY, x2: mmE.clientX, y2: mmE.clientY });
        currentDragBoxRef.current = box;

        // 💡 실시간 DOM 직접 제어: React 상태 업데이트 없이 하이라이팅 (60fps 성능 확보)
        cachedRectsRef.current.forEach(({ rect, node }) => {
            const midX = rect.left + rect.width / 2;
            const midY = rect.top + rect.height / 2;
            if (midX >= xmin && midX <= xmax && midY >= ymin && midY <= ymax) {
                node.classList.add('drag-hover');
            } else {
                node.classList.remove('drag-hover');
            }
        });
    };

    const handleMouseUp = () => {
        // 💡 지연 평가: 마우스를 뗄 때 .drag-hover 클래스를 가진 요소들만 취합하여 단 1회 상태 업데이트 요청
        const hoveredNodes = document.querySelectorAll('.drag-hover');
        if (hoveredNodes.length > 0 && onSelectionComplete) {
            const nextItems = new Set(Array.from(hoveredNodes).map(n => n.getAttribute('data-selectable-id')));
            onSelectionComplete(nextItems);
        }

        // Cleanup: 부여된 임시 클래스 및 리스너 제거
        hoveredNodes.forEach(n => n.classList.remove('drag-hover'));
        setDragBox(null);
        currentDragBoxRef.current = null;
        cachedRectsRef.current = [];
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [items, type, onSelectionComplete, onItemClick, isEditMode]);

  return {
    onMouseDown,
    dragBox
  };
};
