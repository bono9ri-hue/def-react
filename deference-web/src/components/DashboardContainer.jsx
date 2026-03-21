"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import * as Hangul from 'hangul-js';
import SharedCombobox from './ui/SharedCombobox';
import { Button } from './Button';
import { Card } from './Card';
import { ToastProvider, useToast } from './Toast';
import { useExtensionAction } from '../hooks/useExtensionAction';
import { useApi } from '../hooks/useApi';
import NextImage from 'next/image';
import VideoCard from './VideoCard';
import Masonry from 'react-masonry-css';
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
  LayoutGrid,
  List,
  Trash2,
  RefreshCw,
  LayoutDashboard as Layout,
  X,
  Copy,
  Columns,
  Pin,
  PinOff,
  GripVertical,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import ControlBar from './ControlBar';



/* ============================================================
   GalleryCard (선택 기능 & 미니멀 체크박스 통합본)
   ============================================================ */
const GalleryCard = React.memo(({ asset, onClick, isSelected, onToggleSelect, isEditMode, viewMode, openImageModal }) => {
  const [isImageError, setIsImageError] = useState(false);

  // ✨ 이미지 URL이 변경될 경우 에러 상태 초기화 (재렌더링 대응)
  useEffect(() => {
    setIsImageError(false);
  }, [asset?.image_url, asset?.id]);

  // ✨ 이미지 로딩 트랜지션 및 깜빡임 방지 로직 제거됨 (즉시 렌더링 방식 채택)




  if (!asset) {
    const isMasonry = viewMode === 'masonry';
    return (
      <div className={`gallery-item break-inside-avoid ${isMasonry ? 'mb-3' : 'mb-6'} relative rounded-[10px] overflow-hidden bg-gray-100 dark:bg-white/5`}>
        <div className="absolute inset-0 bg-gray-200 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  const isGif = asset.image_url?.toLowerCase().includes('.gif');
  const hasVideo = asset.video_url && typeof asset.video_url === 'string' && asset.video_url.trim() !== "";


  const isMasonry = viewMode === 'masonry';
  const blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

  return (
    <div
      onClick={onClick}
      className={`gallery-item w-full break-inside-avoid ${isMasonry ? 'mb-4' : 'mb-6'} group relative ${isEditMode ? 'cursor-default' : 'cursor-pointer'}`}
      data-id={asset.id}
    >
      <div 
        className={`relative w-full rounded-[10px] overflow-hidden bg-gray-100 dark:bg-white/5 transition-shadow duration-300 ${isSelected ? 'ring-2 ring-blue-500/80 shadow-md' : 'border border-border/40'} ${isMasonry ? 'h-auto' : viewMode === 'grid' ? 'aspect-square' : 'aspect-video'}`}
        style={isMasonry && asset.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : {}}
      >
        {/* ✨ Skeleton Background 삭제 (깜빡임 방지) */}
        
        {/* 체크박스: 오직 isEditMode가 true일 때만 렌더링 */}
        {isEditMode && (
          <div
            onClick={(e) => { e.stopPropagation(); onToggleSelect(asset.id); }}
            className={`absolute top-3 right-3 z-[20] w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer pointer-events-auto backdrop-blur-md
              ${isSelected 
                ? 'bg-blue-500/90 border border-blue-500 text-white shadow-md scale-100 opacity-100' 
                : 'bg-black/20 border border-white/50 text-transparent opacity-0 group-hover:opacity-100 hover:bg-black/30 scale-95 hover:scale-100'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        )}

        {hasVideo ? (
          <div className={`z-10 w-full ${isMasonry ? 'relative h-auto' : 'absolute inset-0 h-full'}`}>
            <VideoCard 
              videoUrl={asset.video_url} 
              posterUrl={asset.image_url} 
              className="w-full h-full"
              isMasonry={isMasonry}
            />
          </div>
        ) : (
          /* 이미지 렌더링 (빈 문자열 및 깨진 링크 방어) */
          (asset.image_url && typeof asset.image_url === 'string' && asset.image_url.trim() !== "" && !isImageError) ? (
            <div className={`relative z-10 w-full ${isMasonry ? 'h-auto' : 'h-full absolute inset-0'}`}>
              <NextImage
                src={asset.image_url}
                alt={asset.memo || "Gallery Image"}
                {...(isMasonry ? { width: 800, height: 1000, className: "w-full h-auto block" } : { fill: true, className: "object-cover group-hover:scale-105 transition-transform duration-500" })}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                unoptimized={isGif}
                onError={() => {
                  console.warn("Image Load Failed:", asset.id);
                  setIsImageError(true);
                }}
              />
            </div>
          ) : (
            /* 에러 났거나 URL이 빈 값일 때 보여줄 Fallback UI (ImageIcon) */
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 opacity-40 z-10">
              <ImageIcon className="text-gray-400" size={32} strokeWidth={1.5} />
            </div>
          )
        )}


        {/* 오직 편집 모드가 아닐 때만 퀵 액션 오버레이 표시 */}
        {!isEditMode && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center gap-2.5 pb-3.5 z-[30] pointer-events-none">
            {asset.page_url && (
              <a
                href={asset.page_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 pointer-events-auto"
                title="바로가기"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); openImageModal(asset); }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110 pointer-events-auto"
              title="상세 보기"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openImageModal(asset); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 pointer-events-auto"
              title="더 보기"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
GalleryCard.displayName = 'GalleryCard';

/* ============================================================
   ListRow (리스트 뷰 스타일)
   ============================================================ */
const ListRow = React.memo(({ asset, onClick, isSelected, onToggleSelect, isEditMode, openImageModal }) => {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border
        ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-surface border-transparent'}`}
    >
      {isEditMode && (
        <div
            onClick={(e) => { e.stopPropagation(); onToggleSelect(asset.id); }}
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border
              ${isSelected ? 'bg-blue-500 border-blue-600 text-white' : 'bg-surface border-border group-hover:border-content/20 text-transparent'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      )}

      <div className="w-12 h-12 rounded-lg bg-surface flex-shrink-0 overflow-hidden border border-border/40 relative">
        {(asset.image_url && asset.image_url.trim() !== "") ? (
          <NextImage
            src={asset.image_url}
            alt={asset.memo || "Thumbnail"}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 opacity-40">
            <ImageIcon className="text-gray-400" size={20} strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold truncate">{asset.memo || asset.page_title || 'Untitled'}</h4>
        <p className="text-[11px] text-contentMuted truncate">{asset.page_url}</p>
      </div>

      <div className="hidden group-hover:flex items-center gap-2">
         {asset.tags && asset.tags.split(',').slice(0, 2).map((t, i) => (
           <span key={i} className="px-2 py-0.5 bg-surface border border-border rounded-md text-[10px] text-contentMuted font-bold uppercase tracking-tighter">{t.trim()}</span>
         ))}
      </div>
    </div>
  );
});
ListRow.displayName = 'ListRow';

/* ============================================================
   BatchTagModal (일괄 태그 수정 모달)
   ============================================================ */
/* ============================================================
   BatchEditModal (프로급 Combobox UX - 데이터 자체 분석형)
   ============================================================ */
const BatchEditModal = ({ isOpen, onClose, selectedAssets, onApply, collections, allTags }) => {
  const [localTags, setLocalTags] = useState([]);
  const [localFolders, setLocalFolders] = useState([]);

  // Analyze tags and collections internally
  const { tagAnalysis, collectionAnalysis } = useMemo(() => {
    if (!selectedAssets || selectedAssets.length === 0) return { tagAnalysis: [], collectionAnalysis: [] };
    const totalSelected = selectedAssets.length;
    
    const tagCounts = {};
    const colCounts = {};

    selectedAssets.forEach(a => {
      const tags = a.tags ? a.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const folders = a.folder ? a.folder.split(',').map(f => f.trim()).filter(Boolean) : [];
      tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      folders.forEach(f => { colCounts[f] = (colCounts[f] || 0) + 1; });
    });

    const ta = Object.entries(tagCounts).map(([tag, count]) => ({ 
      tag, count, isCommon: count === totalSelected, totalCount: totalSelected
    })).sort((a,b) => b.isCommon === a.isCommon ? b.count - a.count : b.isCommon ? -1 : 1);

    const ca = Object.entries(colCounts).map(([folder, count]) => ({ 
      folder, count, isCommon: count === totalSelected, totalCount: totalSelected
    })).sort((a,b) => b.isCommon === a.isCommon ? b.count - a.count : b.isCommon ? -1 : 1);

    return { tagAnalysis: ta, collectionAnalysis: ca };
  }, [selectedAssets]);

  useEffect(() => {
    if (isOpen) {
      setLocalTags(tagAnalysis.map(t => ({ ...t })));
      setLocalFolders(collectionAnalysis.map(c => ({ ...c, tag: c.folder })));
    }
  }, [isOpen, tagAnalysis, collectionAnalysis]);

  const handleAddLocalTag = (val) => {
    let tagName = typeof val === 'string' ? val : (val?.name || val?.tag || '');
    if (!tagName) return;
    const existing = localTags.find(t => t.tag === tagName);
    if (!existing) {
      setLocalTags([...localTags, { tag: tagName, count: 'New', isCommon: true }]);
    } else if (!existing.isCommon) {
      setLocalTags(localTags.map(t => t.tag === tagName ? { ...t, isCommon: true, count: selectedAssets.length } : t));
    }
  };

  const handleAddLocalFolder = (val) => {
    let folderName = typeof val === 'string' ? val : (val?.name || val?.tag || '');
    if (!folderName) return;
    const existing = localFolders.find(f => f.tag === folderName);
    if (!existing) {
      setLocalFolders([...localFolders, { tag: folderName, count: 'New', isCommon: true }]);
    } else if (!existing.isCommon) {
      setLocalFolders(localFolders.map(f => f.tag === folderName ? { ...f, isCommon: true, count: selectedAssets.length } : f));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white/95 dark:bg-[#1C1C1E]/95 border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">Batch Multi-Edit Master</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-contentMuted">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-10 scrollbar-hide">
          <SharedCombobox 
            label="Collection"
            placeholder="Move to folder..."
            allList={collections}
            selectedLocalItems={localFolders}
            onAdd={handleAddLocalFolder}
            onRemove={(tag) => setLocalFolders(localFolders.filter(f => f.tag !== tag))}
            type="folder"
          />

          <SharedCombobox 
            label="Applied Tags"
            placeholder="Assign tags to filtered selection..."
            allList={allTags}
            selectedLocalItems={localTags}
            onAdd={handleAddLocalTag}
            onRemove={(tag) => setLocalTags(localTags.filter(t => t.tag !== tag))}
            type="tag"
          />
        </div>

        <div className="p-8 bg-gray-50/50 dark:bg-white/[0.03] border-t border-gray-100 dark:border-white/5 px-8 pb-10">
          <Button 
            onClick={() => onApply(localTags, localFolders)} 
            className="w-full h-15 rounded-[22px] shadow-2xl shadow-black/10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[15px] hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            Apply Changes to {tagAnalysis[0]?.totalCount || selectedAssets.length} Items
          </Button>
        </div>
      </div>
    </div>
  );
};

export function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { showToast } = useToast();
  const { sendMessageToBackground, getActiveTab } = useExtensionAction();
  const {
    getAssets,
    updateAsset,
    deleteAsset,
    getBookmarks,
    saveBookmark,
    updateBookmark,
    deleteBookmark,
    getCollections,
    saveCollection,
    updateCollection,
    deleteCollection,
    updateCollectionOrder,
    updateAssetStatus,
    getPreferences,    // 통합 추가
    updatePreferences // 통합 추가
  } = useApi();

  const [activeTab, setActiveTab] = useState('home');
  const [activeCollection, setActiveCollection] = useState(null);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('masonry');
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const gridContainerRef = useRef(null);
  const [dragBox, setDragBox] = useState(null);
  const [masonrySize, setMasonrySize] = useState(4); // 메이슨리용 이미지 크기 (기본 4)
  const [gridSize, setGridSize] = useState(6);       // 그리드용 이미지 크기 (기본 6)
  const [initialPreferences, setInitialPreferences] = useState(null); // 서버에서 받아온 초기 설정

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({ memo: '', tags: '', folder: '' });
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  const folderBtnRef = useRef(null);
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [folderDropdownPos, setFolderDropdownPos] = useState({ top: 0, left: 0 });
  const [newFolderName, setNewFolderName] = useState('');

  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalCollections, setOriginalCollections] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const hasFetchedRef = useRef(false); // 무한 루프 방지용 Ref

  // 비로그인 유저 강제 리다이렉트 (인증 아키텍처 구축)
  useEffect(() => {
    if (isLoaded && !userId) {
      window.location.href = '/sign-in';
    }
  }, [isLoaded, userId]);

  const breakpointColumnsObj = useMemo(() => {
    // 현재 모드에 맞는 사이즈 선택
    const currentSize = viewMode === 'masonry' ? masonrySize : gridSize;
    // 1일 때 크게(작은 컬럼), 10일 때 작게(많은 컬럼)
    const baseCols = Math.max(2, Math.floor(11 - currentSize)); 
    return {
      default: baseCols,
      2500: Math.max(2, baseCols + 2),
      1920: Math.max(2, baseCols + 1),
      1440: Math.max(2, baseCols),
      1100: Math.max(2, Math.floor(baseCols * 0.8)),
      700: 2,
      500: 1
    };
  }, [viewMode, masonrySize, gridSize]);
  const [isColSearching, setIsColSearching] = useState(false);
  const [colSearchQuery, setColSearchQuery] = useState('');

  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bmForm, setBmForm] = useState({ name: '', url: '', color: '#ffffff', scale: 1.0, offset_x: 0, offset_y: 0, isTransparent: false });
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const masonryRef = useRef(null);



  // 서버 설정 로드 시 로컬 상태와 동기화
  useEffect(() => {
    if (initialPreferences) {
      if (initialPreferences.view_mode) setViewMode(initialPreferences.view_mode);
      if (initialPreferences.masonry_size) setMasonrySize(Number(initialPreferences.masonry_size));
      if (initialPreferences.grid_size) setGridSize(Number(initialPreferences.grid_size));
      // 초기화 시에는 더티 플래그를 false로 유지
      setIsDirty(false);
    }
  }, [initialPreferences]);



  const fetchData = useCallback(async () => {
    // If Clerk is loaded but no userId, it means not authenticated or still initializing
    if (!isLoaded) return;
    if (!userId) {
      console.log("Dashboard: No userId found, skipping fetch.");
      setLoading(false);
      return;
    }

    try {
      console.log("Dashboard: Fetching data for user", userId);
      setLoading(true);
      const [assetList, bookmarkList, collectionList, preferences] = await Promise.all([
        getAssets().catch(e => { console.error("Assets fetch error:", e); return []; }),
        getBookmarks().catch(e => { console.error("Bookmarks fetch error:", e); return []; }),
        getCollections().catch(e => { console.error("Collections fetch error:", e); return []; }),
        getPreferences().catch(e => { console.error("Preferences fetch error:", e); return null; })
      ]);
      
      console.log("Dashboard: Data fetched", { 
        assets: assetList?.length, 
        bookmarks: bookmarkList?.length, 
        collections: collectionList?.length,
        preferences: !!preferences
      });

      setAssets(assetList || []);
      setBookmarks(bookmarkList || []);
      setCollections(collectionList || []);
      
      if (preferences) {
        setInitialPreferences(preferences);
      }
    } catch (err) {
      console.error("Dashboard: Fetch failed:", err);
      showToast("데이터를 불러오지 못했습니다. 서버 상태를 확인해주세요.", "error");
      
      // 에러 시에도 기본값 세팅하여 무한 로딩 방지
      setAssets([]);
      setBookmarks([]);
      setCollections([]);
      setMasonrySize(4);
      setGridSize(6);
    } finally {
      console.log("Dashboard: Fetch completed, setting loading to false");
      setLoading(false);
    }
  }, [isLoaded, userId]); 
  // API 함수들을 의존성에서 제거하여 무한 루프 원천 차단

  useEffect(() => { 
    console.log("Auth State Check:", { isLoaded, userId: !!userId, hasFetched: hasFetchedRef.current });
    
    if (isLoaded) {
      if (!userId) {
        // 비로그인 상태일 경우 즉시 로딩 해제
        setLoading(false);
      } else if (!hasFetchedRef.current) {
        console.log("🚀 Dashboard: Starting initial data fetch for authenticated user...");
        hasFetchedRef.current = true;
        fetchData(); 
      }
    }
  }, [isLoaded, userId, fetchData]);

  // chrome.storage logic replaced with safe check or stubbed for web
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const syncCollections = (changes, area) => {
        if (area === 'local' && changes.collections) { fetchData(); }
      };
      chrome.storage.onChanged.addListener(syncCollections);
      return () => chrome.storage.onChanged.removeListener(syncCollections);
    }
  }, [fetchData]);

  const filteredAssets = useMemo(() => {
    let result = assets;
    if (activeTab === 'trash') {
      result = result.filter(a => a.status === 'deleted');
    } else {
      result = result.filter(a => a.status !== 'deleted');
    }

    if (activeTab === 'bookmarks') result = [];
    if (activeTab === 'gallery') result = assets.filter(a => a.status !== 'deleted');
    if (activeCollection) result = result.filter(a => a.folder && a.folder.split(',').map(f => f.trim()).includes(activeCollection));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        (a.memo && a.memo.toLowerCase().includes(q)) || 
        (a.tags && a.tags.toLowerCase().includes(q)) ||
        (a.page_title && a.page_title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [assets, activeTab, activeCollection, searchQuery]);

  // Selection Logic
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const sid = String(id);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }, []);

  const handleGridMouseDown = (e) => {
    if (!isEditMode) return; // 편집 모드일 때만 드래그 선택 시작
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a') || e.target.closest('.gallery-item')) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (mmE) => {
      setDragBox({ x1: startX, y1: startY, x2: mmE.clientX, y2: mmE.clientY, isAlt: mmE.altKey });
      
      const xmin = Math.min(startX, mmE.clientX);
      const xmax = Math.max(startX, mmE.clientX);
      const ymin = Math.min(startY, mmE.clientY);
      const ymax = Math.max(startY, mmE.clientY);

      const newSelected = new Set(mmE.shiftKey ? selectedIds : []);
      const gridItems = document.querySelectorAll('.gallery-item');
      
      gridItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const midY = rect.top + rect.height / 2;
        
        if (midX >= xmin && midX <= xmax && midY >= ymin && midY <= ymax) {
          if (mmE.altKey) newSelected.delete(item.dataset.id);
          else newSelected.add(item.dataset.id);
        }
      });
      setSelectedIds(newSelected);
    };

    const handleMouseUp = () => {
      setDragBox(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Image Modal
  const openImageModal = (asset) => {
    setSelectedAsset(asset);
    setAssetForm({ memo: asset.memo || '', tags: asset.tags || '', folder: asset.folder || '전체' });
    setIsImageModalOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;
    try {
      await updateAsset(selectedAsset.id, assetForm);
      setAssets(assets.map(a => a.id === selectedAsset.id ? { ...a, ...assetForm } : a));
      showToast("변경사항이 저장되었습니다.", "success");
    } catch (err) {
      showToast("저장에 실패했습니다.", "error");
    }
  };

  const handleDeleteAsset = async (id, videoUrl) => {
    if (activeTab === 'trash') {
      if (!window.confirm("영구 삭제하시겠습니까? 복구할 수 없습니다.")) return;
      try {
        await deleteAsset(id, videoUrl);
        setAssets(assets.filter(a => a.id !== id));
        setIsImageModalOpen(false);
        showToast("영구 삭제되었습니다.", "success");
      } catch (err) { showToast("삭제에 실패했습니다.", "error"); }
    } else {
      try {
        await updateAssetStatus(id, 'deleted');
        setAssets(assets.map(a => a.id === id ? { ...a, status: 'deleted' } : a));
        setIsImageModalOpen(false);
        showToast("휴지통으로 이동되었습니다.", "success");
      } catch (err) { showToast("이동에 실패했습니다.", "error"); }
    }
  };

  const handleRestoreAsset = async (id) => {
    try {
      await updateAssetStatus(id, 'active');
      setAssets(assets.map(a => a.id === id ? { ...a, status: 'active' } : a));
      setIsImageModalOpen(false);
      showToast("복구되었습니다.", "success");
    } catch (err) { showToast("복구에 실패했습니다.", "error"); }
  };

  const goToPrevAsset = () => {
    const idx = filteredAssets.findIndex(a => a.id === selectedAsset.id);
    if (idx > 0) openImageModal(filteredAssets[idx - 1]);
  };
  const goToNextAsset = () => {
    const idx = filteredAssets.findIndex(a => a.id === selectedAsset.id);
    if (idx < filteredAssets.length - 1) openImageModal(filteredAssets[idx + 1]);
  };

  // Batch Actions
  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (activeTab === 'trash') {
      if (!window.confirm(`${count}개의 항목을 영구 삭제하시겠습니까?`)) return;
      try {
        await Promise.all(Array.from(selectedIds).map(id => {
          const asset = assets.find(a => String(a.id) === id);
          return deleteAsset(id, asset?.video_url || "");
        }));
        setAssets(assets.filter(a => !selectedIds.has(String(a.id))));
        setSelectedIds(new Set());
        showToast("일괄 삭제되었습니다.", "success");
      } catch (err) { showToast("일부 삭제에 실패했습니다.", "error"); }
    } else {
      if (!window.confirm(`${count}개의 항목을 휴지통으로 이동하시겠습니까?`)) return;
      try {
        await Promise.all(Array.from(selectedIds).map(id => updateAssetStatus(id, 'deleted')));
        setAssets(assets.map(a => selectedIds.has(String(a.id)) ? { ...a, status: 'deleted' } : a));
        setSelectedIds(new Set());
        showToast("휴지통으로 이동되었습니다.", "success");
      } catch (err) { showToast("이동에 실패했습니다.", "error"); }
    }
  };

  const handleBatchRestore = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => updateAssetStatus(id, 'active')));
      setAssets(assets.map(a => selectedIds.has(String(a.id)) ? { ...a, status: 'active' } : a));
      setSelectedIds(new Set());
      showToast("일괄 복구되었습니다.", "success");
    } catch (err) { showToast("복구에 실패했습니다.", "error"); }
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    assets.forEach(a => {
      if (a.tags) a.tags.split(',').forEach(t => tagsSet.add(t.trim()));
    });
    return Array.from(tagsSet).sort();
  }, [assets]);

  const handleApplyBatchEdit = async (finalTagsObject, finalFoldersObject) => {
    try {
      const selectedAssets = assets.filter(a => selectedIds.has(String(a.id)));
      if (selectedAssets.length === 0) return;

      const initialTagSet = new Set();
      const initialFolderSet = new Set();

      selectedAssets.forEach(a => {
        const tags = a.tags ? a.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const folders = a.folder ? a.folder.split(',').map(f => f.trim()).filter(Boolean) : [];
        tags.forEach(t => initialTagSet.add(t));
        folders.forEach(f => initialFolderSet.add(f));
      });

      const initialTags = Array.from(initialTagSet);
      const initialFolders = Array.from(initialFolderSet);

      const finalTags = finalTagsObject.map(t => t.tag);
      const finalFolders = finalFoldersObject.map(f => f.tag);

      const addedTags = finalTags.filter(t => !initialTags.includes(t));
      const removedTags = initialTags.filter(t => !finalTags.includes(t));
      const addedFolders = finalFolders.filter(f => !initialFolders.includes(f));
      const removedFolders = initialFolders.filter(f => !finalFolders.includes(f));

      if (addedTags.length === 0 && removedTags.length === 0 && addedFolders.length === 0 && removedFolders.length === 0) {
        setIsBatchTagModalOpen(false);
        return;
      }

      await Promise.all(Array.from(selectedIds).map(id => {
        const asset = assets.find(a => String(a.id) === id);
        if (!asset) return Promise.resolve();
        
        let tags = asset.tags ? asset.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        tags = tags.filter(t => !removedTags.includes(t));
        addedTags.forEach(t => { if (!tags.includes(t)) tags.push(t); });

        let folders = asset.folder ? asset.folder.split(',').map(f => f.trim()).filter(Boolean) : [];
        folders = folders.filter(f => !removedFolders.includes(f));
        addedFolders.forEach(f => { if (!folders.includes(f)) folders.push(f); });

        return updateAsset(id, { ...asset, tags: tags.join(', '), folder: folders.join(', ') });
      }));

      setIsBatchTagModalOpen(false);
      fetchData();
      showToast("일괄 업데이트가 완료되었습니다.", "success");
    } catch (err) { 
      showToast("업데이트에 실패했습니다.", "error"); 
    }
  };

  // Bookmark Drag-n-Drop
  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newItems = [...bookmarks];
    const draggedItem = newItems.splice(draggedIdx, 1)[0];
    newItems.splice(idx, 0, draggedItem);
    setBookmarks(newItems);
    setDraggedIdx(null);
    try {
      await Promise.all(newItems.map((bm, i) => updateBookmark(bm.id, { ...bm, sort_order: i })));
    } catch (err) { console.error("Reorder failed:", err); }
  };

  const openBookmarkModal = (bm = null) => {
    setEditingBookmark(bm);
    if (bm) {
      setBmForm({
        name: bm.name,
        url: bm.url,
        color: bm.icon_value === 'transparent' ? '#ffffff' : (bm.icon_value || '#ffffff'),
        scale: bm.icon_scale || 1.0,
        offset_x: bm.icon_offset_x || 0,
        offset_y: bm.icon_offset_y || 0,
        isTransparent: bm.icon_value === 'transparent'
      });
    } else {
      setBmForm({ name: '', url: '', color: '#ffffff', scale: 1.0, offset_x: 0, offset_y: 0, isTransparent: false });
    }
    setIsBookmarkModalOpen(true);
  };

  const handleTogglePinCollection = async (col) => {
    try {
      const is_pinned = col.is_pinned === 1 ? 0 : 1;
      await updateCollection(col.id, col.name, is_pinned);
      fetchData();
    } catch (err) { showToast("핀 고정 처리에 실패했습니다.", "error"); }
  };

  const handleSaveWorkspace = async () => {
    try {
      const orderPayload = collections.map((col, index) => ({ ...col, sort_order: index }));
      await updateCollectionOrder(orderPayload);
      
      // 사용자 브라우저 설정(Preferences) 저장 추가
      if (isDirty) {
        const payload = {
          view_mode: viewMode || 'masonry',
          masonry_size: Number(masonrySize) || 4,
          grid_size: Number(gridSize) || 6
        };
        console.log("🛠️ Preferences 최종 저장 요청 페이로드 (Final):", payload);
        
        await updatePreferences(payload);
        setInitialPreferences(payload);
        setIsDirty(false);
      }

      setIsEditMode(false);
      showToast("워크스페이스 설정이 저장되었습니다.", "success");
    } catch (err) { 
      console.error("Save workspace failed:", err);
      showToast("저장에 실패했습니다.", "error"); 
    }
  };

  const handleCancelWorkspace = () => {
    setCollections(originalCollections);
    // 뷰 설정 복구
    if (initialPreferences) {
      if (initialPreferences.view_mode) setViewMode(initialPreferences.view_mode);
      if (initialPreferences.masonry_size) setMasonrySize(Number(initialPreferences.masonry_size));
      if (initialPreferences.grid_size) setGridSize(Number(initialPreferences.grid_size));
    }
    setIsDirty(false);
    setIsEditMode(false);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-content/10 border-t-content rounded-full animate-spin" />
      </div>
    );
  }

  const pinnedCols = collections.filter(c => c.is_pinned === 1);
  const unpinnedCols = collections.filter(c => c.is_pinned !== 1);

  const handleReorderPinned = (newPinned) => setCollections([...newPinned, ...unpinnedCols]);
  const handleReorderUnpinned = (newUnpinned) => setCollections([...pinnedCols, ...newUnpinned]);



  return (
    <div className="h-screen w-full flex bg-background text-content overflow-hidden font-medium">
      {/* Sidebar */}
      <aside className="w-[var(--sidebar-width)] bg-sidebar border-r border-border flex flex-col h-full z-30 shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 p-3 mb-6 bg-surface border border-border rounded-2xl shadow-sm">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8", userButtonTriggerRoot: "focus:shadow-none" } }} />
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold truncate">관리자 계정</span>
              <span className="text-[10px] text-contentMuted font-bold uppercase tracking-widest">무료 플랜</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Home size={16} strokeWidth={1.5} />} label="홈" isSubItem={true} />
            <NavBtn active={activeTab === 'all'} onClick={() => { setActiveTab('all'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Grid size={16} strokeWidth={1.5} />} label="전체 미디어" isSubItem={true} />
          </nav>

          <div className="mt-8 mb-2 px-3">
            <span className="text-sm font-semibold text-content">라이브러리</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'bookmarks'} onClick={() => { setActiveTab('bookmarks'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Bookmark size={16} strokeWidth={1.5} />} label="북마크" isSubItem={true} />
            <NavBtn active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<ImageIcon size={16} strokeWidth={1.5} />} label="갤러리" isSubItem={true} />
            <NavBtn active={activeTab === 'trash'} onClick={() => { setActiveTab('trash'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Trash2 size={16} strokeWidth={1.5} />} label="휴지통" isSubItem={true} />
            <NavBtn icon={<Tag size={16} strokeWidth={1.5} />} label="태그" badge="12" isSubItem={true} />
          </nav>

          <div className="mt-8 mb-2 px-3 py-1 flex items-center justify-between cursor-default transition-all duration-200 rounded-lg">
            <div className="flex items-center justify-between w-full">
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
                  <button onClick={() => setIsColSearching(true)} className="p-1 hover:bg-hover rounded-md transition-colors text-content opacity-60 hover:opacity-100"><Search size={14} /></button>
                )}
                <button onClick={() => setIsCreatingCollection(true)} className="p-1 hover:bg-hover rounded-md transition-colors"><Plus size={14} /></button>
              </div>
            </div>
          </div>
          <div className={`relative group/col-list max-h-[420px] overflow-y-auto scrollbar-hide pr-1 pb-10 transition-all duration-300 ${isEditMode ? 'border border-dashed border-content/10 rounded-2xl p-1 bg-content/[0.01]' : ''}`}>
             <Reorder.Group as="nav" layoutScroll axis="y" values={pinnedCols} onReorder={handleReorderPinned} className="flex flex-col gap-1">
                {pinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase())).map((col) => (
                  <Reorder.Item key={col.id} value={col} dragListener={isEditMode} className="relative rounded-full select-none outline-none">
                    <NavBtn
                      active={activeCollectionId === col.id}
                      onClick={() => { if (isEditMode) return; setActiveCollection(col.name); setActiveCollectionId(col.id); setActiveTab('collection'); }}
                      icon={<Folder size={16} strokeWidth={1.5} />} label={col.name} isSubItem={true}
                      onEdit={() => { setEditingCollection(col); setNewCollectionName(col.name); setIsCreatingCollection(true); }}
                                             onDelete={() => { setCollectionToDelete(col); setIsDeleteModalOpen(true); }}

                      isPinned={col.is_pinned === 1} onTogglePin={() => handleTogglePinCollection(col)} isEditMode={isEditMode}
                    />
                  </Reorder.Item>
                ))}
             </Reorder.Group>
             <Reorder.Group as="nav" layoutScroll axis="y" values={unpinnedCols} onReorder={handleReorderUnpinned} className={`flex flex-col gap-1 ${pinnedCols.length > 0 ? 'mt-3' : ''}`}>
                {unpinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase())).map((col) => (
                  <Reorder.Item key={col.id} value={col} dragListener={isEditMode} className="relative rounded-full select-none outline-none">
                    <NavBtn
                      active={activeCollectionId === col.id}
                      onClick={() => { if (isEditMode) return; setActiveCollection(col.name); setActiveCollectionId(col.id); setActiveTab('collection'); }}
                      icon={<Folder size={16} strokeWidth={1.5} />} label={col.name} isSubItem={true}
                      onEdit={() => { setEditingCollection(col); setNewCollectionName(col.name); setIsCreatingCollection(true); }}
                                             onDelete={() => { setCollectionToDelete(col); setIsDeleteModalOpen(true); }}

                      isPinned={col.is_pinned === 1} onTogglePin={() => handleTogglePinCollection(col)} isEditMode={isEditMode}
                    />
                  </Reorder.Item>
                ))}
             </Reorder.Group>
             {collections.length === 0 && <span className="px-3 py-2 text-[11px] text-content italic">생성된 컬렉션 없음</span>}
             <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
          </div>
        </div>

        <div className="mt-auto border-t border-border p-4">
          <nav className="flex flex-col gap-1">
            <NavBtn icon={<Settings size={16} strokeWidth={1.5} />} label="설정" isSubItem={true} />
            <NavBtn icon={<HelpCircle size={16} strokeWidth={1.5} />} label="도움말 및 지원" isSubItem={true} />
            <button onClick={() => { setOriginalCollections([...collections]); setIsEditMode(true); }} className="w-fit mt-4 px-3 py-1.5 rounded-lg border border-border/50 text-[10px] uppercase tracking-tighter font-black text-contentMuted hover:border-content/30 hover:text-content transition-all opacity-40 hover:opacity-100">Edit Workspace</button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-primary relative overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-20 select-none" onMouseDown={handleGridMouseDown}>
          <div className="px-12 max-w-[1400px] mx-auto animate-slide-up">
            {/* Bookmark Area */}
            <div className="mb-10 flex justify-center">
              <div className="w-full max-w-[600px]">
                <div className="flex flex-wrap gap-2 justify-center">
                  {bookmarks.slice(0, 8).map((bm, idx) => (
                    <div key={bm.id} draggable onDragStart={() => setTimeout(() => handleDragStart(idx), 0)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} onClick={() => window.open(bm.url, '_blank')} onContextMenu={(e) => { e.preventDefault(); openBookmarkModal(bm); }} className={`group flex flex-col items-center gap-1.5 w-[60px] cursor-pointer transition-all ${draggedIdx === idx ? 'opacity-30 scale-95' : 'opacity-100'}`}>
                      <div className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative overflow-hidden pointer-events-none" style={{ backgroundColor: bm.icon_value === 'transparent' ? 'transparent' : (bm.icon_value || 'var(--bg-surface)') }}>
                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=128`} className="w-full h-full object-cover z-10" style={{ transform: `scale(${bm.icon_scale || 1.0}) translate(${bm.icon_offset_x || 0}px, ${bm.icon_offset_y || 0}px)` }} alt={bm.name} />
                        {bm.icon_value !== 'transparent' && <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />}
                      </div>
                      <span className="text-[9px] font-bold text-contentMuted truncate w-full text-center group-hover:text-content transition-colors pointer-events-none">{bm.name}</span>
                    </div>
                  ))}
                  <button onClick={() => openBookmarkModal()} className="w-10 h-10 rounded-full border border-dashed border-border flex items-center justify-center text-contentMuted hover:border-content/30 hover:bg-surface transition-all shrink-0"><Plus size={16} /></button>
                </div>
              </div>
            </div>

            {/* Search Area */}
            <div className="mb-12 flex justify-center">
              <div className="w-full max-w-[600px] relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-contentMuted group-focus-within:text-content transition-colors" size={20} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="디자인 라이브러리 검색..." className="w-full h-14 bg-surface border-2 border-border/50 rounded-2xl pl-14 pr-6 text-[15px] font-medium focus:outline-none focus:border-content/10 focus:ring-4 focus:ring-content/5 transition-all shadow-sm" />
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div onClick={() => { setActiveTab('all'); setSearchQuery(''); setActiveCollection(null); }} className={`px-4 py-2 rounded-xl font-black text-[11px] shadow-lg cursor-pointer transition-all ${!searchQuery && activeTab === 'all' ? 'bg-content text-background scale-105' : 'bg-surface border border-border text-content hover:border-content/20'}`}>전체보기</div>
              {['브랜딩', 'UI 패턴', '아이콘', '영감'].map(tag => (
                <div key={tag} onClick={() => setSearchQuery(tag)} className={`px-4 py-2 border rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${searchQuery === tag ? 'bg-content text-background border-content' : 'bg-surface border-border hover:border-content/20'}`}>{tag}</div>
              ))}
              <button onClick={() => setIsCreatingCollection(true)} className="p-2 hover:bg-surface rounded-xl border border-dashed border-border"><Plus size={14} /></button>
            </div>

            <ControlBar 
              activeTab={activeTab} 
              activeCollection={activeCollection} 
              viewMode={viewMode} 
              setViewMode={(mode) => { 
                setViewMode(mode); 
                if (isEditMode) setIsDirty(true);
              }} 
              viewSize={viewMode === 'masonry' ? masonrySize : gridSize}
              setViewSize={(size) => { 
                if (viewMode === 'masonry') setMasonrySize(size);
                else setGridSize(size);
                if (isEditMode) setIsDirty(true);
              }}
            />

            <div id="gallery-grid-area" className="pb-24 min-h-[500px] select-none">
               {loading ? (
                 <div ref={gridContainerRef}>
                   <div className="mb-8 text-center animate-pulse">
                     <p className="text-sm text-contentMuted font-medium">데이터를 불러오는 중입니다...</p>
                   </div>
                   {viewMode === 'masonry' && (
                     <Masonry 
                        ref={masonryRef} breakpointCols={breakpointColumnsObj} 
                        className="flex gap-3 w-auto" 
                        columnClassName="bg-clip-padding"
                      >
                        {Array(12).fill(null).map((_, idx) => (
                          <GalleryCard key={`skeleton-${idx}`} asset={null} viewMode="masonry" />
                        ))}
                     </Masonry>
                   )}
                 </div>
               ) : (filteredAssets.length > 0) ? (
                 <div ref={gridContainerRef}>
                   {viewMode === 'masonry' && (
                     <Masonry 
                        ref={masonryRef} breakpointCols={breakpointColumnsObj} 
                        className="flex gap-3 w-auto" 
                        columnClassName="bg-clip-padding"
                      >
                        {filteredAssets.map((asset, idx) => (
                          <GalleryCard 
                            key={asset.id} 
                            asset={asset} 
                            onClick={() => { isEditMode ? toggleSelect(asset.id) : openImageModal(asset); }} 
                            isSelected={selectedIds.has(String(asset.id))} 
                            onToggleSelect={toggleSelect} 
                            isEditMode={isEditMode} 
                            viewMode="masonry" 
                            openImageModal={openImageModal} 
                            priority={idx < 10} 
                          />
                        ))}
                     </Masonry>
                   )}
                   {viewMode === 'grid' && (
                     <div 
                        className="grid gap-3"
                        style={{ 
                          gridTemplateColumns: `repeat(${Math.max(2, Math.floor(11 - gridSize))}, minmax(0, 1fr))` 
                        }}
                      >
                        {filteredAssets.map((asset, idx) => (
                           <GalleryCard key={asset.id} asset={asset} onClick={() => { isEditMode ? toggleSelect(asset.id) : openImageModal(asset); }} isSelected={selectedIds.has(String(asset.id))} onToggleSelect={toggleSelect} isEditMode={isEditMode} viewMode="grid" openImageModal={openImageModal} priority={idx < 10} />
                        ))}
                     </div>
                   )}
                   {viewMode === 'list' && (
                     <div className="flex flex-col gap-2">
                       {filteredAssets.map((asset, idx) => (
                         <ListRow key={asset.id} asset={asset} onClick={() => isEditMode ? toggleSelect(asset.id) : openImageModal(asset)} isSelected={selectedIds.has(String(asset.id))} onToggleSelect={toggleSelect} isEditMode={isEditMode} openImageModal={openImageModal} priority={idx < 10} />
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                <div className="py-40 text-center bg-surface/30 border-2 border-dashed border-border rounded-[40px] animate-slide-up">
                  <ImageIcon size={48} className="mx-auto mb-6 text-contentMuted opacity-20" />
                  <h4 className="text-[18px] font-black mb-1">라이브러리가 비어있습니다.</h4>
                  <p className="text-[13px] text-contentMuted">익스텐션을 사용하여 디자인 영감을 수집해보세요.</p>
                  <button onClick={fetchData} className="mt-6 px-4 py-2 bg-surface border border-border rounded-xl text-[12px] font-bold hover:bg-hover transition-colors">새로고침</button>
                </div>
               )}
            </div>
          </div>

          {dragBox && createPortal(
            <div style={{ position: 'fixed', left: Math.min(dragBox.x1, dragBox.x2), top: Math.min(dragBox.y1, dragBox.y2), width: Math.abs(dragBox.x2 - dragBox.x1), height: Math.abs(dragBox.y2 - dragBox.y1), backgroundColor: dragBox.isAlt ? 'rgba(239, 68, 68, 0.07)' : 'rgba(0, 102, 255, 0.08)', border: `1px solid ${dragBox.isAlt ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 102, 255, 0.5)'}`, borderRadius: '4px', pointerEvents: 'none', zIndex: 9999 }} />,
            document.body
          )}

          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center p-1.5 bg-[#1c1c1c]/80 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)] rounded-full z-50 transition-all duration-400 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex items-center gap-3 px-4 text-white/90 font-medium text-[13px] tracking-tight">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[11px] font-bold">{selectedIds.size}</span> Selected
            </div>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <div className="flex gap-1">
              {activeTab === 'trash' && (
                <button className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors" onClick={handleBatchRestore}><RefreshCw size={14} strokeWidth={2} /> Restore</button>
              )}
              <button className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" onClick={() => setIsBatchTagModalOpen(true)}><Tag size={14} strokeWidth={2} /> Tags</button>
              <button className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><Folder size={14} strokeWidth={2} /> Move</button>
              <button className="h-9 px-4 flex items-center gap-2 text-[12px] font-medium text-red-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors" onClick={handleBatchDelete}><LogOut size={14} strokeWidth={2} /> {activeTab === 'trash' ? 'Hard Delete' : 'Delete'}</button>
            </div>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button onClick={() => setSelectedIds(new Set())} className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors mr-0.5"><X size={16} strokeWidth={2} /></button>
          </div>
        </div>
      </main>

      {/* Modals... (omitted for brevity in this mock but should be included) */}
      <AnimatePresence>
        {isCreatingCollection && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-background border border-border w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[18px] font-bold">{editingCollection ? '컬렉션 수정' : '새 컬렉션'}</h2>
                        <button onClick={() => { setIsCreatingCollection(false); setEditingCollection(null); setNewCollectionName(''); }}><X size={20} /></button>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault(); if (isSubmitting || !newCollectionName.trim()) return; setIsSubmitting(true);
                        try {
                            if (editingCollection) await updateCollection(editingCollection.id, newCollectionName.trim());
                            else await saveCollection(newCollectionName.trim());
                            setIsCreatingCollection(false); setEditingCollection(null); setNewCollectionName(''); fetchData();
                        } catch (err) { showToast("실패", "error"); } finally { setIsSubmitting(false); }
                    }}>
                        <input autoFocus value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="컬렉션 이름" className="w-full h-12 px-5 bg-hover rounded-2xl mb-8 outline-none" />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsCreatingCollection(false)} className="flex-1 h-12 rounded-2xl bg-hover">취소</button>
                            <button type="submit" className="flex-1 h-12 rounded-2xl bg-content text-background font-bold">{editingCollection ? '수정' : '생성'}</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Collection Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && collectionToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-gray-200 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8" style={{ color: '#111' }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h2 className="text-[20px] font-bold mb-2">컬렉션 삭제</h2>
                <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                  '<span className="font-bold text-gray-900">{collectionToDelete.name}</span>' 컬렉션을 삭제하시겠습니까?<br/>
                  컬렉션 내 에셋들은 '전체 미디어'에 유지됩니다.
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => { setIsDeleteModalOpen(false); setCollectionToDelete(null); }} className="flex-1 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[14px] font-bold text-gray-600 transition-colors">취소</button>
                  <button 
                    onClick={() => {
                      deleteCollection(collectionToDelete.id).then(() => {
                        showToast("삭제되었습니다.", "success");
                        if (activeCollection === collectionToDelete.name) {
                          setActiveCollection(null);
                          setActiveTab('home');
                        }
                        fetchData();
                        setIsDeleteModalOpen(false);
                        setCollectionToDelete(null);
                      }).catch(() => showToast("삭제에 실패했습니다.", "error"));
                    }}
                    className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-[14px] font-bold text-white transition-all shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    삭제하기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isImageModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 backdrop-blur-md p-6 animate-fade-in shadow-2xl">
          {/* Overlay Click Area */}
          <div className="absolute inset-0" onClick={() => setIsImageModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1C1C1E] rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl border-none">
            
            {/* Left: Image Viewer */}
            <div className="flex-1 bg-gray-50/50 dark:bg-white/[0.02] relative flex items-center justify-center p-4 group/viewer border-none">
              <button 
                onClick={(e) => { e.stopPropagation(); goToPrevAsset(); }} 
                className="absolute left-4 z-20 p-3 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-contentMuted hover:text-content transition-all opacity-0 group-hover/viewer:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                {selectedAsset.video_url ? (
                  <video 
                    src={selectedAsset.video_url} 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg" 
                    controls 
                    autoPlay 
                    loop 
                    muted 
                    onCanPlay={(e) => {
                      const playPromise = e.target.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(error => {
                          if (error.name !== 'AbortError') console.error("Modal video error:", error);
                        });
                      }
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <NextImage
                      src={selectedAsset.image_url}
                      alt={selectedAsset.memo || "Detail Image"}
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); goToNextAsset(); }} 
                className="absolute right-4 z-20 p-3 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-contentMuted hover:text-content transition-all opacity-0 group-hover/viewer:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Right: Info Panel */}
            <div className="w-full md:w-[420px] h-full flex flex-col bg-white dark:bg-[#1C1C1E]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 opacity-80">Information</h3>
                <button 
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-contentMuted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-8 scrollbar-hide">
                {/* Memo */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Memo</label>
                  <textarea 
                    value={assetForm.memo} 
                    onChange={e => setAssetForm({ ...assetForm, memo: e.target.value })} 
                    onBlur={handleUpdateAsset} 
                    placeholder="Capture your thoughts..." 
                    rows={4} 
                    className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 text-[14px] leading-relaxed outline-none resize-none hover:bg-gray-100 dark:hover:bg-white/10 transition-all font-medium border-none focus:ring-0" 
                  />
                </div>

                <SharedCombobox 
                  label="Collection"
                  placeholder="Move to folder..."
                  allList={collections}
                  selectedLocalItems={[{ tag: assetForm.folder || '전체', isCommon: true }]}
                  onAdd={async (val) => {
                    const newFolder = typeof val === 'string' ? val : (val.name || val.tag);
                    setAssetForm(prev => ({ ...prev, folder: newFolder }));
                    try {
                      await updateAsset(selectedAsset.id, { folder: newFolder });
                      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, folder: newFolder } : a));
                      showToast("컬렉션이 변경되었습니다.", "success");
                    } catch (err) { showToast("변경 실패", "error"); }
                  }}
                  onRemove={() => {}} // Single select folder, No removal needed but prop is required
                  type="folder"
                />

                <SharedCombobox 
                  label="Tags"
                  placeholder="Add tags..."
                  allList={allTags}
                  selectedLocalItems={(assetForm.tags || '').split(',').filter(Boolean).map(t => ({ tag: t.trim(), isCommon: true }))}
                  onAdd={async (val) => {
                    const newTag = typeof val === 'string' ? val : (val.name || val.tag);
                    const currentTags = assetForm.tags ? assetForm.tags.split(',').map(t => t.trim()) : [];
                    if (!currentTags.includes(newTag)) {
                      const updatedTags = [...currentTags, newTag].join(',');
                      setAssetForm(prev => ({ ...prev, tags: updatedTags }));
                      try {
                        await updateAsset(selectedAsset.id, { tags: updatedTags });
                        setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, tags: updatedTags } : a));
                      } catch (err) { showToast("태그 추가 실패", "error"); }
                    }
                  }}
                  onRemove={async (tag) => {
                    const updatedTags = assetForm.tags.split(',').filter(t => t.trim() !== tag.trim()).join(',');
                    setAssetForm(prev => ({ ...prev, tags: updatedTags }));
                    try {
                      await updateAsset(selectedAsset.id, { tags: updatedTags });
                      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, tags: updatedTags } : a));
                    } catch (err) { showToast("태그 삭제 실패", "error"); }
                  }}
                  type="tag"
                />

                {/* Source Link */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Source</label>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 group/link hover:bg-gray-100 dark:hover:bg-white/10 transition-all border-none">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate text-content mb-0.5">{selectedAsset.page_title || 'Original Page'}</p>
                      <p className="text-[10px] truncate text-gray-400 opacity-60 tracking-tight font-medium">{selectedAsset.page_url || 'No URL'}</p>
                    </div>
                    {selectedAsset.page_url && (
                      <a href={selectedAsset.page_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-gray-400 hover:text-content hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-gray-50/30 dark:bg-white/[0.02]">
                {activeTab === 'trash' ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleRestoreAsset(selectedAsset.id)} className="flex-1 h-12 rounded-2xl bg-blue-500 text-white font-black text-[13px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Restore</button>
                    <button onClick={() => handleDeleteAsset(selectedAsset.id, selectedAsset.video_url || "")} className="flex-1 h-12 rounded-2xl bg-red-500/10 text-red-500 font-bold text-[13px] hover:bg-red-500/20 transition-all active:scale-95">Delete Permanently</button>
                  </div>
                ) : (
                  <button onClick={() => handleDeleteAsset(selectedAsset.id, selectedAsset.video_url || "")} className="w-full h-12 rounded-2xl bg-red-500/5 text-red-500 font-bold text-[12px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Trash2 size={15} /> Move to Trash
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookmarkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl p-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-[18px] font-bold">{editingBookmark ? '북마크 수정' : '북마크 추가'}</h2>
               <button onClick={() => setIsBookmarkModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               const data = { name: bmForm.name, url: bmForm.url.startsWith('http') ? bmForm.url : `https://${bmForm.url}`, icon_value: bmForm.isTransparent ? 'transparent' : bmForm.color, icon_scale: bmForm.scale, icon_offset_x: bmForm.offset_x, icon_offset_y: bmForm.offset_y, icon_type: 'color' };
               try {
                 if (editingBookmark) await updateBookmark(editingBookmark.id, data);
                 else await saveBookmark(data);
                 setIsBookmarkModalOpen(false); fetchData();
               } catch (err) { showToast("실패", "error"); }
             }}>
               <input value={bmForm.name} onChange={e => setBmForm({ ...bmForm, name: e.target.value })} placeholder="이름" className="w-full h-11 px-4 bg-hover rounded-2xl mb-3 outline-none" required />
               <input value={bmForm.url} onChange={e => setBmForm({ ...bmForm, url: e.target.value })} placeholder="URL" className="w-full h-11 px-4 bg-hover rounded-2xl mb-6 outline-none" required />
               <div className="flex gap-3">
                 <button type="button" onClick={() => setIsBookmarkModalOpen(false)} className="flex-1 h-12 rounded-2xl bg-hover">취소</button>
                 <button type="submit" className="flex-1 h-12 rounded-2xl bg-content text-background font-bold">저장</button>
               </div>
             </form>
          </div>
        </div>
      )}

      <BatchEditModal 
        isOpen={isBatchTagModalOpen} 
        onClose={() => setIsBatchTagModalOpen(false)} 
        selectedAssets={assets.filter(a => selectedIds.has(String(a.id)))}
        onApply={handleApplyBatchEdit}
        collections={collections}
        allTags={allTags}
      />

      {isEditMode && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-[#1c1c1c]/80 backdrop-blur-2xl text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/5">
            <span className="text-[12px] font-bold">워크스페이스 순서 편집 중</span>
            <div className="flex items-center gap-2">
              <button onClick={handleCancelWorkspace} className="px-4 py-2 text-[12px]">Cancel</button>
              <button onClick={handleSaveWorkspace} className="px-6 py-2 bg-white text-black rounded-full text-[12px] font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge, isSubItem, onEdit, onDelete, onTogglePin, isPinned, isEditMode }) {
  const [showOptions, setShowOptions] = useState(false);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const handleToggleOptions = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!showOptions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom, left: rect.right - 128 });
    }
    setShowOptions(!showOptions);
  };

  return (
    <div className={`relative group/nav w-full flex items-center justify-between px-3 ${isSubItem ? 'py-1' : 'py-1.5'} rounded-full ${active ? 'bg-hover text-content' : 'text-content hover:bg-hover'}`}>
      <div onClick={onClick} className={`flex-1 flex items-center gap-3 min-w-0 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}>
        {isEditMode && <GripVertical size={14} className="opacity-40" />}
        <span className="opacity-70 relative">
          {icon}
          {isPinned && <div className="absolute -top-1 -right-1 w-2 h-2 bg-content rounded-full border border-background scale-75" />}
        </span>
        <span className="text-[12px] font-medium truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {badge && <span className="text-[10px] font-black bg-hover px-1.5 py-0.5 rounded-md">{badge}</span>}
        {(onEdit || onDelete || onTogglePin) && (
          <div ref={buttonRef} className="opacity-0 group-hover/nav:opacity-40 hover:!opacity-100 p-1 rounded-md" onClick={handleToggleOptions}>
            <MoreVertical size={14} />
          </div>
        )}
      </div>

      {showOptions && createPortal(
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setShowOptions(false)} />
          <div style={{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, width: '128px' }} className="bg-background border border-border rounded-xl shadow-2xl z-[1001] py-1">
            {onTogglePin && <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-hover flex items-center gap-2" onClick={(e) => { e.stopPropagation(); onTogglePin(); setShowOptions(false); }}>{isPinned ? <PinOff size={12} /> : <Pin size={12} />} {isPinned ? '고정 해제' : '최상단 고정'}</button>}
            {onEdit && <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-hover" onClick={(e) => { e.stopPropagation(); onEdit(); setShowOptions(false); }}>이름 변경</button>}
            {onDelete && <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-red-50 text-red-500" onClick={(e) => { e.stopPropagation(); onDelete(); setShowOptions(false); }}>삭제</button>}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default Dashboard;
