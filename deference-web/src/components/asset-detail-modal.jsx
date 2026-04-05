"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Maximize2 
} from "lucide-react";

/**
 * AssetDetailModal
 * Query-string based modal for asset deep-linking (?asset=ID).
 * Provides multi-resolution viewing (Display resolution) and Original download.
 */
export function AssetDetailModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assetId = searchParams.get("asset");

  // Fetch or retrieve assets from cache
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const asset = assets.find((a) => a.id === assetId);

  const handleClose = () => {
    // Clear the asset query param but keep others (like mode, etc)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("asset");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (!assetId) return null;

  return (
    <Dialog open={!!assetId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-screen-2xl w-[95vw] h-[90vh] md:h-[85vh] p-0 overflow-hidden border-none bg-black/95 backdrop-blur-3xl flex flex-col md:flex-row rounded-none gap-0 shadow-2xl">
        {/* Left: Main Viewer (Premium Stage) */}
        <div className="flex-1 relative bg-black/40 flex items-center justify-center overflow-hidden border-r border-white/5">
          {asset ? (
            <>
              {/* Ambient Background Glow */}
              <div 
                className="absolute inset-0 blur-[120px] opacity-20 pointer-events-none scale-150 transition-opacity duration-1000"
                style={{ backgroundImage: `url(${asset.display_url || asset.original_url})`, backgroundSize: 'cover' }}
              />
              <img 
                src={asset.display_url || asset.original_url}
                alt={asset.metadata?.originalName || "Asset"}
                className="relative z-10 max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)]"
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20" />
               <p className="text-white/40 text-[11px] font-mono tracking-widest uppercase animate-pulse">Syncing Asset Resources...</p>
            </div>
          )}
        </div>

        {/* Right: Info & Meta Panel (Dark Premium) */}
        <div className="w-full md:w-80 flex flex-col bg-[#0a0a0a]/80 backdrop-blur-xl overflow-y-auto border-l border-white/5">
          <div className="p-8 space-y-10">
            {/* Header info */}
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight leading-tight text-white/90 break-words">
                {asset?.metadata?.originalName || asset?.file_key || "Object Reference"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-none bg-white/10 text-white/60 text-[9px] font-black uppercase tracking-tighter">
                  {asset?.type?.split("/")?.[1] || "Binary"}
                </span>
                <span className="text-[9px] text-white/30 font-mono">
                  {(asset?.metadata?.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>

            {/* Primary Actions Grid */}
            <div className="grid grid-cols-1 gap-2">
              <Button asChild className="rounded-none h-12 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-widest transition-all">
                <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4 mr-2" strokeWidth={3} /> Download Original
                </a>
              </Button>
              <Button variant="ghost" asChild className="rounded-none h-12 text-white/60 hover:text-white hover:bg-white/5 border border-white/10 font-bold text-[11px] uppercase tracking-wider">
                <a href={asset?.original_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Source URL
                </a>
              </Button>
            </div>

            {/* Systematic Metadata Section */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-none bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-0.5">Ingested Date</p>
                  <p className="text-[11px] font-bold text-white/70">{asset ? new Date(asset.created_at).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' }) : "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-none bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-0.5">Reference ID</p>
                  <p className="text-[10px] font-mono break-all text-white/40 leading-tight tracking-tighter">{asset?.id}</p>
                </div>
              </div>

              {asset?.metadata?.dimensions && (
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-none bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                    <Maximize2 className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-0.5">Pixel Geometry</p>
                    <p className="text-[11px] font-bold text-white/70">{asset.metadata.dimensions.width} &times; {asset.metadata.dimensions.height}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tag Cloud */}
            {asset?.tags?.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/5">
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Metadata Tags</p>
                <div className="flex flex-wrap gap-1.5">
                    {asset.tags.map(t => (
                      <span key={t} className="px-2 py-1 bg-white/5 text-white/60 text-[9px] font-bold uppercase tracking-tight hover:bg-white/10 hover:text-white transition-all cursor-default">
                        {t}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
