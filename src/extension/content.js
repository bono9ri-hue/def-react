// 🌟 [핵심 추가] 요원이 이미 투입되어 있는지 확인하는 방어막
if (!window.hasDefContentScriptRun) {
    window.hasDefContentScriptRun = true;

/* ==========================================
   [섹션 1] 전역 변수 및 설정
   ========================================== */
// 🚀 수파베이스 흔적 완벽 삭제! 이제 우리 워커 서버만 바라봅니다.
const WORKER_URL = "https://def-api.deference.workers.dev";

let lastRightClickData = null;
let isModalOpen = false;

// [상태 변수]
let overlay, selectionBox, sizeLabel, actionBtn, bottomToolbar, keydownHandler, mouseMoveHandler, mouseUpHandler;
let isDrawing = false, isMoving = false, isResizing = false;
let startX, startY, startLeft, startTop, startWidth, startHeight, resizeDir;
let captureRect = null;

let currentRatio = 'free'; 
const ratios = { 'free': 'free', '1:1': 1, '4:5': 4 / 5, '5:4': 5 / 4, '16:9': 16 / 9, '9:16': 9 / 16 };

/* ==========================================
   [섹션 2] 유틸리티: URL 정리
   ========================================== */
function getCleanUrl(url) {
    try { 
        const u = new URL(url); 
        ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid', 'gclid'].forEach(j => u.searchParams.delete(j)); 
        return u.toString().replace(/\/$/, ""); 
    } catch (e) { return url; }
}

/* ==========================================
   [섹션 3] 유틸리티: 미디어 추출 엔진
   ========================================== */
function extractMediaFromElement(el) {
    if (!el) return null;
    if (el.tagName === 'VIDEO') {
        let src = el.currentSrc || el.src || el.querySelector('source')?.src;
        if (src) return { url: src, type: 'video', element: el, isBlob: src.startsWith('blob:') };
    }
    if (el.tagName === 'IMG') {
        let url = el.srcset ? el.srcset.split(',').pop().trim().split(' ')[0] : (el.currentSrc || el.src);
        if (url && !url.startsWith('chrome-extension:') && !url.includes('transparent')) return { url: url, type: 'image', element: el };
    }
    return null;
}

/* ==========================================
   [섹션 4] 유틸리티: 비디오 썸네일 & 포스터 추출
   ========================================== */
function extractThumbnailFromUrl(videoUrl) {
    return new Promise((resolve) => {
        if (!videoUrl) { resolve(null); return; }
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; video.muted = true;
        const timeoutId = setTimeout(() => { video.src = ''; resolve(null); }, 3000);
        video.onloadeddata = () => { video.currentTime = 0.1; };
        video.onseeked = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.9)); 
            } catch (e) { resolve(null); }
        };
        video.onerror = () => { clearTimeout(timeoutId); resolve(null); };
        video.src = videoUrl; video.load();
    });
}

function findPosterImage(videoEl) {
    if (videoEl.poster && !videoEl.poster.includes('transparent')) return videoEl.poster;
    let current = videoEl;
    for (let i = 0; i < 4; i++) {
        if (!current || !current.parentElement) break;
        current = current.parentElement;
        for (let img of current.querySelectorAll('img')) {
            if (img.offsetWidth > 100 && !img.src.includes('transparent') && !img.src.includes('avatar')) {
                let highRes = img.srcset ? img.srcset.split(',').pop().trim().split(' ')[0] : (img.currentSrc || img.src);
                if (highRes && !highRes.includes('data:image')) return highRes;
            }
        }
    }
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) return ogImage.content;
    return "https://via.placeholder.com/640x360.png?text=Video+Reference";
}

/* ==========================================
   [섹션 5] UI 요소: 토스트 알림 (버튼 장착 버전 🚀)
   ========================================== */
