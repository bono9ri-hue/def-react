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
 * Responsive Hybrid UI: Desktop Studio Lightbox vs Mobile Peek Drawer (DVH Optimized).
 * Re-architected for absolute positioning stability on mobile.
 */
export function AssetDetailModal() {
  const selectedAssetId = useAssetStore((state) => state.selectedAssetId);
  const setSelectedAssetId = useAssetStore((state) => state.setSelectedAssetId);
  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);

  // (0) Data Fetching
  const { data: currentAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    staleTime: 1000 * 60 * 5,
  });

  const asset = currentAssets?.find((a) => a.id === selectedAssetId) || null;

  // Initial Sync from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetId = params.get("asset");
    if (assetId) {
      setSelectedAssetId(assetId);
    }
  }, [setSelectedAssetId]);

  // Reactive Sync to URL
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

  // Handle Browser Back/Forward
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
      setIsMobileExpanded(false);
    }
  };

  if (!selectedAssetId) return null;

  return (
    <Dialog open={!!selectedAssetId} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-transparent backdrop-blur-none" />
        
        {/* Full-Screen Stage (Coordinate Parent) */}
        <DialogContent 
          showCloseButton={false} 
          className="!max-w-none !w-screen !h-[100dvh] !p-0 !m-0 !bg-transparent border-none shadow-none !relative flex md:flex-row overflow-hidden"
        >
          {/* Immersive Background Blur Layer */}
          <div 
            className="fixed inset-0 z-0 bg-black/85 backdrop-blur-xl transition-all duration-700" 
            aria-hidden="true" 
            onClick={() => setSelectedAssetId(null)} 
          />

          <DialogTitle className="sr-only">에셋 상세 브라우저</DialogTitle>
          <DialogDescription className="sr-only">에셋의 원본 감상 및 상세 데이터 패널입니다.</DialogDescription>

          {/* Main Visual Section */}
          <div 
            className="relative z-10 flex-1 h-full flex items-center justify-center p-4 md:p-8 cursor-zoom-out animate-in fade-in duration-500 pb-[100px] md:pb-8"
            onClick={() => setSelectedAssetId(null)}
          >
            {asset ? (
              <img
                src={asset.display_url || asset.original_url}
                alt={asset.metadata?.originalName || "Asset"}
                onClick={(e) => e.stopPropagation()} 
                className="max-w-full max-h-full object-contain drop-shadow-[0_0_60px_rgba(0,0,0,0.7)] cursor-default animate-in fade-in zoom-in-[0.98] duration-500 ease-out"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/5 border-t-white/40" />
              </div>
            )}
          </div>

          {/* Action Card / Responsive Drawer */}
          <div 
            className={`
              /* Common & Mobile: Bottom Fixed Drawer */
              absolute bottom-0 left-0 right-0 z-50 bg-background flex flex-col rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${isMobileExpanded ? "translate-y-0 h-[85dvh]" : "translate-y-[calc(100%-80px)] h-[85dvh]"}
              
              /* Desktop: Relative Side Card */
              md:relative md:translate-y-0 md:h-[calc(100dvh-2rem)] md:w-[400px] md:shrink-0 md:my-4 md:mr-4 md:rounded-xl md:border md:border-border
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header (Fixed 80px Peek Area) */}
            <div 
              className="md:hidden flex flex-col items-center justify-start pt-4 pb-2 h-[80px] shrink-0 cursor-pointer border-b border-border/10" 
              onClick={(e) => { e.stopPropagation(); setIsMobileExpanded(!isMobileExpanded); }}
            >
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-3" />
              {!isMobileExpanded ? (
                <div className="flex items-center gap-3 px-6 w-full animate-in fade-in slide-in-from-bottom-1">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold h-4">
                    {asset?.type?.split('/')?.[1]?.toUpperCase() || 'BIN'}
                  </Badge>
                  <p className="text-sm font-bold truncate text-foreground/80 flex-1">
                    {asset?.metadata?.originalName || "에셋 정보"}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">에셋 상세 정보</p>
              )}
            </div>

            {/* Desktop Close/Actions Bar */}
            <div className="hidden md:flex items-center justify-between px-8 pt-8 mb-6">
              <Badge variant="secondary" className="rounded-none bg-muted text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                {asset?.type?.split('/')?.[1] || 'Object'}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-muted"
                onClick={() => setSelectedAssetId(null)}
              >
                <Maximize2 className="w-4 h-4 rotate-45" />
              </Button>
            </div>

            {/* Content Body: Scroll Protected Area */}
            <div className={`
              flex-1 flex flex-col gap-6 p-6 md:p-8 md:pt-0
              ${(isMobileExpanded || window.innerWidth >= 768) ? 'overflow-y-auto' : 'overflow-hidden'}
              scrollbar-hide
            `}>
              {/* Header Info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight leading-tight text-foreground">
                  {asset?.metadata?.originalName || asset?.file_key || "Untitled Object"}
                </h2>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Origin Manifest
                  <span className="w-1 h-1 rounded-full bg-border" />
                  {asset?.type || "format/raw"}
                </p>
              </div>

              {/* Core Actions */}
              <div className="grid grid-cols-1 gap-2.5">
                <Button asChild className="w-full font-bold h-12 shadow-xl" size="lg">
                  <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-4 h-4 mr-2.5" strokeWidth={2.5} />
                    Original Source Download
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full font-bold h-12 border-border/60 hover:bg-muted" size="lg">
                  <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2.5" />
                    Open Source Tab
                  </a>
                </Button>
              </div>

              {/* Spec Map */}
              <div className="space-y-6 pt-6 border-t border-border/10">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Ingested</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20">
                    <Calendar className="w-4.5 h-4.5 text-primary/40 shrink-0" />
                    <span className="text-[13px] font-bold">
                      {asset ? new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : "--"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Geometry</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20">
                    <Maximize2 className="w-4.5 h-4.5 text-primary/40 shrink-0" />
                    <span className="text-[13px] font-bold">
                      {asset?.metadata?.dimensions 
                        ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height} px`
                        : asset?.metadata?.size ? `${(asset.metadata.size / 1024 / 1024).toFixed(2)} MB` : "--"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Internal Reference</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20 overflow-hidden">
                    <FileText className="w-4.5 h-4.5 text-primary/40 shrink-0" />
                    <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
                      {asset?.id || "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Taxonomy Stack */}
              {asset?.tags?.length > 0 && (
                <div className="mt-auto pt-8 border-t border-border/10">
                  <label className="block text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-4 ml-1">System Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map(t => (
                      <Badge key={t} variant="outline" className="px-3 py-1 text-[11px] font-bold border-border/60 hover:bg-muted uppercase">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Close (Extra redundancy for UX) */}
            <div className="md:hidden p-4 pt-0">
               <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => setSelectedAssetId(null)}>
                  Close Viewer
               </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
