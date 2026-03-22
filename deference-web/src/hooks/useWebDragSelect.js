import { useState, useCallback, useRef } from 'react';
import { useSelectionStore } from '../store/useSelectionStore';

/**
 * useWebDragSelect: 데스크톱 웹 전용 마우스 드래그(Marquee) 및 DOM 하이라이팅을 담당하는 훅
 * 
 * @param {Array} items - 데이터를 포함한 배열
 * @param {string} type - 'asset' | 'collection' | 'bookmark' 등 선택 타입
 * @param {string} context - 'sidebar' | 'gallery' | 'trash' 등 선택 발생 지점
 * @param {boolean} isEditMode - 편집 모드 여부
 */
export const useWebDragSelect = (items, type, context, isEditMode, onItemClick) => {
  const [dragBox, setDragBox] = useState(null);
  const cachedRectsRef = useRef([]); 
  const currentDragBoxRef = useRef(null); 
  
  const toggleSingle = useSelectionStore(state => state.toggleSingle);
  const setMarqueeSelection = useSelectionStore(state => state.setMarqueeSelection);
  const clearSelection = useSelectionStore(state => state.clearSelection);
  const initialSelectionRef = useRef([]); // 드래그 시작 시점의 선택 상태 보존

  const onMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    if (e.button !== 0) return; 

    // 1. 개별 아이템 클릭 확인 (상호작용 요소 제외 - DashboardContainer의 onClick과 충돌 방지)
    const itemEl = e.target.closest('[data-selectable-id]');
    if (itemEl && !e.target.closest('button, input, a')) {
        // 아이템 클릭은 DashboardContainer의 onClick에서 처리하되, 
        // 여기서도 stopPropagation을 호출하여 배경 클릭 로직 전파를 차단
        e.stopPropagation();
        return;
    }

    // 2. 드래그 시작 (빈 공간)
    if (e.target.closest('button, input, a, .context-bar')) return;

    // 시작 시점의 전체 선택 상태 스냅샷
    initialSelectionRef.current = useSelectionStore.getState().selectedItems;

    // macOS UX: Cmd/Shift 수식어 없이 드래그가 시작될 때 즉각 선택 해제 (기존 선택 초기화)
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && initialSelectionRef.current.length > 0) {
      clearSelection();
      initialSelectionRef.current = [];
    }

    const startX = e.clientX;
    const startY = e.clientY;

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
        
        setDragBox({ x1: startX, y1: startY, x2: mmE.clientX, y2: mmE.clientY });
        
        const intersectedIds = new Set();
        cachedRectsRef.current.forEach(({ id, rect, node }) => {
            const midX = rect.left + rect.width / 2;
            const midY = rect.top + rect.height / 2;
            if (midX >= xmin && midX <= xmax && midY >= ymin && midY <= ymax) {
                node.classList.add('drag-hover');
                intersectedIds.add(String(id));
            } else {
                node.classList.remove('drag-hover');
            }
        });

        // 실시간 미리보기용 연산 (선택 사항 - 성능 이슈 시 mouseUp으로만 이동)
        // 여기서는 mouseUp에서만 최종 상태를 업데이트하도록 구현
    };

    const handleMouseUp = (muE) => {
        const hoveredNodes = document.querySelectorAll('.drag-hover');
        const intersectedItems = Array.from(hoveredNodes).map(n => ({
            id: String(n.getAttribute('data-selectable-id')),
            type: n.getAttribute('data-selectable-type') || 'asset', // DOM에서 직접 추출하여 무결성 보장
            context
        }));

        const initial = initialSelectionRef.current;
        let finalSelection = [];

        if (muE.altKey) {
            // Subtract: initial - intersected
            finalSelection = initial.filter(i => !intersectedItems.some(ii => String(ii.id) === String(i.id)));
        } else if (muE.ctrlKey || muE.metaKey) {
            // Union: initial + intersected
            const combined = [...initial, ...intersectedItems];
            const seen = new Set();
            finalSelection = combined.filter(i => {
                const key = `${i.id}-${i.type}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        } else if (muE.shiftKey) {
            // XOR (Toggle): (initial - intersected) + (intersected - initial)
            const toRemove = initial.filter(i => intersectedItems.some(ii => String(ii.id) === String(i.id)));
            const toAdd = intersectedItems.filter(ii => !initial.some(i => String(i.id) === String(ii.id)));
            finalSelection = [
                ...initial.filter(i => !toRemove.some(tr => String(tr.id) === String(i.id))),
                ...toAdd
            ];
        } else {
            // Normal: intersected items only
            finalSelection = intersectedItems;
        }

        if (intersectedItems.length > 0 || (!muE.shiftKey && !muE.metaKey && !muE.ctrlKey && !muE.altKey)) {
             setMarqueeSelection(finalSelection);
        }

        hoveredNodes.forEach(n => n.classList.remove('drag-hover'));
        setDragBox(null);
        cachedRectsRef.current = [];
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [items, type, context, isEditMode, setMarqueeSelection]);

  return {
    handleMouseDown: onMouseDown,
    isDragging: !!dragBox,
    selectionBox: dragBox ? {
      left: Math.min(dragBox.x1, dragBox.x2),
      top: Math.min(dragBox.y1, dragBox.y2),
      width: Math.abs(dragBox.x2 - dragBox.x1),
      height: Math.abs(dragBox.y2 - dragBox.y1)
    } : null
  };
};

