import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2 } from 'lucide-react';

/**
 * FloatingBar: Minimalist icons-only selection bar
 */
export function FloatingBar({
  isEditMode,
  selectedItems = [], // [{id, type, context}]
  onDelete,
  onEditTags,
  onCancel
}) {
  const context = useMemo(() => {
    if (selectedItems.length === 0) return 'gallery';
    return selectedItems[selectedItems.length - 1]?.context || 'gallery';
  }, [selectedItems]);

  if (!isEditMode) return null;

  return (
    <AnimatePresence>
      {selectedItems.length > 0 && (
        <motion.div 
          layout
          initial={{ y: 80, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 80, x: "-50%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000]"
        >
          <div className="flex items-center gap-4 px-4 py-3 bg-neutral-900/90 backdrop-blur-md rounded-full border border-white/10 shadow-2xl ring-1 ring-white/5">
            
            {/* 1. Status Area (Context & Count) */}
            <div className="flex items-center gap-3 pl-2 pr-4 border-r border-white/10">
              <span className="text-[13px] font-bold text-white/70 tracking-tight">
                {context === 'trash' ? 'Trash' : 'Gallery'}
              </span>
              <div className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-blue-500 text-[12px] font-black text-white">
                {selectedItems.length}
              </div>
            </div>

            {/* 2. Action Area (Icon Only) */}
            <div className="flex items-center gap-1">
              <button 
                onClick={onEditTags} 
                title="Edit Tags & Folder"
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Pencil size={18} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={onDelete} 
                title={context === 'trash' ? "Delete Permanently" : "Move to Trash"}
                className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* 3. Exit Area (Close) */}
            <button 
              onClick={onCancel} 
              title="Close Selection"
              className="p-2 ml-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
