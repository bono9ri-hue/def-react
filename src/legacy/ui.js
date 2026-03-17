/* ==========================================
   [ui.js] 모달창, 우클릭 컨텍스트 메뉴, 폴더 이동 팝업, 태그 에디터
   ========================================== */

// 전역 상태 변수 공유
window.currentEditingId = null;
window.currentEditingPalette = null;
window.paletteHistory = [];

/* ==========================================
   [ 모달 열기/닫기 (좌측 뷰어 제어) ]
   ========================================== */
window.openModal = function(id) {
  const photo = photos.find(p => String(p.id) === String(id));
  if (!photo) return;
  window.currentEditingId = photo.id; 
  
  document.querySelectorAll('.color-picker-marker').forEach(m => m.remove());
  const oldLoupe = document.getElementById('color-picker-loupe');
  if (oldLoupe) oldLoupe.style.display = 'none';

  const modal = document.getElementById('imageModal');
  const imgEl = document.getElementById('modalImage');
  const imageWrapper = document.getElementById('image-wrapper');
  const paletteViewer = document.getElementById('modalPaletteViewer');
  
  let vidEl = document.getElementById('modalVideo');
  if (!vidEl) {
      vidEl = document.createElement('video'); vidEl.id = 'modalVideo';
      vidEl.autoplay = true; vidEl.controls = true; vidEl.loop = true; vidEl.playsInline = true;
      vidEl.style.width = '100%'; vidEl.style.maxHeight = '80vh'; vidEl.style.objectFit = 'contain';
      vidEl.style.borderRadius = 'var(--radius-md)'; vidEl.style.background = 'var(--color-text-main)';
      imgEl.parentNode.insertBefore(vidEl, imgEl);
  }

  const isPalette = photo.item_type === 'palette' || (photo.tags && photo.tags.includes('Palette') && !photo.image_url);
  const paletteGroup = document.getElementById('color-palette-group');

  if (isPalette) {
      // 🎨 팔레트 전용 모드
      imageWrapper.style.display = 'none'; 
      paletteViewer.style.display = 'flex'; 
      if(paletteGroup) paletteGroup.style.display = 'none'; 

      let colors = []; let columns = 5;
      try {
          const pData = JSON.parse(photo.palette_data);
          colors = pData.colors || []; columns = pData.columns || 5;
      } catch(e) {
          colors = photo.memo ? photo.memo.split(',').filter(c => c.includes('#')).map(c => c.trim()) : [];
      }
      
      window.currentEditingPalette = { colors: [...colors], columns: columns };
      document.getElementById('palette-columns-input').value = columns;

      window.paletteHistory = []; // 타임머신 초기화!
      if(typeof renderPaletteEditor === 'function') renderPaletteEditor(); 

  } else if (photo.video_url) {
      // 🎬 비디오 모드
      imageWrapper.style.display = 'inline-block';
      paletteViewer.style.display = 'none';
      imgEl.style.display = 'none';
      vidEl.style.display = 'block'; vidEl.src = photo.video_url;
      
      if(paletteGroup) {
          paletteGroup.style.display = 'flex'; 
          const toggleWrap = paletteGroup.querySelector('.toggle-wrapper');
          if (toggleWrap) toggleWrap.style.display = 'none'; 
      }
      
      if(typeof renderSmartColors === 'function') renderSmartColors(photo.image_url, true);
      
  } else {
      // 🖼️ 기본 이미지 모드
      imageWrapper.style.display = 'inline-block';
      paletteViewer.style.display = 'none';
      vidEl.style.display = 'none'; vidEl.pause(); vidEl.src = '';
      imgEl.style.display = 'block'; imgEl.src = photo.image_url;

      if(paletteGroup) {
          paletteGroup.style.display = 'flex';
          const toggleWrap = paletteGroup.querySelector('.toggle-wrapper');
          if (toggleWrap) toggleWrap.style.display = 'flex'; 
      }

      if (imageWrapper && typeof initColorLoupe === 'function') initColorLoupe(imageWrapper); 
      if (typeof renderSmartColors === 'function') renderSmartColors(photo.image_url, false);
  }

  document.getElementById('memoInput').value = photo.memo || ""; 
  document.getElementById('tagInput').value = photo.tags || "";   
  modal.style.display = "flex"; document.body.style.overflow = "hidden"; 
};

window.closeModal = function() {
  document.getElementById('imageModal').style.display = "none";
  document.body.style.overflow = "auto";
  window.currentEditingId = null;
  window.currentEditingPalette = null;
  
  const vidEl = document.getElementById('modalVideo');
  if (vidEl) { vidEl.pause(); vidEl.src = ''; }

  document.querySelectorAll('.color-picker-marker').forEach(m => m.remove());
  const oldLoupe = document.getElementById('color-picker-loupe');
  if (oldLoupe) oldLoupe.style.display = 'none';

  const paletteGroup = document.getElementById('color-palette-group');
  if (paletteGroup) paletteGroup.style.setProperty('display', 'none', 'important');
};

/* ==========================================
   [ 폴더 이동 모달 UI ]
   ========================================== */
window.selectedFoldersToMove = []; 

