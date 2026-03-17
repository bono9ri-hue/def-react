/* ==========================================
   [섹션 1] 우클릭 메뉴 설정 (설치 시 실행)
   ========================================== */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "saveDirectImage", title: "SAVE MEDIA (Archive)", contexts: ["all"] });
    // ✨ [추가] 내 컴퓨터로 원본 바로 저장하는 메뉴
    chrome.contextMenus.create({ id: "downloadOriginal", title: "DOWNLOAD ORIGINAL (Local)", contexts: ["all"] }); 
    chrome.contextMenus.create({ id: "startDeference", title: "CAPTURE AREA", contexts: ["all"] });
    chrome.contextMenus.create({ id: "fullScreenCapture", title: "CAPTURE FULL SCREEN", contexts: ["all"] });
  });
});

/* ==========================================
   [섹션 2] 핵심 로직: 무적 무전 시스템 (Auto Re-injection)
   ========================================== */
function ensureSendMessage(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            if (errorMsg.includes("Receiving end does not exist") || errorMsg.includes("connection")) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["content.js"]
                }, () => {
                    if (!chrome.runtime.lastError) {
                        setTimeout(() => chrome.tabs.sendMessage(tabId, message), 200);
                    }
                });
            }
        }
    });
}

/* ==========================================
   [섹션 3] 우클릭 메뉴 클릭 처리
   ========================================== */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveDirectImage") {
    ensureSendMessage(tab.id, { action: "direct-collect", srcUrl: info.srcUrl });
  } else if (info.menuItemId === "downloadOriginal") {
    // ✨ [추가] 수집 요원에게 "원본 다운로드 준비해!" 라고 명령 내리기
    ensureSendMessage(tab.id, { action: "download-original", srcUrl: info.srcUrl });
  } else if (info.menuItemId === "startDeference") {
    ensureSendMessage(tab.id, { action: "start-selection" });
  } else if (info.menuItemId === "fullScreenCapture") {
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
      if (dataUrl) ensureSendMessage(tab.id, { action: "direct-collect", srcUrl: dataUrl });
    });
  }
});

/* ==========================================
   [섹션 4] 통합 메시지 리스너 (클럭 토큰 배급소 🚀)
   ========================================== */
function handleMessage(request, sender, sendResponse) {
  if (request.action === "set-token") {
    chrome.storage.local.set({ def_session_token: request.token }, () => {
      sendResponse({ status: "success" });
    });
    return true; 
  }

  if (request.action === "get-clerk-token") {
    chrome.storage.local.get(['def_session_token'], (result) => {
      sendResponse({ token: result.def_session_token || null });
    });
    return true; 
  }

  if (request.action === "rect-ready") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
      if (dataUrl) {
        ensureSendMessage(sender.tab.id, {
          action: "crop-and-upload",
          fullDataUrl: dataUrl,
          rect: request.rect
        });
      }
    });
    return true;
  }

  if (request.action === "bypass-cors-fetch") {
    fetch(request.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ base64: reader.result });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.message }));
    return true; 
  }

  // ✨ 수집 요원이 찾아낸 고화질 원본 URL을 받아서 내 컴퓨터로 다운로드 실행!
  if (request.action === "trigger-download") {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename || "Deference_Original.jpg", 
      saveAs: false 
    });
    return true;
  }

  // ✨ 팝업에서 "보이는 범위 캡처" 명령이 왔을 때
  if (request.action === "capture-visible-tab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (dataUrl) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // 캡처한 이미지를 모달창(미리보기)으로 넘겨줍니다.
            ensureSendMessage(tabs[0].id, { action: "direct-collect", srcUrl: dataUrl });
        });
      }
    });
    return true;
  }

  // ✨ [수정됨] 이 부분이 함수 밖으로 빠져나가 있어서 에러가 났습니다! 함수 안으로 안전하게 모셔왔습니다.
  // 콘텐츠 스크립트가 스크롤 캡처 중 "지금 화면 찰칵!"을 요청할 때
  if (request.action === "capture-viewport") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // 비동기 응답 필수
  }
} // <--- [핵심] handleMessage 함수는 여기서 닫혀야 합니다!

chrome.runtime.onMessage.addListener(handleMessage);
chrome.runtime.onMessageExternal.addListener(handleMessage);