function showDeferenceToast(message, isSuccess = false) {
    let oldToast = document.getElementById('def-toast');
    if (oldToast) oldToast.remove();

    let t = document.createElement('div');
    t.id = 'def-toast';
    
    // 💡 변경점 1: display:flex로 요소를 가로 정렬하고, pointer-events를 auto로 바꿔서 클릭이 가능하게 합니다.
    t.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); 
        background: #000; color: #fff; padding: 12px 24px; border-radius: 100px; 
        z-index: 2147483647 !important; font-size: 13px; font-weight: 600; 
        box-shadow: 0 15px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);
        pointer-events: auto; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
        opacity: 0; letter-spacing: -0.2px; display: flex; align-items: center; gap: 14px;
    `;
    
    // 💡 변경점 2: 수집 성공 시(ARCHIVED)에만 갤러리 이동 버튼을 렌더링합니다.
    if (message.includes("ARCHIVED") || isSuccess) {
        t.innerHTML = `
            <span>${message}</span>
            <a href="https://deference.work" target="_blank" style="
                background: #fff; color: #000; padding: 6px 14px; border-radius: 50px; 
                text-decoration: none; font-size: 11px; font-weight: 800; 
                transition: transform 0.2s; white-space: nowrap; cursor: pointer;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                View Gallery ↗
            </a>
        `;
        document.body.appendChild(t);

        requestAnimationFrame(() => {
            t.style.opacity = '1';
            t.style.bottom = '60px';
        });

        // 버튼을 누를 수 있도록 알림창이 떠 있는 시간을 4초로 약간 늘립니다.
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.bottom = '50px';
            setTimeout(() => { if(t) t.remove() }, 400);
        }, 4000);

    } else {
        // 일반 에러나 로딩 메시지는 기존처럼 텍스트만 보여줍니다.
        t.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(t);

        requestAnimationFrame(() => {
            t.style.opacity = '1';
            t.style.bottom = '60px';
        });

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.bottom = '50px';
            setTimeout(() => { if(t) t.remove() }, 400);
        }, 3000);
    }
}

/* ==========================================
   [섹션 6] 이벤트 리스너: 마우스 우클릭 감지
   ========================================== */
document.addEventListener("contextmenu", (e) => {
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    if (!els || !els[0]) return;
    let bestMedia = null, bestLink = null;
    
    for (let el of els) {
        const a = el.closest('a');
        if (a && a.href && !a.href.match(/\.(jpeg|jpg|gif|png|webp|avif|mp4|webm)(\?.*)?$/i) && !a.href.startsWith('javascript:')) { bestLink = a.href; break; }
    }
    
    const container = els[0].closest('article, [data-test-id="pin"], .dribbble-shot, .shot-thumbnail, .rf-project-cover, .ProjectCover-root, .Cover-wrapper, .Grid__Item, [class*="card"], [class*="project"], [class*="item"], a');
    
    for (let el of els) { if (el.tagName === 'VIDEO') { bestMedia = extractMediaFromElement(el); break; } }
    
    if (!bestMedia && container) { for (let v of container.querySelectorAll('video')) { const ex = extractMediaFromElement(v); if (ex) { bestMedia = ex; break; } } }
    
    if (!bestMedia) {
        for (let el of els) { if (el.tagName === 'IMG') { bestMedia = extractMediaFromElement(el); break; } }
        if (!bestMedia && container) { for (let img of container.querySelectorAll('img')) { if (img.offsetWidth > 100) { const ex = extractMediaFromElement(img); if (ex) { bestMedia = ex; break; } } } }
    }
    
    let pageUrl = window.location.href; 
    const isDetail = pageUrl.includes('/gallery/') || pageUrl.includes('/project/') || pageUrl.includes('/pin/') || (pageUrl.includes('dribbble.com/shots/') && !pageUrl.endsWith('shots/'));
    if (bestLink && !isDetail) pageUrl = bestLink;
    
    lastRightClickData = { media: bestMedia, link: getCleanUrl(pageUrl) };
}, true); 

/* ==========================================
   [섹션 7] 통신: 백그라운드 메시지 수신 및 분기
   ========================================== */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "direct-collect") handleDirectCollect(request);
    else if (request.action === "start-selection") startSelection(); 
    else if (request.action === "crop-and-upload") cropAndUpload(request.fullDataUrl, request.rect); 
    // ✨ [핵심 추가] 백그라운드에서 "원본 다운로드" 무전이 왔을 때!
    else if (request.action === "download-original") handleDownloadOriginal(request);
});

// ✨ [새로운 기능] 우클릭한 미디어의 원본 URL을 찾아서 다운로드 본부로 전달!
async function handleDownloadOriginal(request) {
    let finalUrl = null;

    // 1. 우클릭했던 위치에서 가장 화질 좋은 미디어를 찾아냅니다.
    if (lastRightClickData && lastRightClickData.media) {
        const media = lastRightClickData.media;
        if (media.type === 'video') {
            // 비디오가 보호된 형식(Blob)이면 썸네일이라도, 아니면 원본 비디오 URL을 가져옵니다.
            finalUrl = (media.isBlob) ? findPosterImage(media.element) : media.url;
        } else {
            finalUrl = media.url; // 고화질 이미지 URL
        }
    } else if (request.srcUrl) {
        // 백업 플랜: 브라우저가 기본적으로 잡은 이미지 URL
        finalUrl = request.srcUrl;
    }

    // 2. URL을 찾았다면 백그라운드 본부에 "다운로드 실행해!" 라고 무전을 칩니다.
    if (finalUrl) {
        showDeferenceToast("⬇️ 원본 파일 다운로드를 시작합니다...");
        
        // 간단한 확장자 추출 로직 (파일명이 예쁘게 저장되도록)
        let ext = "jpg";
        if (finalUrl.toLowerCase().includes(".png")) ext = "png";
        else if (finalUrl.toLowerCase().includes(".webp")) ext = "webp";
        else if (finalUrl.toLowerCase().includes(".mp4")) ext = "mp4";
        else if (finalUrl.toLowerCase().includes(".gif")) ext = "gif";

        chrome.runtime.sendMessage({ 
            action: "trigger-download", 
            url: finalUrl,
            filename: `Deference_Original_${Date.now()}.${ext}` // 예: Deference_Original_1701234567.png
        });
    } else {
        showDeferenceToast("❌ 다운로드할 원본 미디어를 찾지 못했습니다.");
    }
}

async function handleDirectCollect(request) {
    if (lastRightClickData && lastRightClickData.media) {
        const media = lastRightClickData.media;
        const sourceLink = lastRightClickData.link;
        let finalImgUrl = null;
        let finalVidUrl = (media.type === 'video' && !media.isBlob) ? media.url : null;

        if (media.type === 'video') {
            if (media.isBlob) {
                showDeferenceToast("🔒 플랫폼 보안 정책으로 보호된 영상입니다. 썸네일과 출처 링크만 아카이브됩니다.");
                finalVidUrl = null; finalImgUrl = findPosterImage(media.element); 
            } else {
                showDeferenceToast("⏳ 고화질 썸네일을 추출 중입니다...");
                finalImgUrl = await extractThumbnailFromUrl(finalVidUrl);
                if (!finalImgUrl) finalImgUrl = findPosterImage(media.element);
            }
        } else { finalImgUrl = media.url; }
        showPreSaveModal(finalImgUrl, finalVidUrl, sourceLink);
    } else if (request.srcUrl) {
        showPreSaveModal(request.srcUrl, null, getCleanUrl(window.location.href));
    } 
}

/* ==========================================
   [섹션 8] 영역 캡처 엔진 (UI 그리기)
   ========================================== */
function startSelection() {
    if (document.getElementById('def-overlay')) return;

    overlay = document.createElement('div'); overlay.id = 'def-overlay';
    selectionBox = document.createElement('div'); selectionBox.id = 'def-selection';
    sizeLabel = document.createElement('div'); sizeLabel.id = 'def-size-label';
    selectionBox.appendChild(sizeLabel);

    bottomToolbar = document.createElement('div'); bottomToolbar.id = 'def-bottom-toolbar';
    let ratioGroup = document.createElement('div'); ratioGroup.id = 'def-ratio-group';
    
    Object.keys(ratios).forEach(key => {
        let btn = document.createElement('button'); btn.className = 'def-ratio-btn'; btn.innerText = key.toUpperCase();
        btn.onclick = (e) => {
            e.stopPropagation(); e.preventDefault(); currentRatio = ratios[key];
            document.querySelectorAll('.def-ratio-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            if (captureRect && captureRect.width > 0) {
                if (currentRatio !== 'free') {
                    if (currentRatio > 1) captureRect.height = captureRect.width / currentRatio;
                    else if (currentRatio < 1) captureRect.width = captureRect.height * currentRatio;
                    else { let minSize = Math.min(captureRect.width, captureRect.height); captureRect.width = minSize; captureRect.height = minSize; }
                }
                updateSelectionBox();
            }
        };
        ratioGroup.appendChild(btn);
    });

    // 커스텀 픽셀 입력 툴바
    let customWrap = document.createElement('div'); customWrap.style.cssText = 'display:flex; gap:4px; margin-left:8px; align-items:center;';
    let customW = document.createElement('input'); customW.type = 'number'; customW.className = 'def-custom-input'; customW.placeholder = 'W';
    let xSpan = document.createElement('span'); xSpan.innerText = '×'; xSpan.style.cssText = 'color:rgba(255,255,255,0.4); font-size:12px; font-weight:bold;';
    let customH = document.createElement('input'); customH.type = 'number'; customH.className = 'def-custom-input'; customH.placeholder = 'H';
    let customBtn = document.createElement('button'); customBtn.className = 'def-ratio-btn'; customBtn.innerText = 'SET';
    
    [customW, customH].forEach(inp => {
        inp.addEventListener('mousedown', (e) => e.stopPropagation());
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); customBtn.click(); } });
    });

    customBtn.onclick = (e) => {
        e.stopPropagation(); e.preventDefault();
        let cw = parseInt(customW.value), ch = parseInt(customH.value);
        if (cw > 0 && ch > 0) {
            cw = Math.min(cw, window.innerWidth - 20); ch = Math.min(ch, window.innerHeight - 20);
            customW.value = cw; customH.value = ch; currentRatio = cw / ch;
            document.querySelectorAll('.def-ratio-btn').forEach(b => b.classList.remove('active')); customBtn.classList.add('active');
            if (captureRect) {
                let centerX = captureRect.width === 0 ? window.innerWidth / 2 : captureRect.left + captureRect.width / 2;
                let centerY = captureRect.width === 0 ? window.innerHeight / 2 : captureRect.top + captureRect.height / 2;
                captureRect.width = cw; captureRect.height = ch;
                captureRect.left = Math.max(0, centerX - cw / 2); captureRect.top = Math.max(0, centerY - ch / 2);
                updateSelectionBox(); selectionBox.style.display = 'block'; overlay.classList.add('has-selection');
            }
        }
    };

    customWrap.appendChild(customW); customWrap.appendChild(xSpan); customWrap.appendChild(customH); customWrap.appendChild(customBtn);
    ratioGroup.appendChild(customWrap);

    let divider = document.createElement('div'); divider.className = 'def-divider';
    actionBtn = document.createElement('button'); actionBtn.id = 'def-action-btn'; actionBtn.innerText = 'CAPTURE (ENTER)';
    actionBtn.onclick = (e) => { e.stopPropagation(); executeCapture(); };

    bottomToolbar.appendChild(ratioGroup); bottomToolbar.appendChild(divider); bottomToolbar.appendChild(actionBtn);
    selectionBox.appendChild(bottomToolbar);

    const dirs = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    dirs.forEach(dir => {
        let h = document.createElement('div'); h.className = 'def-handle'; 
        if (dir.includes('n')) h.style.top = '0'; if (dir.includes('s')) h.style.top = '100%';
        if (dir.includes('w')) h.style.left = '0'; if (dir.includes('e')) h.style.left = '100%';
        if (dir === 'n' || dir === 's') { h.style.left = '50%'; h.style.cursor = 'ns-resize'; }
        if (dir === 'e' || dir === 'w') { h.style.top = '50%'; h.style.cursor = 'ew-resize'; }
        if (dir === 'nw' || dir === 'se') h.style.cursor = 'nwse-resize';
        if (dir === 'ne' || dir === 'sw') h.style.cursor = 'nesw-resize';
        h.onmousedown = (e) => { e.stopPropagation(); e.preventDefault(); isResizing = true; resizeDir = dir; startX = e.clientX; startY = e.clientY; startLeft = captureRect.left; startTop = captureRect.top; startWidth = captureRect.width; startHeight = captureRect.height; };
        selectionBox.appendChild(h);
    });

    overlay.appendChild(selectionBox); document.body.appendChild(overlay);

    chrome.storage.local.get(['defSavedRect', 'defSavedRatio', 'defCustomW', 'defCustomH'], (result) => {
        if (result.defCustomW) customW.value = result.defCustomW; if (result.defCustomH) customH.value = result.defCustomH;
        if (result.defSavedRatio !== undefined) {
            currentRatio = result.defSavedRatio;
            let ratioKey = Object.keys(ratios).find(key => ratios[key] === currentRatio) || 'free';
            if(ratioKey !== 'free') Array.from(ratioGroup.children).forEach(btn => { if (btn.innerText === ratioKey.toUpperCase()) btn.classList.add('active'); });
            else if (currentRatio !== 'free') customBtn.classList.add('active');
            else ratioGroup.children[0].classList.add('active');
        } else ratioGroup.children[0].classList.add('active');
        if (result.defSavedRect) { captureRect = result.defSavedRect; updateSelectionBox(); selectionBox.style.display = 'block'; overlay.classList.add('has-selection'); }
    });

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) { e.preventDefault(); isDrawing = true; startX = e.clientX; startY = e.clientY; captureRect = { left: startX, top: startY, width: 0, height: 0 }; updateSelectionBox(); selectionBox.style.display = 'block'; overlay.classList.add('has-selection'); } });
    selectionBox.addEventListener('mousedown', (e) => { if (e.target === selectionBox) { e.preventDefault(); isMoving = true; startX = e.clientX; startY = e.clientY; startLeft = captureRect.left; startTop = captureRect.top; } });

    mouseMoveHandler = (e) => {
        if (isDrawing || isMoving || isResizing) e.preventDefault(); 
        if (isDrawing) { 
            let w = Math.abs(e.clientX - startX), h = Math.abs(e.clientY - startY);
            if (currentRatio !== 'free') { if (currentRatio >= 1) h = w / currentRatio; else w = h * currentRatio; }
            captureRect.width = w; captureRect.height = h; captureRect.left = e.clientX < startX ? startX - w : startX; captureRect.top = e.clientY < startY ? startY - h : startY; updateSelectionBox();
        } else if (isMoving) { captureRect.left = startLeft + (e.clientX - startX); captureRect.top = startTop + (e.clientY - startY); updateSelectionBox();
        } else if (isResizing) {
            let dx = e.clientX - startX, dy = e.clientY - startY;
            if (currentRatio === 'free') {
                if (resizeDir.includes('e')) captureRect.width = Math.max(10, startWidth + dx);
                if (resizeDir.includes('s')) captureRect.height = Math.max(10, startHeight + dy);
                if (resizeDir.includes('w')) { let newW = Math.max(10, startWidth - dx); if (newW > 10) { captureRect.left = startLeft + dx; captureRect.width = newW; } }
                if (resizeDir.includes('n')) { let newH = Math.max(10, startHeight - dy); if (newH > 10) { captureRect.top = startTop + dy; captureRect.height = newH; } }
            } else {
                let w = startWidth, h = startHeight;
                if (resizeDir.includes('e') || resizeDir.includes('w')) { w = Math.max(10, resizeDir.includes('e') ? startWidth + dx : startWidth - dx); h = w / currentRatio; }
                else if (resizeDir.includes('s') || resizeDir.includes('n')) { h = Math.max(10, resizeDir.includes('s') ? startHeight + dy : startHeight - dy); w = h * currentRatio; }
                else { w = Math.max(10, resizeDir.includes('e') ? startWidth + dx : startWidth - dx); h = w / currentRatio; }
                if (resizeDir.includes('w')) captureRect.left = startLeft + startWidth - w;
                if (resizeDir.includes('n')) captureRect.top = startTop + startHeight - h;
                captureRect.width = w; captureRect.height = h;
            }
            updateSelectionBox();
        }
    };

    mouseUpHandler = () => { isDrawing = false; isMoving = false; isResizing = false; if (captureRect && captureRect.width > 20 && captureRect.height > 20) { chrome.storage.local.set({ defSavedRect: captureRect, defSavedRatio: currentRatio, defCustomW: customW.value, defCustomH: customH.value }); } };
    window.addEventListener('mousemove', mouseMoveHandler); window.addEventListener('mouseup', mouseUpHandler);
    keydownHandler = (e) => { if (e.key === 'Escape') removeOverlay(); if (e.key === 'Enter') executeCapture(); };
    document.addEventListener('keydown', keydownHandler);
}

/* ==========================================
   [섹션 9] 영역 캡처 엔진 (크롭 및 실행 로직)
   ========================================== */
function updateSelectionBox() { if (!captureRect) return; selectionBox.style.left = captureRect.left + 'px'; selectionBox.style.top = captureRect.top + 'px'; selectionBox.style.width = captureRect.width + 'px'; selectionBox.style.height = captureRect.height + 'px'; sizeLabel.innerText = `${Math.round(captureRect.width)} × ${Math.round(captureRect.height)}`; }

function executeCapture() {
    if (!captureRect || captureRect.width < 20 || captureRect.height < 20) { removeOverlay(); return; }
    const cwInput = document.querySelector('.def-custom-input[placeholder="W"]'), chInput = document.querySelector('.def-custom-input[placeholder="H"]');
    chrome.storage.local.set({ defSavedRect: captureRect, defSavedRatio: currentRatio, defCustomW: cwInput ? cwInput.value : '', defCustomH: chInput ? chInput.value : '' });
    overlay.classList.remove('has-selection'); selectionBox.style.display = 'none'; 
    setTimeout(() => { chrome.runtime.sendMessage({ action: 'rect-ready', rect: captureRect }); removeOverlay(); }, 100);
}

function removeOverlay() { if (overlay) { overlay.remove(); overlay = null; } if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler); if (mouseUpHandler) window.removeEventListener('mouseup', mouseUpHandler); if (keydownHandler) document.removeEventListener('keydown', keydownHandler); }

function cropAndUpload(fullDataUrl, rect) {
    const img = new Image(); img.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = rect.width; canvas.height = rect.height;
        const ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1; 
        ctx.drawImage(img, rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr, 0, 0, rect.width, rect.height);
        showPreSaveModal(canvas.toDataURL('image/png'), null, window.location.href);
    };
    img.src = fullDataUrl;
}

/* ==========================================
   [섹션 10] 저장 전 확인 모달창 UI
   ========================================== */
function showPreSaveModal(imgUrl, vidUrl, sourceLink) {
    if (isModalOpen) return;
    isModalOpen = true;

    const existing = document.getElementById('def-pre-modal-wrap');
    if (existing) existing.remove();

    let autoMemo = document.title || "";
    const metaDesc = document.querySelector('meta[name="description"]')?.content;
    if (metaDesc) autoMemo += `\n${metaDesc}`;

    const modalWrap = document.createElement('div');
    modalWrap.id = 'def-pre-modal-wrap';
    modalWrap.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:2147483637; display:flex; justify-content:center; align-items:center;`;
    modalWrap.onclick = () => { modalWrap.remove(); isModalOpen = false; };

    const modalBox = document.createElement('div');
    modalBox.style.cssText = `width:340px; background:#fff; border-radius:16px; box-shadow:0 40px 80px rgba(0,0,0,0.5); padding:24px; font-family:sans-serif;`;
    modalBox.onclick = (e) => e.stopPropagation();

    const domain = sourceLink ? new URL(sourceLink).hostname.replace('www.', '') : window.location.hostname.replace('www.', '');
    const mediaPreview = vidUrl ? `<video src="${vidUrl}" autoplay loop muted style="max-width:100%; max-height:200px; border-radius:8px; background:#000;"></video>` : `<img src="${imgUrl}" style="max-width:100%; max-height:200px; border-radius:8px; object-fit:contain; background:#f9f9f9;">`;

    modalBox.innerHTML = `
        <div style="margin-bottom:18px; text-align:center;">${mediaPreview}</div>
        <div style="font-size:10px; font-weight:800; color:#bbb; letter-spacing:1px; margin-bottom:12px;">SOURCE: ${domain.toUpperCase()}</div>
        <input id="def-tag-in" type="text" placeholder="TAGS (쉼표 구분)" style="width:100%; padding:12px; border:1px solid #eee; border-radius:8px; margin-bottom:10px; font-size:13px; box-sizing:border-box;">
        <textarea id="def-memo-in" placeholder="MEMO" style="width:100%; height:80px; padding:12px; border:1px solid #eee; border-radius:8px; margin-bottom:18px; font-size:13px; resize:none; box-sizing:border-box;">${autoMemo}</textarea>
        <div style="display:flex; gap:8px;">
            <button id="def-cancel" style="flex:1; padding:12px; background:#f5f5f5; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:12px;">CANCEL</button>
            <button id="def-save" style="flex:2; padding:12px; background:#000; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:12px;">ARCHIVE</button>
        </div>
    `;
    
    modalWrap.appendChild(modalBox); document.body.appendChild(modalWrap);
    const tagIn = document.getElementById('def-tag-in'), saveBtn = document.getElementById('def-save');
    setTimeout(() => tagIn.focus(), 50);
    tagIn.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); } };
    document.getElementById('def-cancel').onclick = () => { modalWrap.remove(); isModalOpen = false; };
    
    saveBtn.onclick = async () => {
        const tags = tagIn.value, memo = document.getElementById('def-memo-in').value;
        modalBox.innerHTML = '<div style="text-align:center; padding:40px; font-size:13px; font-weight:600;">💎 Archiving...</div>';
        await executeUpload(imgUrl, vidUrl, sourceLink, tags, memo);
        modalWrap.remove(); isModalOpen = false;
    };
}

