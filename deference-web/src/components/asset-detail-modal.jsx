"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
 * Hybrid Architecture: Zustand State + Manual History API Sync.
 * Implements a high-end 2-column "Studio" Lightbox UI.
 */
export function AssetDetailModal() {
  const { selectedAssetId, setSelectedAssetId } = useAssetStore();

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
      params.set("asset", selectedAssetId);
      window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
    } else {
      // Clear param on close
      const hasAsset = params.has("asset");
      if (hasAsset) {
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

  const handleClose = (open) => {
    if (!open) {
      setSelectedAssetId(null);
    }
  };

  if (!selectedAssetId) return null;

  return (
    <Dialog open={!!selectedAssetId} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[95vw] !w-full !h-[90vh] !p-0 overflow-hidden bg-black/95 border-none rounded-none shadow-2xl flex flex-col md:!grid md:!grid-cols-[1fr_350px]">
        {/* A11y Requirement: Title & Description (Visual-Hidden) */}
        <DialogTitle className="sr-only">에셋 상세 보기: {asset?.metadata?.originalName || "Asset"}</DialogTitle>
        <DialogDescription className="sr-only">에셋의 고해상도 미리보기와 상세 메타데이터 및 다운로드 옵션을 제공하는 패널입니다.</DialogDescription>

        {/* Left Section: Immersive Studio Viewer */}
        <div className="relative flex-1 flex items-center justify-center bg-black/50 p-4 border-b md:border-b-0 md:border-r border-border/10 overflow-hidden min-h-[50vh] md:min-h-0">
          {asset ? (
            <>
              {/* Backglow Ambient Stage */}
              <div
                className="absolute inset-0 blur-[120px] opacity-15 pointer-events-none scale-150 transition-opacity duration-1000"
                style={{ backgroundImage: `url(${asset.display_url || asset.original_url})`, backgroundSize: 'cover' }}
              />
              <img
                src={asset.display_url || asset.original_url}
                alt={asset.metadata?.originalName || "Asset"}
                className="relative z-10 object-contain w-full h-full max-h-full drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)] transition-all duration-700 animate-in fade-in zoom-in-95"
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/5 border-t-white/30" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20 animate-pulse">Synchronizing Data Buffer...</span>
            </div>
          )}
        </div>

        {/* Right Section: High-Density Info & Action Panel */}
        <div className="bg-background !p-8 flex flex-col gap-10 overflow-y-auto border-l border-border/10 scrollbar-hide shrink-0">
          {/* Section: Header & Type Branding */}
          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-none bg-muted hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1">
              {asset?.type?.split('/')?.[1] || 'Object'}
            </Badge>
            <h2 className="text-2xl font-black tracking-tighter leading-[1.1] text-foreground/90 break-words line-clamp-4">
              {asset?.metadata?.originalName || asset?.file_key || "Untitled"}
            </h2>
          </div>

          {/* Section: Primary CTA Stack */}
          <div className="grid grid-cols-1 gap-3">
            <Button asChild className="rounded-none h-14 bg-foreground text-background hover:bg-foreground/90 font-black text-[12px] uppercase tracking-[0.25em] transition-all shadow-xl">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-4 h-4 mr-2.5" strokeWidth={3} /> Download Master
              </a>
            </Button>
            <Button variant="outline" asChild className="rounded-none h-14 border-border/40 hover:bg-muted font-bold text-[11px] uppercase tracking-widest transition-colors">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2.5" /> Open Source
              </a>
            </Button>
          </div>

          {/* Section: Technical Specs Grid */}
          <div className="space-y-8 pt-8 border-t border-border/10">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-none bg-muted/50 flex items-center justify-center shrink-0 border border-border/5">
                <Calendar className="w-4.5 h-4.5 text-muted-foreground/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground/30 uppercase font-bold tracking-[0.15em] mb-1.5">Created On</p>
                <p className="text-[13px] font-black text-foreground/80 leading-none">
                  {asset ? new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : "--"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-none bg-muted/50 flex items-center justify-center shrink-0 border border-border/5">
                <Maximize2 className="w-4.5 h-4.5 text-muted-foreground/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground/30 uppercase font-bold tracking-[0.15em] mb-1.5">Dimensions / Size</p>
                <p className="text-[13px] font-black text-foreground/80 leading-none">
                  {asset?.metadata?.dimensions
                    ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height}`
                    : asset?.metadata?.size ? `${(asset.metadata.size / 1024 / 1024).toFixed(2)} MB` : "--"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-none bg-muted/50 flex items-center justify-center shrink-0 border border-border/5">
                <FileText className="w-4.5 h-4.5 text-muted-foreground/50" />
              </div>
              <div className="min-w-0 w-full overflow-hidden">
                <p className="text-[10px] text-muted-foreground/30 uppercase font-bold tracking-[0.15em] mb-1.5">System Identifier</p>
                <p className="text-[11px] font-mono text-muted-foreground/60 break-all leading-relaxed tracking-tight bg-muted/20 p-2 border border-border/5">
                  {asset?.id || "--"}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Dynamic Meta Tags */}
          {asset?.tags?.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-border/10 mt-auto">
              <p className="text-[10px] text-muted-foreground/30 uppercase font-bold tracking-[0.15em]">Classification Tags</p>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map(t => (
                  <Badge key={t} variant="outline" className="rounded-none text-[10px] font-black px-3 py-1 border-border/30 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all cursor-default uppercase tracking-wider">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
