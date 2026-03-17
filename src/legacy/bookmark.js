/* ==========================================
   [bookmark.js] 스피드 다이얼 북마크 전담 요원 🌟
   ========================================== */

let bookmarks = [];
let draggedItemIndex = null;

// 1. 북마크 데이터 불러오기 및 초기화
async function initBookmarks() {
    bookmarks = await fetchBookmarksAPI();
    renderBookmarks();
}

// 2. 화면에 북마크 그리기
function renderBookmarks() {
    const container = document.getElementById('bookmark-container');
    if (!container) return;
    container.innerHTML = ""; // 기존 내용 비우기

    // 북마크 아이템들 렌더링
    bookmarks.forEach((bm, index) => {
        const item = document.createElement('a');
        item.className = 'bookmark-item';
        item.href = bm.url;
        item.target = '_blank';
        item.draggable = true; 
        item.dataset.index = index;

        const firstLetter = bm.name ? bm.name.charAt(0).toUpperCase() : '?';
        
        // 🌟 [핵심 마법] URL에서 도메인(pinterest.com)만 쏙 뽑아내서 구글에게 파비콘을 요구합니다!
        let domain = "";
        try { domain = new URL(bm.url).hostname; } catch(e) {}
        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

        const scale = bm.icon_scale || 1.0; // 개별 크기값 가져오기 (없으면 1배)
        
        // img 태그의 transform: scale()에 변수를 넣어주고, background를 투명(transparent)으로 바꿨습니다!
        item.innerHTML = `
            <div class="bookmark-icon" style="background-color: ${bm.icon_value || '#333'}; position: relative; overflow: hidden; pointer-events: none; border: none;">
                <span style="position: absolute; z-index: 1; pointer-events: none;">${firstLetter}</span>
                
                <img src="${faviconUrl}" draggable="false" style="width: 100%; height: 100%; object-fit: cover; position: absolute; z-index: 2; background: #fff; transform: scale(${scale}); pointer-events: none;" onerror="this.style.display='none'">
            </div>
            <div class="bookmark-name" style="pointer-events: none;">${bm.name}</div>
        `;

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);

        item.addEventListener('contextmenu', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); // 지난번에 추가한 마법의 방패!
            openBookmarkModal(bm.id);
        });

        container.appendChild(item);
    });

    // 마지막에 "추가하기(+)" 버튼 렌더링
    const addBtn = document.createElement('div');
    addBtn.className = 'bookmark-item';
    addBtn.onclick = () => openBookmarkModal(); 
    addBtn.innerHTML = `
        <div class="bookmark-icon bookmark-add-btn">＋</div>
        <div class="bookmark-name">Add</div>
    `;
    container.appendChild(addBtn);
}

// ==========================================
// 3. 드래그 앤 드롭 처리 로직
// ==========================================
function handleDragStart(e) {
    draggedItemIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault(); // 드롭을 허용하려면 필수!
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) { this.style.transform = 'scale(1.1)'; }
function handleDragLeave(e) { this.style.transform = ''; }

async function handleDrop(e) {
    e.stopPropagation();
    this.style.transform = '';
    
    const targetIndex = parseInt(this.dataset.index);
    if (draggedItemIndex === targetIndex) return;

    // 배열에서 위치를 스윽 바꿔줍니다.
    const draggedItem = bookmarks.splice(draggedItemIndex, 1)[0];
    bookmarks.splice(targetIndex, 0, draggedItem);

    // 바뀐 순서대로 sort_order 값 재정의
    const updatedBookmarks = bookmarks.map((bm, idx) => {
        bm.sort_order = idx;
        return bm;
    });

    renderBookmarks(); // 바뀐 순서로 화면 즉시 업데이트!

    // 뒷단(Worker)에 바뀐 순서 조용히 보고하기
    const success = await updateBookmarkOrderAPI(updatedBookmarks);
    if (!success) showDeferenceToast("순서 저장에 실패했습니다.");
}

document.addEventListener('dragend', (e) => {
    document.querySelectorAll('.bookmark-item').forEach(item => item.classList.remove('dragging'));
});

