"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus, ArrowUpRight, FolderOpen } from "lucide-react";
import useAssetStore from "@/store/useAssetStore";

// Phase 1: 데이터 구조 강화 (더미 데이터)
const mockAssets = [
  { id: 1, title: "Modern Dashboard UI", heightClass: "h-48", source: "dribbble.com", url: "#" },
  { id: 2, title: "Mobile App Onboarding", heightClass: "h-64", source: "behance.net", url: "#" },
  { id: 3, title: "Brand Identity Guidelines", heightClass: "h-40", source: "pinterest.com", url: "#" },
  { id: 4, title: "E-commerce Product Page", heightClass: "h-72", source: "awwwards.com", url: "#" },
  { id: 5, title: "Typography System", heightClass: "h-32", source: "medium.com", url: "#" },
  { id: 6, title: "Icon Set Design", heightClass: "h-56", source: "figma.com", url: "#" },
  { id: 7, title: "Landing Page Layout", heightClass: "h-60", source: "layers.to", url: "#" },
  { id: 8, title: "User Flow Diagram", heightClass: "h-44", source: "mobbin.com", url: "#" },
  { id: 9, title: "Color Palette Exploration", heightClass: "h-36", source: "adobe.com", url: "#" },
  { id: 10, title: "Auth Flow Screens", heightClass: "h-80", source: "uxdesign.cc", url: "#" },
];

export default function AssetGrid({ customAssets, collectionId }) {
  const assets = useAssetStore((state) => state.assets);
  
  // Use customAssets if provided, otherwise fallback to store or mock
  const currentAssets = customAssets || mockAssets; 

  // Phase 2: Empty State (빈 화면) 렌더링 로직 (유지되되 디자인 정렬)
  if (currentAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-border/50 bg-muted/5">
        <div className="bg-muted/10 p-4 mb-4">
          <FolderOpen className="w-12 h-12 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">아직 수집된 레퍼런스가 없습니다</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          당신의 영감을 이곳에 저장해 보세요. 시작하려면 새로운 레퍼런스를 추가하세요.
        </p>
        <Button size="sm" className="rounded-full shadow-md">
          <Plus className="w-4 h-4 mr-1.5" /> 
          Add Asset
        </Button>
      </div>
    );
  }

  // Phase 3: 올 커스텀 Masonry Grid 및 Hover Overlay 구현
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
      {currentAssets.map((asset) => (
        <div key={asset.id} className="break-inside-avoid mb-3 group relative cursor-pointer overflow-hidden">
          {/* 1. 이미지 플레이스홀더 (Sharp edges) */}
          <div className={`bg-muted/30 w-full flex items-center justify-center ${asset.heightClass} group-hover:scale-105 transition-transform duration-500`}>
            <ImageIcon className="w-8 h-8 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
          </div>

          {/* 2. Hover Overlay Layer (Sharp edges) */}
          <div className="absolute inset-0 bg-black/70 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between">
            {/* Overlay Top: 우상단 + 버튼 (Rounded Full) */}
            <div className="flex justify-end translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
              <Button size="icon-sm" variant="ghost" className="text-white/90 bg-white/10 hover:bg-white/20 hover:text-white rounded-full transition-all">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Overlay Bottom: 좌하단 출처 + 우하단 바로가기 버튼 */}
            <div className="flex items-end justify-between gap-3 overflow-hidden">
              {/* 좌하단 원본출처 텍스트 (Slide up animation) */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/95 truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  {asset.title}
                </p>
                <p className="text-[10px] text-white/60 truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                  {asset.source}
                </p>
              </div>
              
              {/* 우하단 바로가기 버튼 (Rounded Full) */}
              <Button size="icon-sm" variant="ghost" className="text-white/90 bg-white/10 hover:bg-white/20 hover:text-white rounded-full flex-shrink-0 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
