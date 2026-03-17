import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, SignInButton, UserButton } from '@clerk/chrome-extension';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { ToastProvider, useToast } from './components/Toast';
import { useExtensionAction } from './hooks/useExtensionAction';
import { useApi } from './hooks/useApi';
import { 
  Camera, 
  Monitor, 
  Layers, 
  Link as LinkIcon, 
  Bookmark,
  Image as ImageIcon,
  Grid,
  Search,
  Plus,
  FolderOpen,
  MoreVertical,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { sendMessageToContentScript, sendMessageToBackground, getActiveTab } = useExtensionAction();
  const { showToast } = useToast();
  const { getAssets, getBookmarks, getCollections, saveCollection } = useApi();
  
  const [activeTab, setActiveTab] = useState('gallery'); // gallery, bookmarks, collections
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // 📡 Sync token with extension when logged in
  useEffect(() => {
    if (isLoaded && userId) {
      getToken().then(token => {
        if (token) {
          // Dispatch custom event for content.js in this tab
          window.dispatchEvent(new CustomEvent('def-login-sync', { 
            detail: { token } 
          }));
          // Also set in storage for background.js to pick up
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
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, getAssets, getBookmarks, getCollections, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-content/10 border-t-content rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-10 text-center bg-background">
        <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mb-8 shadow-minimal dark:shadow-minimal-dark">
          <div className="w-6 h-6 bg-content rounded-[4px]" />
        </div>
        <h1 className="text-2xl font-bold mb-3 tracking-tight">Deference</h1>
        <p className="text-[14px] text-contentMuted mb-10 max-w-[280px] leading-relaxed">
          Your minimalist archive for design inspiration and bookmarks.
        </p>
        <SignInButton mode="modal">
          <Button variant="primary" size="lg" className="px-8 shadow-lg">
            Sign In to Dashboard
          </Button>
        </SignInButton>
      </div>
    );
  }

  const handleCaptureArea = async () => {
    try {
      const tab = await getActiveTab();
      if (tab) {
        await sendMessageToContentScript(tab.id, 'start-selection');
      } else {
        showToast("Open a website to capture", "info");
      }
    } catch (e) {
      showToast("Extension context not found", "error");
    }
  };

  const handleCaptureVisible = async () => {
    try {
      await sendMessageToBackground('capture-visible-tab');
    } catch (e) {
      showToast("Extension context not found", "error");
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await saveCollection(newCollectionName.trim());
      showToast("Collection created", "success");
      setNewCollectionName('');
      setIsCreatingCollection(false);
      fetchData();
    } catch (e) {
      showToast("Failed to create collection", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-content">
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-border flex flex-col h-screen sticky top-0 bg-background/50 backdrop-blur-xl z-20 shrink-0">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-7 h-7 bg-content text-background rounded-lg flex items-center justify-center shadow-lg">
            <span className="font-black text-[11px] tracking-tighter">DEF</span>
          </div>
          <span className="font-bold text-[18px] tracking-tight">Deference</span>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[14px] font-semibold ${activeTab === 'gallery' ? 'bg-surface text-content shadow-sm border border-border/50' : 'text-contentMuted hover:text-content hover:bg-surface/50'}`}
          >
            <Grid size={18} />
            Gallery
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[14px] font-semibold ${activeTab === 'bookmarks' ? 'bg-surface text-content shadow-sm border border-border/50' : 'text-contentMuted hover:text-content hover:bg-surface/50'}`}
          >
            <Bookmark size={18} />
            Bookmarks
          </button>
          <button 
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[14px] font-semibold ${activeTab === 'collections' ? 'bg-surface text-content shadow-sm border border-border/50' : 'text-contentMuted hover:text-content hover:bg-surface/50'}`}
          >
            <FolderOpen size={18} />
            Collections
          </button>

          <div className="mt-8 mb-2 px-4">
            <h3 className="text-[11px] font-bold text-contentMuted uppercase tracking-widest flex items-center justify-between">
              Quick Capture
            </h3>
          </div>
          <button 
            onClick={handleCaptureArea}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-contentMuted hover:text-content hover:bg-surface/50 transition-all text-left"
          >
            <Camera size={16} />
            Capture Area
          </button>
          <button 
            onClick={handleCaptureVisible}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-contentMuted hover:text-content hover:bg-surface/50 transition-all text-left"
          >
            <Monitor size={16} />
            Visible Screen
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-border bg-surface/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 border-2 border-border", userButtonTriggerRoot: "focus:shadow-none" } }} />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold tracking-tight">Active Plan</span>
                <span className="text-[11px] text-contentMuted font-medium">Free Tier</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen max-w-full overflow-hidden relative">
        <header className="h-[80px] border-b border-border flex items-center justify-between px-10 bg-background/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[20px] font-black tracking-tight capitalize">{activeTab}</h2>
            <div className="w-[1px] h-6 bg-border mx-2" />
            <div className="flex items-center gap-1 text-contentMuted">
              {activeTab === 'gallery' && <span className="text-[13px] font-medium">{assets.length} items</span>}
              {activeTab === 'bookmarks' && <span className="text-[13px] font-medium">{bookmarks.length} saved</span>}
              {activeTab === 'collections' && <span className="text-[13px] font-medium">{collections.length} folders</span>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-contentMuted group-focus-within:text-content transition-colors" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                className="bg-surface border border-border rounded-2xl py-2 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-content/5 w-[240px] transition-all"
              />
            </div>
            {activeTab === 'collections' && (
              <Button size="sm" onClick={() => setIsCreatingCollection(true)} className="gap-2 px-4 rounded-xl">
                <Plus size={16} /> New Folder
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-surface/5 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-content/10 border-t-content rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              {activeTab === 'gallery' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                  {assets.length > 0 ? assets.map((asset) => (
                    <Card key={asset.id} className="group animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden border-none shadow-minimal dark:shadow-minimal-dark hover:shadow-xl transition-all bg-surface">
                      <div className="aspect-[4/5] bg-surface-dark overflow-hidden relative">
                        <img 
                          src={asset.image_url} 
                          alt={asset.memo || "Archive"} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                          <div className="flex justify-end">
                            <Button size="icon" variant="secondary" className="rounded-xl w-9 h-9 bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/20">
                              <MoreVertical size={16}/>
                            </Button>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="secondary" className="flex-1 rounded-xl bg-white text-black border-none text-[11px] font-bold h-8">View</Button>
                             <Button size="icon" variant="secondary" className="rounded-xl w-8 h-8 bg-white/10 backdrop-blur-md border-none text-white"><ExternalLink size={14}/></Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-background/50">
                        <p className="text-[13px] font-bold tracking-tight truncate mb-1">{asset.memo || "Untitled Archive"}</p>
                        <div className="flex items-center justify-between">
                          <div className="px-2 py-0.5 bg-surface border border-border rounded-full flex items-center">
                            <span className="text-[9px] font-bold text-contentMuted uppercase tracking-tighter">{asset.tags || "GENERAL"}</span>
                          </div>
                          <span className="text-[10px] text-contentMuted font-medium">
                            {new Date(asset.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )) : (
                    <div className="col-span-full py-40 text-center border-2 border-dashed border-border rounded-[40px] bg-surface/30">
                      <ImageIcon className="mx-auto mb-6 text-contentMuted opacity-20" size={48} />
                      <h3 className="text-[16px] font-bold mb-2">No items found</h3>
                      <p className="text-[14px] text-contentMuted max-w-[240px] mx-auto leading-relaxed">
                        Start capturing design patterns and inspiration with our extension.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks.length > 0 ? bookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="flex flex-col p-6 bg-surface hover:bg-background border border-border rounded-2xl transition-all group shadow-sm hover:shadow-minimal dark:hover:shadow-minimal-dark">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-contentMuted group-hover:text-content transition-all shadow-sm">
                          <Bookmark size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[15px] font-black truncate tracking-tight">{bookmark.name}</h4>
                          <p className="text-[12px] text-contentMuted truncate">{bookmark.url}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-contentMuted font-bold uppercase tracking-widest">Link</span>
                        <a 
                          href={bookmark.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[12px] font-bold hover:underline"
                        >
                          Visit Page <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-40 text-center border-2 border-dashed border-border rounded-[40px] bg-surface/30">
                      <Bookmark className="mx-auto mb-6 text-contentMuted opacity-20" size={48} />
                      <h3 className="text-[16px] font-bold mb-2">No bookmarks saved</h3>
                      <p className="text-[14px] text-contentMuted max-w-[240px] mx-auto leading-relaxed">
                         Save interesting websites to your minimalist speed dial.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'collections' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {collections.length > 0 ? collections.map((col) => (
                    <div key={col.id} className="bg-surface rounded-2xl p-6 border border-border hover:border-content/20 transition-all cursor-pointer group flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center shadow-sm">
                          <FolderOpen size={20} className="text-contentMuted group-hover:text-content transition-colors" />
                        </div>
                        <ChevronRight size={18} className="text-contentMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-bold tracking-tight mb-1">{col.name}</h4>
                        <p className="text-[12px] text-contentMuted font-medium">0 items</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-40 text-center border-2 border-dashed border-border rounded-[40px] bg-surface/30">
                      <FolderOpen className="mx-auto mb-6 text-contentMuted opacity-20" size={48} />
                      <h3 className="text-[16px] font-bold mb-2">Design Folders</h3>
                      <p className="text-[14px] text-contentMuted max-w-[240px] mx-auto mb-8 leading-relaxed">
                        Organize your captures into meaningful collections.
                      </p>
                      <Button size="sm" onClick={() => setIsCreatingCollection(true)} className="rounded-xl px-6">Create First Folder</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal for Creating Collection */}
      {isCreatingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-background border border-border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <h2 className="text-[20px] font-black tracking-tight mb-2">Create New Folder</h2>
              <p className="text-[13px] text-contentMuted mb-6">Give your collection a clear name to organize your digital assets.</p>
              <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
                <input 
                  autoFocus
                  type="text" 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection Name (e.g., UI Patterns)" 
                  className="bg-surface border border-border rounded-xl py-3 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-content/10 transition-all"
                />
                <div className="flex gap-3 justify-end mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreatingCollection(false)} className="rounded-xl px-6 border-none hover:bg-surface text-[13px] font-bold">Cancel</Button>
                  <Button type="submit" variant="primary" className="rounded-xl px-8 shadow-lg text-[13px] font-bold">Create Folder</Button>
                </div>
              </form>
           </div>
        </div>
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
