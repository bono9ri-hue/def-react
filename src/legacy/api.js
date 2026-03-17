/* ==========================================
   [api.js] 서버 통신 전담 (API 요원)
   ========================================== */

/* ==========================================
   [섹션 3] 데이터 로드 (방어막 + 토큰 발사 버전) 🛡️🚀
   ========================================== */
async function loadPhotos() {
  try {
    const token = await Clerk.session.getToken();
    if (!token) {
        console.error("Clerk 세션이 없습니다. 로그인이 필요합니다.");
        return;
    }

    window.dispatchEvent(new CustomEvent('def-login-sync', { detail: { token: token } }));

    // ✨ 주파수 변경: /projects -> /collections
    const projRes = await fetch(`${WORKER_URL}/collections`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) {
            projects = projData; // 변수명은 일단 호환성을 위해 유지
            if (typeof renderFolders === "function") renderFolders();
        }
    } else {
        const errLog = await projRes.json();
        console.error("워커가 거절함 (컬렉션):", errLog);
    }

    // ✨ 주파수 변경: /photos -> /assets
    const res = await fetch(`${WORKER_URL}/assets`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
        const photoData = await res.json();
        if (Array.isArray(photoData)) {
            photos = photoData; // 호환성을 위해 변수명 유지
            if (typeof renderGallery === "function") renderGallery();
        }
    } else {
        const errLog = await res.json();
        console.error("워커가 거절함 (자산):", errLog);
    }

  } catch (e) { 
    console.error("네트워크 통신 중 진짜 사고 발생:", e); 
    showDeferenceToast("서버와 연결할 수 없습니다.");
  }
}

/* ==========================================
   [섹션 8] 메타데이터 DB 저장 (Clerk 인증 추가) 🛡️
   ========================================== */
async function saveMetaData() {
  if (!currentEditingId) return;
  const memoValue = document.getElementById('memoInput').value;
  const tagValue = document.getElementById('tagInput').value;

  showDeferenceToast("Saving...");
  try {
    const token = await Clerk.session.getToken();

    // ✨ 주파수 변경: /photos -> /assets
    const res = await fetch(`${WORKER_URL}/assets`, {
      method: "PUT", 
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ id: currentEditingId, memo: memoValue, tags: tagValue })
    });

    if (res.ok) {
      showDeferenceToast("Saved");
      const photoIndex = photos.findIndex(p => String(p.id) === String(currentEditingId));
      if (photoIndex > -1) { 
        photos[photoIndex].memo = memoValue; 
        photos[photoIndex].tags = tagValue; 
      }
      if (typeof renderGallery === "function") renderGallery(); 
    } else { 
      showDeferenceToast("Save failed"); 
    }
  } catch (e) { 
    console.error("Save error:", e);
    showDeferenceToast("Network error"); 
  }
}

/* ==========================================
   [섹션 9 일부] 다중 삭제 함수
   ========================================== */
