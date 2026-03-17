import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { sendMessageToContentScript, sendMessageToBackground, getActiveTab } = useExtensionAction();
  const { showToast } = useToast();
  const { getAssets, getBookmarks, saveBookmark } = useApi();
  
  const [activeTab, setActiveTab] = useState('gallery');
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📡 Sync token with extension when logged in
  useEffect(() => {
    if (isLoaded && userId) {
      getToken().then(token => {
        if (token) {
          window.dispatchEvent(new CustomEvent('def-login-sync', { 
            detail: { token } 
          }));
        }
      });
    }
  }, [isLoaded, userId, getToken]);

  // Fetch data
  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [assetsData, bookmarksData] = await Promise.all([
            getAssets(),
            getBookmarks()
          ]);
          setAssets(assetsData || []);
          setBookmarks(bookmarksData || []);
        } catch (e) {
          console.error("Fetch error:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [userId, getAssets, getBookmarks]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-content/10 border-t-content rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-background">
        <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mb-8 shadow-minimal dark:shadow-minimal-dark translate-y-[-20%]">
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
    const tab = await getActiveTab();
    if (tab) {
      await sendMessageToContentScript(tab.id, 'start-selection');
    } else {
      showToast("Extension context needed for area capture", "info");
    }
  };

  const handleCaptureVisible = async () => {
    await sendMessageToBackground('capture-visible-tab');
  };

  return (
    <div className="min-h-screen flex bg-background selection:bg-content/10 text-content">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-border flex flex-col sticky top-0 h-screen bg-background/50 backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3">
          <div className="w-6 h-6 bg-content text-background rounded-[5px] flex items-center justify-center shadow-sm">
            <span className="font-black text-[10px] tracking-tighter">DEF</span>
          </div>
          <span className="font-bold text-[16px] tracking-tight">Deference</span>
        </div>

        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-[13px] font-medium ${activeTab === 'gallery' ? 'bg-surface text-content shadow-sm' : 'text-contentMuted hover:text-content hover:bg-surface/50'}`}
          >
            <Grid size={16} />
            Gallery
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-[13px] font-medium ${activeTab === 'bookmarks' ? 'bg-surface text-content shadow-sm' : 'text-contentMuted hover:text-content hover:bg-surface/50'}`}
          >
            <Bookmark size={16} />
            Bookmarks
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <h3 className="text-[11px] font-bold text-contentMuted uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleCaptureArea} className="w-full justify-start gap-2 h-9 text-[12px]">
                <Camera size={14} /> Capture Area
              </Button>
              <Button variant="outline" size="sm" onClick={handleCaptureVisible} className="w-full justify-start gap-2 h-9 text-[12px]">
                <Monitor size={14} /> Visible Screen
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between px-2">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8", userButtonTrigger: "focus:shadow-none" } }} />
            <span className="text-[11px] text-contentMuted font-medium">v1.9 Stable</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-[72px] border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md">
          <h2 className="text-[18px] font-bold tracking-tight capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-contentMuted" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-surface border border-border rounded-full py-1.5 pl-9 pr-4 text-[13px] focus:outline-none focus:ring-1 focus:ring-content/20 w-[200px] transition-all"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-surface/20">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-content/10 border-t-content rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'gallery' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {assets.length > 0 ? assets.map((asset) => (
                    <Card key={asset.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
                      <div className="aspect-[4/3] bg-surface-dark overflow-hidden relative">
                        <img 
                          src={asset.image_url} 
                          alt={asset.memo || "Archive"} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary" className="rounded-full w-8 h-8"><ImageIcon size={14}/></Button>
                          <Button size="icon" variant="secondary" className="rounded-full w-8 h-8"><Plus size={14}/></Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-[12px] font-medium truncate mb-1">{asset.memo || "No memo"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-contentMuted">{asset.tags || "General"}</span>
                          <span className="text-[9px] text-contentMuted opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(asset.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
                      <ImageIcon className="mx-auto mb-4 text-contentMuted opacity-20" size={40} />
                      <p className="text-[14px] text-contentMuted">No assets captured yet.</p>
                      <p className="text-[12px] text-contentMuted mt-1">Start archiving with the extension!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                  {bookmarks.length > 0 ? bookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="flex items-center gap-4 p-4 bg-surface/50 hover:bg-surface border border-border rounded-xl transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-contentMuted group-hover:text-content group-hover:bg-content group-hover:text-background transition-all">
                        <Bookmark size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold truncate tracking-tight">{bookmark.name}</h4>
                        <p className="text-[11px] text-contentMuted truncate">{bookmark.url}</p>
                      </div>
                      <a 
                        href={bookmark.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2.5 rounded-full hover:bg-background text-contentMuted hover:text-content transition-colors"
                      >
                        <LinkIcon size={16} />
                      </a>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                      <Bookmark className="mx-auto mb-4 text-contentMuted opacity-20" size={40} />
                      <p className="text-[14px] text-contentMuted">No bookmarks saved yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
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
