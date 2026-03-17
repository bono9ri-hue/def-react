/* ==========================================
   [core.js] 앱 초기화, 인증, 데이터 통신 및 업로드
   ========================================== */

// ✨ 강력한 시동 모터 (Clerk 로딩 대기 후 실행)
async function initDeferenceApp() {
    if (!window.Clerk) {
        setTimeout(initDeferenceApp, 100);
        return;
    }

    await window.Clerk.load();
    const overlay = document.getElementById('login-overlay');

    if (window.Clerk.user) {
        if (overlay) overlay.style.display = 'none';
        if (typeof loadPhotos === 'function') loadPhotos(); 
        if (typeof initBookmarks === 'function') initBookmarks(); 
        renderUserButton();
    } else {
        if (overlay) {
            overlay.style.display = 'flex';
            window.Clerk.mountSignIn(document.getElementById('clerk-signin-ui'));
        }
    }
    setupCommonUI();
}

// 브라우저 로딩 상태 확인 후 시동 걸기
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initDeferenceApp();
} else {
    document.addEventListener('DOMContentLoaded', initDeferenceApp);
}

function renderUserButton() {
    const header = document.querySelector('.header');
    let userBtnWrap = document.getElementById('user-button');
    if (!userBtnWrap) {
        userBtnWrap = document.createElement('div');
        userBtnWrap.id = 'user-button';
        // ✂️ 스타일(위치 지정) 코드는 core.css로 분리되었습니다!
        header.appendChild(userBtnWrap);
    }
    window.Clerk.mountUserButton(userBtnWrap);
}

function setupCommonUI() {
    const searchInput = document.getElementById('global-search');
    const clearBtn = document.getElementById('clear-btn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value; 
            if (clearBtn) clearBtn.style.display = searchQuery ? 'flex' : 'none';
            if (typeof renderGallery === 'function') renderGallery();
        });
    }
}

window.clearSearch = function() {
    const searchInput = document.getElementById('global-search');
    const clearBtn = document.getElementById('clear-btn');
    if (searchInput) searchInput.value = ""; 
    if (clearBtn) clearBtn.style.display = 'none'; 
    searchQuery = ""; 
    if (typeof renderGallery === 'function') renderGallery(); 
};

window.handleFileUpload = function(event) {
    if (event.target.files && event.target.files.length > 0) {
        if (typeof processAndUploadFiles === 'function') processAndUploadFiles(event.target.files);
    }
};

window.addEventListener('paste', (e) => {
    const textData = (e.clipboardData || window.clipboardData).getData('text');

    if (typeof currentEditingPalette !== 'undefined' && currentEditingPalette && textData) {
        const hexRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b|\b([a-fA-F0-9]{6})\b/g;
        const matches = [...textData.matchAll(hexRegex)];
        const rawColors = matches.map(m => '#' + (m[1] || m[2]).toUpperCase());
        const uniqueColors = [...new Set(rawColors)];

        if (uniqueColors.length > 0) {
            e.preventDefault(); 
            paletteHistory.push([...currentEditingPalette.colors]);
            currentEditingPalette.colors.push(...uniqueColors);
            if (typeof renderPaletteEditor === 'function') renderPaletteEditor();
            if (typeof showDeferenceToast === 'function') showDeferenceToast(`${uniqueColors.length} color(s) added! 🎨`);
            setTimeout(() => {
                const viewer = document.getElementById('modalPaletteViewer');
                if (viewer) viewer.scrollTop = viewer.scrollHeight;
            }, 50);
            return; 
        }
    }

    if (textData) {
        const hexRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b|\b([a-fA-F0-9]{6})\b/g;
        const matches = [...textData.matchAll(hexRegex)];
        const rawColors = matches.map(m => '#' + (m[1] || m[2]).toUpperCase());
        const uniqueColors = [...new Set(rawColors)];

        if (uniqueColors.length >= 2) {
            e.preventDefault(); 
            if (typeof uploadPaletteData === 'function') uploadPaletteData(uniqueColors, textData);
            return; 
        }
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const files = [];
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) { 
            const file = item.getAsFile(); 
            if (file) files.push(file); 
        }
    }
    if (files.length > 0) { 
        e.preventDefault(); 
        if (typeof processAndUploadFiles === 'function') processAndUploadFiles(files); 
    }
});

window.saveMetaData = async function() {
    if (typeof currentEditingId === 'undefined' || !currentEditingId) return; 
    
    const newMemo = document.getElementById('memoInput').value;
    const newTags = document.getElementById('tagInput').value;
    const btn = document.querySelector('.save-btn');
    const originalText = btn.innerText;

    btn.innerText = "Saving..."; 

    try {
        const token = await window.Clerk.session.getToken();
        const payload = { id: currentEditingId, memo: newMemo, tags: newTags };
        if (typeof currentEditingPalette !== 'undefined' && currentEditingPalette) {
            payload.palette_data = JSON.stringify(currentEditingPalette);
        }

        const res = await fetch(`${WORKER_URL}/assets`, { 
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Save Failed");

        const photo = photos.find(p => String(p.id) === String(currentEditingId));
        if (photo) { 
            photo.memo = newMemo; 
            photo.tags = newTags; 
            if (typeof currentEditingPalette !== 'undefined' && currentEditingPalette) photo.palette_data = JSON.stringify(currentEditingPalette);
        }
        
        if (typeof showDeferenceToast === 'function') showDeferenceToast("Saved successfully! 🎉");
        if (typeof closeModal === 'function') closeModal(); 
        if (typeof renderGallery === 'function') renderGallery(); 
        if (typeof renderFilterTags === 'function' && window.isTagPanelOpen) renderFilterTags(); 

    } catch (e) {
        console.error(e);
        if (typeof showDeferenceToast === 'function') showDeferenceToast("Failed to save ❌");
    } finally {
        btn.innerText = originalText;
    }
};

// ==========================================
// [스마트 동기화 센서] 다른 탭에서 수집하고 돌아왔을 때 자동 새로고침
// ==========================================
window.addEventListener('focus', () => {
    if (window.Clerk && window.Clerk.user) {
        console.log("👀 갤러리 탭으로 돌아옴! 최신 데이터 동기화 중...");
        
        // 1. 기존 이미지/비디오/팔레트 동기화
        if (typeof loadPhotos === 'function') loadPhotos();
        
        // 2. ✨ 북마크(스피드 다이얼) 자동 동기화 한 줄 추가!
        if (typeof initBookmarks === 'function') initBookmarks(); 
    }
});