async function deleteSelected() {
  if (selectedIds.size === 0) return;
  if (!confirm(`Delete ${selectedIds.size} selected items permanently?`)) return;
  
  showDeferenceToast("Deleting...");

  try {
    const token = await Clerk.session.getToken();

    for (let id of selectedIds) {
      const photo = photos.find(p => String(p.id) === String(id));
      if (photo) {
          const urlParts = photo.image_url ? photo.image_url.split('/') : [];
          const fileName = urlParts.length >= 4 ? urlParts.slice(3).join('/') : ''; 

          // ✨ 주파수 변경: /photos -> /assets
          await fetch(`${WORKER_URL}/assets?id=${id}&fileName=${fileName}`, { 
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
      }
    }
    
    clearSelection(); 
    if (typeof toggleSelectMode === "function" && isSelectMode) toggleSelectMode();
    await loadPhotos(); 
    showDeferenceToast("Deleted");
    
  } catch (e) {
    console.error("Delete failed:", e);
    showDeferenceToast("Delete failed");
  }
}

/* ==========================================
   [섹션 11] 통합 업로드 엔진 (Clerk 인증 적용)
   ========================================== */
async function processAndUploadFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const btn = document.getElementById('upload-btn');
    if (btn) { btn.disabled = true; btn.innerText = "Uploading..."; }
    showDeferenceToast(`Uploading ${imageFiles.length} images...`);

    let successCount = 0;
    
    try {
        const token = await Clerk.session.getToken();

        for (const file of imageFiles) {
            try {
                const compressedBlob = await resizeAndCompress(file);
                const formData = new FormData();
                formData.append("file", compressedBlob, `direct_${Date.now()}.webp`);

                const cfRes = await fetch(`${WORKER_URL}/upload`, { 
                    method: "POST", 
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData 
                });
                const cfData = await cfRes.json();

                if (cfData.success) {
                    // ✨ 주파수 변경: /photos -> /assets
                    await fetch(`${WORKER_URL}/assets`, {
                        method: "POST", 
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            image_url: cfData.url,
                            page_url: window.location.href, 
                            memo: `Source: ${file.name || 'Pasted Image'}`,
                            tags: "Uploads",
                            folder: "",
                            item_type: "image" // ✨ 아이템 타입 명시
                        })
                    });
                    successCount++;
                }
            } catch (e) { 
                console.error("파일 개별 업로드 에러:", e); 
            }
        }
    } catch (authError) {
        console.error("인증 에러:", authError);
        showDeferenceToast("인증이 만료되었습니다. 다시 로그인해주세요.");
    }

    if (btn) { btn.disabled = false; btn.innerText = "Upload"; }
    
    if (successCount > 0) { 
        showDeferenceToast(`Successfully uploaded ${successCount} images!`); 
        setTimeout(() => location.reload(), 800); 
    }
}

function resizeAndCompress(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image(); img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height, MAX = 1200;
                if (w > MAX) { h = (MAX / w) * h; w = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
            };
        };
        reader.onerror = reject;
    });
}

/* ==========================================
   [섹션 11.5] 🎨 스마트 팔레트 업로드 엔진 (NEW)
   ========================================== */
