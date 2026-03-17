/* ==========================================
   [colorPicker.js] 초지능형 컬러 스캐너, 인터랙티브 핀, 팔레트 에디터 🎨
   ========================================== */

window.isMarkersVisible = true; 
window.globalLoupe = null; 

window.toggleMarkers = function(toggleInput) {
    window.isMarkersVisible = toggleInput.checked;
    document.querySelectorAll('.color-picker-marker').forEach(marker => {
        marker.style.display = window.isMarkersVisible ? 'block' : 'none';
    });
    if(window.isMarkersVisible && typeof showDeferenceToast === 'function') showDeferenceToast("Pins enabled");
};

window.initColorLoupe = function(parentWrapper) {
    if (window.globalLoupe) return; 
    window.globalLoupe = document.createElement('div');
    window.globalLoupe.id = 'color-picker-loupe';
    window.globalLoupe.className = 'color-picker-loupe';
    window.globalLoupe.style.transform = 'translate(-50%, -50%)'; 
    window.globalLoupe.style.pointerEvents = 'none'; 
    const loupeCanvas = document.createElement('canvas');
    window.globalLoupe.appendChild(loupeCanvas);
    parentWrapper.appendChild(window.globalLoupe);
};

window.updatePalettePosition = function(isZoomed) {
    const paletteGroup = document.getElementById('color-palette-group');
    if (!paletteGroup) return;
    paletteGroup.style.left = '50%';
};

window.resetZoomState = function(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('zoomed');
    wrapper.style.transform = 'scale(1)';
    const modalLeftPanel = document.querySelector('.modal-left');
    const modalContainer = modalLeftPanel ? modalLeftPanel.parentElement : null;
    if (modalContainer) modalContainer.classList.remove('is-zoomed');
    setTimeout(() => window.updatePalettePosition(false), 100); 
};

window.getRenderedBounds = function(img, wrapper) {
    const wrapRect = wrapper.getBoundingClientRect();
    const wrapW = wrapRect.width || 1; 
    const wrapH = wrapRect.height || 1;

    if (!img.naturalWidth) return { renderW: wrapW, renderH: wrapH, offsetX: 0, offsetY: 0, wrapW, wrapH };

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const wrapRatio = wrapW / wrapH;
    let renderW = wrapW, renderH = wrapH, offsetX = 0, offsetY = 0;

    if (wrapRatio > imgRatio) {
        renderH = wrapH; renderW = renderH * imgRatio;
        offsetX = (wrapW - renderW) / 2;
    } else {
        renderW = wrapW; renderH = renderW / imgRatio;
        offsetY = (wrapH - renderH) / 2;
    }
    return { renderW, renderH, offsetX, offsetY, wrapW, wrapH };
};

