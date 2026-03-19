/* ==========================================
   [store.js] 전역 변수 및 공통 유틸리티
   ========================================== */
// 🚀 수파베이스 흔적 완벽 삭제! 이제 우리 워커만 바라봅니다.
const WORKER_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || "https://def-api.deference.workers.dev";

// [전역 데이터 창고]
let photos = [];
let projects = [];
let currentProject = 'ALL';
let selectedIds = new Set();
let currentEditingId = null; 
let searchQuery = ""; 

/* ==========================================
   [공통 UI 유틸리티: 토스트 알림]
   ========================================== */
function showDeferenceToast(message) {
  let t = document.getElementById('deference-toast') || document.createElement('div');
  t.id = 'deference-toast';
  t.className = 'toast-message'; 
  if (!document.getElementById('deference-toast')) document.body.appendChild(t);
  t.innerText = message; 
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}