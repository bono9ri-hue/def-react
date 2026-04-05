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
      <DialogContent className="!max-w-[95vw] !w-full !h-[90vh] !p-0 overflow-hidden bg-background sm:rounded-xl border border-border flex flex-col md:!grid md:!grid-cols-[1fr_400px] shadow-2xl">
        {/* A11y Requirement: Title & Description (Visual-Hidden) */}
        <DialogTitle className="sr-only">에셋 상세 보기: {asset?.metadata?.originalName || "Asset"}</DialogTitle>
        <DialogDescription className="sr-only">에셋의 고해상도 미리보기와 상세 메타데이터 및 다운로드 옵션을 제공하는 패널입니다.</DialogDescription>

        {/* Left Section: Immersive Viewer */}
        <div className="relative flex-1 bg-zinc-950 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-border min-h-[40vh] md:min-h-0">
          {asset ? (
            <img
              src={asset.display_url || asset.original_url}
              alt={asset.metadata?.originalName || "Asset"}
              className="relative z-10 object-contain w-full h-full max-h-full drop-shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
              <p className="text-xs font-medium">데이터 로드 중...</p>
            </div>
          )}
        </div>

        {/* Right Section: Standardized Info & Action Panel */}
        <div className="bg-background p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide shrink-0">
          {/* Section: Header */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {asset?.metadata?.originalName || asset?.file_key || "이름 없는 파일"}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-semibold">
                {asset?.type?.split('/')?.[1]?.toUpperCase() || 'FILE'}
              </Badge>
              에셋 상세 정보
            </p>
          </div>

          {/* Section: Essential Actions */}
          <div className="grid grid-cols-1 gap-2">
            <Button asChild className="w-full font-semibold shadow-sm" size="lg">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-4 h-4 mr-2" />
                원본 다운로드
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full font-medium" size="lg">
              <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                새 창으로 열기
              </a>
            </Button>
          </div>

          {/* Section: Metadata List (Shadcn Form Style) */}
          <div className="space-y-6 pt-2">
            <div className="grid gap-1.5">
              <span className="text-sm font-medium leading-none text-foreground/70">등록 일자</span>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/30">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {asset ? new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                </span>
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className="text-sm font-medium leading-none text-foreground/70">파일 사양</span>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/30">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {asset?.metadata?.dimensions 
                    ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height}`
                    : asset?.metadata?.size ? `${(asset.metadata.size / 1024 / 1024).toFixed(2)} MB` : "-"}
                </span>
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className="text-sm font-medium leading-none text-foreground/70">시스템 고유 식별자</span>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/30 overflow-hidden">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground truncate">
                  {asset?.id || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Tags */}
          {asset?.tags?.length > 0 && (
            <div className="space-y-2.5 mt-auto border-t pt-6">
              <span className="text-sm font-medium leading-none text-foreground/70">태그 데이터</span>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map(t => (
                  <Badge key={t} variant="secondary" className="px-2 py-0.5 font-medium">
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
