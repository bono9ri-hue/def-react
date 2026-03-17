/* ==========================================
   [organize.js] 편집 모드, 다중 드래그 선택, 순서 변경(D&D) 엔진 ✏️
   ========================================== */

window.isSelectMode = false;

window.toggleSelectMode = function() {
    window.isSelectMode = !window.isSelectMode;
    const btn = document.getElementById('toggle-select-btn');
    
    if (window.isSelectMode) { 
        // 편집 모드 ON
        btn.innerText = "Done"; 
        btn.style.background = "var(--color-text-main)"; 
        btn.style.color = "var(--color-bg-white)"; 
        document.body.classList.add('edit-mode'); 
        showDeferenceToast("Organize mode active ✏️"); 
    } else { 
        // 편집 모드 OFF
        btn.innerText = "Select"; 
        btn.style.background = "var(--color-bg-white)"; 
        btn.style.color = "var(--color-text-main)"; 
        document.body.classList.remove('edit-mode'); 
        clearSelection(); 
    }

    // 모드가 바뀔 때마다 드래그 앤 드롭 활성화/비활성화 갱신
    if (typeof initDragAndDrop === 'function') initDragAndDrop();
};

window.handleCardClick = function(id, event) {
    if (window.isSelectMode) {
        if(event) event.preventDefault(); 
        toggleSelect(id, event); 
    } else {
        if(typeof openModal === 'function') openModal(id);
    }
};

window.toggleSelect = function(id, event) {
    if (event) event.stopPropagation(); 
    const stringId = String(id);
    if (selectedIds.has(stringId)) {
        selectedIds.delete(stringId);
    } else {
        selectedIds.add(stringId);
    }
    
    if (typeof renderGallery === 'function') renderGallery(); 
    updateMultiSelectBar();
};

window.updateMultiSelectBar = function() {
    const bar = document.getElementById('multi-select-bar');
    const count = document.getElementById('select-count');
    if (!bar || !count) return;
    
    count.innerText = `${selectedIds.size} selected`;
    
    if (window.isSelectMode && selectedIds.size > 0) {
        bar.classList.add('show'); 
    } else {
        bar.classList.remove('show');
    }
};

window.selectAll = function() { 
    selectedIds = new Set(photos.map(p => String(p.id))); 
    if (typeof renderGallery === 'function') renderGallery(); 
    updateMultiSelectBar(); 
};

window.clearSelection = function() { 
    selectedIds.clear(); 
    if (typeof renderGallery === 'function') renderGallery(); 
    updateMultiSelectBar(); 
};

// Esc 키로 선택 모드 탈출
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.isSelectMode) {
        toggleSelectMode(); 
    }
});


/* ==========================================
   드래그 박스 (마키 다중 선택) 엔진 🟦
   ========================================== */
let marqueeBox = null;
let startX = 0, startY = 0;
let isDraggingMarquee = false;
let isSubtracting = false; 
let initialSelectedIds = new Set(); 

const marqueeStyle = document.createElement('style');
marqueeStyle.innerHTML = `
    .marquee-box { position: absolute; border: 1px solid rgba(0, 100, 224, 0.4); background: rgba(0, 100, 224, 0.1); pointer-events: none; z-index: 99999; display: none; border-radius: 4px; transition: background-color 0.1s, border-color 0.1s; }
    .marquee-box.subtract-mode { border-color: rgba(255, 59, 48, 0.5); background-color: rgba(255, 59, 48, 0.15); }
`;
document.head.appendChild(marqueeStyle);

marqueeBox = document.createElement('div');
marqueeBox.className = 'marquee-box';
document.body.appendChild(marqueeBox);

document.addEventListener('mousedown', (e) => {
    if (!window.isSelectMode) return;
    if (e.target.closest('.card') || e.target.closest('button') || e.target.closest('input') || e.target.closest('.modal') || e.target.closest('.color-picker-marker') || e.target.closest('.pcr-app')) return;
    
    isDraggingMarquee = true;
    startX = e.pageX; 
    startY = e.pageY;
    
    isSubtracting = e.altKey;

    if (isSubtracting) marqueeBox.classList.add('subtract-mode');
    else marqueeBox.classList.remove('subtract-mode');
    
    marqueeBox.style.left = startX + 'px'; 
    marqueeBox.style.top = startY + 'px';
    marqueeBox.style.width = '0px'; 
    marqueeBox.style.height = '0px';
    marqueeBox.style.display = 'block';

    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        selectedIds.clear();
        document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    }
    
    initialSelectedIds = new Set(selectedIds);
    updateMultiSelectBar();
});

