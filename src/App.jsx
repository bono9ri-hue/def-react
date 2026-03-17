import React from 'react';
import { useAuth, SignInButton, UserButton } from '@clerk/chrome-extension';
import { Button } from './components/Button';
import { ToastProvider, useToast } from './components/Toast';
import { useExtensionAction } from './hooks/useExtensionAction';
import { useApi } from './hooks/useApi';
import { 
  Camera, 
  Monitor, 
  Layers, 
  Link as LinkIcon, 
  Bookmark 
} from 'lucide-react';

function PopupContent() {
  const { isLoaded, userId } = useAuth();
  const { sendMessageToContentScript, sendMessageToBackground, getActiveTab } = useExtensionAction();
  const { showToast } = useToast();
  const { saveBookmark } = useApi();

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Deference Archive</h2>
        <p className="text-sm text-gray-400 mb-8">
          Sign in to access your digital collection and powerful capture tools.
        </p>
        <SignInButton mode="modal" fallbackRedirectUrl="/">
          <Button variant="primary" className="w-full">
            Sign In to Continue
          </Button>
        </SignInButton>
      </div>
    );
  }

  const handleCaptureArea = async () => {
    const tab = await getActiveTab();
    await sendMessageToContentScript(tab.id, 'start-selection');
    window.close();
  };

  const handleCaptureVisible = async () => {
    await sendMessageToBackground('capture-visible-tab');
    window.close();
  };

  const handleBatchSave = async () => {
    const tab = await getActiveTab();
    await sendMessageToContentScript(tab.id, 'open-batch-save');
    window.close();
  };

  const handleSaveBookmark = async () => {
    try {
      const tab = await getActiveTab();
      showToast("Saving bookmark...", "info");
      
      await saveBookmark({
        name: tab.title,       
        url: tab.url,          
        icon_type: "color",
        icon_value: "transparent", 
        icon_scale: 1.0        
      });
      
      showToast("Bookmark saved! 📌", "success");
      setTimeout(() => window.close(), 1500);
    } catch (e) {
      showToast("Failed to save bookmark", "error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-[#141414]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-extrabold text-[10px] tracking-tighter">DEF</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Deference</span>
        </div>
        <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
      </header>

      {/* Main Actions Grid */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Capture Section */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleCaptureArea}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-[#141414] hover:bg-[#1f1f1f] rounded-2xl border border-white/5 transition-all focus:ring-2 focus:ring-white/20 group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Camera size={20} />
            </div>
            <span className="text-sm font-medium text-gray-200">Capture Area</span>
          </button>
          
          <button 
            onClick={handleCaptureVisible}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-[#141414] hover:bg-[#1f1f1f] rounded-2xl border border-white/5 transition-all focus:ring-2 focus:ring-white/20 group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
              <Monitor size={20} />
            </div>
            <span className="text-sm font-medium text-gray-200">Visible Screen</span>
          </button>
        </div>

        {/* List Actions */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleBatchSave}
            className="flex items-center gap-3 p-4 bg-[#141414] hover:bg-[#1f1f1f] rounded-xl border border-white/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Layers size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">Batch Archive</div>
              <div className="text-xs text-gray-500">Save multiple images/videos</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button 
            onClick={handleSaveBookmark}
            className="flex items-center gap-3 p-4 bg-[#141414] hover:bg-[#1f1f1f] rounded-xl border border-white/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Bookmark size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">Save Bookmark</div>
              <div className="text-xs text-gray-500">Pin to Speed Dial</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-[#141414] hover:bg-[#1f1f1f] rounded-xl border border-white/5 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <LinkIcon size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">Save Link</div>
              <div className="text-xs text-gray-500">Archive current page</div>
            </div>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="p-4 text-center border-t border-white/5 shrink-0">
        <a 
          href="https://deference.work" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs font-medium text-gray-500 hover:text-white transition-colors"
        >
          Open Deference Gallery ↗
        </a>
      </footer>

    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <PopupContent />
    </ToastProvider>
  );
}

export default App;
