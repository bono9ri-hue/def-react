"use client";

import { useEffect, useState } from 'react';
import { useUser, UserButton } from "@clerk/nextjs";
import useAssetStore from "@/store/useAssetStore";
import { LogOut, Settings, LayoutGrid, ChevronRight } from "lucide-react";
import Link from 'next/link';

/**
 * Profile & Boards Index Page
 * Integrates Clerk user data and D1 collection data for a unified management view.
 */
export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { collections, fetchCollections } = useAssetStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL;

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 selection:bg-white/10">
      {/* Header Container */}
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{user?.fullName || 'User Profile'}</h1>
              <p className="text-white/40 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Back to Gallery
            </Link>
            <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Collections Section */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-medium tracking-tight">My Collections</h2>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
              {collections.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="aspect-[4/5] bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 flex flex-col hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden shadow-2xl"
              >
                {/* Thumbnail Grid */}
                <div className="aspect-[4/3] bg-[#141414] rounded-2xl p-2 mb-4 border border-white/5 group-hover:border-white/20 transition-colors overflow-hidden">
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden">
                    {[0, 1, 2, 3].map(i => {
                      const assets = col.preview_assets || [];
                      const asset = assets[i];
                      return (
                        <div key={i} className="bg-white/5 w-full h-full relative">
                          {asset?.thumb_url && <img src={asset.thumb_url} alt="preview" className="w-full h-full object-cover" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                      {col.asset_count || 0} Assets
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <ChevronRight size={14} className="text-white/40" />
                  </div>
                </div>
              </Link>
            ))}

            {/* Empty State / Create Board Suggestion */}
            {collections.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">No boards created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[9px] text-white/10 uppercase tracking-widest font-bold">
          <span>Deference ID: {user?.id.slice(0, 12)}</span>
          <span>Version 1.2.0</span>
        </div>
      </div>
    </div>
  );
}
