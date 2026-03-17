/* ==========================================
   [gallery.js] 갤러리 렌더링, 정렬, 필터 및 비디오 재생 엔진 🖼️
   ========================================== */

window.playVideoOnHover = function(wrapper) {
    const vid = wrapper.querySelector('video.hover-video');
    if (vid) { vid.style.opacity = '1'; vid.play().catch(e => console.log('Pending playback')); }
};

window.pauseVideoOnLeave = function(wrapper) {
    const vid = wrapper.querySelector('video.hover-video');
    if (vid) { vid.style.opacity = '0'; vid.pause(); vid.currentTime = 0; }
};

// 전역 상태 변수들
window.currentSortOrder = 'newest';
window.currentMediaType = 'all';
window.selectedFilterTags = new Set(); 
window.isTagPanelOpen = false;

window.applySortAndFilter = function() {
    window.currentSortOrder = document.getElementById('sort-order').value;
    window.currentMediaType = document.getElementById('filter-type').value;
    if (typeof renderGallery === 'function') renderGallery(); 
};

window.toggleTagPanel = function() {
    const panel = document.getElementById('tag-filter-panel');
    const btn = document.getElementById('filter-tags-btn');
    window.isTagPanelOpen = !window.isTagPanelOpen;

    if (window.isTagPanelOpen) {
        panel.style.display = 'flex';
        btn.style.background = 'var(--color-text-main)';
        btn.style.color = 'var(--color-bg-white)';
        renderFilterTags(); 
    } else {
        panel.style.display = 'none';
        btn.style.background = 'var(--color-bg-white)';
        btn.style.color = 'var(--color-text-main)';
    }
};

window.renderFilterTags = function() {
    const panel = document.getElementById('tag-filter-panel');
    if (!panel) return;
    panel.innerHTML = "";

    let allTags = new Set();
    photos.forEach(p => {
        if (p.tags) {
            p.tags.split(',').forEach(t => {
                const trimmed = t.trim();
                if (trimmed && trimmed !== "Uploads") allTags.add(trimmed); 
            });
        }
    });

    const sortedTags = Array.from(allTags).sort();

    if (sortedTags.length === 0) {
        panel.innerHTML = `<span style="color:var(--color-text-muted); font-size:13px;">등록된 태그가 없습니다. 사진에 태그를 추가해보세요!</span>`;
        return;
    }

    sortedTags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = `filter-tag-chip ${window.selectedFilterTags.has(tag) ? 'active' : ''}`;
        chip.innerText = tag;
        
        chip.onclick = () => {
            if (window.selectedFilterTags.has(tag)) window.selectedFilterTags.delete(tag);
            else window.selectedFilterTags.add(tag);
            if (typeof renderGallery === 'function') renderGallery(); 
        };
        panel.appendChild(chip);
    });
};

window.renderFolders = function() {
    const list = document.getElementById('folder-list');
    if (!list) return;
    list.innerHTML = "";

    const allBtn = document.createElement('button');
    allBtn.innerText = "All"; 
    allBtn.className = currentProject === 'ALL' ? 'folder-btn active' : 'folder-btn inactive';
    allBtn.onclick = () => { currentProject = 'ALL'; renderFolders(); renderGallery(); };
    list.appendChild(allBtn);

    projects.forEach(proj => {
        const btn = document.createElement('button');
        btn.innerText = proj.name; 
        
        // ✨ [핵심 변경 1] 폴더 이름(proj.name) 대신 고유 ID(proj.id)를 기준으로 선택 상태를 관리합니다.
        const projId = String(proj.id);
        btn.className = currentProject === projId ? 'folder-btn active' : 'folder-btn inactive';
        btn.onclick = () => { currentProject = projId; renderFolders(); renderGallery(); };
        
        list.appendChild(btn);
    });
};

