"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import useAssetStore from '@/store/useAssetStore';
import AssetGrid from '@/components/dashboard/AssetGrid';

/**
 * Dynamic Collection View (/collections/[id])
 * Displays a filtered gallery of assets belonging to a specific collection.
 */
export default function CollectionView() {
  const params = useParams();
  const router = useRouter();
  const { collections, boardAssets, fetchBoardAssets, deleteCollection } = useAssetStore();
  
  const board = collections.find(c => c.id === params.id);

  useEffect(() => {
    if (params.id) {
      fetchBoardAssets(params.id);
    }
  }, [params.id, fetchBoardAssets]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{board?.name || 'Loading Collection...'}</h1>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                {boardAssets.length} Items • Saved to Collection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to delete this collection?')) {
                  deleteCollection(board.id);
                  router.push('/profile');
                }
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={18} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <Share2 size={18} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        {/* Reusable Asset Grid with Custom Data */}
        <div className="h-[70vh]">
          <AssetGrid customAssets={boardAssets} collectionId={board?.id} />
        </div>

        {/* Collection Meta Info */}
        {board?.description && (
          <div className="mt-20 pt-8 border-t border-white/5 max-w-2xl">
            <h4 className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-4">Description</h4>
            <p className="text-white/50 text-sm leading-relaxed">{board.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