window.renderSmartColors = function(imageUrl, isVideo = false) {
    const paletteGroup = document.getElementById('color-palette-group');
    const paletteContainer = document.getElementById('modal-color-palette');
    const imageWrapper = document.getElementById('image-wrapper'); 
    const pinToggle = document.getElementById('pinToggle');
    
    if (!paletteGroup || !paletteContainer || !imageWrapper) return;
    if (paletteGroup.parentElement !== document.body) document.body.appendChild(paletteGroup);

    window.resetZoomState(imageWrapper);
    if (pinToggle) window.isMarkersVisible = pinToggle.checked; 
    window.setupImageZoom(imageWrapper);

    document.querySelectorAll('.color-picker-marker').forEach(m => m.remove());
    paletteGroup.style.display = 'flex'; 
    paletteContainer.innerHTML = ''; 

    const safeUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'notaint=' + Date.now();
    const imgForColor = new Image(); 
    imgForColor.crossOrigin = 'Anonymous'; 
    imgForColor.src = safeUrl;

    imgForColor.onload = () => {
        try {
            const colorThief = new ColorThief();
            const rawPalette = colorThief.getPalette(imgForColor, 30);
            if (!rawPalette) return;

            const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            const getDiff = (c1, c2) => Math.sqrt(Math.pow(c1[0]-c2[0], 2) + Math.pow(c1[1]-c2[1], 2) + Math.pow(c1[2]-c2[2], 2));
            
            let candidates = rawPalette.map((rgb, idx) => {
                let score = 30 - idx;
                return { rgb, hex: rgbToHex(...rgb), score };
            });

            const finalSelection = [candidates[0]];
            for (let cand of candidates) {
                if (finalSelection.length >= 5) break;
                if (!finalSelection.some(sel => getDiff(cand.rgb, sel.rgb) < 70)) finalSelection.push(cand);
            }

            const scanCanvas = document.createElement('canvas');
            const scanCtx = scanCanvas.getContext('2d', {willReadFrequently: true});
            const scale = Math.min(1, 150 / Math.max(imgForColor.naturalWidth, imgForColor.naturalHeight));
            const w = Math.floor(imgForColor.naturalWidth * scale);
            const h = Math.floor(imgForColor.naturalHeight * scale);
            scanCanvas.width = w; scanCanvas.height = h;
            scanCtx.drawImage(imgForColor, 0, 0, w, h);
            const imgData = scanCtx.getImageData(0, 0, w, h).data;
            
            const findPosition = (targetRgb) => {
                let bestX = w/2, bestY = h/2, minD = Infinity;
                for(let i=0; i<imgData.length; i+=4) {
                    if (imgData[i+3] < 128) continue; 
                    const d = Math.abs(imgData[i]-targetRgb[0]) + Math.abs(imgData[i+1]-targetRgb[1]) + Math.abs(imgData[i+2]-targetRgb[2]);
                    if(d < minD) { minD = d; bestX = (i/4)%w; bestY = Math.floor((i/4)/w); }
                } 
                return { pctX: bestX / w, pctY: bestY / h }; 
            };

            paletteContainer.innerHTML = ''; 
            
            finalSelection.forEach((item) => {
                const chip = document.createElement('div');
                chip.className = 'def-color-chip';
                chip.style.backgroundColor = item.hex;
                chip.dataset.hex = item.hex; 
                chip.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.05)";
                chip.onclick = () => { navigator.clipboard.writeText(chip.dataset.hex || item.hex); if(typeof showDeferenceToast === 'function') showDeferenceToast(`Copied!`); };
                paletteContainer.appendChild(chip);

                if (!isVideo) {
                    const marker = document.createElement('div');
                    marker.className = 'color-picker-marker';
                    marker.style.backgroundColor = item.hex;
                    marker.style.position = 'absolute';
                    marker.style.transform = 'translate(-50%, -50%)'; 
                    marker.style.border = '2px solid rgba(255,255,255,0.9)'; 
                    marker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                    marker.style.display = 'none'; 
                    
                    const pos = findPosition(item.rgb);
                    imageWrapper.appendChild(marker);

                    setTimeout(() => {
                        const imgEl = document.getElementById('modalImage');
                        const bounds = window.getRenderedBounds(imgEl, imageWrapper);
                        
                        const leftPct = ((bounds.offsetX + pos.pctX * bounds.renderW) / bounds.wrapW) * 100;
                        const topPct = ((bounds.offsetY + pos.pctY * bounds.renderH) / bounds.wrapH) * 100;

                        marker.style.left = leftPct + '%';
                        marker.style.top = topPct + '%';
                        marker.style.display = window.isMarkersVisible ? 'block' : 'none';
                    }, 200);

                    window.setupMarkerDrag(marker, chip, imageWrapper, imgForColor.naturalWidth, imgForColor.naturalHeight, imgForColor);
                }
            });
        } catch (e) { console.error(e); }
    };
};

