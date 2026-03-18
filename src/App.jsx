import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom'; // ✨ 추가
import { useAuth, SignInButton, UserButton } from '@clerk/chrome-extension';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { ToastProvider, useToast } from './components/Toast';
import { useExtensionAction } from './hooks/useExtensionAction';
import { useApi } from './hooks/useApi';
import {
  Home,
  Bookmark,
  Image as ImageIcon,
  Grid,
  Search,
  Folder,
  Plus,
  FolderOpen,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Settings,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Tag,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Minus,
  RefreshCw,
  X,
  Pin,
  PinOff,
  Layout,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';

/* ============================================================
   GalleryCard (선택 기능 & 미니멀 체크박스 통합본)
   ============================================================ */
const GalleryCard = React.memo(({ asset, onClick, isSelected, onToggleSelect, isSelectionMode, viewMode }) => {
  const videoRef = useRef(null);
  const isGif = asset.image_url?.toLowerCase().includes('.gif');
  const hasVideo = !!asset.video_url;

  const handleMouseEnter = () => {
    if (hasVideo && videoRef.current) {
      videoRef.current.play();
    }
  };
  const handleMouseLeave = () => {
    if (hasVideo && videoRef.current) {
      videoRef.current.pause();
      // Only keep the video at current time instead of resetting to 0 for smoother experience, 
      // or set to 0 if preferred. User didn't specify, but often 0 is cleaner for Dribbble style.
      videoRef.current.currentTime = 0;
    }
  };

  const isMasonry = viewMode === 'masonry';

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`gallery-item break-inside-avoid mb-6 group relative ${isSelectionMode ? 'cursor-default' : 'cursor-pointer'}`}
      data-id={asset.id}
    >
      <div className={`relative ${isMasonry ? '' : viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} rounded-[10px] overflow-hidden bg-surface transition-shadow duration-300
        ${isSelected ? 'ring-2 ring-blue-500/80 shadow-md' : 'border border-border/40'}`}>

        {/* ✨ 선택 체크박스 (얇은 라인 스타일) */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSelect(asset.id); }}
          className={`absolute top-3 right-3 z-[20] w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer pointer-events-auto backdrop-blur-md
            ${isSelected ? 'bg-blue-500/90 border border-blue-500 text-white shadow-md scale-100 opacity-100' :
              isSelectionMode ? 'bg-black/20 border border-white/50 text-transparent opacity-100' :
                'bg-black/10 border border-white/30 text-transparent opacity-0 group-hover:opacity-100 hover:bg-black/30 scale-95 hover:scale-100'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>

        {/* 🖼️ Base Image (Always there as foundation) */}
        <img
          src={asset.image_url}
          alt={asset.memo}
          className={`${isMasonry ? 'w-full h-auto block' : 'absolute inset-0 w-full h-full object-cover'} transition-opacity duration-300`}
          loading="lazy"
        />

        {/* 🎥 Video Overlay (Only if video exists, otherwise null) */}
        {hasVideo && (
          <>
            <video
              ref={videoRef}
              src={asset.video_url}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[5]"
              muted
              loop
              playsInline
              preload="none"
            />
            <div className="absolute top-3 left-3 z-[10] bg-black/60 text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-widest flex items-center gap-1.5 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              VIDEO
            </div>
          </>
        )}

        {/* 🖤 Overlay UI (Buttons) */}
        <div className={`absolute inset-0 z-[15] rounded-[10px] bg-black/20 transition-opacity duration-300 flex flex-col justify-between p-3 pointer-events-none opacity-0 group-hover:opacity-100`}>
          <div className="flex justify-end gap-2 pointer-events-auto mt-auto">
            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 transition-colors"><Plus size={14} /></Button>
            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 transition-colors"><MoreVertical size={14} /></Button>
            {asset.page_url && (
              <a
                href={asset.page_url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 transition-colors flex items-center justify-center"
                title="원본 페이지 방문"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ============================================================
   ListRow (리스트 뷰 전용 컴포넌트)
   ============================================================ */
const ListRow = React.memo(({ asset, onClick, isSelected, onToggleSelect, isSelectionMode }) => {
  return (
    <div 
      onClick={onClick}
      data-id={asset.id}
      className={`gallery-item flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border ${isSelected ? 'bg-blue-500/5 border-blue-200' : 'bg-surface border-border/40 hover:bg-hover'}`}
    >
      <div 
        className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-hover border border-border/20 group"
        onClick={(e) => { e.stopPropagation(); onToggleSelect(asset.id); }}
      >
        <img src={asset.image_url} alt="" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500/40 opacity-100' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14px] truncate text-content">{asset.memo || '제목 없음'}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {asset.tags?.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-hover rounded-md text-content/60 border border-border/40">#{tag}</span>
          )) || <span className="text-[10px] text-content/20 italic">태크 없음</span>}
        </div>
      </div>
      <div className="text-[11px] text-content/40 font-medium whitespace-nowrap pl-4">
        {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '-'}
      </div>
    </div>
  );
});

/* ============================================================
   BatchTagModal (성능 최적화를 위한 별도 컴포넌트 분리)
   ============================================================ */
function BatchTagModal({ isOpen, onClose, tagAnalysis, onAddTag, onRemoveTag }) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-[18px] font-bold tracking-tight text-content">태그 일괄 수정</h2>
          <button onClick={onClose} className="p-1 hover:bg-hover rounded-full transition-colors text-content/30 hover:text-content">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-8 py-4 border-t border-border/30">
          <div className="mb-6">
            <label className="text-[11px] font-black uppercase tracking-widest text-contentMuted mb-3 block">태그</label>
            <div className="flex flex-wrap gap-2">
              {tagAnalysis.common.map((tag, i) => (
                <span key={`common-${i}`} className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {tag}
                  <button onClick={() => onRemoveTag(tag)} className="text-blue-500/50 hover:text-blue-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tagAnalysis.individual.map((tag, i) => (
                <span key={`indiv-${i}`} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full bg-hover text-content/80 border border-border/50">
                  {tag}
                  <button onClick={() => onRemoveTag(tag)} className="text-contentMuted hover:text-content transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tagAnalysis.common.length === 0 && tagAnalysis.individual.length === 0 && (
                <span className="text-[12px] text-contentMuted italic">지정된 태그 없음</span>
              )}
            </div>
          </div>
          <div className="mb-8">
            <label className="text-[11px] font-black uppercase tracking-widest text-contentMuted mb-3 block">새 태그 추가</label>
            <input
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              type="text"
              placeholder="태그 입력 후 Enter"
              className="w-full h-12 px-5 bg-hover border-none rounded-2xl focus:outline-none text-[14px] font-medium placeholder:text-content/20"
            />
          </div>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-content text-background hover:opacity-90 active:scale-[0.98] transition-all text-[14px] font-bold shadow-lg"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { showToast } = useToast();
  const { getActiveTab } = useExtensionAction();
  const {
    getAssets,
    getBookmarks,
    getCollections,
    saveCollection,
    updateCollection,
    updateCollectionOrder,
    togglePinCollection, // ✨ 추가
    deleteCollection,
    saveBookmark,
    updateBookmark,
    updateBookmarkOrder,
    deleteBookmark,
    updateAsset,
    deleteAsset,
    uploadFile
  } = useApi();

  const [activeTab, setActiveTab] = useState('home');
  const [activeCollection, setActiveCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  // 🔍 Collection Search States
  const [colSearchQuery, setColSearchQuery] = useState('');
  const [isColSearching, setIsColSearching] = useState(false);
  const [viewMode, setViewMode] = useState('masonry'); // 'masonry', 'grid', 'list'

  // 🔖 Bookmark Edit Modal States
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bmForm, setBmForm] = useState({
    name: '', url: '', color: '#ffffff', scale: 1.0,
    isTransparent: true,
    offset_x: 0, offset_y: 0 // 🌟 미세 조정 좌표 추가
  });

  // 🖼️ Image Detail Modal States
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({ memo: '', tags: '', folder: '' });
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const folderBtnRef = useRef(null);
  const [folderDropdownPos, setFolderDropdownPos] = useState({ top: 0, left: 0 });

  // 🏷️ Batch Tag Edit States
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);

  const [draggedIdx, setDraggedIdx] = useState(null); // 북마크용
  const [draggedColIdx, setDraggedColIdx] = useState(null); // ✨ 컬렉션용
  const [dragOverColIdx, setDragOverColIdx] = useState(null); // ✨ 삽입 위치 표시용 추가

  // 🌟 드래그 & 일괄 선택 상태
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dragBox, setDragBox] = useState(null);
  const isDraggingRef = useRef(false);  // 드래그 중 여부
  const dragStartRef = useRef(null);    // 드래그 시작 좌표
  const gridContainerRef = useRef(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 개별 토글 함수
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const strId = String(id);
      if (newSet.has(strId)) newSet.delete(strId); else newSet.add(strId);
      return newSet;
    });
  };

  const isSelectionModeRef = useRef(false);

  // ─── 드래그 박스 선택 로직 ─────────────────────────────────────────────────
  const handleGridMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    // ✨ 좌표를 계산하여 상단 헤더 영역(북마크, 검색, 필터) 클릭 시 드래그 무시
    const gridArea = document.getElementById('gallery-grid-area');
    if (gridArea && e.clientY < gridArea.getBoundingClientRect().top) return;

    // 선택 모드가 아닌데 카드 위를 클릭 → 모달 열기 (드래그 무시)
    if (!isSelectionModeRef.current && e.target.closest('.gallery-item')) return;

    e.preventDefault(); // 이미지/텍스트 기본 드래그 선택 방지
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, isAlt: e.altKey };

    const onMouseMove = (me) => {
      const { x: sx, y: sy } = dragStartRef.current;
      const dist = Math.hypot(me.clientX - sx, me.clientY - sy);
      if (!isDraggingRef.current && dist < 5) return;
      isDraggingRef.current = true;
      setDragBox({ x1: sx, y1: sy, x2: me.clientX, y2: me.clientY, isAlt: dragStartRef.current.isAlt || me.altKey });
    };

    const onMouseUp = (ue) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (isDraggingRef.current) {
        const { x: sx, y: sy } = dragStartRef.current;
        const isAlt = dragStartRef.current.isAlt || ue.altKey;
        const box = {
          left: Math.min(sx, ue.clientX), right: Math.max(sx, ue.clientX),
          top: Math.min(sy, ue.clientY), bottom: Math.max(sy, ue.clientY),
        };
        setSelectedIds(prev => {
          const next = new Set(prev);
          document.querySelectorAll('.gallery-item').forEach(card => {
            const r = card.getBoundingClientRect();
            const hit = !(box.right < r.left || box.left > r.right || box.bottom < r.top || box.top > r.bottom);
            if (hit) { const id = String(card.getAttribute('data-id')); isAlt ? next.delete(id) : next.add(id); }
          });
          return next;
        });
      } else {
        if (!dragStartRef.current.isAlt) setSelectedIds(new Set());
      }

      setDragBox(null);
      isDraggingRef.current = false;
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const openBookmarkModal = (bm = null) => {
    if (bm) {
      setEditingBookmark(bm);
      setBmForm({
        name: bm.name,
        url: bm.url,
        color: bm.icon_value === 'transparent' ? '#ffffff' : (bm.icon_value || '#ffffff'),
        scale: bm.icon_scale || 1.0,
        isTransparent: bm.icon_value === 'transparent',
        offset_x: bm.icon_offset_x || 0, // 🌟 복원
        offset_y: bm.icon_offset_y || 0  // 🌟 복원
      });
    } else {
      setEditingBookmark(null);
      setBmForm({ name: '', url: '', color: '#ffffff', scale: 1.0, isTransparent: true, offset_x: 0, offset_y: 0 });
    }
    setIsBookmarkModalOpen(true);
  };

  // 🏷️ Tag Analysis Logic for Batch Edit
  const tagAnalysis = useMemo(() => {
    if (selectedIds.size === 0) return { common: [], individual: [] };
    const selectedAssets = assets.filter(a => selectedIds.has(String(a.id)));
    if (selectedAssets.length === 0) return { common: [], individual: [] };

    const allTagCounts = {};
    selectedAssets.forEach(asset => {
      const tags = asset.tags ? asset.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const uniqueTags = [...new Set(tags)];
      uniqueTags.forEach(tag => {
        allTagCounts[tag] = (allTagCounts[tag] || 0) + 1;
      });
    });

    const common = [];
    const individual = [];
    const assetCount = selectedAssets.length;

    Object.entries(allTagCounts).forEach(([tag, count]) => {
      if (count === assetCount) {
        common.push(tag);
      } else {
        individual.push(tag);
      }
    });

    return { common, individual };
  }, [selectedIds, assets]);

  // 🔍 Filtered Data Logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.memo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'gallery' && asset.image_url) ||
      activeTab === 'home' || // Home shows everything for now
      activeTab === 'collection'; // Collection tab also shows assets
    const matchesCollection = !activeCollection || asset.folder === activeCollection;

    return matchesSearch && matchesTab && matchesCollection;
  });

  const openImageModal = (asset) => {
    setSelectedAsset(asset);
    setAssetForm({
      memo: asset.memo || '',
      tags: asset.tags || '',
      folder: asset.folder || '전체'
    });
    setShowTagInput(false);
    setTagInputValue('');
    setShowFolderSelect(false);
    setIsImageModalOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;
    try {
      await updateAsset(selectedAsset.id, assetForm);
      showToast("수정되었습니다.", "success");
      // ✨ 낙관적 UI 업데이트: fetchData() 제거
      setAssets(prev => prev.map(item =>
        item.id === selectedAsset.id ? { ...item, ...assetForm } : item
      ));
      // Keep modal open but update selected asset to reflect changes
      setSelectedAsset({ ...selectedAsset, ...assetForm });
    } catch (err) {
      showToast("수정에 실패했습니다.", "error");
    }
  };

  const handleAddBatchTag = async (tag) => {
    if (!tag) return;
    const idsArray = Array.from(selectedIds);
    const CHUNK_SIZE = 5;
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < idsArray.length; i += CHUNK_SIZE) {
        const chunk = idsArray.slice(i, i + CHUNK_SIZE);
        const results = await Promise.allSettled(chunk.map(async (id) => {
          const asset = assets.find(a => String(a.id) === id);
          if (!asset) return;
          const existingTags = asset.tags ? asset.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          if (!existingTags.includes(tag)) {
            const updatedTags = [...existingTags, tag].join(', ');
            return updateAsset(id, { ...asset, tags: updatedTags });
          }
        }));

        results.forEach(r => {
          if (r.status === 'fulfilled') successCount++;
          else failCount++;
        });
      }

      if (failCount > 0) {
        showToast(`${idsArray.length}개 중 ${successCount}개 추가 성공, ${failCount}개 실패`, "error");
        fetchData(); // 일부 실패 시에만 전체 갱신 (선택 사항)
      } else {
        showToast(`${successCount}개 항목에 태그가 일괄 추가되었습니다.`, "success");
        // ✨ 낙관적 UI 업데이트: fetchData() 대신 setAssets 호출
        setAssets(prev => prev.map(item => {
          if (idsArray.includes(String(item.id))) {
            const currentTags = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            if (!currentTags.includes(tag)) {
              return { ...item, tags: [...currentTags, tag].join(', ') };
            }
          }
          return item;
        }));
      }
    } catch (err) {
      showToast("태그 추가 중 예기치 못한 오류가 발생했습니다.", "error");
    }
  };

  const handleRemoveBatchTag = async (tag) => {
    const idsArray = Array.from(selectedIds);
    const CHUNK_SIZE = 5;
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < idsArray.length; i += CHUNK_SIZE) {
        const chunk = idsArray.slice(i, i + CHUNK_SIZE);
        const results = await Promise.allSettled(chunk.map(async (id) => {
          const asset = assets.find(a => String(a.id) === id);
          if (!asset) return;
          const existingTags = asset.tags ? asset.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const updatedTags = existingTags.filter(t => t !== tag).join(', ');
          return updateAsset(id, { ...asset, tags: updatedTags });
        }));

        results.forEach(r => {
          if (r.status === 'fulfilled') successCount++;
          else failCount++;
        });
      }

      if (failCount > 0) {
        showToast(`${idsArray.length}개 중 ${successCount}개 삭제 성공, ${failCount}개 실패`, "error");
        fetchData();
      } else {
        showToast(`${successCount}개 항목에서 태그가 일괄 삭제되었습니다.`, "success");
        // ✨ 낙관적 UI 업데이트
        setAssets(prev => prev.map(item => {
          if (idsArray.includes(String(item.id))) {
            const currentTags = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            return { ...item, tags: currentTags.filter(t => t !== tag).join(', ') };
          }
          return item;
        }));
      }
    } catch (err) {
      showToast("태그 삭제 중 예기치 못한 오류가 발생했습니다.", "error");
    }
  };

  // 1️⃣ 단일 삭제: 이미지 상세 모달에서 '삭제' 클릭 시
  const handleDeleteAsset = async (id, fileName) => {
    if (!window.confirm("정말 이 이미지를 삭제하시겠습니까?")) return;
    try {
      await deleteAsset(id, fileName);
      // 서버 삭제 성공 시, 로컬 상태에서도 즉시 제거해서 화면 갱신
      setAssets(prev => prev.filter(a => a.id !== id));
      showToast("이미지가 삭제되었습니다.", "success");
      setIsImageModalOpen(false); // 모달 닫기
    } catch (err) {
      console.error("Delete error:", err);
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  // 2️⃣ 일괄 삭제: 선택 모드에서 하단 툴바 'Delete' 클릭 시
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개의 항목을 서버에서 영구 삭제하시겠습니까?`)) return;

    try {
      const idsArray = Array.from(selectedIds);

      // 서버 및 스토리지 파일 삭제 병렬 실행
      await Promise.all(idsArray.map(id => {
        const asset = assets.find(a => String(a.id) === id);
        const fileName = asset?.video_url || asset?.image_url || "";
        return deleteAsset(id, fileName);
      }));

      // 로컬 상태에서 즉시 제거 (UI 반응성)
      setAssets(prev => prev.filter(asset => !selectedIds.has(String(asset.id))));

      // 초기화
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      isSelectionModeRef.current = false;

      showToast(`${idsArray.length}개 항목이 삭제되었습니다.`, "success");
    } catch (err) {
      console.error("Batch delete error:", err);
      showToast("일부 항목 삭제에 실패했습니다.", "error");
      fetchData(); // 에러 시 상태 동기화
    }
  };

  const goToNextAsset = () => {
    const currentIndex = filteredAssets.findIndex(a => a.id === selectedAsset.id);
    if (currentIndex < filteredAssets.length - 1) {
      openImageModal(filteredAssets[currentIndex + 1]);
    }
  };

  const goToPrevAsset = () => {
    const currentIndex = filteredAssets.findIndex(a => a.id === selectedAsset.id);
    if (currentIndex > 0) {
      openImageModal(filteredAssets[currentIndex - 1]);
    }
  };

  // 📡 Sync token with extension
  useEffect(() => {
    if (isLoaded && userId) {
      getToken().then(token => {
        if (token) {
          window.dispatchEvent(new CustomEvent('def-login-sync', { detail: { token } }));
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ def_token: token });
          }
        }
      });
    }
  }, [isLoaded, userId, getToken]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [assetsData, bookmarksData, collectionsData] = await Promise.all([
        getAssets(),
        getBookmarks(),
        getCollections()
      ]);
      setAssets(assetsData || []);
      setBookmarks(bookmarksData || []);
      setCollections(collectionsData || []);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, getAssets, getBookmarks, getCollections]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔃 Drag and Drop Handlers
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const newBookmarks = [...bookmarks];
    const [draggedItem] = newBookmarks.splice(draggedIdx, 1);
    newBookmarks.splice(targetIdx, 0, draggedItem);

    // Update sort_order for all
    const updatedBms = newBookmarks.map((bm, index) => ({
      ...bm,
      sort_order: index
    }));

    setBookmarks(updatedBms); // Optimistic UI update
    setDraggedIdx(null);

    try {
      await updateBookmarkOrder(updatedBms);
    } catch (err) {
      console.error("Order update failed:", err);
      showToast("순서 저장에 실패했습니다.", "error");
      fetchData(); // Rollback on error
    }
  };

  // 📂 컬렉션 드래그 핸들러 ✨
  const handleColDragStart = (e, idx) => {
    setDraggedColIdx(idx);
    e.dataTransfer.effectAllowed = 'move';

    // 드래그 시작 시 검색 종료 (UX 최적화)
    setIsColSearching(false);
    setColSearchQuery('');

    // 미리 정의된 투명 엘리먼트를 이미지로 설정하여 기본 고스트 숨김 (지구 모양 방지) ✨
    const ghost = document.getElementById('drag-ghost');
    if (ghost) {
      e.dataTransfer.setDragImage(ghost, 0, 0);
    }
  };

  const handleTogglePinCollection = async (col) => {
    const newPinnedStatus = !col.is_pinned;

    // Optimistic UI Update
    setCollections(prev => {
      const updated = prev.map(c => c.id === col.id ? { ...c, is_pinned: newPinnedStatus ? 1 : 0 } : c);
      return [...updated].sort((a, b) => {
        const pinA = Number(a.is_pinned || 0);
        const pinB = Number(b.is_pinned || 0);
        if (pinB !== pinA) return pinB - pinA;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    });

    try {
      await togglePinCollection(col.id, newPinnedStatus);
      // 성공 시에는 낙관적 업데이트 상태를 유지 (fetchData 불필요)
    } catch (err) {
      console.error("Pin toggle failed:", err);
      showToast("핀 고정 처리에 실패했습니다.", "error");
      fetchData(); // 에러 시에만 서버 데이터로 롤백
    }
  };

  const handleColDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColIdx === null) return;

    // 마우스가 항목의 위쪽 절반인지 아래쪽 절반인지 계산 (Edge Detection)
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTopHalf = relativeY < rect.height / 2;

    // 위쪽이면 현재 인덱스(idx)에 삽입, 아래쪽이면 다음 인덱스(idx+1)에 삽입
    const newTargetIdx = isTopHalf ? idx : idx + 1;

    if (dragOverColIdx !== newTargetIdx) {
      setDragOverColIdx(newTargetIdx);
    }
  };

  const handleColDrop = async (targetIdx) => {
    if (draggedColIdx === null) return;

    const fromIdx = draggedColIdx;
    let toIdx = targetIdx;

    // 아래로 드래그할 때의 인덱스 보정 (목표 위치가 내 뒤라면 하나 당겨짐)
    if (fromIdx < toIdx) {
      toIdx -= 1;
    }

    const newCols = [...collections];
    const [movedCol] = newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, movedCol);

    // 상태 초기화 (동작 완료 즉시)
    setDraggedColIdx(null);
    setDragOverColIdx(null);

    // 실제 순서가 바뀌었는지 확인 (아이디 배열 비교)
    const isMoved = newCols.some((col, i) => col.id !== collections[i].id);
    if (!isMoved) return;

    const orderedCols = newCols.map((col, i) => ({ ...col, sort_order: i + 1 }));
    setCollections(orderedCols);

    try {
      await updateCollectionOrder(orderedCols);
    } catch (err) {
      console.error("Order save failed:", err);
      showToast("순서 저장에 실패했습니다.", "error");
      fetchData(); // 롤백
    }
  };

  const handleColDragEnd = () => {
    setDraggedColIdx(null);
    setDragOverColIdx(null);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-content/10 border-t-content rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-10 text-center bg-background animate-fade-in">
        <div className="w-20 h-20 bg-surface border border-border rounded-3xl flex items-center justify-center mb-8 shadow-md">
          <div className="w-8 h-8 bg-content rounded-lg" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">Deference</h1>
        <p className="text-[15px] text-contentMuted mb-10 max-w-[320px] leading-relaxed">
          디자이너와 크리에이터를 위한 최고의 미니멀 디자인 아카이브.
        </p>
        <SignInButton mode="modal">
          <Button variant="primary" size="lg" className="px-10 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
            시작하기
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background text-content overflow-hidden font-medium">
      {/* 🟢 Sidebar (Eagle/Figma Style) */}
      <aside className="w-[var(--sidebar-width)] bg-sidebar border-r border-border flex flex-col h-full z-30 shrink-0">
        <div className="p-6 pb-2">
          {/* Account Area */}
          <div className="flex items-center gap-3 p-3 mb-6 bg-surface border border-border rounded-2xl shadow-sm">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8", userButtonTriggerRoot: "focus:shadow-none" } }} />
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold truncate">관리자 계정</span>
              <span className="text-[10px] text-contentMuted font-bold uppercase tracking-widest">무료 플랜</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setActiveCollection(null); }} icon={<Home size={16} strokeWidth={1.5} />} label="홈" isSubItem={true} />
            <NavBtn active={activeTab === 'all'} onClick={() => { setActiveTab('all'); setActiveCollection(null); }} icon={<Grid size={16} strokeWidth={1.5} />} label="전체 미디어" isSubItem={true} />
          </nav>

          <div className="mt-8 mb-2 px-3">
            <span className="text-sm font-semibold text-content">라이브러리</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={16} strokeWidth={1.5} />} label="갤러리" isSubItem={true} />
            <NavBtn active={activeTab === 'bookmarks'} onClick={() => setActiveTab('bookmarks')} icon={<Bookmark size={16} strokeWidth={1.5} />} label="북마크" isSubItem={true} />
            <NavBtn icon={<Tag size={16} strokeWidth={1.5} />} label="태그" badge="12" isSubItem={true} />
          </nav>

          <div
            className={`mt-8 mb-2 px-3 py-1 flex items-center justify-between cursor-default transition-all duration-200 rounded-lg ${dragOverColIdx === 0 && draggedColIdx !== null ? 'bg-hover' : ''}`}
            onDragEnter={() => setDragOverColIdx(0)}
            onDragOver={(e) => handleColDragOver(e, 0)}
            onDrop={() => handleColDrop(0)}
          >
            <div className={`flex items-center justify-between w-full ${draggedColIdx !== null ? 'pointer-events-none' : ''}`}>
              {isColSearching ? (
                <div className="flex items-center bg-hover rounded-md px-2 py-0.5 w-full mr-2 animate-fade-in">
                  <Search size={12} className="opacity-50 mr-1.5" />
                  <input
                    autoFocus
                    type="text"
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    placeholder="검색..."
                    className="bg-transparent text-[12px] w-full outline-none placeholder:text-content/30"
                  />
                  <button onClick={() => { setIsColSearching(false); setColSearchQuery(''); }} className="opacity-40 hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-semibold text-content">Collections</span>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {!isColSearching && (
                  <button
                    onClick={() => setIsColSearching(true)}
                    className="p-1 hover:bg-hover rounded-md transition-colors text-content opacity-60 hover:opacity-100"
                  >
                    <Search size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsCreatingCollection(true)}
                  className="p-1 hover:bg-hover rounded-md transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="relative group/col-list">
            <nav className="flex flex-col max-h-[380px] overflow-y-auto scrollbar-hide pr-1 pb-10">
              {collections
                .filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase()))
                .map((col, idx) => (
                  <React.Fragment key={col.id}>
                    {/* 1. 삽입 인디케이터 (현재 인덱스에 삽입될 예정일 때) */}
                    {dragOverColIdx === idx && draggedColIdx !== null && (
                      <div className="h-0.5 bg-content mx-3 shrink-0 relative z-10" />
                    )}

                    {/* 2. 항목 영역 (상/하 감지 드롭 타겟) */}
                    <div
                      className="py-0.5"
                      onDragOver={(e) => handleColDragOver(e, idx)}
                      onDrop={() => handleColDrop(dragOverColIdx)}
                    >
                      <NavBtn
                        active={activeCollection === col.name}
                        onClick={() => {
                          setActiveCollection(col.name);
                          setActiveTab('collection');
                        }}
                        icon={<Folder size={16} strokeWidth={1.5} />}
                        label={col.name}
                        isSubItem={true}
                        onEdit={() => {
                          setEditingCollection(col);
                          setNewCollectionName(col.name);
                          setIsCreatingCollection(true);
                        }}
                        onDelete={() => {
                          if (window.confirm(`'${col.name}' 컬렉션을 삭제하시겠습니까?`)) {
                            deleteCollection(col.id).then(() => {
                              showToast("삭제되었습니다.", "success");
                              if (activeCollection === col.name) {
                                setActiveCollection(null);
                                setActiveTab('home');
                              }
                              fetchData();
                            }).catch(() => showToast("삭제에 실패했습니다.", "error"));
                          }
                        }}
                        draggable={true}
                        onDragStart={(e) => handleColDragStart(e, idx)}
                        onDragEnd={handleColDragEnd}
                        isDragging={draggedColIdx === idx}
                        isPinned={col.is_pinned === 1}
                        onTogglePin={() => handleTogglePinCollection(col)}
                      />
                    </div>

                    {/* 3. 마지막 항목 아래 삽입 인디케이터 */}
                    {idx === collections.length - 1 && dragOverColIdx === collections.length && draggedColIdx !== null && (
                      <div className="h-0.5 bg-content mx-3 shrink-0 relative z-10" />
                    )}
                  </React.Fragment>
                ))}

              {/* 리스트가 비어있거나 끝 영역 드롭을 위한 여백 (메뉴 짤림 방지 위해 높이 증설) */}
              <div
                className="h-24 w-full shrink-0"
                onDrop={() => handleColDrop(collections.length)}
              />
              {collections.length === 0 && <span className="px-3 py-2 text-[11px] text-content italic">생성된 컬렉션 없음</span>}
            </nav>
            {/* 하단 페이드 효과 ✨ (더 많은 콘텐츠가 있음을 암시) */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20 transition-opacity duration-300" />
          </div>
        </div>

        <div className="mt-auto border-t border-border p-4">
          <nav className="flex flex-col gap-1">
            <NavBtn icon={<Settings size={16} strokeWidth={1.5} />} label="설정" isSubItem={true} />
            <NavBtn icon={<HelpCircle size={16} strokeWidth={1.5} />} label="도움말 및 지원" isSubItem={true} />
          </nav>
        </div>
      </aside>

      {/* 🔵 Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-primary relative overflow-hidden">

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-20 select-none" onMouseDown={handleGridMouseDown}>

          <div className="px-12 max-w-[1400px] mx-auto animate-slide-up">

            {/* 1️⃣ Bookmark Area (Speed Dial - Circular Icons) */}
            <div className="mb-10 flex justify-center">
              <div className="w-full max-w-[600px]">
                <div className="flex flex-wrap gap-2 justify-center">
                  {bookmarks.slice(0, 8).map((bm, idx) => (
                    <div
                      key={bm.id}
                      draggable
                      onDragStart={(e) => {
                        // 브라우저가 스냅샷을 찍는 동안은 원래 스타일 유지
                        setTimeout(() => handleDragStart(idx), 0);
                      }}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => window.open(bm.url, '_blank')}
                      onContextMenu={(e) => { e.preventDefault(); openBookmarkModal(bm); }}
                      className={`group flex flex-col items-center gap-1.5 w-[60px] cursor-pointer transition-all ${draggedIdx === idx ? 'opacity-30 scale-95' : 'opacity-100'}`}
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative overflow-hidden pointer-events-none"
                        style={{ backgroundColor: bm.icon_value === 'transparent' ? 'transparent' : (bm.icon_value || 'var(--bg-surface)') }}
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=128`}
                          className="w-full h-full object-cover transition-all z-10 pointer-events-none"
                          draggable={false}
                          style={{
                            transform: `scale(${bm.icon_scale || 1.0}) translate(${bm.icon_offset_x || 0}px, ${bm.icon_offset_y || 0}px)`
                          }}
                          alt={bm.name}
                        />
                        {bm.icon_value !== 'transparent' && <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />}
                      </div>
                      <span className="text-[9px] font-bold text-contentMuted truncate w-full text-center group-hover:text-content transition-colors pointer-events-none">{bm.name}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => openBookmarkModal()}
                    className="w-10 h-10 rounded-full border border-dashed border-border flex items-center justify-center text-contentMuted hover:border-content/30 hover:bg-surface transition-all shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2️⃣ Search Area */}
            <div className="mb-12 flex justify-center">
              <div className="w-full max-w-[600px] relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-contentMuted group-focus-within:text-content transition-colors" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="디자인 라이브러리 검색..."
                  className="w-full h-14 bg-surface border-2 border-border/50 rounded-2xl pl-14 pr-6 text-[15px] font-medium focus:outline-none focus:border-content/10 focus:ring-4 focus:ring-content/5 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* 3️⃣ Favorites/Folder Suggestion Area */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div
                onClick={() => { setActiveTab('all'); setSearchQuery(''); setActiveCollection(null); }}
                className={`px-4 py-2 rounded-xl font-black text-[11px] shadow-lg cursor-pointer transition-all ${!searchQuery && activeTab === 'all' ? 'bg-content text-background scale-105' : 'bg-surface border border-border text-content hover:border-content/20'}`}
              >
                전체보기
              </div>
              {['브랜딩', 'UI 패턴', '아이콘', '영감'].map(tag => (
                <div
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className={`px-4 py-2 border rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${searchQuery === tag ? 'bg-content text-background border-content' : 'bg-surface border-border hover:border-content/20'}`}
                >
                  {tag}
                </div>
              ))}
              <button onClick={() => setIsCreatingCollection(true)} className="p-2 hover:bg-surface rounded-xl border border-dashed border-border"><Plus size={14} /></button>
            </div>

            {/* 4️⃣ Filter & Sort Bar */}
            <div className="mb-8 flex items-center justify-between py-4 border-b border-border/50">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                  <Filter size={14} /> 유형: {activeTab === 'home' ? '전체' : activeTab === 'gallery' ? '이미지' : activeTab === 'bookmarks' ? '북마크' : activeCollection || '일반'}
                </button>
                <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                  <ArrowUpDown size={14} /> 최신순
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* 뷰 모드 토글 (Segmented Control 스타일) */}
                <div className="flex items-center bg-gray-100/80 dark:bg-zinc-800/50 p-1 rounded-xl mr-2 gap-0.5 border border-gray-200/30 dark:border-zinc-700/30 shadow-sm">
                  <button 
                    onClick={() => setViewMode('masonry')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'masonry' ? 'bg-white dark:bg-zinc-600 text-black dark:text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/30'}`}
                    title="Masonry"
                  >
                    <Layout size={18} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-600 text-black dark:text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/30'}`}
                    title="Grid"
                  >
                    <LayoutGrid size={18} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-600 text-black dark:text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/30'}`}
                    title="List"
                  >
                    <ListIcon size={18} strokeWidth={1.5} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const next = !isSelectionMode;
                    isSelectionModeRef.current = next;
                    setIsSelectionMode(next);
                    if (!next) setSelectedIds(new Set()); 
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all ${isSelectionMode ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-500/20' : 'bg-gray-100/80 dark:bg-zinc-800/50 border border-gray-200/30 dark:border-zinc-700/30 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-200/50 transition-colors'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  {isSelectionMode ? '선택 취소' : '선택 모드'}
                </button>

                <div className="w-[1px] h-4 bg-border mx-1" />
                <button className="p-2 hover:bg-surface rounded-lg transition-colors"><Grid size={16} /></button>
                <button className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronRight size={16} className="rotate-90" /></button>
              </div>
            </div>

            {/* 5️⃣ Image Gallery Grid */}
            <div id="gallery-grid-area" className="pb-24 min-h-[500px] select-none">
              {loading ? (
                <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-content/10 border-t-content rounded-full animate-spin" /></div>
              ) : filteredAssets.length > 0 ? (
                <div ref={gridContainerRef}>
                  {viewMode === 'masonry' && (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 [column-fill:_balance]">
                      {filteredAssets.map((asset) => (
                        <GalleryCard
                          key={asset.id}
                          asset={asset}
                          onClick={() => isSelectionMode || selectedIds.size > 0 ? toggleSelect(asset.id) : openImageModal(asset)}
                          isSelected={selectedIds.has(String(asset.id))}
                          onToggleSelect={toggleSelect}
                          isSelectionMode={isSelectionMode || selectedIds.size > 0}
                          viewMode="masonry"
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {filteredAssets.map((asset) => (
                        <GalleryCard
                          key={asset.id}
                          asset={asset}
                          onClick={() => isSelectionMode || selectedIds.size > 0 ? toggleSelect(asset.id) : openImageModal(asset)}
                          isSelected={selectedIds.has(String(asset.id))}
                          onToggleSelect={toggleSelect}
                          isSelectionMode={isSelectionMode || selectedIds.size > 0}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === 'list' && (
                    <div className="flex flex-col gap-2">
                      {filteredAssets.map((asset) => (
                        <ListRow
                          key={asset.id}
                          asset={asset}
                          onClick={() => isSelectionMode || selectedIds.size > 0 ? toggleSelect(asset.id) : openImageModal(asset)}
                          isSelected={selectedIds.has(String(asset.id))}
                          onToggleSelect={toggleSelect}
                          isSelectionMode={isSelectionMode || selectedIds.size > 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-40 text-center bg-surface/30 border-2 border-dashed border-border rounded-[40px]">
                  <ImageIcon size={48} className="mx-auto mb-6 text-contentMuted opacity-20" />
                  <h4 className="text-[18px] font-black mb-1">라이브러리가 비어있습니다.</h4>
                  <p className="text-[13px] text-contentMuted">익스텐션을 사용하여 디자인 영감을 수집해보세요.</p>
                </div>
              )}
            </div>
          </div>

          {/* ✨ 피그마 스타일 드래그 선택 박스 */}
          {dragBox && createPortal(
            <div
              style={{
                position: 'fixed',
                left: Math.min(dragBox.x1, dragBox.x2),
                top: Math.min(dragBox.y1, dragBox.y2),
                width: Math.abs(dragBox.x2 - dragBox.x1),
                height: Math.abs(dragBox.y2 - dragBox.y1),
                backgroundColor: dragBox.isAlt ? 'rgba(239, 68, 68, 0.07)' : 'rgba(0, 102, 255, 0.08)',
                border: `1px solid ${dragBox.isAlt ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 102, 255, 0.5)'}`,
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 9999
              }}
            />,
            document.body
          )}

          {/* ✨ 스플라인 스타일: 투박한 박스를 버리고 '알약(Pill)' 형태의 플로팅 아일랜드로 변경 */}
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center p-1.5 bg-[#1c1c1c]/80 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-full z-50 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedIds.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex items-center gap-3 px-4 text-white/90 font-medium text-[13px] tracking-tight">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[11px] font-bold">{selectedIds.size}</span>
              Selected
            </div>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <div className="flex gap-1">
              <button
                className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setIsBatchTagModalOpen(true)}
              >
                <Tag size={14} strokeWidth={2} /> Tags
              </button>
              <button className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Folder size={14} strokeWidth={2} /> Move
              </button>
              <button
                className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                onClick={handleBatchDelete}
              >
                <LogOut size={14} strokeWidth={2} /> Delete
              </button>
            </div>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button onClick={() => setSelectedIds(new Set())} className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors mr-0.5">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* 👻 드래그 잔상 제거용 투명 엘리먼트 */}
          <div id="drag-ghost" style={{ position: 'fixed', top: '-100px', left: '-100px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
        </div>
      </main>

      {/* MODAL: Create Collection */}
      {isCreatingCollection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-border w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h2 className="text-[18px] font-bold tracking-tight text-content">
                {editingCollection ? '컬렉션 수정' : '새 컬렉션'}
              </h2>
              <button
                onClick={() => { setIsCreatingCollection(false); setEditingCollection(null); setNewCollectionName(''); }}
                className="p-1 hover:bg-hover rounded-full transition-colors text-content/30 hover:text-content"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-4 border-t border-border/30">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newCollectionName.trim()) return;
                try {
                  if (editingCollection) {
                    await updateCollection(editingCollection.id, newCollectionName.trim());
                    showToast("이름이 변경되었습니다.", "success");
                  } else {
                    await saveCollection(newCollectionName.trim());
                    showToast("컬렉션이 생성되었습니다.", "success");
                  }
                  setIsCreatingCollection(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  fetchData();
                } catch (err) { showToast("처리에 실패했습니다.", "error"); }
              }}>
                <div className="mb-8 mt-2">
                  <input
                    autoFocus
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    type="text"
                    placeholder="컬렉션 이름 입력"
                    className="w-full h-12 px-5 bg-hover border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-content/5 transition-all text-[14px] font-medium placeholder:text-content/20"
                  />
                </div>

                {/* Modal Footer (Buttons) */}
                <div className="flex gap-3 pb-4">
                  <button
                    type="button"
                    onClick={() => { setIsCreatingCollection(false); setEditingCollection(null); setNewCollectionName(''); }}
                    className="flex-1 h-12 rounded-2xl bg-hover/50 hover:bg-hover text-[14px] font-bold text-content/60 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-2xl bg-content text-background hover:opacity-90 active:scale-[0.98] transition-all text-[14px] font-bold shadow-lg"
                    disabled={!newCollectionName.trim()}
                  >
                    {editingCollection ? '수정하기' : '생성하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bookmark Editor */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-border w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-bold tracking-tight text-content">{editingBookmark ? '북마크 수정' : '북마크 추가'}</h2>
                {editingBookmark && (
                  <button
                    onClick={async () => {
                      if (window.confirm("정말 삭제하시겠습니까?")) {
                        try {
                          await deleteBookmark(editingBookmark.id);
                          showToast("삭제되었습니다.", "success");
                          setIsBookmarkModalOpen(false);
                          fetchData();
                        } catch (err) { showToast("삭제에 실패했습니다.", "error"); }
                      }
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <LogOut size={16} className="rotate-180" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="p-1 hover:bg-hover rounded-full transition-colors text-content/30 hover:text-content"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 border-t border-border/30">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const data = {
                  name: bmForm.name,
                  url: bmForm.url.startsWith('http') ? bmForm.url : `https://${bmForm.url}`,
                  icon_value: bmForm.isTransparent ? 'transparent' : bmForm.color,
                  icon_scale: bmForm.scale,
                  icon_offset_x: bmForm.offset_x,
                  icon_offset_y: bmForm.offset_y,
                  icon_type: 'color'
                };
                try {
                  if (editingBookmark) {
                    await updateBookmark(editingBookmark.id, data);
                    showToast("수정되었습니다.", "success");
                  } else {
                    await saveBookmark(data);
                    showToast("추가되었습니다.", "success");
                  }
                  setIsBookmarkModalOpen(false);
                  fetchData();
                } catch (err) { showToast("저장에 실패했습니다.", "error"); }
              }}>

                {/* Real-time Preview */}
                <div className="flex flex-col items-center justify-center p-6 bg-hover/30 rounded-3xl border border-dashed border-border/50 mb-6 relative h-48 group/preview">
                  <div
                    className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-200 border-2 border-white/50 bg-surface"
                    style={{ backgroundColor: bmForm.isTransparent ? 'transparent' : bmForm.color }}
                  >
                    {bmForm.url ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${bmForm.url.includes('.') ? (bmForm.url.startsWith('http') ? new URL(bmForm.url).hostname : bmForm.url) : 'google.com'}&sz=128`}
                        className="w-full h-full object-cover z-10"
                        style={{ transform: `scale(${bmForm.scale}) translate(${bmForm.offset_x}px, ${bmForm.offset_y}px)` }}
                      />
                    ) : <Plus size={20} className="text-contentMuted opacity-20" />}
                  </div>

                  {/* Controls */}
                  <button type="button" onClick={() => setBmForm({ ...bmForm, offset_y: bmForm.offset_y - 0.5 })} className="absolute top-6 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronUp size={12} /></button>
                  <button type="button" onClick={() => setBmForm({ ...bmForm, offset_y: bmForm.offset_y + 0.5 })} className="absolute bottom-6 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronDown size={12} /></button>
                  <button type="button" onClick={() => setBmForm({ ...bmForm, offset_x: bmForm.offset_x - 0.5 })} className="absolute left-6 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronLeft size={12} /></button>
                  <button type="button" onClick={() => setBmForm({ ...bmForm, offset_x: bmForm.offset_x + 0.5 })} className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronRight size={12} /></button>
                  <button type="button" onClick={() => setBmForm({ ...bmForm, offset_x: 0, offset_y: 0, scale: 1.0 })} className="absolute top-4 right-4 p-1.5 bg-background border border-border rounded-lg shadow-sm hover:text-red-500 transition-all z-20"><RefreshCw size={12} /></button>
                </div>

                {/* Zoom Slider */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-content/40 uppercase tracking-widest">Zoom</span>
                    <span className="text-[10px] font-bold text-content/60">{bmForm.scale.toFixed(2)}x</span>
                  </div>
                  <input type="range" min="0.3" max="2.5" step="0.01" value={bmForm.scale} onChange={e => setBmForm({ ...bmForm, scale: parseFloat(e.target.value) })} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-content" />
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="col-span-2 space-y-1.5">
                    <input value={bmForm.name} onChange={e => setBmForm({ ...bmForm, name: e.target.value })} type="text" placeholder="이름" className="w-full h-11 px-4 bg-hover border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-content/5 transition-all text-[13px] font-medium" required />
                    <input value={bmForm.url} onChange={e => setBmForm({ ...bmForm, url: e.target.value })} type="text" placeholder="URL" className="w-full h-11 px-4 bg-hover border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-content/5 transition-all text-[13px] font-medium" required />
                  </div>

                  <div className="flex items-center justify-between px-3 bg-hover rounded-2xl h-11">
                    <span className="text-[12px] font-medium text-content/60">배경 투명</span>
                    <input type="checkbox" checked={bmForm.isTransparent} onChange={e => setBmForm({ ...bmForm, isTransparent: e.target.checked })} className="w-4 h-4 accent-content cursor-pointer" />
                  </div>
                  {!bmForm.isTransparent && (
                    <input type="color" value={bmForm.color} onChange={e => setBmForm({ ...bmForm, color: e.target.value })} className="w-full h-11 p-1 bg-hover border-none rounded-2xl cursor-pointer" />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsBookmarkModalOpen(false)} className="flex-1 h-12 rounded-2xl bg-hover/50 hover:bg-hover text-[14px] font-bold text-content/60 transition-colors">취소</button>
                  <button type="submit" className="flex-1 h-12 rounded-2xl bg-content text-background hover:opacity-90 active:scale-[0.98] transition-all text-[14px] font-bold shadow-lg">저장하기</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Image Detail Viewer ✨ */}
      {isImageModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
          {/* Close Area */}
          <div className="absolute inset-0 z-0" onClick={() => setIsImageModalOpen(false)} />

          <div className="relative z-10 w-full max-w-6xl h-full flex flex-col md:flex-row gap-8 items-center justify-center animate-slide-up">

            {/* Left: Image Canvas */}
            <div className="flex-1 h-full flex items-center justify-center relative group/canvas">
              {/* Prev Button */}
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevAsset(); }}
                className="absolute left-4 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover/canvas:opacity-100 z-20"
              >
                <ChevronLeft size={32} />
              </button>

              {/* 💡 비디오/이미지 분기 처리 */}
              {selectedAsset.video_url ? (
                <video
                  src={selectedAsset.video_url}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                  controls       /* 플레이어 컨트롤(재생/일시정지) 표시 */
                  autoPlay       /* 모달 열리면 자동 재생 */
                  loop           /* 무한 반복 */
                  muted          /* 기본 음소거 (자동재생을 위해 필수) */
                />
              ) : (
                <img
                  src={selectedAsset.image_url}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                  alt={selectedAsset.memo}
                />
              )}

              {/* Next Button */}
              <button
                onClick={(e) => { e.stopPropagation(); goToNextAsset(); }}
                className="absolute right-4 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover/canvas:opacity-100 z-20"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            {/* Right: Info Panel - White Mode */}
            <div className="w-full md:w-[300px] shrink-0 bg-white rounded-[24px] p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto max-h-[90vh]" style={{ color: '#111' }}>
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#aaa' }}>상세 정보</span>
                <button onClick={() => setIsImageModalOpen(false)} className="p-1.5 rounded-full transition-colors" style={{ background: 'none' }} onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                  <X size={18} style={{ color: '#888' }} />
                </button>
              </div>

              {/* Memo */}
              <textarea
                value={assetForm.memo}
                onChange={e => setAssetForm({ ...assetForm, memo: e.target.value })}
                onBlur={handleUpdateAsset}
                placeholder="메모..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-none transition-colors"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111' }}
              />

              {/* Source URL */}
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <span className="flex-1 text-[13px] truncate" style={{ color: '#666' }}>{selectedAsset.page_url || '출처 없음'}</span>
                {selectedAsset.page_url && (
                  <a href={selectedAsset.page_url} target="_blank" rel="noreferrer" style={{ color: '#aaa' }} onMouseOver={e => e.currentTarget.style.color = '#333'} onMouseOut={e => e.currentTarget.style.color = '#aaa'}>
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold" style={{ color: '#444' }}>태그</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(assetForm.tags ? assetForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#f3f4f6', color: '#333', maxWidth: '140px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag}</span>
                      <button
                        onClick={() => {
                          const newTags = assetForm.tags.split(',').map(t => t.trim()).filter(Boolean).filter((_, idx) => idx !== i);
                          const updated = { ...assetForm, tags: newTags.join(', ') };
                          setAssetForm(updated);
                          updateAsset(selectedAsset.id, updated);
                        }}
                        style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                        onMouseOver={e => e.currentTarget.style.color = '#333'} onMouseOut={e => e.currentTarget.style.color = '#aaa'}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {showTagInput ? (
                    <input
                      autoFocus
                      value={tagInputValue}
                      onChange={e => setTagInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && tagInputValue.trim()) {
                          const existing = assetForm.tags ? assetForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                          const updated = { ...assetForm, tags: [...existing, tagInputValue.trim()].join(', ') };
                          setAssetForm(updated);
                          updateAsset(selectedAsset.id, updated);
                          setTagInputValue('');
                          setShowTagInput(false);
                        } else if (e.key === 'Escape') {
                          setTagInputValue(''); setShowTagInput(false);
                        }
                      }}
                      onBlur={() => { setTagInputValue(''); setShowTagInput(false); }}
                      placeholder="태그 입력"
                      className="text-[12px] px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: '#f3f4f6', border: '1px solid #d1d5db', width: '90px', color: '#111' }}
                    />
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="flex items-center justify-center rounded-lg transition-colors"
                      style={{ width: '32px', height: '32px', background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#888' }}
                      onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Folder */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold" style={{ color: '#444' }}>폴더</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {(assetForm.folder ? assetForm.folder.split(',').map(f => f.trim()).filter(f => f && f !== '전체') : []).map((folder, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#f3f4f6', color: '#333', maxWidth: '140px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder}</span>
                      <button
                        onClick={() => {
                          const newFolders = assetForm.folder.split(',').map(f => f.trim()).filter(f => f && f !== '전체').filter((_, idx) => idx !== i);
                          const updated = { ...assetForm, folder: newFolders.length > 0 ? newFolders.join(', ') : '전체' };
                          setAssetForm(updated);
                          updateAsset(selectedAsset.id, updated).then(() => { showToast("폴더가 해제되었습니다.", "success"); fetchData(); });
                        }}
                        style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                        onMouseOver={e => e.currentTarget.style.color = '#333'} onMouseOut={e => e.currentTarget.style.color = '#aaa'}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {showFolderSelect && createPortal(
                    <>
                      {/* 백드롭 콜렉 레이어 */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => { setShowFolderSelect(false); setNewFolderName(''); }}
                      />
                      {/* 드롭다운 패널 */}
                      <div
                        className="fixed z-[9999] rounded-xl overflow-hidden"
                        style={{
                          top: `${folderDropdownPos.top}px`,
                          left: `${folderDropdownPos.left}px`,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                          minWidth: '200px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          transform: 'translateY(-100%) translateY(-8px)'
                        }}
                      >
                        {/* 새 폴더 입력 — 작은 헤더로 간단히 */}
                        <div className="px-3 pt-3 pb-2">
                          <input
                            autoFocus
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && newFolderName.trim()) {
                                try {
                                  await saveCollection(newFolderName.trim());
                                  const existing = assetForm.folder ? assetForm.folder.split(',').map(f => f.trim()).filter(f => f && f !== '전체') : [];
                                  const updated = { ...assetForm, folder: [...existing, newFolderName.trim()].join(', ') };
                                  setAssetForm(updated);
                                  await updateAsset(selectedAsset.id, updated);
                                  showToast(`'${newFolderName.trim()}' 폴더가 생성되었습니다.`, 'success');
                                  fetchData();
                                  setSelectedAsset({ ...selectedAsset, folder: updated.folder });
                                  setNewFolderName('');
                                  setShowFolderSelect(false);
                                } catch { showToast('폴더 생성에 실패했습니다.', 'error'); }
                              } else if (e.key === 'Escape') {
                                setNewFolderName(''); setShowFolderSelect(false);
                              }
                            }}
                            placeholder="+ 새 폴더 이름 (Enter)"
                            className="w-full text-[12px] px-3 py-2 rounded-lg outline-none"
                            style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#111', boxSizing: 'border-box', width: '100%' }}
                          />
                        </div>

                        {/* 기존 폴더 목록 */}
                        {collections.length === 0 && (
                          <div className="px-4 py-3 text-[12px]" style={{ color: '#aaa' }}>폴더 없음</div>
                        )}
                        {collections.map(col => {
                          const alreadyAdded = assetForm.folder ? assetForm.folder.split(',').map(f => f.trim()).includes(col.name) : false;
                          return (
                            <button
                              key={col.id}
                              disabled={alreadyAdded}
                              onClick={() => {
                                if (alreadyAdded) return;
                                const existing = assetForm.folder ? assetForm.folder.split(',').map(f => f.trim()).filter(f => f && f !== '전체') : [];
                                const updated = { ...assetForm, folder: [...existing, col.name].join(', ') };
                                setAssetForm(updated);
                                updateAsset(selectedAsset.id, updated).then(() => { showToast('폴더에 추가되었습니다.', 'success'); fetchData(); setSelectedAsset({ ...selectedAsset, folder: updated.folder }); });
                                setShowFolderSelect(false);
                                setNewFolderName('');
                              }}
                              className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2"
                              style={{ background: 'none', border: 'none', cursor: alreadyAdded ? 'default' : 'pointer', color: alreadyAdded ? '#ccc' : '#222' }}
                              onMouseOver={e => { if (!alreadyAdded) e.currentTarget.style.background = '#f5f5f5'; }}
                              onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
                            >
                              <Folder size={13} style={{ color: alreadyAdded ? '#ccc' : '#888', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{col.name}</span>
                              {alreadyAdded && <span className="ml-auto text-[10px] shrink-0" style={{ color: '#ccc' }}>추가됨</span>}
                            </button>
                          );
                        })}
                        <div style={{ height: '8px' }} />
                      </div>
                    </>,
                    document.body
                  )}
                  <button
                    ref={folderBtnRef}
                    onClick={() => {
                      if (folderBtnRef.current) {
                        const rect = folderBtnRef.current.getBoundingClientRect();
                        setFolderDropdownPos({ top: rect.top, left: rect.left });
                      }
                      setShowFolderSelect(v => !v);
                    }}
                    className="flex items-center justify-center rounded-lg transition-colors"
                    style={{ width: '32px', height: '32px', background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#888' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <Plus size={14} />
                  </button>
                </div>

              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              {/* Actions */}
              <button
                onClick={() => handleDeleteAsset(selectedAsset.id, selectedAsset.video_url || "")}
                className="w-full h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
                style={{ background: '#fff0f0', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fff0f0'}
              >
                이미지 삭제
              </button>

              <div className="text-[10px] font-medium" style={{ color: '#ccc' }}>
                수집일: {new Date(selectedAsset.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Key Hints */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-40 pointer-events-none">
            <span className="text-[10px] font-bold border border-white/20 px-2 py-1 rounded">ESC : 닫기</span>
            <span className="text-[10px] font-bold border border-white/20 px-2 py-1 rounded">←/→ : 탐색</span>
          </div>
        </div>
      )}

      {/* BATCH TAG EDIT MODAL */}
      <BatchTagModal
        isOpen={isBatchTagModalOpen}
        onClose={() => setIsBatchTagModalOpen(false)}
        tagAnalysis={tagAnalysis}
        onAddTag={handleAddBatchTag}
        onRemoveTag={handleRemoveBatchTag}
      />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge, isSubItem, onEdit, onDelete, onTogglePin, isPinned, draggable, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }) {
  const [showOptions, setShowOptions] = useState(false);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const handleToggleOptions = (e) => {
    e.stopPropagation();
    if (!showOptions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // fixed 포지션을 사용하므로 뷰포트 상대 좌표인 rect를 그대로 사용합니다.
      setMenuPos({
        top: rect.bottom,
        left: rect.right - 128 // 메뉴 너비 128px 기준
      });
    }
    setShowOptions(!showOptions);
  };

  return (
    <div className={`relative group/nav ${isDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'} transition-all duration-200`}>
      <button
        ref={buttonRef}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`w-full flex items-center justify-between px-3 ${isSubItem ? 'py-1' : 'py-1.5'} rounded-xl transition-all duration-200 group ${active ? 'bg-hover text-content' : 'text-content hover:bg-hover'} ${draggable ? 'cursor-grab active:cursor-grabbing select-none' : ''} ${isDragging ? 'shadow-inner bg-surface' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="transition-colors opacity-70 relative shrink-0">
            {icon}
            {isPinned && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-content rounded-full border border-background scale-75" />
            )}
          </span>
          <span className="tracking-tight text-[12px] font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {badge && <span className="text-[10px] font-black bg-hover px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{badge}</span>}
          {(onEdit || onDelete || onTogglePin) && (
            <div
              className="opacity-0 group-hover/nav:opacity-40 hover:!opacity-100 transition-opacity p-1 rounded-md hover:bg-content/10"
              onClick={handleToggleOptions}
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </button>

      {showOptions && createPortal(
        <>
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setShowOptions(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: '128px'
            }}
            className="bg-background border border-border rounded-xl shadow-2xl z-[1001] py-1 overflow-hidden animate-fade-in"
          >
            {onTogglePin && (
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-hover transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                  setShowOptions(false);
                }}
              >
                {isPinned ? <PinOff size={12} strokeWidth={2} /> : <Pin size={12} strokeWidth={2} />}
                {isPinned ? '고정 해제' : '최상단 고정'}
              </button>
            )}
            {onEdit && (
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-hover transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(false);
                  onEdit();
                }}
              >
                이름 변경
              </button>
            )}
            {onDelete && (
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-red-50 text-red-500 transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(false);
                  onDelete();
                }}
              >
                삭제
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}

export default App;
