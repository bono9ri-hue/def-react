import React, { useState, useEffect } from 'react';
import { Scissors, Image as ImageIcon, Video, ExternalLink, RefreshCw, Check, Save, LogIn, Bookmark } from 'lucide-react';

function Popup() {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  // Check login status via storage and background sync
  useEffect(() => {
    const checkLogin = () => {
      chrome.storage.local.get(['def_token'], (result) => {
        if (result.def_token) {
          // Add a basic token validity check (check if it's a valid looking JWT)
          const parts = result.def_token.split('.');
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(atob(parts[1]));
              const isExpired = payload.exp * 1000 < Date.now();
              if (!isExpired) {
                setToken(result.def_token);
                setUserId(true);
                setIsLoaded(true);
                return;
              }
            } catch (e) {
              console.error("Token parse error", e);
            }
          }
        }
        
        // If not found or expired, trigger sync
        chrome.runtime.sendMessage({ action: "SYNC_SESSION" }, (response) => {
          if (response?.success) {
            setToken(response.token);
            setUserId(true);
          } else {
            setUserId(null);
          }
          setIsLoaded(true);
        });
      });
    };
    checkLogin();
  }, []);

  const fetchData = () => {
    if (!token && !userId) return;
    setLoading(true);
    chrome.runtime.sendMessage({ action: "GET_PAGE_DATA" }, (response) => {
      if (response?.status === "success") {
        setData(response.data);
      } else {
        console.warn("Extraction failed:", response?.message);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleAreaCapture = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "START_SELECTION" }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError.message);
        });
        window.close();
      }
    });
  };

  const handleSave = async (item, index) => {
    if (!token) return;
    setSavingId(index);
    const assetData = {
      image_url: item.type === 'image' ? item.url : (item.thumbnail || ''),
      video_url: item.type === 'video' ? item.url : '',
      page_url: data?.url || '',
      memo: data?.title || '',
      og_image: data?.og_image || ''
    };
    chrome.runtime.sendMessage({ action: "SAVE_ASSET", data: assetData, token: token }, (response) => {
      setSavingId(null);
      if (response?.success) {
        setSavedIds(prev => new Set([...prev, index]));
        setTimeout(() => setSavedIds(prev => { const next = new Set(prev); next.delete(index); return next; }), 2000);
      }
    });
  };

  const handleBookmark = async () => {
    if (!token) return;
    const bookmarkData = { 
      image_url: '', 
      video_url: '', 
      page_url: data?.url || '', 
      memo: data?.title || '북마크',
      og_image: data?.og_image || ''
    };
    chrome.runtime.sendMessage({ action: "SAVE_ASSET", data: bookmarkData, token: token }, (response) => {
      if (response?.success) alert("북마크 완료!");
    });
  };


  // Loading State
  if (!isLoaded) return (
    <div style={{ width: '350px', height: '550px', background: '#111' }} className="flex flex-col items-center justify-center text-white gap-4">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium">Deference 연결 중...</p>
    </div>
  );

  // Signed Out View
  if (!userId) {
    return (
      <div style={{ width: '350px', height: '550px', background: '#111' }} className="flex flex-col text-white">
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h1 className="text-lg font-bold tracking-tight">Deference</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-2">
            <LogIn size={32} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-400">웹사이트(deference.work)에서<br />로그인을 완료해주세요.</p>
          </div>
          
          <div className="flex flex-col w-full gap-2">
            <button 
              onClick={() => {
                chrome.tabs.create({ url: "http://localhost:3000/" });
                window.close();
              }}
              className="w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              로그인 시작하기 (Local)
            </button>
            <button 
              onClick={() => {
                chrome.tabs.create({ url: "https://www.deference.work/" });
                window.close();
              }}
              className="w-full py-3 bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              운영 서버 이동
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-600 font-medium">DEFERENCE COLLECTOR v1.0.0</p>
        </div>
      </div>
    );
  }

  // Signed In View
  return (
    <div style={{ width: '350px', height: '550px', background: '#111' }} className="flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Deference</h1>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">BETA</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { chrome.storage.local.remove('def_token'); setUserId(null); }}
            className="text-[10px] text-gray-600 hover:text-gray-400 font-bold"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleAreaCapture} className="flex flex-col items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all font-bold active:scale-[0.98]">
            <Scissors size={20} />
            <span className="text-xs">영역 선택</span>
          </button>
          <button onClick={handleBookmark} className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-bold active:scale-[0.98]">
            <Bookmark size={20} className="text-blue-400" />
            <span className="text-xs">북마크</span>
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">추출된 미디어 ({data?.media?.length || 0})</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
              <RefreshCw size={24} className="animate-spin opacity-50" />
              <p className="text-[10px]">분석 중...</p>
            </div>
          ) : (!data?.media || data.media.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-[#161616] rounded-xl border border-white/5">
              <p className="text-xs">수집 가능한 미디어가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-4">
              {data.media.map((m, i) => (
                <div key={i} className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-black/40">
                    <img 
                      src={m.type === 'video' ? m.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80' : m.url} 
                      className="w-full h-full object-cover" 
                      alt=""
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleSave(m, i)}
                        disabled={savingId === i || savedIds.has(i)}
                        className={`p-3 rounded-full transition-all ${
                          savedIds.has(i) ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-blue-50'
                        }`}
                      >
                        {savingId === i ? <RefreshCw size={18} className="animate-spin" /> : 
                         savedIds.has(i) ? <Check size={18} /> : <Save size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Popup;