window.renderGallery = function() {
  if (!document.getElementById('def-hover-styles')) {
      const style = document.createElement('style');
      style.id = 'def-hover-styles';
      style.innerHTML = `
          .card { position: relative; border-radius: var(--radius-none); overflow: hidden; background: var(--color-bg-white); }
          .card .media-wrapper { position: relative; width: 100%; height: 100%; overflow: hidden; cursor: pointer; transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), border-radius 0.25s ease; }
          .card .media-wrapper img { display: block; width: 100%; transition: transform var(--transition-normal); }
          .card:not(.link-type):hover .media-wrapper img { transform: scale(1.03); }
          .card .hover-dim { position: absolute; inset: 0; background: var(--color-dim); opacity: 0; transition: opacity var(--transition-normal); pointer-events: none; z-index: 1; }
          .card:hover .hover-dim { opacity: 1; }
          .card .hover-source { position: absolute; bottom: 16px; left: 16px; color: var(--color-bg-white); font-size: var(--text-sm); font-weight: var(--weight-bold); opacity: 0; transform: translateY(5px); transition: all var(--transition-normal); z-index: 2; pointer-events: none; text-shadow: var(--shadow-sm); text-transform: capitalize; letter-spacing: 0.5px; }
          .card:hover .hover-source { opacity: 1; transform: translateY(0); }
          .card .hover-link { position: absolute; bottom: 16px; right: 16px; width: 28px; height: 28px; background: var(--color-bg-white); color: var(--color-text-main); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; text-decoration: none; font-weight: var(--weight-bold); font-size: var(--text-body); opacity: 0; transform: translateY(5px); transition: all var(--transition-fast); z-index: 3; box-shadow: var(--shadow-sm); }
          .card:hover .hover-link { opacity: 1; transform: translateY(0); }
          .card .hover-link:hover { background: var(--color-text-main); color: var(--color-bg-white); transform: translateY(0) scale(1.1); }
          .palette-bar { cursor: pointer; }

          /* 편집 모드 & 선택 UI */
          .card .card-checkbox { position: absolute; top: 12px; left: 12px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); background: rgba(0,0,0,0.25); z-index: 10; opacity: 0; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; pointer-events: none; backdrop-filter: blur(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
          .card .card-checkbox::after { content: ''; width: 10px; height: 5px; border-left: 2px solid white; border-bottom: 2px solid white; transform: rotate(-45deg) translateY(-1px); opacity: 0; transition: opacity 0.2s ease; }
          
          body.edit-mode .card .card-checkbox { opacity: 1; }
          body.edit-mode .card .hover-link { display: none; } 
          body.edit-mode .card:hover .hover-dim { opacity: 0; } 
          body.edit-mode .card:hover .media-wrapper img { transform: scale(1); } 
          
          .card.selected .media-wrapper { transform: scale(0.88); border-radius: 12px; }
          .card.selected .card-checkbox { background: var(--color-text-main); border-color: var(--color-text-main); opacity: 1; }
          .card.selected .card-checkbox::after { opacity: 1; }
          .card.selected::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.05); pointer-events: none; z-index: 0; border-radius: var(--radius-none); }

          /* ✨ 링크 임베드 전용 스타일 추가 ✨ */
          .card.link-type { grid-column: span 2; }
          .card.link-type .media-wrapper { display: flex; flex-direction: row; height: 140px; background: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; text-decoration: none; color: inherit; align-items: stretch; }
          .card.link-type:hover .media-wrapper { box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-4px); }
          .card.link-type .link-info { flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; text-align: left; }
          .card.link-type .link-title { font-size: 15px; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.5px; }
          .card.link-type .link-desc { font-size: 13px; color: #888; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; }
          .card.link-type .link-domain { font-size: 11px; color: #aaa; display: flex; align-items: center; gap: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .card.link-type .link-domain img { width: 14px; height: 14px; border-radius: 2px; }
          .card.link-type .link-thumbnail { width: 140px; min-width: 140px; border-left: 1px solid #eaeaea; background: #f0f0f0; overflow: hidden; }
          .card.link-type .link-thumbnail img { width: 100%; height: 100%; object-fit: cover; transform: none !important; }
      `;
      document.head.appendChild(style);
  }

  const container = document.getElementById('gallery');
  container.innerHTML = "";
  
let filteredPhotos = photos.filter(photo => {
      let isProjectMatch = false;

      // ✨ [초깔끔해진 폴더 필터링] 오직 고유 ID만 검사합니다!
      if (currentProject === 'ALL') { 
          isProjectMatch = true; 
      } else {
          const folderStr = String(photo.folder || "");
          const targetId = String(currentProject);
          
          // 조건 1: 스캐너를 통해 단일 숫자 ID ("1") 로 들어간 경우
          // 조건 2: 다중 이동 모달창을 통해 배열 형태 ('["1", "2"]') 로 들어간 경우
          if (folderStr === targetId || folderStr.includes(`"${targetId}"`)) {
              isProjectMatch = true;
          }
      }

      let domain = "";
      try { if (photo.page_url && photo.page_url !== "undefined") domain = new URL(photo.page_url).hostname.replace('www.', ''); } catch(e) {}
      const combinedText = `${photo.tags || ''} ${domain} ${photo.memo || ''}`.toLowerCase();
      const isSearchMatch = combinedText.includes((typeof searchQuery !== 'undefined' ? searchQuery : '').toLowerCase());

      let isMediaTypeMatch = true; 
      const hasVideo = photo.video_url && photo.video_url.trim() !== ""; 

      if (window.currentMediaType === 'image') { isMediaTypeMatch = !hasVideo; } 
      else if (window.currentMediaType === 'video') { isMediaTypeMatch = hasVideo; }

      let isTagMatch = true; 
      if (window.selectedFilterTags.size > 0) { 
          if (!photo.tags) isTagMatch = false; 
          else {
              const photoTags = photo.tags.split(',').map(t => t.trim());
              isTagMatch = Array.from(window.selectedFilterTags).some(selectedTag => photoTags.includes(selectedTag));
          }
      }

      return isProjectMatch && isSearchMatch && isMediaTypeMatch && isTagMatch;
  });

  filteredPhotos.sort((a, b) => {
      if (window.currentSortOrder === 'custom' || currentProject !== 'ALL') {
          let idxA = a.sort_index !== undefined && a.sort_index !== null ? a.sort_index : 999999;
          let idxB = b.sort_index !== undefined && b.sort_index !== null ? b.sort_index : 999999;
          if (idxA !== idxB) return idxA - idxB; 
      }

      let valA = a.created_at ? new Date(a.created_at).getTime() : 0;
      let valB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (valA === 0 && valB === 0) { valA = parseInt(a.id) || 0; valB = parseInt(b.id) || 0; }
      
      if (window.currentSortOrder === 'newest') return valB - valA; 
      else if (window.currentSortOrder === 'oldest') return valA - valB;
      return 0;
  });

  if (filteredPhotos.length === 0) {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 120px 0; color: var(--color-text-muted); font-size: var(--text-sm); font-weight: var(--weight-bold); letter-spacing: 2px;">No results found</div>`;
      return;
  }

  filteredPhotos.forEach(photo => {
    const stringId = String(photo.id);
    const isSelected = typeof selectedIds !== 'undefined' && selectedIds.has(stringId);
    let domain = "Unknown Source";
    try { if (photo.page_url && photo.page_url !== "undefined") domain = new URL(photo.page_url).hostname.replace('www.', ''); } catch(e) {}

    const card = document.createElement('div');
    card.setAttribute('data-id', stringId); 

    // ✨ 1. 팔레트 타입 처리
    const isPalette = photo.item_type === 'palette' || (photo.tags && photo.tags.includes('Palette') && !photo.image_url);
    if (isPalette) {
        card.className = `card ${isSelected ? 'selected' : ''}`;
        let colors = []; let columns = 5;
        try {
            const pData = JSON.parse(photo.palette_data);
            colors = pData.colors || []; columns = pData.columns || 5;
        } catch(e) { colors = photo.memo ? photo.memo.split(',').filter(c => c.includes('#')).map(c => c.trim()) : []; }

        if (colors.length === 0) colors = ['#eeeeee']; 
        const infoText = photo.tags ? photo.tags : "Color Palette";

        let paletteHtml = `<div class="media-wrapper palette-wrapper" onclick="if(typeof handleCardClick === 'function') handleCardClick('${stringId}', event)" style="display:flex; flex-wrap:wrap; align-content:flex-start; width:100%; height:100%; min-height:240px; background:#f5f5f5;">
            <div class="card-checkbox"></div>`; 

        colors.forEach(color => {
            const rowHeight = Math.max(40, 240 / Math.ceil(colors.length / columns));
            paletteHtml += `<div class="palette-bar" style="background-color: ${color}; flex: 0 0 calc(100% / ${columns}); height: ${rowHeight}px;" title="${color}"></div>`;
        });

        paletteHtml += `<div class="hover-dim"></div><div class="hover-source">${infoText}</div></div>`;
        card.innerHTML = paletteHtml;
        container.appendChild(card);
        return; 
    }

    // ✨ 2. 링크 임베드 타입 처리
    if (photo.item_type === 'link') {
        card.className = `card link-type ${isSelected ? 'selected' : ''}`;
        
        const memoParts = (photo.memo || "").split('\n');
        const linkTitle = memoParts[0] || "Untitled Link";
        const linkDesc = memoParts.slice(1).join('\n') || "설명이 없습니다.";
        const faviconUrl = domain !== "Unknown Source" ? `https://www.google.com/s2/favicons?domain=${domain}` : '';
        const targetUrl = photo.page_url && photo.page_url !== "undefined" ? photo.page_url : "#";

        card.innerHTML = `
          <div class="media-wrapper" onclick="if(typeof handleCardClick === 'function') handleCardClick('${stringId}', event)">
              <div class="card-checkbox"></div>
              <div class="link-info">
                  <div class="link-title">${linkTitle}</div>
                  <div class="link-desc">${linkDesc}</div>
                  <div class="link-domain">
                      ${faviconUrl ? `<img src="${faviconUrl}" alt="favicon">` : ''}
                      <span>${domain}</span>
                  </div>
              </div>
              <div class="link-thumbnail">
                  ${photo.image_url ? `<img src="${photo.image_url}" loading="lazy">` : ''}
              </div>
              <a href="${targetUrl}" target="_blank" class="hover-link" onclick="event.stopPropagation()">↗</a>
          </div>
        `;
        container.appendChild(card);
        return;
    }

    // ✨ 3. 일반 이미지/비디오 타입 처리
    card.className = `card ${isSelected ? 'selected' : ''}`;
    const infoText = photo.tags ? photo.tags : domain;
    const hasLink = photo.page_url && photo.page_url !== "undefined";
    const videoBadge = photo.video_url ? `<div style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); color:var(--color-bg-white); font-size:var(--text-xs); font-weight:var(--weight-bold); padding:6px 12px; border-radius:var(--radius-full); pointer-events:none; z-index:2; box-shadow:var(--shadow-sm);">Video</div>` : '';
    const hoverVideoHtml = photo.video_url ? `<video class="hover-video" src="${photo.video_url}" preload="none" muted loop playsinline style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity var(--transition-normal); pointer-events:none; background:var(--color-text-main); z-index:0;"></video>` : '';

    card.innerHTML = `
      <div class="media-wrapper" onclick="if(typeof handleCardClick === 'function') handleCardClick('${stringId}', event)" onmouseenter="playVideoOnHover(this)" onmouseleave="pauseVideoOnLeave(this)">
          <div class="card-checkbox"></div> <img src="${photo.image_url}" loading="lazy">
          ${hoverVideoHtml}
          ${videoBadge}
          <div class="hover-dim"></div>
          <div class="hover-source">${infoText}</div>
          ${hasLink ? `<a href="${photo.page_url}" target="_blank" class="hover-link" onclick="event.stopPropagation()">↗</a>` : ''}
      </div>
    `;
    container.appendChild(card);
  });

  if (typeof initDragAndDrop === 'function') setTimeout(initDragAndDrop, 50);
};