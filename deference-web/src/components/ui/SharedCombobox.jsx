import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as Hangul from 'hangul-js';
import { X, Plus, ChevronDown } from 'lucide-react';

/**
 * SharedCombobox: 최고 수준의 UX를 지향하는 공통 콤보박스
 * - 한글 자소 검색 (hangul-js)
 * - 좌우/상하 방향키 네비게이션
 * - 원클릭 새 항목 추가 (+ Add)
 * - 미니멀 Pill 스타일 레이아웃
 */
const SharedCombobox = ({ 
  label, 
  placeholder, 
  allList, 
  selectedLocalItems, 
  onAdd, 
  onRemove,
  type = 'tag', // 'tag' or 'folder'
  maxRecent = 5
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // 필터링 파이프라인 (검색어 유무에 따라 분리)
  const filteredItems = useMemo(() => {
    const term = input.trim().toLowerCase();
    const available = allList.filter(item => {
      const name = typeof item === 'string' ? item : (item.name || item.tag);
      // 교집합(공통 적용) 항목만 제외
      return !selectedLocalItems.find(sl => sl.tag === name && sl.isCommon);
    });

    if (!term) {
      // 입력 전: 최근/기본 항목 노출
      if (type === 'folder') {
        return [...available].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).slice(0, 8);
      }
      return [...available].reverse().slice(0, maxRecent);
    }

    // 입력 중: 전체 데이터를 대상으로 hangul-js 자소 검색
    return available.filter(item => {
      const name = typeof item === 'string' ? item : (item.name || item.tag);
      return Hangul.search(name.toLowerCase(), term) >= 0;
    });
  }, [allList, input, selectedLocalItems, type, maxRecent]);

  const shouldShowAdd = useMemo(() => {
    const term = input.trim();
    if (!term) return false;
    return !allList.find(item => {
      const name = typeof item === 'string' ? item : (item.name || item.tag);
      return name.toLowerCase() === term.toLowerCase();
    });
  }, [allList, input]);

  const suggestions = useMemo(() => {
    const base = shouldShowAdd ? [{ isNew: true, val: input.trim() }, ...filteredItems] : filteredItems;
    return base;
  }, [shouldShowAdd, filteredItems, input]);

  // 키보드 네비게이션 (자동 스크롤)
  useEffect(() => {
    if (showSuggestions && activeIdx >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIdx];
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIdx, showSuggestions]);

  const handleSelect = (item) => {
    onAdd(item.isNew ? item.val : item);
    setInput('');
    setShowSuggestions(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIdx(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      } else if (input.trim()) {
        e.preventDefault();
        handleSelect({ isNew: true, val: input.trim() });
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between ml-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        {type === 'tag' && <span className="text-[9px] text-gray-400 opacity-40">Press Enter</span>}
      </div>

      {/* Selected Items (Pills) */}
      <div className="flex flex-wrap gap-2 min-h-[42px] mb-1">
        {selectedLocalItems.map((item, i) => (
          <div 
            key={i}
            title={item.tag}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all h-fit group/tag border shadow-sm
              ${item.isCommon 
                ? 'bg-white dark:bg-white text-gray-900 border-transparent text-[13px] font-bold' 
                : 'bg-transparent border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-400 text-[13px] font-medium hover:bg-white/10'}`}
          >
            <span className="leading-none shrink-0 truncate max-w-[150px]">{item.tag}</span>
            <button 
              onClick={() => onRemove(item.tag)}
              className={`hover:scale-125 transition-transform ${item.isCommon ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-500'}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {selectedLocalItems.length === 0 && (
          <p className="text-[12px] text-gray-400 italic opacity-50 py-2 ml-1">No items added.</p>
        )}
      </div>

      {/* Input & Suggestions */}
      <div className="relative">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
              setActiveIdx(input.trim() ? 0 : -1);
            }}
            onFocus={() => {
              setShowSuggestions(true);
              setActiveIdx(-1);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-2xl px-5 pr-12 text-[14px] outline-none hover:bg-gray-100 dark:hover:bg-white/10 focus:bg-white dark:focus:bg-white/10 transition-all font-medium border-none focus:ring-0 shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Plus size={16} className={`text-gray-400 transition-transform ${input.trim() ? 'rotate-90 text-blue-500' : ''}`} />
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0) && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <ul ref={listRef} className="flex flex-wrap gap-2 p-4 max-h-[280px] overflow-y-auto scrollbar-hide">
              {suggestions.map((item, idx) => {
                const name = item.isNew ? `+ Add "${item.val}"` : (typeof item === 'string' ? item : (item.name || item.tag));
                const isActive = idx === activeIdx;
                
                return (
                  <li
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className={`inline-flex items-center px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer transition-all duration-200 transform
                      ${item.isNew 
                        ? (isActive ? 'bg-blue-500 text-white scale-105 shadow-lg' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20')
                        : (isActive ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 scale-105 shadow-xl' : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300')
                      }`}
                  >
                    {name}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedCombobox;
