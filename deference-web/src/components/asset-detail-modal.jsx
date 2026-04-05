"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
 * Zustand + History API Hybrid Modal.
 * Bypasses Next.js RSC 404 errors while maintaining Deep Linking (?asset=ID).
 */
export function AssetDetailModal() {
  const { selectedAssetId, setSelectedAssetId } = useAssetStore();

  console.log("🔥 [DEBUG 2] 모달이 인식한 현재 selectedAssetId:", selectedAssetId);

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

  // Handle Browser Back/Forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedAssetId(params.get("asset"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setSelectedAssetId]);

  // Data Fetching
  const { data: currentAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    staleTime: 1000 * 60 * 5,
  });

  const asset = currentAssets?.find((a) => a.id === selectedAssetId) || null;

  if (!selectedAssetId) return null;

  return (
    <Dialog open={!!selectedAssetId} onOpenChange={(open) => !open && setSelectedAssetId(null)}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-black/95 border-none rounded-none shadow-2xl flex flex-col md:grid md:grid-cols-[1fr_350px]">
        {/* A11y Requirement: DialogTitle (sr-only) */}
        <DialogTitle className="sr-only">에셋 상세 보기: {asset?.metadata?.originalName || "Asset"}</DialogTitle>

        {/* Left Section: Immersive Viewer */}
        <div className="relative flex-1 flex items-center justify-center bg-black/50 p-4 border-b md:border-b-0 md:border-r border-border/10 overflow-hidden">
          {asset ? (
            <>
              {/* Backglow Ambient Stage */}
              <div 
                className="absolute inset-0 blur-[100px] opacity-10 pointer-events-none scale-150"
                style={{ backgroundImage: `url(${asset.display_url || asset.original_url})`, backgroundSize: 'cover' }}
              />
              <img 
                src={asset.display_url || asset.original_url}
                alt={asset.metadata?.originalName || "Asset"}
                className="relative z-10 object-contain w-full h-full max-h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-700 animate-in fade-in zoom-in-95"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/10 border-t-white/40" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/30 animate-pulse">Syncing Buffer...</span>
            </div>
          )}
        </div>

        {/* Right Section: Floating Action/Info Panel */}
        <div className="bg-background p-8 flex flex-col gap-10 overflow-y-auto border-l border-border/10">
          {/* Header & Type Classification */}
          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-none bg-muted hover:bg-muted text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
              {asset?.type?.split('/')?.[1] || 'Binary Object'}
            </Badge>
            <h2 className="text-xl font-black tracking-tight leading-tight text-foreground/90 break-words line-clamp-3">
              {asset?.metadata?.originalName || asset?.file_key || "Untitled Object"}
            </h2>
          </div>

          {/* Core Action Group (Premium Buttons) */}
          <div className="grid grid-cols-1 gap-2.5">
            <Button asChild className="rounded-none h-12 bg-foreground text-background hover:bg-foreground/90 font-black text-[11px] uppercase tracking-[0.2em] transition-all">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-3.5 h-3.5 mr-2" strokeWidth={3} /> Download Source
              </a>
            </Button>
            <Button variant="outline" asChild className="rounded-none h-12 border-border/50 hover:bg-muted font-bold text-[10px] uppercase tracking-widest">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-2" /> View Original File
              </a>
            </Button>
          </div>

          {/* Technical Specifications Grid */}
          <div className="space-y-6 pt-6 border-t border-border/10">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest mb-1">Ingestion Date</p>
                <p className="text-[11px] font-bold text-foreground/70 leading-none">
                  {asset ? new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center shrink-0">
                <Maximize2 className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest mb-1">Pixel Geometry</p>
                <p className="text-[11px] font-bold text-foreground/70 leading-none">
                  {asset?.metadata?.dimensions 
                    ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height}`
                    : `${(asset?.metadata?.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest mb-1">Logical Key</p>
                <p className="text-[10px] font-mono text-muted-foreground/60 break-all leading-tight tracking-tighter">
                  {asset?.id}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Tag System */}
          {asset?.tags?.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border/10">
              <p className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest">Metadata Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map(t => (
                  <Badge key={t} variant="outline" className="rounded-none text-[9px] font-bold px-2 py-0.5 border-border/50 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors transition-all cursor-default uppercase">
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
