"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Maximize2 
} from "lucide-react";
import useAssetStore from "@/store/useAssetStore";

/**
 * AssetDetailModal
 * Behance-Style Floating Layout.
 * Transparent full-screen overlay with a separate Action Card.
 */
export function AssetDetailModal() {
  const selectedAssetId = useAssetStore((state) => state.selectedAssetId);
  const setSelectedAssetId = useAssetStore((state) => state.setSelectedAssetId);

  // (0) Data Fetching
  const { data: currentAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    staleTime: 1000 * 60 * 5,
  });

  const asset = currentAssets?.find((a) => a.id === selectedAssetId) || null;

  // (1) Initial Hydration: URL -> Store (On Mount)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetId = params.get("asset");
    if (assetId) {
      setSelectedAssetId(assetId);
    }
  }, [setSelectedAssetId]);

  // (2) Reactive Sync: Store -> URL (On State Change)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedAssetId) {
      if (params.get("asset") !== selectedAssetId) {
        params.set("asset", selectedAssetId);
        window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      if (params.has("asset")) {
        params.delete("asset");
        const newQuery = params.toString();
        const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [selectedAssetId]);

  // (3) Handle Browser Back/Forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedAssetId(params.get("asset"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setSelectedAssetId]);

  const handleOpenChange = (open) => {
    if (!open) {
      setSelectedAssetId(null);
    }
  };

  if (!selectedAssetId) return null;

  return (
    <Dialog open={!!selectedAssetId} onOpenChange={handleOpenChange}>
      <DialogPortal>
        {/* Custom Darkened Overlay with Heavy Blur */}
        <DialogOverlay className="bg-black/80 backdrop-blur-md" />
        
        {/* Full-Screen Transparent Container */}
        <DialogContent 
          showCloseButton={false} 
          className="!max-w-none !w-screen !h-screen !p-0 !m-0 !top-0 !left-0 !translate-x-0 !translate-y-0 bg-transparent border-none shadow-none ring-0 flex flex-row items-stretch outline-none"
        >
          {/* A11y: Title & Description (Visual-Hidden) */}
          <DialogTitle className="sr-only">에셋 상세 보기</DialogTitle>
          <DialogDescription className="sr-only">에셋 상세 정보 및 다운로드 패널</DialogDescription>

          {/* Left Section: Immersive Image Stage (Click Backdrop to Close) */}
          <div 
            className="flex-1 h-full flex items-center justify-center p-8 cursor-zoom-out animate-in fade-in duration-300 ease-out"
            onClick={() => setSelectedAssetId(null)}
          >
            {asset ? (
              <img
                src={asset.display_url || asset.original_url}
                alt={asset.metadata?.originalName || "Asset"}
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.6)] cursor-default animate-in fade-in zoom-in-[0.98] duration-300 ease-out"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/30">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/5 border-t-white/40" />
              </div>
            )}
          </div>

          {/* Right Section: Separate Floating Card (Shadcn Style) */}
          <div 
            className="w-[400px] shrink-0 bg-background h-[calc(100vh-2rem)] my-4 mr-4 rounded-2xl shadow-2xl border border-border flex flex-col p-8 overflow-y-auto cursor-default animate-in slide-in-from-right-8 fade-in duration-500 ease-out scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-end mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-muted"
                onClick={() => setSelectedAssetId(null)}
              >
                <Maximize2 className="w-4 h-4 rotate-45" />
              </Button>
            </div>

            {/* Header: File Name & Type */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider h-5">
                  {asset?.type?.split('/')?.[1] || 'FILE'}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">에셋 상세 정보</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight leading-tight text-foreground">
                {asset?.metadata?.originalName || asset?.file_key || "이름 없는 파일"}
              </h2>
            </div>

            {/* Action Stack */}
            <div className="grid grid-cols-1 gap-2 mb-10">
              <Button asChild className="w-full font-bold h-12 shadow-md" size="lg">
                <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  원본 고해상도 다운로드
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full font-medium h-12 border-border/60" size="lg">
                <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  새 창에서 원본 보기
                </a>
              </Button>
            </div>

            {/* Metadata (Shadcn Form/Label Style) */}
            <div className="space-y-8 flex-1">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">등록 일자</label>
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span className="text-sm font-semibold">
                    {asset ? new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">파일 규격 및 사양</label>
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20">
                  <Maximize2 className="w-4 h-4 text-primary/60" />
                  <span className="text-sm font-semibold">
                    {asset?.metadata?.dimensions 
                      ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height} px`
                      : asset?.metadata?.size ? `${(asset.metadata.size / 1024 / 1024).toFixed(2)} MB` : "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">시스템 고유 식별자</label>
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 overflow-hidden">
                  <FileText className="w-4 h-4 text-primary/60 shrink-0" />
                  <span className="text-[11px] font-mono text-muted-foreground truncate">
                    {asset?.id || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags (Bottom) */}
            {asset?.tags?.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border/50">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">분류 태그</label>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(t => (
                    <Badge key={t} variant="outline" className="px-3 py-1 text-[11px] font-medium border-border/60 hover:bg-muted transition-colors">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
