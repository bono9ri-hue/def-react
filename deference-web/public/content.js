// 🎨 Toast UI Helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.innerText = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '12px',
    backgroundColor: type === 'error' ? '#ff4d4f' : '#333', color: '#fff', fontSize: '14px',
    zIndex: '999999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s ease',
    opacity: '0', transform: 'translateY(20px)', fontFamily: 'sans-serif'
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
    position: 'fixed', inset: '0', backgroundColor: 'rgba(0,0,0,0.4)',
    cursor: 'crosshair', zIndex: '999998'
  });

  selection = document.createElement('div');
  Object.assign(selection.style, {
    position: 'absolute', border: '2px solid white', backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'none'
  });

  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  overlay.onmousedown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0';
    selection.style.height = '0';
    selection.style.display = 'block';

    overlay.onmousemove = (mv) => {
      const width = mv.clientX - startX;
      const height = mv.clientY - startY;
      selection.style.width = Math.abs(width) + 'px';
      selection.style.height = Math.abs(height) + 'px';
      selection.style.left = (width > 0 ? startX : mv.clientX) + 'px';
      selection.style.top = (height > 0 ? startY : mv.clientY) + 'px';
    };

    overlay.onmouseup = async () => {
      overlay.onmousemove = null;
      overlay.onmouseup = null;
      const rect = selection.getBoundingClientRect();
      overlay.remove();
      isSelecting = false;
      
      if (rect.width > 10 && rect.height > 10) {
        showToast('영역 수집 완료 (기능 준비 중)', 'success');
      }
    };
  };
}

// 📩 Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SELECTION") {
    startAreaSelection();
  } else if (request.action === "COLLECT_MEDIA") {
    // 우클릭 수집 로직
    showToast('미디어 정보 수집됨: ' + (request.srcUrl || '페이지'), 'info');
    // 여기서 API 전송 로직 추가 가능
  }
  return true;
});
