"use client";

import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  LayoutDashboard as Layout, 
  LayoutGrid, 
  List,
  CheckCircle2 as CheckSquare
} from 'lucide-react';

const ControlBar = ({ 
  activeTab, 
  activeCollection, 
  viewMode, 
  setViewMode,
  viewSize,
  setViewSize
}) => {
  // Pill button base style based on minimal specs
  const getBtnClass = (isActive) => `
    flex items-center gap-1.5 h-8 px-3.5 rounded-full border transition-all duration-200 text-[13px] 
    ${isActive 
      ? 'bg-[#111111] border-[#111111] text-white font-medium shadow-sm' 
      : 'bg-white dark:bg-transparent border-[#E0E0E0] dark:border-[#333333] text-[#555555] dark:text-[#888888] hover:bg-[#F5F5F5] dark:hover:bg-[#FFFFFF]/5'
    }
  `;

  const getIconBtnClass = (isActive) => `
    p-1.5 rounded-full border transition-all duration-200 flex items-center justify-center
    ${isActive 
      ? 'bg-[#111111] border-[#111111] text-white shadow-sm scale-105' 
      : 'bg-white dark:bg-transparent border-[#E0E0E0] dark:border-[#333333] text-[#888888] hover:bg-[#F5F5F5] dark:hover:bg-[#FFFFFF]/5 dark:hover:text-[#EDEDED]'
    }
  `;

  const iconProps = {
    size: 14,
    strokeWidth: 1.5
  };

  const ImageIcon = ({ size }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="opacity-40"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );

  return (
    <div className="mb-8 flex items-center justify-between py-2 px-1 bg-transparent border-b border-[#E0E0E0]/30 dark:border-[#333333]/30">
      {/* 🟢 Left Group: Filters & Sorting */}
      <div className="flex items-center gap-3">
        <button className={getBtnClass(false)}>
          <Filter {...iconProps} />
          <span className="text-[#888888] dark:text-[#666666]">유형 :</span> 
          <span className="text-[#333333] dark:text-[#EDEDED] font-medium">{activeTab === 'home' ? '전체' : activeTab === 'gallery' ? '이미지' : activeTab === 'bookmarks' ? '북마크' : activeCollection || '일반'}</span>
        </button>
        
        <button className={getBtnClass(false)}>
          <ArrowUpDown {...iconProps} />
          <span className="text-[#333333] dark:text-[#EDEDED]">최신순</span>
        </button>
      </div>

      {/* 🔵 Right Group: View Layout & Size */}
      <div className="flex items-center gap-6">
        {/* Finder Style Size Slider */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#F5F5F5]/50 dark:bg-white/5 rounded-full border border-[#E0E0E0] dark:border-[#333333]">
          <ImageIcon size={12} />
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="1"
            value={viewSize}
            onChange={(e) => setViewSize(parseInt(e.target.value))}
            className="w-24 h-1 bg-[#E0E0E0] dark:bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#111111] dark:accent-white"
          />
          <ImageIcon size={18} />
        </div>

        {/* View Selection (Masonry, Grid, List) */}
        <div className="flex items-center bg-white dark:bg-transparent p-1 border border-[#E0E0E0] dark:border-[#333333] rounded-full gap-1">
          <button 
            onClick={() => setViewMode('masonry')}
            className={getIconBtnClass(viewMode === 'masonry')}
            title="Masonry View"
          >
            <Layout size={15} strokeWidth={viewMode === 'masonry' ? 2 : 1.5} />
          </button>
          
          <button 
            onClick={() => setViewMode('grid')}
            className={getIconBtnClass(viewMode === 'grid')}
            title="Grid View"
          >
            <LayoutGrid size={15} strokeWidth={viewMode === 'grid' ? 2 : 1.5} />
          </button>
          
          <button 
            onClick={() => setViewMode('list')}
            className={getIconBtnClass(viewMode === 'list')}
            title="List View"
          >
            <List size={15} strokeWidth={viewMode === 'list' ? 2 : 1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