// ==========================================
// 4. 모달창 관리 (추가/수정/삭제)
// ==========================================
function openBookmarkModal(id = null) {
    const modal = document.getElementById('bookmarkModal');
    const title = document.getElementById('bm-modal-title');
    const deleteBtn = document.getElementById('bm-delete-btn');
    const saveBtn = document.getElementById('bm-save-btn');
    
    // 입력창 싹 비우기 및 기본값 세팅
    document.getElementById('bm-id').value = "";
    document.getElementById('bm-name').value = "";
    document.getElementById('bm-url').value = "";
    document.getElementById('bm-color').value = "#ffffff";
    
    // ✨ 새 북마크는 '투명'이 기본값입니다.
    document.getElementById('bm-transparent-check').checked = true;
    document.getElementById('bm-color').disabled = true;

    // ✨ 스케일 1.0배 기본 세팅
    document.getElementById('bm-scale').value = 1.0;
    document.getElementById('bm-scale-display').innerText = "1.0x";

    if (id) {
        // ✏️ [수정 모드]
        const bm = bookmarks.find(b => b.id === id);
        if (bm) {
            title.innerText = "Edit Bookmark";
            document.getElementById('bm-id').value = bm.id;
            document.getElementById('bm-name').value = bm.name;
            document.getElementById('bm-url').value = bm.url;
            
            // ✨ 투명 여부 체크 복원
            const isTransparent = (!bm.icon_value || bm.icon_value === 'transparent');
            document.getElementById('bm-transparent-check').checked = isTransparent;
            document.getElementById('bm-color').disabled = isTransparent;
            document.getElementById('bm-color').value = isTransparent ? "#ffffff" : bm.icon_value;
            
            // ✨ 스케일 값 복원
            const scaleVal = bm.icon_scale || 1.0;
            document.getElementById('bm-scale').value = scaleVal;
            // 소수점 1자리까지 깔끔하게 표시 (예: 1 -> 1.0x)
            document.getElementById('bm-scale-display').innerText = Number(scaleVal).toFixed(1) + "x";

            deleteBtn.style.display = "block"; 
            
            saveBtn.onclick = () => saveBookmarkAction();
            deleteBtn.onclick = () => deleteBookmarkAction(bm.id);
        }
    } else {
        // ➕ [추가 모드]
        title.innerText = "Add Bookmark";
        deleteBtn.style.display = "none";
        saveBtn.onclick = () => saveBookmarkAction();
    }

    modal.style.display = "flex";
}

window.closeBookmarkModal = function() {
    document.getElementById('bookmarkModal').style.display = "none";
}

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('bookmarkModal')) closeBookmarkModal();
});

// ==========================================
// 5. 서버에 저장 & 삭제 실행
// ==========================================
async function saveBookmarkAction() {
    const id = document.getElementById('bm-id').value;
    const name = document.getElementById('bm-name').value.trim();
    let url = document.getElementById('bm-url').value.trim();
    
    // ✨ 투명 체크박스가 켜져있으면 'transparent' 저장, 아니면 컬러피커 색상 저장!
    const isTransparent = document.getElementById('bm-transparent-check').checked;
    const color = isTransparent ? 'transparent' : document.getElementById('bm-color').value;
    
    const scale = parseFloat(document.getElementById('bm-scale').value);

    if (!name || !url) { showDeferenceToast("이름과 URL을 모두 입력해주세요."); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    const data = { id: id || null, name: name, url: url, icon_type: 'color', icon_value: color, icon_scale: scale };

    showDeferenceToast("Saving...");
    const success = await saveBookmarkAPI(data);
    if (success) {
        closeBookmarkModal();
        await initBookmarks(); 
        showDeferenceToast("Bookmark saved!");
    } else { showDeferenceToast("Save failed"); }
}

async function deleteBookmarkAction(id) {
    if (!confirm("이 북마크를 삭제하시겠습니까?")) return;
    
    showDeferenceToast("Deleting...");
    const success = await deleteBookmarkAPI(id);
    if (success) {
        closeBookmarkModal();
        await initBookmarks(); 
        showDeferenceToast("Deleted");
    } else { showDeferenceToast("Delete failed"); }
}