async function uploadPaletteData(colors, rawText) {
    showDeferenceToast("Saving palette...");
    try {
        const token = await Clerk.session.getToken();
        
        // ✨ 이미지 URL 대신 색상 배열과 기본 컬럼 설정(5줄)을 JSON으로 묶어서 보냅니다.
        const payload = {
            item_type: "palette",
            palette_data: JSON.stringify({ colors: colors, columns: 5 }), // 5개 단위 줄바꿈이 기본값
            memo: rawText, // 원본 브랜드 가이드 텍스트도 검색을 위해 저장!
            tags: "Palette",
            image_url: "", // 순수 데이터이므로 이미지는 비워둡니다
            page_url: window.location.href,
            folder: ""
        };

        const res = await fetch(`${WORKER_URL}/assets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showDeferenceToast("Palette saved!");
            setTimeout(() => location.reload(), 800); 
        } else {
            showDeferenceToast("Failed to save palette.");
        }
    } catch (e) {
        console.error("Palette upload error:", e);
        showDeferenceToast("Network error");
    }
}

/* ==========================================
   [섹션 12 일부] 프로젝트 폴더
   ========================================== */
async function createFolder() {
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;

    try {
        showDeferenceToast("Creating folder...");
        const token = await Clerk.session.getToken();

        // ✨ 주파수 변경: /projects -> /collections
        const res = await fetch(`${WORKER_URL}/collections`, {
            method: 'POST', 
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ name: folderName.trim() })
        });

        if (res.ok) { 
            showDeferenceToast("Folder created"); 
            loadPhotos(); 
        } else { 
            showDeferenceToast("Creation failed"); 
        }
    } catch (e) { 
        console.error("Folder creation error:", e);
        showDeferenceToast("Network error"); 
    }
}

/* ==========================================
   [섹션 13 일부] 폴더 이동 API 로직
   ========================================== */
async function executeMoveToFolder() {
    if (selectedFoldersToMove.length === 0) { showDeferenceToast("Select a folder"); return; }
    showDeferenceToast("Moving...");
    try {
        const token = await Clerk.session.getToken(); // 🛡️ 보안 추가
        const promises = Array.from(selectedIds).map(async (id) => {
            return fetch(`${WORKER_URL}/assets`, { // ✨ 주파수 변경
                method: 'PUT', 
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ id: id, folder: JSON.stringify(selectedFoldersToMove) }) 
            });
        });
        await Promise.all(promises);
        finishFolderAction("Moved");
    } catch(e) { showDeferenceToast("Error occurred"); }
}

async function executeAddToFolder() {
    if (selectedFoldersToMove.length === 0) { showDeferenceToast("Select a folder"); return; }
    showDeferenceToast("Adding...");
    try {
        const token = await Clerk.session.getToken(); // 🛡️ 보안 추가
        const promises = Array.from(selectedIds).map(async (id) => {
            const photo = photos.find(p => String(p.id) === id);
            let currentFolders = [];
            try { currentFolders = photo.folder ? JSON.parse(photo.folder) : []; } catch(e){}
            const mergedFolders = [...new Set([...currentFolders, ...selectedFoldersToMove])];

            return fetch(`${WORKER_URL}/assets`, { // ✨ 주파수 변경
                method: 'PUT', 
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ id: id, folder: JSON.stringify(mergedFolders) })
            });
        });
        await Promise.all(promises);
        finishFolderAction("Added");
    } catch(e) { showDeferenceToast("Error occurred"); }
}

async function finishFolderAction(msg) { showDeferenceToast(msg); selectedIds.clear(); if (typeof closeFolderModal === "function") closeFolderModal(); await loadPhotos(); }

/* ==========================================
   [섹션 14 일부] 단일/스마트 삭제 API 로직
   ========================================== */
async function smartDelete() {
    if (selectedIds.size > 0) { deleteSelected(); return; }
    if (contextTargetId) { deleteSinglePhoto(contextTargetId); return; }
    showDeferenceToast("Nothing to delete");
}

async function deleteSinglePhoto(id) {
    if (!confirm("Delete this item permanently?")) return;
    showDeferenceToast("Deleting...");
    try {
        const token = await Clerk.session.getToken(); // 🛡️ 보안 추가
        const photo = photos.find(p => String(p.id) === String(id));
        const fileName = (photo && photo.image_url) ? photo.image_url.split('/').pop() : '';
        
        await fetch(`${WORKER_URL}/assets?id=${id}&fileName=${fileName}`, { 
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        selectedIds.delete(String(id)); await loadPhotos(); showDeferenceToast("Deleted");
    } catch(e) { showDeferenceToast("Delete failed"); }
}

/* ==========================================
   [섹션 15 일부] 태그 편집 API 로직
   ========================================== */
async function updatePhotoTags(id, tagsString) {
    try {
        const token = await window.Clerk.session.getToken();

        const res = await fetch(`${WORKER_URL}/assets`, { // ✨ 주파수 변경
            method: "PUT", 
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ id: id, tags: tagsString })
        });

        if (!res.ok) throw new Error("서버에서 거절함");
        
    } catch (e) { 
        console.error("Tag update failed", e); 
        showDeferenceToast("태그 저장에 실패했습니다. ❌");
    }
}

/* ==========================================
   [추가 구역] 스피드 다이얼 북마크 API 통신망 🌟
   ========================================== */

// 1. 북마크 목록 가져오기
async function fetchBookmarksAPI() {
    try {
        const token = await Clerk.session.getToken();
        const res = await fetch(`${WORKER_URL}/bookmarks`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) return await res.json();
        return [];
    } catch (e) { console.error("북마크 로드 실패:", e); return []; }
}

// 2. 북마크 추가 및 수정 (단일)
async function saveBookmarkAPI(data) {
    try {
        const token = await Clerk.session.getToken();
        const method = data.id ? "PUT" : "POST";
        const res = await fetch(`${WORKER_URL}/bookmarks`, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.error("북마크 저장 실패:", e); return false; }
}

// 3. 북마크 순서 한꺼번에 업데이트
async function updateBookmarkOrderAPI(bookmarkArray) {
    try {
        const token = await Clerk.session.getToken();
        const res = await fetch(`${WORKER_URL}/bookmarks`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(bookmarkArray)
        });
        return res.ok;
    } catch (e) { console.error("북마크 순서 변경 실패:", e); return false; }
}

// 4. 북마크 삭제
async function deleteBookmarkAPI(id) {
    try {
        const token = await Clerk.session.getToken();
        const res = await fetch(`${WORKER_URL}/bookmarks?id=${id}`, {
            method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
        });
        return res.ok;
    } catch (e) { console.error("북마크 삭제 실패:", e); return false; }
}