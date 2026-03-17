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
  const { isLoaded, userId, getToken } = useAuth(); // Added getToken
  const { sendMessageToContentScript, sendMessageToBackground, getActiveTab } = useExtensionAction();
  const { showToast } = useToast();
  const { saveBookmark } = useApi();

  // 📡 Sync token with extension when logged in
  React.useEffect(() => {
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

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-5 h-5 border-2 border-content/10 border-t-content rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-background">
        <div className="w-14 h-14 bg-surface border border-border rounded-xl flex items-center justify-center mb-6 shadow-minimal dark:shadow-minimal-dark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2 tracking-tight">Deference Archive</h2>
        <p className="text-[13px] text-contentMuted mb-8 max-w-[200px] leading-relaxed">
          Sign in to access your digital collection and capture tools.
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
      setTimeout(() => window.close(), 1200);
    } catch (e) {
      showToast("Failed to save bookmark", "error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background selection:bg-content/10">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-content text-background rounded-[4px] flex items-center justify-center shadow-sm">
            <span className="font-black text-[9px] tracking-tighter">DEF</span>
          </div>
          <span className="font-bold text-[14px] tracking-tight">Deference</span>
        </div>
        <UserButton appearance={{ elements: { avatarBox: "w-7 h-7 border border-border", userButtonTrigger: "focus:shadow-none" } }} />
      </header>

      {/* Main Actions Grid */}
      <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        
        {/* Capture Section */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleCaptureArea}
            className="flex flex-col items-center justify-center gap-3.5 p-5 bg-surface hover:bg-surfaceHover rounded-xl border border-border transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-content group-hover:text-background transition-colors">
              <Camera size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[12px] font-semibold text-content">Capture Area</span>
          </button>
          
          <button 
            onClick={handleCaptureVisible}
            className="flex flex-col items-center justify-center gap-3.5 p-5 bg-surface hover:bg-surfaceHover rounded-xl border border-border transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-content group-hover:text-background transition-colors">
              <Monitor size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[12px] font-semibold text-content">Visible Screen</span>
          </button>
        </div>

        {/* List Actions */}
        <div className="flex flex-col gap-1.5">
          <button 
            onClick={handleBatchSave}
            className="flex items-center gap-4 p-4 bg-transparent hover:bg-surface rounded-lg transition-all group"
          >
            <div className="w-7 h-7 flex items-center justify-center text-contentMuted group-hover:text-content">
              <Layers size={16} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-content">Batch Archive</div>
              <div className="text-[11px] text-contentMuted">Save multiple items</div>
            </div>
          </button>

          <button 
            onClick={handleSaveBookmark}
            className="flex items-center gap-4 p-4 bg-transparent hover:bg-surface rounded-lg transition-all group"
          >
            <div className="w-7 h-7 flex items-center justify-center text-contentMuted group-hover:text-content">
              <Bookmark size={16} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-content">Save Bookmark</div>
              <div className="text-[11px] text-contentMuted">Pin to Speed Dial</div>
            </div>
          </button>

          <button className="flex items-center gap-4 p-4 bg-transparent hover:bg-surface rounded-lg transition-all group">
            <div className="w-7 h-7 flex items-center justify-center text-contentMuted group-hover:text-content">
              <LinkIcon size={16} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-content">Save Link</div>
              <div className="text-[11px] text-contentMuted">Archive current page</div>
            </div>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="p-5 text-center border-t border-border shrink-0">
        <a 
          href="https://deference.work" 
          target="_blank" 
          rel="noreferrer"
          className="text-[11px] font-semibold text-contentMuted hover:text-content transition-colors"
        >
          Open Gallery ↗
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
