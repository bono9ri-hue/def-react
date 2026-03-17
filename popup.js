/* ==========================================
   [설정] 우리 워커 서버 주소
   ========================================== */
const WORKER_URL = "https://def-api.deference.workers.dev";

// ==========================================
// 1. 북마크 추가 (새 탭 스피드 다이얼용) 📌
// ==========================================
const btnBookmark = document.getElementById('btn-save-bookmark');
if (btnBookmark) {
  btnBookmark.addEventListener('click', async () => {
    const textSpan = document.getElementById('text-save-bookmark');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const storage = await chrome.storage.local.get(['def_token', 'clerk_token', 'token']);
      const token = storage.def_token || storage.clerk_token || storage.token;

      if (!token) {
          alert("먼저 Deference 사이트에서 로그인해주세요.");
          return;
      }

      btnBookmark.style.pointerEvents = 'none';
      textSpan.innerText = "북마크 저장 중...";
      textSpan.style.color = "#888";

      // 스피드 다이얼 북마크 테이블(/bookmarks)로 전송
      const res = await fetch(`${WORKER_URL}/bookmarks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: tab.title,       
          url: tab.url,          
          icon_type: "color",
          icon_value: "transparent", 
          icon_scale: 1.0        
        })
      });

      if (res.ok) {
        textSpan.innerText = "북마크 완료! 📌";
        textSpan.style.color = "#000";
        setTimeout(() => window.close(), 1000); 
      } else {
        throw new Error("서버 저장 실패");
      }
    } catch (e) {
      console.error("북마크 에러:", e);
      textSpan.innerText = "저장 실패 ❌";
      textSpan.style.color = "#ff4d4f"; 
      btnBookmark.style.pointerEvents = 'auto';
    }
  });
}

// ==========================================
// 2. 링크 임베드 (메인 갤러리 아카이빙용) 🔗
// ==========================================
const btnLink = document.getElementById('btn-save-link');
if (btnLink) {
  btnLink.addEventListener('click', async () => {
    const textSpan = document.getElementById('text-save-link');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const storage = await chrome.storage.local.get(['def_token', 'clerk_token', 'token']);
      const token = storage.def_token || storage.clerk_token || storage.token;

      if (!token) {
          alert("먼저 Deference 사이트에서 로그인해주세요.");
          return;
      }

      btnLink.style.pointerEvents = 'none';
      textSpan.innerText = "정보 추출 중...";
      textSpan.style.color = "#888";

      // 현재 웹페이지에서 오픈그래프(OG) 메타 데이터 긁어오기
      const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
              const getMeta = (prop) => {
                  const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
                  return el ? el.content : "";
              };
              return {
                  title: getMeta("og:title") || document.title,
                  image: getMeta("og:image") || getMeta("twitter:image") || "",
                  desc: getMeta("og:description") || getMeta("description") || ""
              };
          }
      });

      const ogData = results[0].result;
      textSpan.innerText = "갤러리에 저장 중...";

      // 메인 갤러리 테이블(/assets)로 전송
      const res = await fetch(`${WORKER_URL}/assets`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          item_type: "link",         
          image_url: ogData.image,   
          page_url: tab.url,         
          memo: `${ogData.title}\n${ogData.desc}`, 
          tags: "Link",
          folder: "전체"
        })
      });

      if (res.ok) {
        textSpan.innerText = "갤러리 저장 완료! 🎉";
        textSpan.style.color = "#000";
        setTimeout(() => window.close(), 1000); 
      } else {
        throw new Error("서버 저장 실패");
      }
    } catch (e) {
      console.error("링크 저장 에러:", e);
      textSpan.innerText = "저장 실패 ❌";
      textSpan.style.color = "#ff4d4f"; 
      btnLink.style.pointerEvents = 'auto';
    }
  });
}

// ==========================================
// 2. 선택 범위 캡처
// ==========================================
document.getElementById('btn-capture-area').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "start-selection" });
  window.close();
});

// ==========================================
// 3. 보이는 범위 캡처 (수정 완료 ✨)
// ==========================================
document.getElementById('btn-capture-visible').addEventListener('click', () => {
  // 팝업이 아니라 백그라운드 본부로 캡처 명령을 내리고 팝업은 닫습니다.
  chrome.runtime.sendMessage({ action: "capture-visible-tab" });
  window.close();
});

// ==========================================
// 4. 일괄 저장 (새로운 기능 오픈 ✨)
// ==========================================
const batchBtn = document.getElementById('btn-batch-save');
batchBtn.classList.remove('disabled'); // 비활성화 해제
batchBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "open-batch-save" });
  window.close();
});

// ==========================================
// 5. 웹페이지 전체 캡처 (스크롤 캡처 ✨)
// ==========================================
const fullBtn = document.getElementById('btn-capture-full');
fullBtn.classList.remove('disabled'); // 비활성화 해제
fullBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "start-full-page-capture" });
  window.close(); // 명령만 내리고 팝업은 닫기
});

/* ==========================================
   [핵심] 클라우드플레어 통합 저장 함수
   ========================================== */
async function saveToCloudflare(dataUrl, pageUrl, textSpan) {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const compressedBlob = await resizeAndCompress(blob);
    
    const formData = new FormData();
    formData.append("file", compressedBlob, `screenshot_${Date.now()}.webp`);

    const uploadRes = await fetch(`${WORKER_URL}/upload`, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.success) throw new Error("R2 Upload Failed");

    const storage = await chrome.storage.local.get(['def_token', 'clerk_token', 'token']);
    const token = storage.def_token || storage.clerk_token || storage.token;

    const dbRes = await fetch(`${WORKER_URL}/assets`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            image_url: uploadData.url,
            page_url: pageUrl,
            tags: "Screenshot",
            memo: "Visible Area Capture",
            item_type: "image",
            folder: ""
        })
    });

    if (dbRes.ok) {
      if(textSpan) {
          textSpan.innerText = "저장 완료!";
          textSpan.style.color = "#000";
      }
      setTimeout(() => window.close(), 1000);
    } else {
        throw new Error("DB Save Failed");
    }

  } catch(e) {
    console.error("Archive Error:", e);
    if(textSpan) {
        textSpan.innerText = "저장 실패";
        textSpan.style.color = "#ff4d4f";
    }
    alert("저장에 실패했습니다: " + e.message);
  }
}

// ⚙️ 팝업용 압축 엔진
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