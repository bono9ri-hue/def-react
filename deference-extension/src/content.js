// 🎨 Toast UI Helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.innerText = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '12px',
    backgroundColor: type === 'error' ? '#ff4d4f' : '#222222', 
    color: '#fff', fontSize: '14px', zIndex: '999999', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)', transition: 'all 0.3s ease',
    opacity: '0', transform: 'translateY(20px)', fontFamily: 'sans-serif',
    border: '1px solid rgba(255,255,255,0.1)'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 📸 Area Selection Logic
let isSelecting = false;
let startX, startY, overlay, selection;

function startAreaSelection() {
  if (isSelecting) return;
  isSelecting = true;
  showToast('드래그하여 수집할 영역을 선택하세요.', 'info');

  overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', backgroundColor: 'rgba(0,0,0,0.5)',
    cursor: 'crosshair', zIndex: '999998'
  });

  selection = document.createElement('div');
  Object.assign(selection.style, {
    position: 'absolute', border: '2px solid #3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
    display: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
  });

  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  const handleMouseDown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0';
    selection.style.height = '0';
    selection.style.display = 'block';

    const handleMouseMove = (mv) => {
      const width = mv.clientX - startX;
      const height = mv.clientY - startY;
      selection.style.width = Math.abs(width) + 'px';
      selection.style.height = Math.abs(height) + 'px';
      selection.style.left = (width > 0 ? startX : mv.clientX) + 'px';
      selection.style.top = (height > 0 ? startY : mv.clientY) + 'px';
    };

    const handleMouseUp = () => {
      overlay.removeEventListener('mousemove', handleMouseMove);
      overlay.removeEventListener('mouseup', handleMouseUp);
      const rect = selection.getBoundingClientRect();
      overlay.remove();
      isSelecting = false;
      
      if (rect.width > 10 && rect.height > 10) {
        showToast('영역 선택 완료 - 데이터를 추출합니다...', 'success');
        // TODO: Implement screen capture or data extraction from area
      }
    };

    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
  };

  overlay.addEventListener('mousedown', handleMouseDown);
}

// 🔍 Media Extraction Logic
function getOgImage() {
  const meta = document.querySelector('meta[property="og:image"]') || 
               document.querySelector('meta[name="twitter:image"]');
  return meta?.content || '';
}

function extractMediaInfo() {
  const media = [];
  const ogImage = getOgImage();
  
  // 1. Video Check (High Quality First)
  const videos = Array.from(document.querySelectorAll('video'));
  videos.forEach(v => {
    let videoUrl = v.src || v.querySelector('source')?.src;
    if (!videoUrl || videoUrl.startsWith('blob:')) {
      videoUrl = v.getAttribute('data-src') || v.getAttribute('original-src');
    }

    if (videoUrl && videoUrl.startsWith('http')) {
      media.push({
        type: 'video',
        url: videoUrl,
        thumbnail: v.poster || v.getAttribute('data-poster') || ogImage || '',
        width: v.videoWidth || v.offsetWidth,
        height: v.videoHeight || v.offsetHeight
      });
    }
  });

  // 2. Image Check
  const images = Array.from(document.querySelectorAll('img'));
  images.forEach(img => {
    const src = img.getAttribute('data-src') || img.src;
    if (img.naturalWidth > 150 && img.naturalHeight > 150) {
      if (src && src.startsWith('http')) {
        const parent = img.closest('a, div');
        const hasVideoLink = parent?.querySelector('video, [class*="video"]');
        media.push({
          type: hasVideoLink ? 'video' : 'image',
          url: src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          thumbnail: hasVideoLink ? src : ''
        });
      }
    }
  });

  const uniqueMedia = Array.from(new Set(media.map(m => m.url)))
    .map(url => media.find(m => m.url === url))
    .slice(0, 20);

  return { 
    title: document.title, 
    url: window.location.href, 
    media: uniqueMedia,
    og_image: ogImage
  };
}

function findElementDetails(srcUrl) {
  const elements = document.querySelectorAll(`img[src*="${srcUrl}"], video[src*="${srcUrl}"], video source[src*="${srcUrl}"]`);
  let bestElement = elements[0];
  
  if (!bestElement) {
    bestElement = Array.from(document.querySelectorAll('img')).find(img => (img.getAttribute('data-src') || img.src).includes(srcUrl));
  }

  // Dribbble-specific: find the video container if we are on a thumbnail
  const dribbbleVideo = bestElement?.closest('.video-player, [data-video-source-264]');
  const videoUrl = dribbbleVideo?.getAttribute('data-video-source-264') || 
                   dribbbleVideo?.querySelector('video')?.src || 
                   dribbbleVideo?.querySelector('source')?.src;

  if (videoUrl && videoUrl.startsWith('http') && !videoUrl.match(/\.(webp|png|jpg|jpeg|gif)$/i)) {
    return {
      type: 'video',
      video_url: videoUrl,
      image_url: bestElement?.src || bestElement?.getAttribute('data-src') || '',
      page_url: window.location.href,
      memo: document.title
    };
  }

  if (bestElement) {
    const videoParent = bestElement.closest('video') || bestElement.parentElement?.querySelector('video');
    const vUrl = videoParent?.src || videoParent?.querySelector('source')?.src;
    
    if (vUrl && vUrl.startsWith('http') && !vUrl.match(/\.(webp|png|jpg|jpeg|gif)$/i)) {
      return { 
        type: 'video', 
        video_url: vUrl, 
        image_url: videoParent.poster || bestElement.src || '', 
        page_url: window.location.href, 
        memo: document.title 
      };
    }
    
    const imageUrl = bestElement.src || bestElement.getAttribute('data-src');
    return { 
      type: 'image', 
      image_url: imageUrl, 
      video_url: '', 
      page_url: window.location.href, 
      memo: document.title,
      og_image: getOgImage()
    };
  }

  return {
    image_url: '',
    page_url: window.location.href,
    memo: document.title,
    og_image: getOgImage()
  };
}

// 📩 Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received action:", request.action);
  
  if (request.action === "START_SELECTION") {
    startAreaSelection();
    sendResponse({ status: "started" });
  } else if (request.action === "EXTRACT_PAGE_DATA") {
    sendResponse({ status: "success", data: extractMediaInfo() });
  } else if (request.action === "GET_ELEMENT_INFO") {
    const details = findElementDetails(request.srcUrl);
    sendResponse({ status: "success", data: details || {
      image_url: request.srcUrl,
      page_url: window.location.href,
      memo: document.title
    }});
  } else if (request.action === "COLLECT_MEDIA") {
    showToast('Deference: 수집 중...', 'info');
    sendResponse({ status: "acknowledged" });
  }
  return true;
});

console.log("Deference Collector content script initialized.");
