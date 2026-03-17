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
  LogOut
} from 'lucide-react';

function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { sendMessageToContentScript, showToast } = useToast();
  const { getActiveTab } = useExtensionAction();
  const { getAssets, getBookmarks, getCollections, saveCollection } = useApi();
  
  const [activeTab, setActiveTab] = useState('home'); // home, all, gallery, bookmarks
  const [assets, setAssets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

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
          The ultimate minimalist design archive and speed dial for dreamers.
        </p>
        <SignInButton mode="modal">
          <Button variant="primary" size="lg" className="px-10 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
            Get Started
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
              <span className="text-[12px] font-bold truncate">Project Admin</span>
              <span className="text-[10px] text-contentMuted font-bold uppercase tracking-widest">Free Plan</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={16}/>} label="Home" />
            <NavBtn active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={<Grid size={16}/>} label="All Media" />
          </nav>

          <div className="mt-8 mb-2 px-3">
             <span className="text-[10px] font-black text-contentMuted uppercase tracking-[0.2em]">Library</span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavBtn active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={16}/>} label="Gallery" />
            <NavBtn active={activeTab === 'bookmarks'} onClick={() => setActiveTab('bookmarks')} icon={<Bookmark size={16}/>} label="Bookmarks" />
            <NavBtn icon={<Tag size={16}/>} label="Tags" badge="12" />
          </nav>

          <div className="mt-8 mb-2 px-3 flex items-center justify-between">
             <span className="text-[10px] font-black text-contentMuted uppercase tracking-[0.2em]">Collections</span>
             <button onClick={() => setIsCreatingCollection(true)} className="p-1 hover:bg-hover rounded-md transition-colors"><Plus size={14}/></button>
          </div>
          <nav className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            {collections.map(col => (
              <NavBtn key={col.id} icon={<FolderOpen size={16}/>} label={col.name} />
            ))}
            {collections.length === 0 && <span className="px-3 py-2 text-[11px] text-contentMuted italic">No collection yet</span>}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-4 bg-background/30">
          <nav className="flex flex-col gap-1">
            <NavBtn icon={<Settings size={16}/>} label="Settings" />
            <NavBtn icon={<HelpCircle size={16}/>} label="Help & Support" />
          </nav>
        </div>
      </aside>

      {/* 🔵 Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-primary relative overflow-hidden">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Header Padding Area (Transparent) */}
          <div className="h-6 sticky top-0 bg-background/95 backdrop-blur-sm z-20" />

          <div className="px-12 max-w-[1400px] mx-auto animate-slide-up">
            
            {/* 1️⃣ Bookmark Area (Speed Dial - Circular Icons) */}
            <div className="mb-12">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[13px] font-black tracking-tight flex items-center gap-2">
                   <Bookmark size={14} className="text-contentMuted"/> Quick Access
                 </h3>
                 <button className="text-[11px] font-bold text-contentMuted hover:text-content">See All</button>
               </div>
               <div className="flex flex-wrap gap-5">
                 {bookmarks.slice(0, 8).map(bm => (
                   <div key={bm.id} className="group flex flex-col items-center gap-2 w-[72px] cursor-pointer">
                     <div className="w-14 h-14 rounded-full bg-surface border border-border shadow-sm flex items-center justify-center group-hover:bg-content group-hover:text-background transition-all duration-300">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=64`}
                          className="w-7 h-7 rounded-[4px] group-hover:invert transition-all"
                          alt={bm.name}
                        />
                     </div>
                     <span className="text-[10px] font-bold text-contentMuted truncate w-full text-center group-hover:text-content transition-colors">{bm.name}</span>
                   </div>
                 ))}
                 <button className="w-14 h-14 rounded-full border border-dashed border-border flex items-center justify-center text-contentMuted hover:border-content/30 hover:bg-surface transition-all">
                    <Plus size={20}/>
                 </button>
               </div>
            </div>

            {/* 2️⃣ Search Area */}
            <div className="mb-12 flex justify-center">
              <div className="w-full max-w-[600px] relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-contentMuted group-focus-within:text-content transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search your design library..." 
                  className="w-full h-14 bg-surface border-2 border-border/50 rounded-2xl pl-14 pr-6 text-[15px] font-medium focus:outline-none focus:border-content/10 focus:ring-4 focus:ring-content/5 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* 3️⃣ Favorites/Folder Suggestion Area */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
               <div className="px-4 py-2 bg-content text-background rounded-xl font-black text-[11px] shadow-lg">FAVORITES</div>
               {['Branding', 'UI Patterns', 'Iconography', 'Inspiration'].map(tag => (
                 <div key={tag} className="px-4 py-2 bg-surface border border-border rounded-xl text-[11px] font-bold hover:border-content/20 cursor-pointer transition-colors">{tag}</div>
               ))}
               <button className="p-2 hover:bg-surface rounded-xl border border-dashed border-border"><Plus size={14}/></button>
            </div>

            {/* 4️⃣ Filter & Sort Bar */}
            <div className="mb-8 flex items-center justify-between py-4 border-b border-border/50">
               <div className="flex items-center gap-6">
                 <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                   <Filter size={14}/> Type: All Media
                 </button>
                 <button className="flex items-center gap-2 text-[12px] font-bold hover:text-contentMuted transition-colors">
                   <ArrowUpDown size={14}/> Newest First
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
              ) : assets.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 [column-fill:_balance]">
                  {assets.map((asset) => (
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
                               <a href={asset.page_url} target="_blank" rel="noreferrer" className="flex-1 bg-white text-black h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase hover:bg-white/90 transition-colors">Open Source</a>
                               <Button size="icon" variant="secondary" className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border-none text-white"><ExternalLink size={14}/></Button>
                            </div>
                         </div>
                       </div>
                       <div className="p-4 border-t border-border/10">
                          <p className="text-[12px] font-bold truncate tracking-tight">{asset.memo || "New Archive"}</p>
                          <div className="flex items-center justify-between mt-2">
                             <div className="px-2 py-0.5 bg-background border border-border rounded-md">
                               <span className="text-[8px] font-black text-contentMuted uppercase">{asset.tags?.split(',')[0] || "GENERAL"}</span>
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
                   <h4 className="text-[18px] font-black mb-1">Your canvas is empty</h4>
                   <p className="text-[13px] text-contentMuted">Capture design inspiration using the extension.</p>
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
              <h2 className="text-[22px] font-black tracking-tight mb-2">New Folder</h2>
              <p className="text-[13px] text-contentMuted mb-8 font-semibold">Organize your archived assets in style.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newCollectionName.trim()) return;
                try {
                  await saveCollection(newCollectionName.trim());
                  setIsCreatingCollection(false);
                  setNewCollectionName('');
                  fetchData();
                  showToast("Collection created", "success");
                } catch(err) { showToast("Failed to create", "error"); }
              }} className="flex flex-col gap-4">
                <div className="relative">
                  <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-contentMuted" size={16}/>
                  <input autoFocus value={newCollectionName} onChange={e=>setNewCollectionName(e.target.value)} type="text" placeholder="e.g., Color Palette" className="w-full h-12 pl-12 pr-4 bg-sidebar border-2 border-border rounded-2xl focus:outline-none focus:border-content transition-all text-[14px] font-bold" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreatingCollection(false)} className="flex-1 rounded-2xl border-none hover:bg-sidebar text-[13px] font-bold">Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-2xl shadow-lg text-[13px] font-bold">Create</Button>
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
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-surface text-content shadow-sm border border-border/50' : 'text-contentMuted hover:text-content hover:bg-hover'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-accent-main' : 'text-contentMuted group-hover:text-content'} transition-colors`}>{icon}</span>
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
