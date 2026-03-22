"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import * as Hangul from 'hangul-js';
import SharedCombobox from './ui/SharedCombobox';
import { Button } from './Button';
import { FloatingBar } from './FloatingBar';
import { Card } from './Card';
import { ToastProvider, useToast } from './Toast';
import { useExtensionAction } from '../hooks/useExtensionAction';
import { useApi } from '../hooks/useApi';
import NextImage from 'next/image';
import VideoCard from './VideoCard';
import Masonry from 'react-masonry-css';
import { useSelectionStore } from '../store/useSelectionStore';
import { useWebDragSelect } from '../hooks/useWebDragSelect';
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
  Edit2,
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
const GalleryCard = React.memo(({ asset, onClick, isSelected, isEditMode, viewMode, openImageModal }) => {
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
        className={`gallery-card-inner-box relative w-full rounded-[10px] overflow-hidden bg-gray-100 dark:bg-white/5 transition-shadow duration-300 ${isSelected ? 'ring-2 ring-blue-500/80 shadow-md' : 'border border-border/40'} ${isMasonry ? 'h-auto' : viewMode === 'grid' ? 'aspect-square' : 'aspect-video'}`}
        style={isMasonry && asset.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : {}}
      >
        {/* ✨ Skeleton Background 삭제 (깜빡임 방지) */}
        
        {/* 체크박스: 오직 선택 모드일 때만 렌더링 */}
        {(isEditMode || isSelected) && (
          <div
            className={`absolute top-3 right-3 z-[20] w-5 h-5 rounded-md flex items-center justify-center transition-all pointer-events-none backdrop-blur-md
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


        {/* 오직 선택 모드가 아닐 때만 퀵 액션 오버레이 표시 */}
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
const ListRow = React.memo(({ asset, onClick, isSelected, isEditMode, openImageModal }) => {
  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      data-selectable-id={asset.id}
      data-selectable-type="asset"
      className={`list-row-inner-box group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border
        ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-surface border-transparent'}`}
    >
      {(isEditMode || isSelected) && (
        <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 border
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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
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
    updateCollectionOrder,
    updateStatus,
    updateCollectionsStatus,
    togglePinCollection,
    deleteCollection,
    getPreferences,    // 통합 추가
    updatePreferences // 통합 추가
  } = useApi();

  const [activeTab, setActiveTab] = useState('home');
  const isTrashView = searchParams.get('status') === 'trash' || activeTab === 'trash';
  const [activeCollection, setActiveCollection] = useState(null);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('masonry');
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [trashCollections, setTrashCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const clearSelection = useSelectionStore(state => state.clearSelection);
  const selectedItems = useSelectionStore(state => state.selectedItems);
  const isEditMode = useSelectionStore(state => state.isEditMode);
  const setEditMode = useSelectionStore(state => state.setEditMode);
  const gridContainerRef = useRef(null);
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
  const [originalCollections, setOriginalCollections] = useState([]);
  
  // 💡 삭제 확인 모달 통합 상태
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '삭제하기',
    onConfirm: () => {},
    isDanger: true
  });
  const [isDirty, setIsDirty] = useState(false);

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
      console.log("Dashboard: Fetching data for user", userId, "status:", isTrashView ? 'trash' : 'active');
      setLoading(true);
      const [assetList, bookmarkList, collectionList, trashColList, preferences] = await Promise.all([
        getAssets(isTrashView ? 'trash' : 'active').catch(e => { console.error("Assets fetch error:", e); return []; }),
        getBookmarks().catch(e => { console.error("Bookmarks fetch error:", e); return []; }),
        getCollections('active').catch(e => { console.error("Collections fetch error:", e); return []; }),
        getCollections('trash').catch(e => { console.error("Trash collections fetch error:", e); return []; }),
        getPreferences().catch(e => { console.error("Preferences fetch error:", e); return null; })
      ]);
      
      console.log("Dashboard: Data fetched", { 
        assets: assetList?.length, 
        bookmarks: bookmarkList?.length, 
        collections: collectionList?.length,
        trashCollections: trashColList?.length,
        preferences: !!preferences
      });

      setAssets(assetList || []);
      setBookmarks(bookmarkList || []);
      setCollections(collectionList || []);
      setTrashCollections(trashColList || []);
      
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
      setTrashCollections([]);
      setMasonrySize(4);
      setGridSize(6);
    } finally {
      console.log("Dashboard: Fetch completed, setting loading to false");
      setLoading(false);
    }
  }, [isLoaded, userId, isTrashView, activeTab]); 
  // API 함수들을 의존성에서 제거하여 무한 루프 원천 차단

  useEffect(() => {
    if (isLoaded && userId) {
      fetchData();
    }
  }, [isLoaded, userId, isTrashView, fetchData]);

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
    // 1. 휴지통 뷰일 경우 폴더/탭 필터링 전면 우회
    if (isTrashView) {
      // 검색어(searchQuery)가 있을 때만 휴지통 내 검색 허용, 그 외엔 원본 통과
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return assets.filter(a => 
          (a.memo && a.memo.toLowerCase().includes(q)) || 
          (a.tags && a.tags.toLowerCase().includes(q)) ||
          (a.page_title && a.page_title.toLowerCase().includes(q))
        );
      }
      return assets;
    }

    // 2. 일반 뷰 필터링 로직
    let result = assets.filter(a => a.status !== 'trash');
    
    if (activeTab === 'bookmarks') result = [];
    if (activeTab === 'gallery') {
      // 이미 위에서 status !== 'trash'로 걸러짐
    }
    if (activeCollection) {
      result = result.filter(a => a.folder && a.folder.split(',').map(f => f.trim()).includes(activeCollection));
    }

    // 3. 일반 뷰 검색 필터링
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        (a.memo && a.memo.toLowerCase().includes(q)) || 
        (a.tags && a.tags.toLowerCase().includes(q)) ||
        (a.page_title && a.page_title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [assets, activeTab, activeCollection, searchQuery, isTrashView]);

  // 💡 Marquee Selection (드래그 선택)
  const { handleMouseDown, isDragging, selectionBox } = useWebDragSelect(
    activeTab === 'trash' ? [...trashCollections, ...assets] : filteredAssets,
    'asset', // TODO: Trash에서는 collection도 지원하도록 확장 가능
    isTrashView ? 'trash' : 'gallery',
    isEditMode
  );

  // 💡 View Change Reset
  useEffect(() => {
    clearSelection();
  }, [isTrashView, activeCollectionId, clearSelection]);

  // 💡 전역 단축키 핸들러 (Cmd+A: 전체 선택, ESC: 선택 해제) - TDZ 방지를 위해 선언부 뒤로 이동
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditMode) return; // 💡 편집 모드가 아닐 경우 모든 단축키 동작 차단

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
      if (isInput) return;

      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const allItems = filteredAssets.map(a => ({ id: String(a.id), type: 'asset', context: isTrashView ? 'trash' : 'gallery' }));
        useSelectionStore.getState().setMarqueeSelection(allItems);
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, filteredAssets, isTrashView, clearSelection]);

  // 💡 여백 클릭 시 선택 해제 핸들러 - macOS 표준 (수식어 없을 때만 해제)
  const handleGridAreaMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    if (e.button !== 0) return; // 좌클릭만 허용

    const isItem = e.target.closest('[data-selectable-id]');
    const isUI = e.target.closest('button, input, a, .context-bar');

    // macOS Standard: Cmd/Shift 수식어 없이 순수 배경 클릭 시에만 초기화
    if (!isItem && !isUI && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      clearSelection();
    }
  }, [isEditMode, clearSelection]);
  
  // Image Modal
  const openImageModal = useCallback((asset) => {
    setSelectedAsset(asset);
    setAssetForm({ memo: asset.memo || '', tags: asset.tags || '', folder: asset.folder || '전체' });
    setIsImageModalOpen(true);
  }, []);

  // 💡 Figma-style Item Click 핸들러 (Normal / Meta-Ctrl / Shift) - macOS 표준 알고리즘
  const handleItemClick = useCallback((e, item, index, currentList, type, context) => {
    e.preventDefault();
    e.stopPropagation(); // 드래그 이벤트로의 버블링 철저히 차단

    if (!isEditMode) {
      if (type === 'asset') openImageModal(item);
      return;
    }

    const { selectSingle, toggleSingle, selectRange } = useSelectionStore.getState();

    if (e.shiftKey) {
      // Shift 클릭: 범위 선택 알고리즘 호출
      selectRange(item, currentList, type, context);
    } else if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl 클릭: 개별 토글
      toggleSingle(item, context);
    } else {
      // 일반 클릭: 단일 선택 및 앵커 갱신
      selectSingle(item, context);
    }
  }, [isEditMode, openImageModal]);



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

  const handleDeleteAsset = (id, videoUrl) => {
    if (activeTab === 'trash') {
      setDeleteConfirm({
        isOpen: true,
        title: '영구 삭제',
        description: '이 항목을 영구 삭제하시겠습니까? 복구할 수 없습니다.',
        confirmText: '삭제하기',
        onConfirm: async () => {
          try {
            await deleteAsset(id, videoUrl);
            setAssets(assets.filter(a => a.id !== id));
            setIsImageModalOpen(false);
            showToast("영구 삭제되었습니다.", "success");
          } catch (err) { showToast("삭제에 실패했습니다.", "error"); }
        }
      });
    } else {
      setDeleteConfirm({
        isOpen: true,
        title: '휴지통 이동',
        description: '이 항목을 휴지통으로 이동하시겠습니까?',
        confirmText: '이동하기',
        onConfirm: async () => {
          try {
            await updateStatus('asset', id, 'trash');
            setAssets(assets.map(a => a.id === id ? { ...a, status: 'trash' } : a));
            setIsImageModalOpen(false);
            showToast("휴지통으로 이동되었습니다.", "success");
          } catch (err) { showToast("이동에 실패했습니다.", "error"); }
        }
      });
    }
  };

  const handleRestoreAsset = async (id) => {
    try {
      await updateStatus('asset', id, 'active');
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

  // 💡 Integrated Polymorphic Actions (Zustand 대응)
  const handleIntegratedDelete = async () => {
    if (selectedItems.length === 0) return;
    const count = selectedItems.length;
    const isTrashAction = selectedItems.some(i => i.context === 'trash');

    const config = isTrashAction ? {
      title: '영구 삭제',
      description: `${count}개의 항목을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 D1 데이터베이스에서 즉시 소멸됩니다.`,
      confirmText: '영구 삭제',
      isDanger: true
    } : {
      title: '휴지통 이동',
      description: `${count}개의 항목을 휴지통으로 이동하시겠습니까?`,
      confirmText: '이동하기',
      isDanger: true
    };

    setDeleteConfirm({
      isOpen: true,
      ...config,
      onConfirm: async () => {
        try {
          // Type별 분배 처리
          const assetsToDel = selectedItems.filter(i => i.type === 'asset');
          const colsToDel = selectedItems.filter(i => i.type === 'collection');
          const bookmarksToDel = selectedItems.filter(i => i.type === 'bookmark');

          if (isTrashAction) {
            if (assetsToDel.length > 0) {
              await Promise.all(assetsToDel.map(i => {
                const asset = assets.find(a => String(a.id) === String(i.id));
                return deleteAsset(i.id, asset?.video_url || "");
              }));
              setAssets(prev => prev.filter(a => !assetsToDel.some(i => String(i.id) === String(a.id))));
            }
            if (colsToDel.length > 0) await Promise.all(colsToDel.map(i => deleteCollection(i.id)));
            if (bookmarksToDel.length > 0) await Promise.all(bookmarksToDel.map(i => deleteBookmark(i.id)));
          } else {
            if (assetsToDel.length > 0) await Promise.all(assetsToDel.map(i => updateStatus('asset', i.id, 'trash')));
            if (colsToDel.length > 0) {
              const ids = colsToDel.map(i => Number(i.id));
              await updateCollectionsStatus(ids, 'trash');
              if (ids.includes(activeCollectionId)) {
                setActiveCollection(null);
                setActiveCollectionId(null);
                setActiveTab('home');
              }
            }
            if (bookmarksToDel.length > 0) await Promise.all(bookmarksToDel.map(i => deleteBookmark(i.id)));
          }

          clearSelection();
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.invalidateQueries({ queryKey: ['assets'] });
          setAssets([]); // 💡 UI Refresh 강제 (깜빡임 효과로 상태 변경 인지)
          fetchData();
          showToast(isTrashAction ? "영구 삭제되었습니다." : "휴지통으로 이동되었습니다.", "success");
        } catch (err) {
          showToast("작업 중 오류가 발생했습니다.", "error");
        }
      }
    });
  };

  const handleIntegratedRestore = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const assetsToRestore = selectedItems.filter(i => i.type === 'asset');
      const colsToRestore = selectedItems.filter(i => i.type === 'collection');

      if (assetsToRestore.length > 0) await Promise.all(assetsToRestore.map(i => updateStatus('asset', i.id, 'active')));
      if (colsToRestore.length > 0) await Promise.all(colsToRestore.map(i => updateCollectionStatus(i.id, 'active')));
      
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      clearSelection();
      fetchData();
      showToast("복구되었습니다.", "success");
    } catch (err) {
      showToast("복구 중 오류가 발생했습니다.", "error");
    }
  };

  const handleBatchPin = async () => {
    const cols = selectedItems.filter(i => i.type === 'collection');
    if (cols.length === 0) return;
    try {
      await Promise.all(cols.map(i => togglePinCollection(i.id, 1)));
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      showToast("핀 고정되었습니다.", "success");
      fetchData();
    } catch (err) {
      showToast("핀 고정 실패", "error");
    }
  };

  const handleRenameSelected = () => {
    const col = selectedItems.find(i => i.type === 'collection');
    if (col) {
      const fullCol = collections.find(c => String(c.id) === String(col.id));
      if (fullCol) {
        setEditingCollection(fullCol);
        setNewCollectionName(fullCol.name);
        setIsCreatingCollection(true);
      }
    }
  };

  const handleApplyWorkspace = async () => {
    await handleSaveWorkspace();
    setEditMode(false);
    clearSelection();
  };

  const handleCancelWorkspaceEnhanced = () => {
    handleCancelWorkspace();
    setEditMode(false);
    clearSelection();
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
      const selectedAssets = assets.filter(a => selectedItems.some(i => i.type === 'asset' && String(i.id) === String(a.id)));
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

      await Promise.all(Array.from(selectedItems.filter(i => i.type === 'asset').map(i => i.id)).map(id => {
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
      clearSelection(); // Clear selection
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
      const isPinned = col.is_pinned === 1 ? false : true; // 토글링
      await togglePinCollection(col.id, isPinned);
      
      // React Query 캐시 무효화를 통해 사이드바 리스트 및 핀 아이콘 즉시 갱신
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      
      fetchData(); // 💡 폴더 리스트 즉시 리프레시
      showToast(isPinned ? "컬렉션이 고정되었습니다." : "고정이 해제되었습니다.", "info");
    } catch (err) { 
      showToast("핀 고정 처리에 실패했습니다.", "error"); 
    }
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

      clearSelection();
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
    clearSelection();
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

  const handleDeleteCollection = (folder) => {
    // 💡 대상 폴더가 휴지통에 있는지 판별하는 조건을 status 필드로 엄격하게 분기 (Status-based logic)
    if (folder.status === 'trash') {
      setDeleteConfirm({
        isOpen: true,
        title: '영구 삭제',
        description: `'${folder.name}' 컬렉션을 영구 삭제하시겠습니까? 복구할 수 없습니다.`,
        confirmText: '영구 삭제',
        isDanger: true,
        onConfirm: async () => {
          try {
            await deleteCollection(folder.id);
            showToast("영구 삭제되었습니다.", "success");
            
            if (activeCollectionId === folder.id) {
              setActiveCollection(null);
              setActiveCollectionId(null);
              setActiveTab('home');
            }
            
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            clearSelection();
            fetchData();
          } catch (err) {
            showToast("삭제에 실패했습니다.", "error");
          }
        }
      });
    } else {
      setDeleteConfirm({
        isOpen: true,
        title: '휴지통으로 이동',
        description: `'${folder.name}' 컬렉션을 휴지통으로 이동하시겠습니까?`,
        confirmText: '이동하기',
        isDanger: true,
        onConfirm: async () => {
          try {
            await updateStatus('collection', folder.id, 'trash');
            showToast("휴지통으로 이동되었습니다.", "success");
            
            if (activeCollectionId === folder.id) {
              setActiveCollection(null);
              setActiveCollectionId(null);
              setActiveTab('home');
            }
            
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            clearSelection();
            fetchData();
          } catch (err) {
            showToast("이동에 실패했습니다.", "error");
          }
        }
      });
    }
  };

  console.log("[Debug Tracker] 뷰 상태:", isTrashView ? "Trash" : "Active");
  console.log("[Debug Tracker] API 원본 데이터 (assets.length):", assets.length);
  console.log("[Debug Tracker] 렌더링 직전 데이터 (filteredAssets.length):", filteredAssets.length);

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
            <NavBtn active={activeTab === 'home'} onClick={(e) => { setActiveTab('home'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Home size={16} strokeWidth={1.5} />} label="홈" isSubItem={true} />
            <NavBtn active={activeTab === 'all'} onClick={(e) => { setActiveTab('all'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Grid size={16} strokeWidth={1.5} />} label="전체 미디어" isSubItem={true} />
          </nav>

          <div className="mt-8 mb-2 px-3">
            <span className="text-sm font-semibold text-content">라이브러리</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'bookmarks'} onClick={(e) => { setActiveTab('bookmarks'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Bookmark size={16} strokeWidth={1.5} />} label="북마크" isSubItem={true} />
            <NavBtn active={activeTab === 'gallery'} onClick={(e) => { setActiveTab('gallery'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<ImageIcon size={16} strokeWidth={1.5} />} label="갤러리" isSubItem={true} />
            <NavBtn active={activeTab === 'trash'} onClick={(e) => { setActiveTab('trash'); setActiveCollection(null); setActiveCollectionId(null); }} icon={<Trash2 size={16} strokeWidth={1.5} />} label="휴지통" isSubItem={true} />
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
                  <button onClick={(e) => { setIsColSearching(false); setColSearchQuery(''); }} className="opacity-40 hover:opacity-100">
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
                {pinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase())).map((col, idx) => (
                  <Reorder.Item key={col.id} value={col} dragListener={isEditMode} className="relative rounded-full select-none outline-none" data-selectable-id={col.id} data-selectable-type="collection">
                    <NavBtn
                      active={activeCollectionId === col.id}
                      onClick={(e) => { 
                        const list = pinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase()));
                        handleItemClick(e, col, idx, list, 'collection', 'sidebar');
                        if (!isEditMode) {
                          setActiveCollection(col.name); 
                          setActiveCollectionId(col.id); 
                          setActiveTab('collection'); 
                        }
                      }}
                      icon={<Folder size={16} strokeWidth={1.5} />} label={col.name} isSubItem={true}
                      onEdit={() => { setEditingCollection(col); setNewCollectionName(col.name); setIsCreatingCollection(true); }}
                      onDelete={() => handleDeleteCollection(col)}
                      isPinned={col.is_pinned === 1} onTogglePin={() => handleTogglePinCollection(col)} isEditMode={isEditMode}
                    />
                  </Reorder.Item>
                ))}
             </Reorder.Group>
             <Reorder.Group as="nav" layoutScroll axis="y" values={unpinnedCols} onReorder={handleReorderUnpinned} className={`flex flex-col gap-1 ${pinnedCols.length > 0 ? 'mt-3' : ''}`}>
                {unpinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase())).map((col, idx) => (
                  <Reorder.Item key={col.id} value={col} dragListener={isEditMode} className="relative rounded-full select-none outline-none" data-selectable-id={col.id} data-selectable-type="collection">
                    <NavBtn
                      active={activeCollectionId === col.id}
                      onClick={(e) => { 
                        const list = unpinnedCols.filter(col => col.name.toLowerCase().includes(colSearchQuery.toLowerCase()));
                        handleItemClick(e, col, idx, list, 'collection', 'sidebar');
                        if (!isEditMode) {
                          setActiveCollection(col.name); 
                          setActiveCollectionId(col.id); 
                          setActiveTab('collection'); 
                        }
                      }}
                      icon={<Folder size={16} strokeWidth={1.5} />} label={col.name} isSubItem={true}
                      onEdit={() => { setEditingCollection(col); setNewCollectionName(col.name); setIsCreatingCollection(true); }}
                      onDelete={() => handleDeleteCollection(col)}
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
            <button onClick={(e) => { 
                // 💡 워크스페이스 편집 진입 시 상태 초기화 (SSOT)
                setEditMode(true);
                clearSelection();
                setOriginalCollections([...collections]); 
              }} className="w-fit mt-4 px-3 py-1.5 rounded-lg border border-border/50 text-[10px] uppercase tracking-tighter font-black text-contentMuted hover:border-content/30 hover:text-content transition-all opacity-40 hover:opacity-100">Edit Workspace</button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-primary relative overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-20 select-none min-h-screen" onMouseDown={handleMouseDown}>
          <div className="px-12 max-w-[1400px] mx-auto animate-slide-up">
            {/* Bookmark Area */}
            <div className="mb-10 flex justify-center">
              <div className="w-full max-w-[600px]">
                <div className="flex flex-wrap gap-2 justify-center">
                  {bookmarks.slice(0, 8).map((bm, idx) => (
                    <div key={bm.id} data-selectable-id={bm.id} data-selectable-type="bookmark" draggable onDragStart={() => setTimeout(() => handleDragStart(idx), 0)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} onClick={(e) => { if (isEditMode) return; window.open(bm.url, '_blank'); }} onContextMenu={(e) => { e.preventDefault(); openBookmarkModal(bm); }} className={`group flex flex-col items-center gap-1.5 w-[60px] cursor-pointer transition-all ${draggedIdx === idx ? 'opacity-30 scale-95' : 'opacity-100'} ${selectedItems.some(i => String(i.id) === String(bm.id)) ? 'ring-2 ring-blue-500 rounded-xl bg-blue-500/10' : ''}`}>
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
            <div className="mb-12 flex justify-center" onMouseDown={(e) => e.stopPropagation()}>
              <div className="w-full max-w-[600px] relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-contentMuted group-focus-within:text-content transition-colors" size={20} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="디자인 라이브러리 검색..." className="w-full h-14 bg-surface border-2 border-border/50 rounded-2xl pl-14 pr-6 text-[15px] font-medium focus:outline-none focus:border-content/10 focus:ring-4 focus:ring-content/5 transition-all shadow-sm" />
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8 flex flex-wrap items-center gap-3" onMouseDown={(e) => e.stopPropagation()}>
              <div onClick={(e) => { setActiveTab('all'); setSearchQuery(''); setActiveCollection(null); }} className={`px-4 py-2 rounded-xl font-black text-[11px] shadow-lg cursor-pointer transition-all ${!searchQuery && activeTab === 'all' ? 'bg-content text-background scale-105' : 'bg-surface border border-border text-content hover:border-content/20'}`}>전체보기</div>
              {['브랜딩', 'UI 패턴', '아이콘', '영감'].map(tag => (
                <div key={tag} onClick={() => setSearchQuery(tag)} className={`px-4 py-2 border rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${searchQuery === tag ? 'bg-content text-background border-content' : 'bg-surface border-border hover:border-content/20'}`}>{tag}</div>
              ))}
              <button onClick={() => setIsCreatingCollection(true)} className="p-2 hover:bg-surface rounded-xl border border-dashed border-border"><Plus size={14} /></button>
            </div>

            <div onMouseDown={(e) => e.stopPropagation()}>
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
            </div>

            <div id="gallery-grid-area" className="pb-24 min-h-[500px] select-none">
               {activeTab === 'trash' && trashCollections.length > 0 && !loading && (
                 <div className="mb-12 animate-slide-up">
                   <div className="flex items-center gap-2 mb-6 px-4">
                     <Trash2 size={16} className="text-red-500" />
                     <h3 className="text-[15px] font-black tracking-tight">삭제된 컬렉션</h3>
                     <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-400/10 text-red-500">{trashCollections.length}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 px-2">
                     {trashCollections.map(col => (
                       <div 
                         key={col.id} onMouseDown={(e) => e.stopPropagation()}                          onClick={(e) => handleItemClick(e, col, trashCollections.indexOf(col), trashCollections, "collection", "trash")}
                         className={`group relative aspect-square bg-surface border rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 p-4
                          ${selectedItems.some(i => String(i.id) === String(col.id)) 
                             ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20 shadow-md' 
                             : 'border-border hover:border-red-400/30 hover:bg-red-400/5'}`}
                         data-selectable-id={col.id}
                         data-selectable-type="collection"
                       >
                         <div className={`p-3 rounded-2xl transition-all
                           ${selectedItems.some(i => String(i.id) === String(col.id))
                             ? 'bg-blue-500 text-white shadow-sm'
                             : 'bg-red-400/10 text-red-500 group-hover:bg-red-400/20'}`}>
                           <Folder size={24} strokeWidth={1.5} />
                         </div>
                         <span className="text-[11px] font-bold truncate w-full text-center px-2 text-content">{col.name}</span>
                         
                         {/* Selection Indicator */}
                         {selectedItems.some(i => String(i.id) === String(col.id)) && (
                           <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm scale-110 animate-pulse">
                             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                   
                   <div className="h-[1px] w-full bg-border mt-12 mb-8 mx-auto opacity-50" />
                 </div>
               )}

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
                      <div key={asset.id} onMouseDown={(e) => e.stopPropagation()} data-selectable-id={asset.id} data-selectable-type="asset" className="gallery-item-wrapper break-inside-avoid mb-4">
                        <GalleryCard 
                          asset={asset} 
                          onClick={(e) => { 
                            handleItemClick(e, asset, idx, filteredAssets, 'asset', isTrashView ? 'trash' : 'gallery');
                          }} 
                          isSelected={selectedItems.some(i => String(i.id) === String(asset.id))} 
                          isEditMode={isEditMode} 
                          viewMode="masonry" 
                          openImageModal={openImageModal} 
                          priority={idx < 10} 
                        />
                      </div>
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
                       <div key={asset.id} onMouseDown={(e) => e.stopPropagation()} data-selectable-id={asset.id} data-selectable-type="asset" className="gallery-item-wrapper">
                         <GalleryCard 
                           asset={asset} 
                           onClick={(e) => handleItemClick(e, asset, idx, filteredAssets, 'asset', isTrashView ? 'trash' : 'gallery')} 
                           isSelected={selectedItems.some(i => String(i.id) === String(asset.id))} 
                           isEditMode={isEditMode} 
                           viewMode="grid" 
                           openImageModal={openImageModal} 
                           priority={idx < 10} 
                         />
                       </div>
                    ))}
                 </div>
               )}
               {/* 💡 전역 드래그 박스 Portal (useWebDragSelect 제거됨 - 필요 시 Zustand 기반으로 재구현 가능) */}
               {viewMode === 'list' && (
                 <div className="flex flex-col gap-2">
                   {filteredAssets.map((asset, idx) => (
                     <ListRow 
                       key={asset.id} 
                       asset={asset} 
                       onClick={(e) => handleItemClick(e, asset, idx, filteredAssets, "asset", isTrashView ? "trash" : "gallery")}
                       isSelected={selectedItems.some(i => String(i.id) === String(asset.id))} 
                       isEditMode={isEditMode} 
                       openImageModal={openImageModal} 
                       priority={idx < 10} 
                     />
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




          <style jsx global>{`
            /* 💡 드래그 중인 요소(Real-time highlight) 스타일 */
            .drag-hover .gallery-card-inner-box {
              ring: 2.5px solid #3b82f6 !important;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.4) !important;
              outline: 2px solid #3b82f6 !important;
              outline-offset: -2px;
            }
            .drag-hover.list-row-inner-box {
              background-color: rgba(59, 130, 246, 0.1) !important;
              border-color: rgba(59, 130, 246, 0.4) !important;
            }
          `}</style>

          {/* 🧩 Separated Dedicated Floating Bar Component (Zustand 대응) */}
          <FloatingBar 
            isEditMode={isEditMode}
            selectedItems={selectedItems}
            onDelete={handleIntegratedDelete}
            onEditTags={() => setIsBatchTagModalOpen(true)}
            onCancel={handleCancelWorkspaceEnhanced}
          />
          
          {/* Drag Selection Marquee Box */}
          {isDragging && selectionBox && (
            <div
              className="fixed border border-blue-500 bg-blue-500/20 z-[9999]"
              style={{
                pointerEvents: 'none', // 클릭 방해 방지
                left: selectionBox.left,
                top: selectionBox.top,
                width: selectionBox.width,
                height: selectionBox.height,
              }}
            />
          )}

        </div>
      </main>

      {/* Modals... (omitted for brevity in this mock but should be included) */}
      <AnimatePresence>
        {isCreatingCollection && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-background border border-border w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[18px] font-bold">{editingCollection ? '컬렉션 수정' : '새 컬렉션'}</h2>
                        <button onClick={(e) => { setIsCreatingCollection(false); setEditingCollection(null); setNewCollectionName(''); }}><X size={20} /></button>
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

      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-gray-200 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8" style={{ color: '#111' }}>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-[20px] font-bold mb-2">{deleteConfirm.title || '삭제 확인'}</h2>
                <div className="text-[14px] text-gray-500 mb-8 leading-relaxed whitespace-pre-line">
                  {deleteConfirm.description}
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))} className="flex-1 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[14px] font-bold text-gray-600 transition-colors">취소</button>
                  <button 
                    onClick={async () => {
                      await deleteConfirm.onConfirm();
                      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                    }}
                    className={`flex-1 h-12 rounded-2xl ${deleteConfirm.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-[14px] font-bold text-white transition-all shadow-lg active:scale-95`}
                  >
                    {deleteConfirm.confirmText || '확인'}
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
        selectedAssets={assets.filter(a => selectedItems.some(i => i.type === 'asset' && String(i.id) === String(a.id)))}
        onApply={handleApplyBatchEdit}
        collections={collections}
        allTags={allTags}
      />

      {/* Empty space for layout balance */}
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