window.setupMarkerDrag = function(marker, chip, wrapper, imgW, imgH, sourceImg) {
    const loupeZoom = 4; const loupeSize = 100; 

    function getLoupe() {
        let loupe = document.getElementById('color-picker-loupe');
        if (!loupe) {
            loupe = document.createElement('div');
            loupe.id = 'color-picker-loupe'; loupe.className = 'color-picker-loupe';
            loupe.style.transform = 'translate(-50%, -50%)';
            loupe.style.pointerEvents = 'none';
            const canvas = document.createElement('canvas');
            loupe.appendChild(canvas); wrapper.appendChild(loupe);
        }
        return loupe;
    }

    marker.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation(); 
        const loupe = getLoupe();
        loupe.style.display = 'block';
        const loupeCanvas = loupe.querySelector('canvas');
        loupeCanvas.width = loupeSize; loupeCanvas.height = loupeSize;
        const ctx = loupeCanvas.getContext('2d', {willReadFrequently: true});
        ctx.imageSmoothingEnabled = false; 

        marker.classList.add('active');
        const markerRect = marker.getBoundingClientRect();
        const markerCenterX = markerRect.left + markerRect.width / 2;
        const markerCenterY = markerRect.top + markerRect.height / 2;
        const offsetX = e.clientX - markerCenterX;
        const offsetY = e.clientY - markerCenterY;

        const updatePositionAndLoupe = (clientX, clientY) => {
            const wrapperRect = wrapper.getBoundingClientRect();
            const imgEl = document.getElementById('modalImage');
            const bounds = window.getRenderedBounds(imgEl, wrapper); 

            let x = (clientX - offsetX) - wrapperRect.left;
            let y = (clientY - offsetY) - wrapperRect.top;

            x = Math.max(bounds.offsetX, Math.min(x, bounds.offsetX + bounds.renderW));
            y = Math.max(bounds.offsetY, Math.min(y, bounds.offsetY + bounds.renderH));

            const xPercent = (x / bounds.wrapW) * 100;
            const yPercent = (y / bounds.wrapH) * 100;

            marker.style.left = xPercent + '%'; marker.style.top = yPercent + '%';
            loupe.style.left = xPercent + '%'; loupe.style.top = yPercent + '%';

            const imgPctX = (x - bounds.offsetX) / bounds.renderW;
            const imgPctY = (y - bounds.offsetY) / bounds.renderH;
            const px = imgPctX * imgW;
            const py = imgPctY * imgH;

            const sourceSize = loupeSize / loupeZoom;
            const sx = px - sourceSize/2; const sy = py - sourceSize/2;

            ctx.clearRect(0,0,loupeSize,loupeSize);
            ctx.drawImage(sourceImg, sx, sy, sourceSize, sourceSize, 0, 0, loupeSize, loupeSize);

            try {
                const [r, g, b] = ctx.getImageData(loupeSize/2, loupeSize/2, 1, 1).data;
                const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
                chip.style.backgroundColor = hex; marker.style.backgroundColor = hex;
                chip.dataset.hex = hex;
            } catch (err) {}
        };

        updatePositionAndLoupe(e.clientX, e.clientY);

        const onMouseMove = (moveEvent) => updatePositionAndLoupe(moveEvent.clientX, moveEvent.clientY);
        const onMouseUp = () => {
            marker.classList.remove('active');
            getLoupe().style.display = 'none'; 
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
};

window.setupImageZoom = function(wrapper) {
    window.addEventListener('resize', () => {
        window.updatePalettePosition(wrapper.classList.contains('zoomed'));
    });

    wrapper.onclick = function(e) {
        if (e.target.classList.contains('color-picker-marker') || e.target.closest('.color-picker-loupe')) {
            return;
        }

        const modalLeftPanel = document.querySelector('.modal-left');
        const modalContainer = modalLeftPanel ? modalLeftPanel.parentElement : null;

        if (this.classList.contains('zoomed')) {
            this.classList.remove('zoomed');
            this.style.transform = ''; 
            if(modalContainer) modalContainer.classList.remove('is-zoomed');
            
            setTimeout(() => window.updatePalettePosition(false), 50);
        } else {
            this.style.transformOrigin = 'top center';
            this.classList.add('zoomed');
            this.style.transform = 'none'; 
            
            if(modalContainer) modalContainer.classList.add('is-zoomed');
            
            window.updatePalettePosition(true);
        }
    };
};

window.copyAllColors = function() {
    const chips = document.querySelectorAll('.def-color-chip');
    const hexList = [];
    
    chips.forEach(chip => {
        const val = chip.dataset.hex;
        if (val) hexList.push(val);
    });

    if (hexList.length > 0) {
        const resultString = hexList.join(', '); 
        navigator.clipboard.writeText(resultString).then(() => {
            if(typeof showDeferenceToast === 'function') showDeferenceToast("All colors copied! 🎨");
        });
    }
};

/* --- 팔레트 전용 에디터 엔진 --- */
let dragSourceIndex = null;
let globalPickrInstance = null; 
let currentActiveColorIndex = null;

window.getMasterPickr = function() {
    if (!globalPickrInstance) {
        const style = document.createElement('style');
        style.innerHTML = `
            .pcr-app { z-index: 999999999 !important; box-shadow: 0 12px 40px rgba(0,0,0,0.25) !important; border-radius: 12px !important; padding-top: 24px !important; }
            .pcr-drag-handle { position: absolute; top: 0; left: 0; width: 100%; height: 24px; cursor: grab; display: flex; align-items: center; justify-content: center; border-radius: 12px 12px 0 0; z-index: 100; }
            .pcr-drag-handle::before { content: ""; width: 36px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px; }
            .pcr-drag-handle:active { cursor: grabbing; }
        `;
        document.head.appendChild(style);

        const anchor = document.createElement('div');
        document.body.appendChild(anchor);

        globalPickrInstance = Pickr.create({
            el: anchor,
            theme: 'monolith',
            useAsButton: true,
            swatches: ['#0064E0', '#1C2B33', '#FFFFFF', '#FF3B30', '#FF9500', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'],
            components: { preview: true, hue: true, interaction: { hex: true, input: true, save: true } }
        });

        globalPickrInstance.on('change', (color) => {
            if (currentActiveColorIndex !== null) {
                window.updateColorValue(currentActiveColorIndex, color.toHEXA().toString());
            }
        });

        globalPickrInstance.on('save', () => globalPickrInstance.hide());
        globalPickrInstance.on('hide', () => { currentActiveColorIndex = null; });
    }
    return globalPickrInstance;
};

window.openGlobalPickr = function(idx, color, event) {
    if (event) event.stopPropagation();
    currentActiveColorIndex = idx;
    
    const p = window.getMasterPickr();
    p.setColor(color, true); 
    p.show(); 

    setTimeout(() => {
        const pcrApp = document.querySelector('.pcr-app');
        if (!pcrApp) return;

        if (event) {
            const rect = event.target.getBoundingClientRect();
            const appRect = pcrApp.getBoundingClientRect();
            let left = rect.right + 80; let top = rect.top - 30; 
            if (left + appRect.width > window.innerWidth) left = rect.left - appRect.width - 40;
            if (top + appRect.height > window.innerHeight) top = window.innerHeight - appRect.height - 20;

            pcrApp.style.position = 'fixed'; pcrApp.style.left = left + 'px'; pcrApp.style.top = top + 'px';
            pcrApp.style.margin = '0'; pcrApp.style.transform = 'none'; 
        }

        if (!pcrApp.querySelector('.pcr-drag-handle')) {
            const handle = document.createElement('div');
            handle.className = 'pcr-drag-handle';
            pcrApp.appendChild(handle);

            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            handle.addEventListener('mousedown', (e) => {
                isDragging = true; startX = e.clientX; startY = e.clientY;
                const rect = pcrApp.getBoundingClientRect();
                initialLeft = rect.left; initialTop = rect.top;
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX; const dy = e.clientY - startY;
                pcrApp.style.left = `${initialLeft + dx}px`; pcrApp.style.top = `${initialTop + dy}px`;
            });

            document.addEventListener('mouseup', () => { isDragging = false; });
        }
    }, 10);
};

window.renderPaletteEditor = function() {
    const container = document.getElementById('palette-grid-container');
    if (!container || typeof currentEditingPalette === 'undefined' || !currentEditingPalette) return;

    const cols = currentEditingPalette.columns || 5;
    container.innerHTML = '';

    currentEditingPalette.colors.forEach((color, idx) => {
        const block = document.createElement('div');
        block.className = 'palette-edit-block';
        block.style.backgroundColor = color;
        block.style.flex = `0 0 calc(100% / ${cols})`;
        block.style.minHeight = Math.max(120, 500 / Math.ceil(currentEditingPalette.colors.length / cols)) + 'px';
        block.draggable = true;

        block.addEventListener('dragstart', (e) => {
            dragSourceIndex = idx; e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => block.style.opacity = '0.4', 0);
        });
        block.addEventListener('dragover', (e) => { e.preventDefault(); block.classList.add('drag-over'); });
        block.addEventListener('dragleave', () => { block.classList.remove('drag-over'); });
        block.addEventListener('drop', (e) => {
            e.preventDefault(); block.classList.remove('drag-over');
            if (dragSourceIndex !== null && dragSourceIndex !== idx) {
                const draggedColor = currentEditingPalette.colors.splice(dragSourceIndex, 1)[0];
                currentEditingPalette.colors.splice(idx, 0, draggedColor);
                window.renderPaletteEditor();
            }
        });
        block.addEventListener('dragend', () => {
            block.style.opacity = '1'; dragSourceIndex = null;
            document.querySelectorAll('.palette-edit-block').forEach(b => b.classList.remove('drag-over'));
        });

        block.innerHTML = `
            <div class="palette-block-hover">
                <div class="ctrl-btn-group">
                    <button type="button" class="ctrl-btn edit-btn" onclick="openGlobalPickr(${idx}, '${color}', event)" title="Edit Color">🎨</button>
                    <button type="button" class="ctrl-btn delete-btn" onclick="event.stopPropagation(); removePaletteColor(${idx})" title="Delete">✕</button>
                </div>
                <div class="palette-hex-label" onclick="event.stopPropagation(); copySingleColor('${color}')">${color}</div>
            </div>
        `;
        container.appendChild(block);
    });
};

window.copySingleColor = function(hex) {
    navigator.clipboard.writeText(hex).then(() => {
        if(typeof showDeferenceToast === 'function') showDeferenceToast(`Copied ${hex} ! 🎨`);
    });
};

window.updateColorValue = function(idx, val) {
    if(!val.startsWith('#')) val = '#' + val;
    const upperVal = val.toUpperCase();
    if(typeof currentEditingPalette !== 'undefined' && currentEditingPalette) currentEditingPalette.colors[idx] = upperVal;
    
    const container = document.getElementById('palette-grid-container');
    if (container && container.children[idx]) {
        const block = container.children[idx];
        block.style.backgroundColor = upperVal;
        
        const label = block.querySelector('.palette-hex-label');
        if(label) {
            label.innerText = upperVal;
            label.setAttribute('onclick', `event.stopPropagation(); copySingleColor('${upperVal}')`);
            
            const editBtn = block.querySelector('.edit-btn');
            if (editBtn) editBtn.setAttribute('onclick', `openGlobalPickr(${idx}, '${upperVal}', event)`);
        }
    }
};

window.addPaletteColor = function() {
    if(typeof currentEditingPalette !== 'undefined' && currentEditingPalette) currentEditingPalette.colors.push('#000000'); 
    window.renderPaletteEditor();
    setTimeout(() => {
        const viewer = document.getElementById('modalPaletteViewer');
        if(viewer) viewer.scrollTop = viewer.scrollHeight;
    }, 50);
};

window.removePaletteColor = function(idx) {
    if(typeof currentEditingPalette !== 'undefined' && currentEditingPalette) currentEditingPalette.colors.splice(idx, 1);
    window.renderPaletteEditor();
};

window.updatePaletteColumns = function(val) {
    if(typeof currentEditingPalette !== 'undefined' && currentEditingPalette) currentEditingPalette.columns = parseInt(val) || 5;
    window.renderPaletteEditor();
};

window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('imageModal');
    if (modal && modal.style.display === "flex" && typeof currentEditingPalette !== 'undefined' && currentEditingPalette) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
            if (typeof paletteHistory !== 'undefined' && paletteHistory.length > 0) {
                e.preventDefault(); 
                currentEditingPalette.colors = paletteHistory.pop();
                window.renderPaletteEditor();
                if(typeof showDeferenceToast === 'function') showDeferenceToast("Undo ↩️");
            } else {
                if(typeof showDeferenceToast === 'function') showDeferenceToast("Nothing to undo", "warning"); 
            }
        }
    }
});