window.openMoveModal = function() {
    if (typeof selectedIds === 'undefined' || selectedIds.size === 0) return;
    const modal = document.getElementById('folderModal');
    const list = document.getElementById('folderModalList');
    window.selectedFoldersToMove = []; list.innerHTML = "";

    if (projects.length === 0) { list.innerHTML = `<div style="font-size:var(--text-body); color:var(--color-text-muted); text-align:center; padding:20px;">No folders</div>`; }

    projects.forEach(proj => {
        const btn = document.createElement('button');
        btn.innerText = proj.name; btn.className = 'folder-modal-list-btn';
        btn.onclick = () => {
            if (window.selectedFoldersToMove.includes(proj.name)) {
                window.selectedFoldersToMove = window.selectedFoldersToMove.filter(name => name !== proj.name);
                btn.style.background = 'var(--color-bg-white)'; btn.style.borderColor = 'var(--color-border-light)';
            } else {
                window.selectedFoldersToMove.push(proj.name);
                btn.style.background = '#f0f8ff'; btn.style.borderColor = 'var(--color-text-main)';
            }
        };
        list.appendChild(btn);
    });

    const oldBtn = document.getElementById('folderModalActionBtn');
    if (oldBtn) {
        const parent = oldBtn.parentElement; parent.id = "action-buttons-container"; 
        parent.innerHTML = `<div style="display:flex; gap:10px; width:100%;"><button class="auth-btn-sub" onclick="executeMoveToFolder()" style="flex:1; margin:0;">Move to</button><button class="auth-btn-main" onclick="executeAddToFolder()" style="flex:1; margin:0;">Add to</button></div>`;
    }
    modal.style.display = "flex";
};

window.closeFolderModal = function() { document.getElementById('folderModal').style.display = "none"; };
window.addEventListener('click', (e) => { if (e.target === document.getElementById('folderModal')) window.closeFolderModal(); });

/* ==========================================
   [ 우클릭 컨텍스트 메뉴 UI ]
   ========================================== */
const contextMenu = document.createElement('div');
contextMenu.id = 'custom-context-menu'; document.body.appendChild(contextMenu);
let contextTargetId = null; let contextPos = { x: 0, y: 0 }; 

contextMenu.innerHTML = `
    <button onclick="hideContextMenu(); openTagEditorFromContext()">Add Tags</button>
    <div style="height:1px; background:var(--color-border-light); margin:4px 0;"></div>
    <button onclick="hideContextMenu(); selectAll()">Select All</button>
    <button onclick="hideContextMenu(); clearSelection()">Reset Selection</button>
    <div style="height:1px; background:var(--color-border-light); margin:4px 0;"></div>
    <button onclick="hideContextMenu(); openMoveModal()">Move / Add to Folder</button>
    <button class="danger" onclick="hideContextMenu(); smartDelete()">Delete</button>
`;

window.hideContextMenu = function() { contextMenu.style.display = 'none'; };

document.addEventListener('contextmenu', (e) => {
    e.preventDefault(); contextPos = { x: e.clientX, y: e.clientY };
    const clickedCard = e.target.closest('.card'); contextTargetId = clickedCard ? clickedCard.getAttribute('data-id') : null;
    contextMenu.style.display = 'flex'; contextMenu.style.left = `${contextPos.x}px`; contextMenu.style.top = `${contextPos.y}px`;
});

window.openTagEditorFromContext = function() { 
    if (contextTargetId) { window.openTagEditor(contextTargetId, contextPos.x, contextPos.y); } 
    else { if(typeof showDeferenceToast === 'function') showDeferenceToast("Select an image first"); } 
};
document.addEventListener('click', (e) => { if (e.target !== contextMenu && !contextMenu.contains(e.target)) window.hideContextMenu(); });
document.addEventListener('scroll', window.hideContextMenu);

/* ==========================================
   [ 태그 편집 팝오버 UI ]
   ========================================== */
const tagEditor = document.createElement('div');
tagEditor.id = 'tag-editor-popover'; tagEditor.className = 'tag-editor-popover'; document.body.appendChild(tagEditor);

window.openTagEditor = function(id, x, y) {
    const photo = photos.find(p => String(p.id) === String(id)); if (!photo) return;
    tagEditor.style.display = 'flex'; tagEditor.style.left = `${x}px`; tagEditor.style.top = `${y}px`;

    tagEditor.innerHTML = `<input type="text" id="tag-popover-input" class="tag-popover-input" placeholder="Add tag..."><div id="tag-popover-list" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>`;
    const input = document.getElementById('tag-popover-input'); const list = document.getElementById('tag-popover-list');

    const renderChips = () => {
        const currentTags = photo.tags ? photo.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        list.innerHTML = currentTags.map(tag => `<div class="tag-chip-ui">${tag}<span class="tag-del" onclick="removeTagFromPopover('${id}', '${tag}')">✕</span></div>`).join('');
    };

    renderChips(); input.focus();

    input.onkeydown = async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const newTag = input.value.trim();
            const currentTags = photo.tags ? photo.tags.split(',').map(t => t.trim()).filter(t => t) : [];
            if (!currentTags.includes(newTag)) {
                currentTags.push(newTag);
                const updatedTags = currentTags.join(', ');
                if(typeof updatePhotoTags === 'function') await updatePhotoTags(id, updatedTags); 
                photo.tags = updatedTags; input.value = ""; renderChips(); 
                if(typeof renderGallery === 'function') renderGallery(); 
            }
        }
    };
};

window.removeTagFromPopover = async function(id, tagToRemove) {
    const photo = photos.find(p => String(p.id) === String(id));
    let currentTags = photo.tags.split(',').map(t => t.trim()).filter(t => t !== tagToRemove);
    const updatedTags = currentTags.join(', ');
    if(typeof updatePhotoTags === 'function') await updatePhotoTags(id, updatedTags); 
    photo.tags = updatedTags;
    window.openTagEditor(id, parseInt(tagEditor.style.left), parseInt(tagEditor.style.top)); 
    if(typeof renderGallery === 'function') renderGallery();
};

document.addEventListener('mousedown', (e) => { if (!tagEditor.contains(e.target) && e.target !== contextMenu) tagEditor.style.display = 'none'; });