/* ==========================================
   [섹션 11] 최종 업로드 엔진 (가볍고 빠른 순정 버전 🚀)
   ========================================== */
async function executeUpload(imgUrl, vidUrl, pageUrl, tags, memo, folder) {
    try {
        const token = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "get-clerk-token" }, (response) => {
                // ✨ [수정] 백그라운드와 연결이 끊겼거나 응답이 없을 때 에러가 나지 않도록 방어막 추가!
                if (chrome.runtime.lastError || !response) {
                    console.warn("백그라운드 통신 오류 또는 토큰 없음:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response.token);
                }
            });
        });

        if (!token) {
            showDeferenceToast("🔒 로그인 후 다시 시도해주세요. (홈페이지 접속 필요)");
            return;
        }

        let blob;
        try { 
            const res = await fetch(imgUrl); blob = await res.blob(); 
        } catch (e) { 
            const b64 = await new Promise((res) => { 
                chrome.runtime.sendMessage({ action: "bypass-cors-fetch", url: imgUrl }, (r) => res(r.base64)); 
            }); 
            const br = await fetch(b64); blob = await br.blob(); 
        }
        
        const compressedBlob = await resizeAndCompress(blob);
        
        const formData = new FormData();
        formData.append("file", compressedBlob, `collect_${Date.now()}.webp`);

        // 1. R2 업로드
        const cfRes = await fetch(`${WORKER_URL}/upload`, { 
            method: "POST", 
            headers: { "Authorization": `Bearer ${token}` },
            body: formData 
        });
        const cfData = await cfRes.json();

        if (!cfData.success) throw new Error("Cloudflare R2 upload failed");

        // 2. D1 저장
        const dbRes = await fetch(`${WORKER_URL}/assets`, { 
            method: "POST", 
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                image_url: cfData.url, 
                video_url: vidUrl || "", 
                page_url: pageUrl || "", 
                tags: tags || "",  
                memo: memo || "",
                folder: folder || "전체" 
            }) 
        });

        if (!dbRes.ok) throw new Error("Cloudflare D1 save failed");

    } catch (e) { 
        console.error("수집 에러:", e);
        showDeferenceToast("ARCHIVE FAILED"); 
    }
}

