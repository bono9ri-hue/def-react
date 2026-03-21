chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "collect-media",
    title: "Deference에 수집하기",
    contexts: ["image", "video", "page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "collect-media") {
    try {
      await chrome.tabs.sendMessage(tab.id, { 
        action: "COLLECT_MEDIA",
        srcUrl: info.srcUrl,
        pageUrl: info.pageUrl || tab.url,
        title: tab.title
      });
    } catch (err) {
      console.error("Content script not ready or not found:", err);
    }
  }
});

// 저장 완료 알림 등 백그라운드 로직
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "MEDIA_COLLECTED") {
    console.log("Media collected and saved:", request.data);
  }
});
