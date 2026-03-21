function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.innerText = message;
  
  // 스타일 설정
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '12px',
    backgroundColor: type === 'error' ? '#ff4d4f' : '#333',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    opacity: '0',
    transform: 'translateY(20px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });

  document.body.appendChild(toast);

  // 애니메이션 효과 (등장)
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // 3초 뒤 삭제 (퇴장 애니메이션 포함)
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function extractMediaInfo() {
  // 수집 시작 알림
  showToast('Deference로 미디어 수집 중...', 'info');

  const video = document.querySelector('video');
  const page_url = window.location.href;
  const memo = document.title;

  if (video) {
    let imageUrl = video.poster || "";
    if (!imageUrl) {
      const parent = video.parentElement;
      const nearbyImg = parent ? parent.querySelector('img') : null;
      imageUrl = nearbyImg ? nearbyImg.src : "";
    }

    return {
      video_url: video.src || video.querySelector('source')?.src || "",
      image_url: imageUrl,
      page_url,
      memo
    };
  }

  const imgElements = Array.from(document.querySelectorAll('img'));
  const largeImages = imgElements.filter(img => {
    return img.naturalWidth >= 200 && img.naturalHeight >= 200;
  });

  return {
    video_url: "",
    image_url: largeImages.length > 0 ? largeImages[0].src : "",
    page_url,
    memo
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "collect_media") {
    sendResponse(extractMediaInfo());
  } else if (request.action === "show_result") {
    showToast(request.message, request.type || 'info');
  }
  return true;
});