document.addEventListener('mousemove', (e) => {
    if (!isDraggingMarquee) return;

    const currentX = e.pageX; const currentY = e.pageY;
    const left = Math.min(startX, currentX); const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX); const height = Math.abs(currentY - startY);

    marqueeBox.style.left = left + 'px'; marqueeBox.style.top = top + 'px';
    marqueeBox.style.width = width + 'px'; marqueeBox.style.height = height + 'px';

    const marqueeRect = marqueeBox.getBoundingClientRect();
    
    document.querySelectorAll('.card').forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const isIntersecting = !( 
            marqueeRect.right < cardRect.left || marqueeRect.left > cardRect.right || 
            marqueeRect.bottom < cardRect.top || marqueeRect.top > cardRect.bottom 
        );

        const id = card.getAttribute('data-id');
        
        if (isIntersecting) {
            if (isSubtracting) {
                selectedIds.delete(id);
                card.classList.remove('selected');
            } else {
                selectedIds.add(id);
                card.classList.add('selected');
            }
        } else {
            if (initialSelectedIds.has(id)) {
                selectedIds.add(id);
                card.classList.add('selected');
            } else {
                selectedIds.delete(id);
                card.classList.remove('selected');
            }
        }
    });
    
    updateMultiSelectBar(); 
});

document.addEventListener('mouseup', () => {
    if (isDraggingMarquee) {
        isDraggingMarquee = false;
        marqueeBox.style.display = 'none'; 
    }
});


/* ==========================================
   폴더 내 드래그 앤 드롭 (순서 변경) 엔진 🔄
   ========================================== */
let draggedCard = null;
let dropPlaceholder = document.createElement('div');
dropPlaceholder.className = 'drop-placeholder';

const dragStyle = document.createElement('style');
dragStyle.innerHTML = `
    .drop-placeholder { background: rgba(0, 100, 224, 0.05); border: 2px dashed rgba(0, 100, 224, 0.4); border-radius: var(--radius-none); box-sizing: border-box; transition: all 0.2s ease; }
    .card.dragging { opacity: 0.5; transform: scale(0.95); box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 100; }
`;
document.head.appendChild(dragStyle);

window.initDragAndDrop = function() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        if (window.isSelectMode && currentProject !== 'ALL') {
            card.setAttribute('draggable', 'true');
            card.style.cursor = 'grab';
        } else {
            card.setAttribute('draggable', 'false');
            card.style.cursor = 'pointer';
        }

        card.addEventListener('dragstart', function(e) {
            if (!window.isSelectMode || currentProject === 'ALL') return;
            draggedCard = this;
            setTimeout(() => this.classList.add('dragging'), 0);
            
            const rect = this.getBoundingClientRect();
            dropPlaceholder.style.width = rect.width + 'px';
            dropPlaceholder.style.height = rect.height + 'px';
            
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragover', function(e) {
            e.preventDefault(); 
            if (!draggedCard || this === draggedCard) return;

            const rect = this.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const relX = e.clientX - rect.left;
            
            if (relX < rect.width / 2) {
                this.parentNode.insertBefore(dropPlaceholder, this);
            } else {
                this.parentNode.insertBefore(dropPlaceholder, this.nextSibling);
            }
        });

        card.addEventListener('dragend', async function() {
            this.classList.remove('dragging');
            
            if (dropPlaceholder.parentNode) {
                dropPlaceholder.parentNode.insertBefore(this, dropPlaceholder);
                dropPlaceholder.parentNode.removeChild(dropPlaceholder);
                
                const currentCards = document.querySelectorAll('#gallery .card');
                const orderUpdates = []; 

                currentCards.forEach((c, index) => {
                    const id = c.getAttribute('data-id');
                    const photoData = photos.find(p => String(p.id) === String(id));
                    if (photoData) {
                        if (photoData.sort_index !== index) {
                            photoData.sort_index = index;
                            orderUpdates.push({ id: photoData.id, sort_index: index });
                        }
                    }
                });

                if (orderUpdates.length > 0) {
                    showDeferenceToast("Saving new order... ⏳");
                    try {
                        const token = await window.Clerk.session.getToken();
                        const res = await fetch(`${WORKER_URL}/assets/reorder`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ updates: orderUpdates })
                        });

                        if (!res.ok) throw new Error("Order Save Failed");
                        showDeferenceToast("Order updated! 🔄");
                    } catch (e) {
                        console.error(e);
                        showDeferenceToast("Failed to save order ❌");
                    }
                } else {
                    showDeferenceToast("Order unchanged");
                }
            }
            draggedCard = null;
        });
    });
};