// ⚙️ 잃어버렸던 압축 엔진 복구 완료!
function resizeAndCompress(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height, MAX = 1200; 
                if (w > MAX) { h = (MAX / w) * h; w = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
            };
        };
        reader.onerror = reject;
    });
}

// 📡 웹사이트(deference.work)에서 날린 토큰을 낚아채는 비밀 안테나
window.addEventListener('def-login-sync', (e) => {
    if (e.detail && e.detail.token) {
        chrome.runtime.sendMessage({ action: "set-token", token: e.detail.token });
        console.log("Deference 요원: 클럭 신분증 동기화 완료! 🔐");
    }
});

/* ==========================================
   [섹션 12] 일괄 저장 (Batch Save) 스캐너 엔진 🚀
   ========================================== */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open-batch-save") {
        openBatchSaveUI();
    }
});

function openBatchSaveUI() {
    // 1. 미디어 스캐너 고도화 (해상도 및 포맷 추출)
    let mediaMap = new Map();

    function getExt(url) {
        const clean = url.split('?')[0].toLowerCase();
        const ext = clean.split('.').pop();
        return ['jpg','jpeg','png','gif','webp','svg','mp4'].includes(ext) ? ext : 'unknown';
    }

    // 이미지 추출
    document.querySelectorAll('img').forEach(img => {
        let src = img.srcset ? img.srcset.split(',').pop().trim().split(' ')[0] : (img.currentSrc || img.src);
        if (src && src.startsWith('http') && !src.includes('transparent') && img.naturalWidth > 100) {
            mediaMap.set(src, { 
                url: src, 
                width: img.naturalWidth, 
                height: img.naturalHeight, 
                ext: getExt(src) 
            });
        }
    });

    // 비디오(포스터) 추출
    document.querySelectorAll('video').forEach(vid => {
        if (vid.poster && vid.poster.startsWith('http')) {
            mediaMap.set(vid.poster, { url: vid.poster, width: vid.videoWidth || 0, height: vid.videoHeight || 0, ext: 'mp4' });
        }
    });

    // SVG 추출 (src로 된 것만 우선)
    document.querySelectorAll('img[src$=".svg"]').forEach(svg => {
        if (svg.src && svg.src.startsWith('http')) {
            mediaMap.set(svg.src, { url: svg.src, width: svg.clientWidth || 0, height: svg.clientHeight || 0, ext: 'svg' });
        }
    });

    const mediaList = Array.from(mediaMap.values());
    if (mediaList.length === 0) {
        showDeferenceToast("저장할 만한 고화질 미디어를 찾지 못했습니다. 🥲");
        return;
    }

    // 2. 전체 화면 레이아웃 (좌측 그리드 / 우측 사이드바)
    const overlay = document.createElement('div');
    overlay.id = 'def-batch-overlay';
    overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f4f5f7; z-index:2147483647; display:flex; flex-direction:column; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`;

    // 상단 헤더
    const header = document.createElement('div');
    header.style.cssText = `height:60px; padding:0 24px; display:flex; justify-content:space-between; align-items:center; background:#fff; border-bottom:1px solid #e1e4e8; flex-shrink:0;`;
    header.innerHTML = `
        <div style="font-size:16px; font-weight:700; color:#111;">일괄 저장 <span style="color:#888; font-weight:500; font-size:14px; margin-left:8px;">(0 / ${mediaList.length})</span></div>
        <div style="display:flex; align-items:center; gap:16px;">
            <button id="def-batch-select-all" style="background:none; border:none; color:#0066ff; font-weight:600; cursor:pointer; font-size:14px;">전체 선택</button>
            <button id="def-batch-close" style="background:none; border:none; font-size:20px; cursor:pointer; color:#888; padding:4px;">✕</button>
        </div>
    `;
    overlay.appendChild(header);

    // 메인 컨테이너 (좌측 목록, 우측 패널)
    const mainWrap = document.createElement('div');
    mainWrap.style.cssText = `display:flex; flex:1; overflow:hidden;`;
    
    const gridWrap = document.createElement('div');
    gridWrap.style.cssText = `flex:1; overflow-y:auto; padding:24px; display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:24px; align-content:start;`;
    
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `width:300px; background:#fff; border-left:1px solid #e1e4e8; display:flex; flex-direction:column; overflow-y:auto;`;
    
    sidebar.innerHTML = `
        <div style="padding:24px; flex:1;">
            <div style="margin-bottom:24px;">
                <div style="font-size:13px; font-weight:700; color:#555; margin-bottom:12px;">형식 필터</div>
                <label style="display:block; margin-bottom:8px; font-size:14px;"><input type="checkbox" checked class="def-filter" value="all" style="margin-right:8px;">전체 보기</label>
                <label style="display:block; margin-bottom:8px; font-size:14px;"><input type="checkbox" class="def-filter" value="img" style="margin-right:8px;">이미지 (jpg, png 등)</label>
                <label style="display:block; margin-bottom:8px; font-size:14px;"><input type="checkbox" class="def-filter" value="mp4" style="margin-right:8px;">동영상 (mp4)</label>
                <label style="display:block; margin-bottom:8px; font-size:14px;"><input type="checkbox" class="def-filter" value="svg" style="margin-right:8px;">벡터 (svg)</label>
            </div>
            
            <div style="margin-bottom:24px;">
                <div style="font-size:13px; font-weight:700; color:#555; margin-bottom:12px;">폴더 지정</div>
                <select id="def-batch-folder" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; outline:none; font-size:14px; background:#f9f9f9;">
                    <option value="">+ 폴더 선택 안함</option>
                </select>
            </div>

            <div style="margin-bottom:24px;">
                <div style="font-size:13px; font-weight:700; color:#555; margin-bottom:12px;">일괄 태그 추가</div>
                <input type="text" id="def-batch-tags" placeholder="태그 입력 (쉼표로 구분)" style="width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid #ddd; outline:none; font-size:14px; background:#f9f9f9;">
            </div>
        </div>
        
        <div style="padding:20px; border-top:1px solid #e1e4e8; background:#fff;">
            <button id="def-batch-submit" style="width:100%; background:#0066ff; color:#fff; border:none; padding:14px; border-radius:8px; font-weight:bold; font-size:15px; cursor:pointer; opacity:0.5; pointer-events:none; transition:0.2s;">0개 다운로드</button>
        </div>
    `;

    mainWrap.appendChild(gridWrap);
    mainWrap.appendChild(sidebar);
    overlay.appendChild(mainWrap);

    let selectedUrls = new Set();
    const cards = [];

    // 3. 카드 렌더링
    mediaList.forEach((item, idx) => {
        const cardBox = document.createElement('div');
        const displayType = item.ext === 'mp4' ? 'mp4' : (item.ext === 'svg' ? 'svg' : 'img');
        
        cardBox.style.cssText = `display:flex; flex-direction:column; gap:8px;`;
        cardBox.dataset.type = displayType;

        const card = document.createElement('div');
        card.style.cssText = `position:relative; aspect-ratio:3/4; background:${item.ext === 'svg' ? '#eef0f2' : '#fff'}; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); cursor:pointer; border:2px solid transparent; transition:all 0.15s ease;`;
        
        card.innerHTML = `
            <img src="${item.url}" style="width:100%; height:100%; object-fit:${item.ext === 'svg' ? 'contain' : 'cover'}; pointer-events:none;">
            ${item.ext === 'mp4' ? `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:32px; height:32px; background:rgba(0,0,0,0.6); border-radius:50%; display:flex; justify-content:center; align-items:center;"><span style="color:#fff; font-size:12px;">▶</span></div>` : ''}
            <div class="def-batch-check" style="position:absolute; top:8px; right:8px; width:22px; height:22px; border-radius:6px; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.1); display:flex; justify-content:center; align-items:center; opacity:0; transition:0.15s;">
                <span style="color:#fff; font-weight:bold; font-size:12px; display:none;">✓</span>
            </div>
        `;

        const metaInfo = document.createElement('div');
        metaInfo.style.cssText = `font-size:12px; color:#666; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
        metaInfo.innerText = `${item.width > 0 ? `${item.width} × ${item.height} / ` : ''}${item.ext.toUpperCase()}`;

        card.onmouseenter = () => { if(!selectedUrls.has(item.url)) card.querySelector('.def-batch-check').style.opacity = '1'; };
        card.onmouseleave = () => { if(!selectedUrls.has(item.url)) card.querySelector('.def-batch-check').style.opacity = '0'; };

        card.onclick = () => {
            const checkIcon = card.querySelector('.def-batch-check');
            const checkMark = checkIcon.querySelector('span');
            if (selectedUrls.has(item.url)) {
                selectedUrls.delete(item.url);
                card.style.borderColor = 'transparent';
                checkIcon.style.background = 'rgba(255,255,255,0.7)';
                checkIcon.style.border = '1px solid rgba(0,0,0,0.1)';
                checkMark.style.display = 'none';
            } else {
                selectedUrls.add(item.url);
                card.style.borderColor = '#0066ff';
                checkIcon.style.opacity = '1';
                checkIcon.style.background = '#0066ff';
                checkIcon.style.border = 'none';
                checkMark.style.display = 'block';
            }
            updateUIState();
        };

        cardBox.appendChild(card);
        cardBox.appendChild(metaInfo);
        gridWrap.appendChild(cardBox);
        cards.push(cardBox);
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

// ✨ [수정됨] 클라우드플레어 D1(collections)에서 실제 폴더 목록 불러오기
    function loadUserFolders() {
        const folderSelect = document.getElementById('def-batch-folder');
        
        // 1. background.js에 저장된 Clerk 토큰 가져오기
        chrome.runtime.sendMessage({ action: "get-clerk-token" }, async (response) => {
            const token = response.token;
            if (!token) {
                console.warn("로그인이 필요합니다. 폴더 목록을 불러올 수 없습니다.");
                return;
            }

            try {
                
                const apiUrl = 'https://def-api.deference.workers.dev/collections';
                
                const res = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) throw new Error('서버에서 폴더를 가져오지 못했습니다.');

                const collections = await res.json();

                // 2. 가져온 폴더 배열을 순회하며 옵션(<option>)으로 만들기
                // 스크린샷의 DB 구조 기준: folder.id, folder.name 사용
                collections.forEach(folder => {
                    const opt = document.createElement('option');
                    opt.value = folder.id;       // DB의 고유 id (저장할 때 서버로 보낼 값)
                    opt.innerText = folder.name; // 화면에 보여질 이름 (예: '테스트')
                    folderSelect.appendChild(opt);
                });

            } catch (error) {
                console.error("폴더 목록 로드 에러:", error);
            }
        });
    }
    loadUserFolders();

    // 4. 상태 업데이트 및 제어 함수들
    const submitBtn = document.getElementById('def-batch-submit');
    const headerTitle = header.querySelector('span');

    function updateUIState() {
        const count = selectedUrls.size;
        headerTitle.innerText = `(${count} / ${mediaList.length})`;
        submitBtn.innerText = `${count}개 다운로드`;
        
        if (count > 0) {
            submitBtn.style.opacity = '1'; 
            submitBtn.style.pointerEvents = 'auto';
        } else {
            submitBtn.style.opacity = '0.5'; 
            submitBtn.style.pointerEvents = 'none';
        }
    }

    // 전체 선택 기능
    document.getElementById('def-batch-select-all').onclick = () => {
        const visibleCards = cards.filter(c => c.style.display !== 'none');
        const allSelected = visibleCards.every(c => selectedUrls.has(c.querySelector('img').src));
        
        visibleCards.forEach(c => {
            const url = c.querySelector('img').src;
            if (allSelected) {
                selectedUrls.delete(url);
                c.firstElementChild.style.borderColor = 'transparent';
                c.querySelector('.def-batch-check').style.background = 'rgba(255,255,255,0.7)';
                c.querySelector('span').style.display = 'none';
            } else {
                selectedUrls.add(url);
                c.firstElementChild.style.borderColor = '#0066ff';
                c.querySelector('.def-batch-check').style.opacity = '1';
                c.querySelector('.def-batch-check').style.background = '#0066ff';
                c.querySelector('span').style.display = 'block';
            }
        });
        updateUIState();
    };

    // 필터링 기능
    const filters = document.querySelectorAll('.def-filter');
    filters.forEach(f => {
        f.addEventListener('change', (e) => {
            if(e.target.value === 'all') {
                filters.forEach(cb => { if(cb !== e.target) cb.checked = false; });
            } else {
                document.querySelector('.def-filter[value="all"]').checked = false;
            }
            
            const checkedValues = Array.from(filters).filter(cb => cb.checked).map(cb => cb.value);
            
            cards.forEach(card => {
                if(checkedValues.includes('all') || checkedValues.includes(card.dataset.type)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    document.getElementById('def-batch-close').onclick = () => {
        overlay.remove(); document.body.style.overflow = 'auto';
    };

    // 5. 최종 저장 실행 엔진
    submitBtn.onclick = async () => {
        const urlsToSave = Array.from(selectedUrls);
        submitBtn.innerText = "저장 중... ⏳";
        submitBtn.style.pointerEvents = 'none';

        // 우측 사이드바에서 유저가 입력한 태그와 폴더 가져오기
        const userFolder = document.getElementById('def-batch-folder').value;
        const userInputTags = document.getElementById('def-batch-tags').value;
        
        let successCount = 0;
        const pageUrl = window.location.href; 
        
        // ✅ 수정된 코드 (유저가 입력한 값만 깔끔하게 넘김)
        let finalTags = userInputTags.trim();

        for (const targetUrl of urlsToSave) {
            try {
                // 폴더 정보를 executeUpload에 같이 넘겨주도록 백엔드/API 규격을 맞춰야 합니다.
                await executeUpload(targetUrl, null, pageUrl, finalTags, document.title, userFolder);
                successCount++;
            } catch (e) { console.error(e); }
        }

        showDeferenceToast(`🎉 성공적으로 ${successCount}개의 미디어를 저장했습니다!`, true);
        overlay.remove(); 
        document.body.style.overflow = 'auto';
    };
}

/* ==========================================
   [섹션 13] 전략 A: 시선 유도 (Scroll Into View) 스크롤 캡처 🚀
   ========================================== */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start-full-page-capture") {
        executeFullPageCapture();
    }
});

async function executeFullPageCapture() {
    const MAX_PAGES = 10; // 무한 스크롤 방어막 (최대 10화면)
    showDeferenceToast(`📸 시선 유도 스캔 중... (최대 ${MAX_PAGES}화면) 마우스를 움직이지 마세요!`, false);

    const noScrollStyle = document.createElement('style');
    noScrollStyle.innerHTML = `::-webkit-scrollbar { display: none !important; }`;
    document.head.appendChild(noScrollStyle);

    // 1. 진짜 스크롤 컨테이너 찾기
    let scrollEl = document.documentElement;
    document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
            if (el.clientWidth * el.clientHeight > scrollEl.clientWidth * scrollEl.clientHeight) scrollEl = el;
        }
    });

    const isWindow = (scrollEl === document.documentElement || scrollEl === document.body);
    const viewportHeight = isWindow ? window.innerHeight : scrollEl.clientHeight;
    const innerWidth = isWindow ? window.innerWidth : scrollEl.clientWidth;
    const dpr = window.devicePixelRatio || 1;

    // 맨 위로 초기화
    if (isWindow) window.scrollTo(0, 0); else scrollEl.scrollTop = 0;
    await new Promise(r => setTimeout(r, 600));

    // ✨ [전략 A 핵심] 시선을 유도할 투명한 '닻(Anchor)' 엘리먼트 생성
    const anchor = document.createElement('div');
    anchor.style.cssText = "position:absolute; left:0; width:1px; height:1px; background:transparent; pointer-events:none; z-index:-9999;";
    
    // 타겟 상자 안에 닻을 던져 넣습니다.
    if (!isWindow && window.getComputedStyle(scrollEl).position === 'static') {
        scrollEl.style.position = 'relative'; 
    }
    (isWindow ? document.body : scrollEl).appendChild(anchor);

    let currentY = 0;
    let pageCount = 0;
    let fixedElements = [];
    let capturedImages = [];

    const captureFrame = async () => {
        const response = await new Promise(resolve => chrome.runtime.sendMessage({ action: "capture-viewport" }, resolve));
        if (response && response.dataUrl) {
            const img = new Image();
            await new Promise(resolve => { img.onload = resolve; img.src = response.dataUrl; });
            return img;
        }
        return null;
    };

    // =====================================
    // 🔄 시선 유도 스크롤 메인 루프
    // =====================================
    while (pageCount < MAX_PAGES) {
        // 현재 화면 찰칵
        const img = await captureFrame();
        if (img) capturedImages.push({ img, y: currentY });

        // 고정 메뉴바 투명화 (첫 장 찍은 직후 1회만 실행)
        if (pageCount === 0) {
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'sticky') {
                    fixedElements.push({ el, opacity: style.opacity, transition: style.transition });
                    el.style.setProperty('transition', 'none', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                }
            });
            await new Promise(r => setTimeout(r, 100));
        }

        const previousY = currentY;
        
        // ✨ [전략 A] 다음 목표 지점(현재 위치 + 화면 높이)에 닻을 내립니다.
        const targetY = currentY + viewportHeight;
        anchor.style.top = `${targetY}px`;

        // ✨ 브라우저야, 저 닻이 있는 곳으로 부드럽게(smooth) 카메라 좀 이동해 줘!
        anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // 브라우저가 네이티브하게 스크롤을 내리고, 사이트가 새 사진을 불러올 시간을 넉넉히 줍니다.
        await new Promise(r => setTimeout(r, 1000)); 

        // 이동 후 실제 좌표 확인
        currentY = isWindow ? window.scrollY : scrollEl.scrollTop;

        // 바닥에 도달했거나 더 이상 안 내려가면 스톱!
        if (currentY <= previousY + 10) {
            if (currentY > previousY) { // 마지막 짜투리 캡처
                const finalImg = await captureFrame();
                if (finalImg) capturedImages.push({ img: finalImg, y: currentY });
            }
            break; 
        }
        pageCount++;
    }

    // =====================================
    // 🛠️ 마무리 및 캔버스 조립
    // =====================================
    anchor.remove(); // 다 쓴 닻은 치워줍니다.
    fixedElements.forEach(item => {
        item.el.style.setProperty('transition', item.transition);
        item.el.style.setProperty('opacity', item.opacity);
    });
    noScrollStyle.remove();
    if (isWindow) window.scrollTo(0, 0); else scrollEl.scrollTop = 0;

    showDeferenceToast("💎 스캔 완료! 아카이브에 저장합니다...", false);

    const canvas = document.createElement('canvas');
    canvas.width = innerWidth * dpr;
    const totalHeight = capturedImages.length > 0 ? capturedImages[capturedImages.length - 1].y + viewportHeight : viewportHeight;
    canvas.height = totalHeight * dpr;
    const ctx = canvas.getContext('2d');

    capturedImages.forEach(capture => {
        ctx.drawImage(capture.img, 0, 0, capture.img.width, capture.img.height, 0, capture.y * dpr, innerWidth * dpr, viewportHeight * dpr);
    });

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    showPreSaveModal(finalDataUrl, null, getCleanUrl(window.location.href));
}

} // 🌟 방어막 닫기

// 🔑 로그인 토큰 자동 동기화 엔진 (최종 방탄 버전 🛡️)
let defSyncInterval = null;

function syncAuthToken() {
    const token = localStorage.getItem('__clerk_db_jwt') || 
                  document.cookie.split('; ').find(row => row.startsWith('__session'))?.split('=')[1];

    if (token) {
        try {
            // 본부가 죽었는지 확인하지 않고, 그냥 냅다 저장 시도를 합니다.
            // 만약 익스텐션이 재시작되어 연결이 끊긴 상태라면 여기서 조용히 catch 블록으로 던져집니다.
            chrome.storage.local.set({ 'def_token': token }, () => {
                // 에러 찌꺼기가 콘솔에 남지 않도록 허공에 날려줍니다.
                if (chrome.runtime && chrome.runtime.lastError) { /* empty */ }
            });
        } catch (e) {
            // 본부와 연결이 끊겨서 에러가 나면, 빨간줄을 띄우는 대신 즉시 무전기(타이머)를 끕니다.
            if (defSyncInterval) {
                clearInterval(defSyncInterval);
            }
        }
    }
}

// 최초 1회 실행 후 10초마다 반복
syncAuthToken();
defSyncInterval = setInterval(syncAuthToken, 10000);