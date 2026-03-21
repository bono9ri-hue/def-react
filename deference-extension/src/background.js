// Deference API Configuration
const API_URL = 'https://def-api.deference.workers.dev/assets';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "collect-media",
    title: "Deference에 수집하기",
    contexts: ["image", "video"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "collect-media") {
    // 1. Show toast in content script
    chrome.tabs.sendMessage(tab.id, { action: "COLLECT_MEDIA", srcUrl: info.srcUrl });

    // 2. Get detailed metadata from content script
    chrome.tabs.sendMessage(tab.id, { action: "GET_ELEMENT_INFO", srcUrl: info.srcUrl }, (response) => {
      const assetData = response?.data || {
        image_url: info.mediaType === 'image' ? info.srcUrl : '',
        video_url: info.mediaType === 'video' ? info.srcUrl : '',
        page_url: tab.url,
        memo: tab.title
      };

      // 3. Save with token
      chrome.storage.local.get(['def_token'], (result) => {
        if (result.def_token) {
          saveToDeference(assetData, result.def_token);
        }
      });
    });
  }
});

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";

async function saveToDeference(data, token) {
  if (!token) {
    console.error("No Token Provided");
    return { ok: false, error: "No Token Provided" };
  }

  // Ensure image_url is valid
  if (!data.image_url || data.image_url.trim() === "") {
    console.warn("Image URL is empty, applying fallback...");
    data.image_url = data.og_image || DEFAULT_PLACEHOLDER;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log("Success saving to Deference");
      return { ok: true, status: response.status };
    } else {
      const errorText = await response.text();
      console.error("Failed to save:", errorText);
      return { ok: false, status: response.status, error: errorText };
    }
  } catch (err) {
    console.error("API Error:", err);
    return { ok: false, error: err.message };
  }
}

// Listener for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SAVE_ASSET") {
    chrome.storage.local.get(['def_token'], (result) => {
      const token = request.token || result.def_token;
      
      if (!token) {
        sendResponse({ success: false, error: "No Token Provided" });
        return;
      }

      saveToDeference(request.data, token).then((res) => {
        sendResponse({ success: res.ok, ...res });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    });
    return true; // Keep channel open
  }

  // Get Page Data Proxy (avoid direct popup-to-content messaging if preferred)
  if (request.action === "GET_PAGE_DATA") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: "EXTRACT_PAGE_DATA" }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ status: "error", message: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ status: "error", message: "No active tab" });
      }
    });
    return true;
  }

  // Session Sync Action
  if (request.action === "SYNC_SESSION") {
    syncSession().then(token => {
      sendResponse({ success: !!token, token });
    });
    return true;
  }
  return true;
});

async function syncSession() {
  return new Promise((resolve) => {
    // Attempt to get Clerk session cookie from the main domain (check both www and non-www and localhost)
    const checkCookie = (url) => {
      return new Promise((res) => {
        chrome.cookies.get({ url: url, name: "__client" }, (cookie) => {
          if (cookie) res(cookie);
          else {
            chrome.cookies.get({ url: url, name: "__session" }, (sessionCookie) => {
              res(sessionCookie);
            });
          }
        });
      });
    };

    Promise.all([
      checkCookie("https://deference.work"),
      checkCookie("https://www.deference.work"),
      checkCookie("http://localhost"),
      checkCookie("http://localhost:3000")
    ]).then(([c1, c2, c3, c4]) => {
      const cookie = c1 || c2 || c3 || c4;
      if (cookie) {
        console.log("Found session cookie:", cookie.value);
        
        // 1. Try to extract token directly from cookie if it's a JWT (for __session)
        if (cookie.name === "__session" && cookie.value.split('.').length === 3) {
          chrome.storage.local.set({ def_token: cookie.value });
          resolve(cookie.value);
          return;
        }

        // 2. Otherwise, fall back to executing script in a tab
        chrome.tabs.query({ url: [
          "https://deference.work/*", 
          "https://www.deference.work/*",
          "http://localhost:3000/*"
        ] }, (tabs) => {
          if (tabs.length > 0) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                // Try to get token from Clerk object if available
                return window.Clerk?.session?.getToken();
              }
            }, (results) => {
              const token = results?.[0]?.result;
              if (token) {
                chrome.storage.local.set({ def_token: token });
                resolve(token);
              } else {
                resolve(null);
              }
            });
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  });
}
