"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, Folder, Loader2, Plus, Sparkles, Image as ImageIcon } from "lucide-react";
import { 
  Empty, 
  EmptyContent, 
  EmptyDescription, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle 
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * AssetGrid: Responsive Masonry-style gallery for Deference Assets.
 */
export default function AssetGrid({ customAssets, collectionId }) {
  const { 
    data: fetchedAssets = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    enabled: !customAssets,
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentAssets = customAssets || fetchedAssets || [];

  const handleOpenDetail = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams(searchParams.toString());
    params.set("asset", id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Phase 1: Stochastic Masonry Skeleton (Premium Loading)
  if (isLoading) {
    const skeletonHeights = [
      "h-[200px]", "h-[320px]", "h-[240px]", "h-[280px]", "h-[220px]", 
      "h-[300px]", "h-[200px]", "h-[260px]", "h-[320px]", "h-[240px]"
    ];
    
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
        {skeletonHeights.map((height, i) => (
          <div key={i} className="break-inside-avoid mb-3 overflow-hidden rounded-none border border-border/40 bg-muted/20">
            <Skeleton className={`${height} w-full rounded-none`} />
          </div>
        ))}
      </div>
    );
  }

  // Phase 2: Premium Empty State (Requested Shadcn Style)
  if (currentAssets.length === 0) {
    return (
      <div className="py-20 px-4">
        <Empty className="max-w-2xl mx-auto border-none bg-transparent">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
              <ImageIcon size={24} strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>Your Gallery is Empty</EmptyTitle>
            <EmptyDescription>
              Fill this space with your ideas.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex flex-row justify-center gap-3">
            <Button className="shadow-lg px-6" onClick={() => document.querySelector('input[type="file"]')?.click()}>
              <Plus className="w-4 h-4 mr-1" /> Add New
            </Button>
          </EmptyContent>
          <Button
            variant="link"
            asChild
            className="text-muted-foreground mt-4"
            size="sm"
          >
            <a href="https://deference.work/guide" target="_blank" rel="noreferrer" className="flex items-center gap-1">
              Learn more <ArrowUpRight className="w-3 h-3" />
            </a>
          </Button>
        </Empty>
      </div>
    );
  }

  // Phase 3: Global Responsive Masonry Grid
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
      {currentAssets.map((asset) => (
        <div 
          key={asset.id} 
          onClick={(e) => handleOpenDetail(e, asset.id)}
          className="break-inside-avoid mb-3 group relative cursor-pointer overflow-hidden rounded-none border border-border/40 bg-muted/20"
        >
          {/* 1. Item Skeleton Placeholder (Always present as background) */}
          <div className="absolute inset-0 bg-muted/30 animate-pulse pointer-events-none" />

          {/* 2. Asset Image Layer */}
          <div className="relative w-full overflow-hidden bg-muted/10">
            <img 
              src={asset.thumb_url || asset.original_url || asset.image_url} 
              alt={asset.metadata?.originalName || "Asset"} 
              className="relative z-10 w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {/* Fallback Icon if Image doesn't load/exist */}
            <ImageIcon className="absolute inset-0 m-auto w-8 h-8 text-muted-foreground/10" />
          </div>

          {/* Hover Overlay Layer (Premium Design - High Visibility) */}
          <div className="absolute inset-0 z-20 bg-black/60 p-4 hidden sm:flex flex-col justify-between opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 rounded-none pointer-events-none sm:group-hover:pointer-events-auto will-change-opacity">
            {/* Overlay Top: [우상단] Quick Action (Plus Button) */}
            <div className="flex justify-end">
              <Button 
                size="icon-xs" 
                variant="ghost" 
                className="rounded-full bg-white/20 hover:!bg-white/30 text-white hover:!text-white border-0 shadow-2xl p-0 transition-colors"
                onClick={(e) => { e.stopPropagation(); /* Quick add logic */ }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </div>

            {/* Overlay Bottom: [우하단] Info & Button Group */}
            <div className="flex items-end gap-3 font-sans">
              {/* [좌측/중앙] Metadata Summary (Now on the left) */}
              <div className="flex-1 min-w-0 pb-0.5">
                <p className="text-[11px] font-bold text-white leading-tight truncate px-1">
                  {asset.metadata?.originalName || asset.file_key}
                </p>
                <p className="text-[9px] font-medium text-white/50 uppercase tracking-tighter truncate px-1">
                  {asset.type?.split('/')?.[1] || 'image'} • {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* [우측] Primary Action Button (Now on the right) */}
              <Button 
                size="icon-sm" 
                variant="ghost" 
                className="rounded-full bg-white/20 hover:!bg-white/30 text-white hover:!text-white border-0 shadow-2xl p-0 transition-colors shrink-0"
                onClick={(e) => { e.stopPropagation(); handleOpenDetail(asset.id); }}
              >
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
