import React, { useState, useEffect, useCallback } from 'react';
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
  Minus,
  RefreshCw
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
    saveBookmark, 
    updateBookmark, 
    updateBookmarkOrder, // 🌟 추가
    deleteBookmark 
  } = useApi();
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [activeCollection, setActiveCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  // 🔖 Bookmark Edit Modal States
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bmForm, setBmForm] = useState({ 
    name: '', url: '', color: '#ffffff', scale: 1.0, 
    isTransparent: true, 
    offset_x: 0, offset_y: 0 // 🌟 미세 조정 좌표 추가
  });

  // 🔃 Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState(null);

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
            <NavBtn active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setActiveCollection(null); }} icon={<Home size={16}/>} label="홈" />
            <NavBtn active={activeTab === 'all'} onClick={() => { setActiveTab('all'); setActiveCollection(null); }} icon={<Grid size={16}/>} label="전체 미디어" />
          </nav>

          <div className="mt-8 mb-2 px-3">
             <span className="text-[10px] font-black text-content uppercase tracking-[0.2em]">라이브러리</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={16}/>} label="갤러리" />
            <NavBtn active={activeTab === 'bookmarks'} onClick={() => setActiveTab('bookmarks')} icon={<Bookmark size={16}/>} label="북마크" />
            <NavBtn icon={<Tag size={16}/>} label="태그" badge="12" />
          </nav>

          <div className="mt-8 mb-2 px-3 flex items-center justify-between">
             <span className="text-[10px] font-black text-content uppercase tracking-[0.2em]">Collections</span>
             <button onClick={() => setIsCreatingCollection(true)} className="p-1 hover:bg-hover rounded-md transition-colors"><Plus size={14}/></button>
          </div>
          <nav className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            {collections.map(col => (
              <NavBtn 
                key={col.id} 
                active={activeCollection === col.name}
                onClick={() => {
                  setActiveCollection(col.name);
                  setActiveTab('collection');
                }}
                icon={<FolderOpen size={16}/>} 
                label={col.name} 
              />
            ))}
            {collections.length === 0 && <span className="px-3 py-2 text-[11px] text-content italic">생성된 컬렉션 없음</span>}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-4 bg-background/30">
          <nav className="flex flex-col gap-1">
            <NavBtn icon={<Settings size={16}/>} label="설정" />
            <NavBtn icon={<HelpCircle size={16}/>} label="도움말 및 지원" />
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
        </div>
      </main>

      {/* MODAL: Create Collection */}
      {isCreatingCollection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-background border border-border w-full max-w-sm rounded-[32px] p-10 shadow-2xl animate-slide-up">
              <h2 className="text-[22px] font-black tracking-tight mb-2">새 컬렉션</h2>
              <p className="text-[13px] text-contentMuted mb-8 font-semibold">아카이브를 깔끔하게 정리해보세요.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newCollectionName.trim()) return;
                try {
                  await saveCollection(newCollectionName.trim());
                  setIsCreatingCollection(false);
                  setNewCollectionName('');
                  fetchData();
                  showToast("컬렉션이 생성되었습니다.", "success");
                } catch(err) { showToast("생성에 실패했습니다.", "error"); }
              }} className="flex flex-col gap-4">
                <div className="relative">
                  <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-contentMuted" size={16}/>
                  <input autoFocus value={newCollectionName} onChange={e=>setNewCollectionName(e.target.value)} type="text" placeholder="예: 컬러 팔레트" className="w-full h-12 pl-12 pr-4 bg-sidebar border-2 border-border rounded-2xl focus:outline-none focus:border-content transition-all text-[14px] font-bold" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreatingCollection(false)} className="flex-1 rounded-2xl border-none hover:bg-sidebar text-[13px] font-bold">취소</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-2xl shadow-lg text-[13px] font-bold">생성하기</Button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: Bookmark Editor */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-background border border-border w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[20px] font-black tracking-tight mb-1">{editingBookmark ? '북마크 수정' : '북마크 추가'}</h2>
                  <p className="text-[12px] text-contentMuted font-semibold">스피드 다이얼 설정을 구성합니다.</p>
                </div>
                {editingBookmark && (
                  <button 
                    onClick={async () => {
                      if (window.confirm("정말 삭제하시겠습니까?")) {
                        try {
                          await deleteBookmark(editingBookmark.id);
                          showToast("삭제되었습니다.", "success");
                          setIsBookmarkModalOpen(false);
                          fetchData();
                        } catch (err) {
                          showToast("삭제에 실패했습니다.", "error");
                        }
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                     <LogOut size={16} className="rotate-180"/>
                  </button>
                )}
              </div>

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
                    showToast("북마크가 수정되었습니다.", "success");
                  } else {
                    await saveBookmark(data);
                    showToast("북마크가 추가되었습니다.", "success");
                  }
                  setIsBookmarkModalOpen(false);
                  fetchData();
                } catch (err) {
                  showToast("저장에 실패했습니다.", "error");
                }
              }} className="flex flex-col gap-4">
                
                {/* 🌟 Real-time Preview Area with Fine Controls */}
                <div className="flex flex-col items-center justify-center p-6 bg-sidebar rounded-2xl border border-dashed border-border mb-2 relative h-52 group/preview">
                   <span className="text-[9px] font-black text-contentMuted uppercase tracking-widest absolute top-4 left-1/2 -translate-x-1/2">미세 조정 및 미리보기</span>
                   
                   {/* Centered Circular Icon Container */}
                   <div 
                      className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-200 border-2 border-border"
                      style={{ backgroundColor: bmForm.isTransparent ? 'transparent' : bmForm.color }}
                   >
                     {bmForm.url ? (
                       <img 
                         src={`https://www.google.com/s2/favicons?domain=${bmForm.url.includes('.') ? (bmForm.url.startsWith('http') ? new URL(bmForm.url).hostname : bmForm.url) : 'google.com'}&sz=128`}
                         className="w-full h-full object-cover z-10"
                         style={{ transform: `scale(${bmForm.scale}) translate(${bmForm.offset_x}px, ${bmForm.offset_y}px)` }}
                         alt="Preview"
                         onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=128'; }}
                       />
                     ) : (
                       <Plus size={24} className="text-contentMuted opacity-20"/>
                     )}
                     {!bmForm.isTransparent && <div className="absolute inset-0 bg-black/5" />}
                   </div>

                   {/* 🕹️ Directional Controls (Pushed to box borders - smaller) */}
                   <button type="button" onClick={() => setBmForm({...bmForm, offset_y: bmForm.offset_y - 0.5})} className="absolute top-10 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border rounded-full shadow-sm hover:bg-surface transition-all z-20">
                     <ChevronUp size={12}/>
                   </button>
                   <button type="button" onClick={() => setBmForm({...bmForm, offset_y: bmForm.offset_y + 0.5})} className="absolute bottom-4 left-1/2 -translate-x-1/2 p-1.5 bg-background border border-border rounded-full shadow-sm hover:bg-surface transition-all z-20">
                     <ChevronDown size={12}/>
                   </button>
                   <button type="button" onClick={() => setBmForm({...bmForm, offset_x: bmForm.offset_x - 0.5})} className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border rounded-full shadow-sm hover:bg-surface transition-all z-20">
                     <ChevronLeft size={12}/>
                   </button>
                   <button type="button" onClick={() => setBmForm({...bmForm, offset_x: bmForm.offset_x + 0.5})} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-background border border-border rounded-full shadow-sm hover:bg-surface transition-all z-20">
                     <ChevronRight size={12}/>
                   </button>

                   {/* 🔄 Reset Button (Extreme Top Right - smaller) */}
                   <button type="button" onClick={() => setBmForm({...bmForm, offset_x: 0, offset_y: 0, scale: 1.0})} className="absolute top-4 right-4 p-1.5 bg-background border border-border rounded-md shadow-sm hover:text-red-500 transition-all z-20" title="초기화">
                     <RefreshCw size={12}/>
                   </button>
                </div>

                {/* 🔍 Zoom Slider (Moved outside the box) */}
                <div className="px-4 py-2 space-y-1.5 mb-2">
                   <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-contentMuted uppercase">Zoom</span>
                     <span className="text-[10px] font-black">{bmForm.scale.toFixed(2)}x</span>
                   </div>
                   <input type="range" min="0.3" max="2.5" step="0.01" value={bmForm.scale} onChange={e=>setBmForm({...bmForm, scale: parseFloat(e.target.value)})} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-content" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-contentMuted uppercase px-1">기본 정보</span>
                  <input value={bmForm.name} onChange={e=>setBmForm({...bmForm, name: e.target.value})} type="text" placeholder="이름 (예: Pinterest)" className="w-full h-11 px-4 bg-sidebar border border-border rounded-xl focus:outline-none focus:border-content transition-all text-[13px] font-bold" required />
                  <input value={bmForm.url} onChange={e=>setBmForm({...bmForm, url: e.target.value})} type="text" placeholder="주소 (예: pinterest.com)" className="w-full h-11 px-4 bg-sidebar border border-border rounded-xl focus:outline-none focus:border-content transition-all text-[13px] font-bold" required />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-contentMuted uppercase">배경 설정</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={bmForm.isTransparent} onChange={e=>setBmForm({...bmForm, isTransparent: e.target.checked})} className="w-4 h-4 accent-content" />
                       <span className="text-[11px] font-bold">투명</span>
                    </label>
                  </div>
                  {!bmForm.isTransparent && (
                    <input type="color" value={bmForm.color} onChange={e=>setBmForm({...bmForm, color: e.target.value})} className="w-full h-10 p-1 bg-sidebar border border-border rounded-xl cursor-pointer" />
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsBookmarkModalOpen(false)} className="flex-1 rounded-2xl border-none hover:bg-sidebar text-[13px] font-bold">취소</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-2xl shadow-lg text-[13px] font-bold">저장하기</Button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-surface text-content shadow-sm border border-border/50' : 'text-content hover:bg-hover'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-accent-main' : 'text-content group-hover:text-content'} transition-colors`}>{icon}</span>
        <span className={`text-[13px] ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
      </div>
      {badge && <span className="text-[10px] font-black bg-hover px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{badge}</span>}
      {active && <div className="w-1.5 h-1.5 rounded-full bg-content animate-fade-in" />}
    </button>
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
