chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 1. Content Script로 "collect_media" 메시지 전송
    const response = await chrome.tabs.sendMessage(tab.id, { action: "collect_media" });
    
    if (!response) {
      console.log("No response from content script.");
      return;
    }

    if (!response.image_url && !response.video_url) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "show_result", 
        message: "❌ 수집할 수 있는 미디어를 찾지 못했습니다.",
        type: "error"
      });
      return;
    }

    // 2. Storage에서 토큰 가져오기
    const { def_token } = await chrome.storage.local.get("def_token");
    if (!def_token) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "show_result", 
        message: "🔑 로그인 토큰(def_token)이 없습니다. 먼저 로그인해 주세요.",
        type: "error"
      });
      return;
    }

    // 3. API 전송
    const apiResponse = await fetch("https://def-api.deference.workers.dev/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${def_token}`
      },
      body: JSON.stringify(response)
    });

    if (apiResponse.ok) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "show_result", 
        message: "✨ Deference에 성공적인 저장을 완료했습니다!",
        type: "success"
      });
    } else {
      const errorText = await apiResponse.text();
      chrome.tabs.sendMessage(tab.id, { 
        action: "show_result", 
        message: `❌ 저장 실패: ${errorText}`,
        type: "error"
      });
    }
  } catch (err) {
    console.error("Error in background script:", err);
    chrome.tabs.sendMessage(tab.id, { 
      action: "show_result", 
      message: "⚠️ 요청 중 오류가 발생했습니다. 페이지를 새로고침하거나 나중에 다시 시도해 주세요.",
      type: "error"
    });
  }
});
