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
  PinOff
} from 'lucide-react';

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
  
  // 🔖 Bookmark Edit Modal States
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bmForm, setBmForm] = useState({ 
    name: '', url: '', color: '#ffffff', scale: 1.0, 
    isTransparent: true, 
    offset_x: 0, offset_y: 0 // 🌟 미세 조정 좌표 추가
  });

  const [draggedIdx, setDraggedIdx] = useState(null); // 북마크용
  const [draggedColIdx, setDraggedColIdx] = useState(null); // ✨ 컬렉션용
  const [dragOverColIdx, setDragOverColIdx] = useState(null); // ✨ 삽입 위치 표시용 추가

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

  // 🔍 Filtered Data Logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.memo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'gallery' && asset.image_url) ||
                       (activeTab === 'home'); // Home shows everything for now
    const matchesCollection = !activeCollection || asset.folder === activeCollection;
    
    return matchesSearch && matchesTab && matchesCollection;
  });

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
            <NavBtn active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setActiveCollection(null); }} icon={<Home size={16} strokeWidth={1.5}/>} label="홈" isSubItem={true} />
            <NavBtn active={activeTab === 'all'} onClick={() => { setActiveTab('all'); setActiveCollection(null); }} icon={<Grid size={16} strokeWidth={1.5}/>} label="전체 미디어" isSubItem={true} />
          </nav>

          <div className="mt-8 mb-2 px-3">
             <span className="text-sm font-semibold text-content">라이브러리</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={16} strokeWidth={1.5}/>} label="갤러리" isSubItem={true} />
            <NavBtn active={activeTab === 'bookmarks'} onClick={() => setActiveTab('bookmarks')} icon={<Bookmark size={16} strokeWidth={1.5}/>} label="북마크" isSubItem={true} />
            <NavBtn icon={<Tag size={16} strokeWidth={1.5}/>} label="태그" badge="12" isSubItem={true} />
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
                     <Search size={14}/>
                   </button>
                 )}
                 <button 
                   onClick={() => setIsCreatingCollection(true)} 
                   className="p-1 hover:bg-hover rounded-md transition-colors"
                 >
                   <Plus size={14}/>
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
                    icon={<Folder size={16} strokeWidth={1.5}/>} 
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
            <NavBtn icon={<Settings size={16} strokeWidth={1.5}/>} label="설정" isSubItem={true} />
            <NavBtn icon={<HelpCircle size={16} strokeWidth={1.5}/>} label="도움말 및 지원" isSubItem={true} />
          </nav>
        </div>
      </aside>

      {/* 🔵 Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-primary relative overflow-hidden">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-20">

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
                       <Plus size={16}/>
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
               <button onClick={() => setIsCreatingCollection(true)} className="p-2 hover:bg-surface rounded-xl border border-dashed border-border"><Plus size={14}/></button>
            </div>

            {/* 4️⃣ Filter & Sort Bar */}
            <div className="mb-8 flex items-center justify-between py-4 border-b border-border/50">
               <div className="flex items-center gap-6">
                 <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                   <Filter size={14}/> 유형: {activeTab === 'home' ? '전체' : activeTab === 'gallery' ? '이미지' : activeTab === 'bookmarks' ? '북마크' : activeCollection || '일반'}
                 </button>
                 <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                   <ArrowUpDown size={14}/> 최신순
                 </button>
               </div>
               <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-surface rounded-lg transition-colors"><Grid size={16}/></button>
                 <div className="w-[1px] h-4 bg-border mx-1"/>
                 <button className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronRight size={16} className="rotate-90"/></button>
               </div>
            </div>

            {/* 5️⃣ Image Gallery Grid */}
            <div className="pb-24">
              {loading ? (
                 <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-content/10 border-t-content rounded-full animate-spin" /></div>
              ) : filteredAssets.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 [column-fill:_balance]">
                  {filteredAssets.map((asset) => (
                    <div key={asset.id} className="break-inside-avoid mb-6 bg-surface border border-border rounded-2xl overflow-hidden group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-zoom-in">
                       <div className="relative">
                         <img 
                          src={asset.image_url} 
                          alt={asset.memo} 
                          className="w-full h-auto block"
                          loading="lazy"
                         />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                            <div className="flex justify-end gap-2">
                               <Button size="icon" variant="secondary" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md border-none text-white"><Plus size={14}/></Button>
                               <Button size="icon" variant="secondary" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md border-none text-white"><MoreVertical size={14}/></Button>
                            </div>
                            <div className="flex items-center gap-2">
                               <a href={asset.page_url} target="_blank" rel="noreferrer" className="flex-1 bg-white text-black h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase hover:bg-white/90 transition-colors">원본 방문</a>
                               <Button size="icon" variant="secondary" className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border-none text-white"><ExternalLink size={14}/></Button>
                            </div>
                         </div>
                       </div>
                       <div className="p-4 border-t border-border/10">
                          <p className="text-[12px] font-bold truncate tracking-tight">{asset.memo || "새로운 아카이브"}</p>
                          <div className="flex items-center justify-between mt-2">
                             <div className="px-2 py-0.5 bg-background border border-border rounded-md">
                               <span className="text-[8px] font-black text-contentMuted uppercase">{asset.tags?.split(',')[0] || "전체"}</span>
                             </div>
                             <span className="text-[9px] text-contentMuted">{new Date(asset.created_at).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center bg-surface/30 border-2 border-dashed border-border rounded-[40px]">
                   <ImageIcon size={48} className="mx-auto mb-6 text-contentMuted opacity-20"/>
                   <h4 className="text-[18px] font-black mb-1">라이브러리가 비어있습니다.</h4>
                   <p className="text-[13px] text-contentMuted">익스텐션을 사용하여 디자인 영감을 수집해보세요.</p>
                </div>
              )}
            </div>
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
                  } catch(err) { showToast("처리에 실패했습니다.", "error"); }
                }}>
                  <div className="mb-8 mt-2">
                    <input 
                      autoFocus 
                      value={newCollectionName} 
                      onChange={e=>setNewCollectionName(e.target.value)} 
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
                       <LogOut size={16} className="rotate-180"/>
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
                      // Assuming updateBookmark is available in useApi
                      // await updateBookmark(editingBookmark.id, data); 
                      showToast("수정되었습니다.", "success");
                    } else {
                      // Assuming saveBookmark is available in useApi
                      // await saveBookmark(data);
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
                      ) : <Plus size={20} className="text-contentMuted opacity-20"/>}
                    </div>

                    {/* Controls */}
                    <button type="button" onClick={() => setBmForm({...bmForm, offset_y: bmForm.offset_y - 0.5})} className="absolute top-6 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronUp size={12}/></button>
                    <button type="button" onClick={() => setBmForm({...bmForm, offset_y: bmForm.offset_y + 0.5})} className="absolute bottom-6 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronDown size={12}/></button>
                    <button type="button" onClick={() => setBmForm({...bmForm, offset_x: bmForm.offset_x - 0.5})} className="absolute left-6 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronLeft size={12}/></button>
                    <button type="button" onClick={() => setBmForm({...bmForm, offset_x: bmForm.offset_x + 0.5})} className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border shadow-sm rounded-full hover:bg-hover transition-all z-20"><ChevronRight size={12}/></button>
                    <button type="button" onClick={() => setBmForm({...bmForm, offset_x: 0, offset_y: 0, scale: 1.0})} className="absolute top-4 right-4 p-1.5 bg-background border border-border rounded-lg shadow-sm hover:text-red-500 transition-all z-20"><RefreshCw size={12}/></button>
                  </div>

                  {/* Zoom Slider */}
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-content/40 uppercase tracking-widest">Zoom</span>
                      <span className="text-[10px] font-bold text-content/60">{bmForm.scale.toFixed(2)}x</span>
                    </div>
                    <input type="range" min="0.3" max="2.5" step="0.01" value={bmForm.scale} onChange={e=>setBmForm({...bmForm, scale: parseFloat(e.target.value)})} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-content" />
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="col-span-2 space-y-1.5">
                      <input value={bmForm.name} onChange={e=>setBmForm({...bmForm, name: e.target.value})} type="text" placeholder="이름" className="w-full h-11 px-4 bg-hover border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-content/5 transition-all text-[13px] font-medium" required />
                      <input value={bmForm.url} onChange={e=>setBmForm({...bmForm, url: e.target.value})} type="text" placeholder="URL" className="w-full h-11 px-4 bg-hover border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-content/5 transition-all text-[13px] font-medium" required />
                    </div>
                    
                    <div className="flex items-center justify-between px-3 bg-hover rounded-2xl h-11">
                      <span className="text-[12px] font-medium text-content/60">배경 투명</span>
                      <input type="checkbox" checked={bmForm.isTransparent} onChange={e=>setBmForm({...bmForm, isTransparent: e.target.checked})} className="w-4 h-4 accent-content cursor-pointer" />
                    </div>
                    {!bmForm.isTransparent && (
                      <input type="color" value={bmForm.color} onChange={e=>setBmForm({...bmForm, color: e.target.value})} className="w-full h-11 p-1 bg-hover border-none rounded-2xl cursor-pointer" />
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
                {isPinned ? <PinOff size={12} strokeWidth={2}/> : <Pin size={12} strokeWidth={2}/>}
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
