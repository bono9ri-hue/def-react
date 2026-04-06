"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { fetchAssets, updateAsset, addAssetTag, removeAssetTag, fetchCollections, forkAssetToCollection, unforkAssetFromCollection, createCollection } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Maximize2,
  Tag,
  Palette,
  FolderOpen,
  ChevronDown,
  Info,
  Loader2,
  Check,
  AlertCircle,
  X,
  Plus,
  Folder
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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

  const { data: collectionsData = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });
  const collections = collectionsData?.collections || (Array.isArray(collectionsData) ? collectionsData : []);

  const { user } = useUser();
  const queryClient = useQueryClient();
  const asset = currentAssets?.find((a) => a.id === selectedAssetId) || null;
  const isOwner = user?.id === asset?.user_id;

  // (1) Local State for Zero-Lag Editing
  const [localTitle, setLocalTitle] = React.useState("");
  const [localMemo, setLocalMemo] = React.useState("");
  const [localTags, setLocalTags] = React.useState([]);
  const [saveStatus, setSaveStatus] = React.useState("idle"); // "idle" | "editing" | "saving" | "saved" | "error"
  const [forkStatus, setForkStatus] = React.useState("idle"); // "idle" | "forking" | "forked"
  const [isCreatingCollection, setIsCreatingCollection] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  
  const titleRef = React.useRef(null);
  const memoRef = React.useRef(null);

  // Sync Local State when Asset Changes
  React.useEffect(() => {
    if (asset) {
      setLocalTitle(asset.metadata?.originalName || asset.file_key || "");
      setLocalMemo(asset.metadata?.memo || "");
      setLocalTags(asset.tags || []);
      setSaveStatus("idle");
      setForkStatus("idle");
      setIsCreatingCollection(false);
      setNewCollectionName("");
    }
  }, [asset]);

  // (1.5) Auto-resize for Title & Memo
  React.useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [localTitle, selectedAssetId]);

  React.useEffect(() => {
    if (memoRef.current) {
      memoRef.current.style.height = "auto";
      memoRef.current.style.height = `${memoRef.current.scrollHeight}px`;
    }
  }, [localMemo, selectedAssetId]);

  // (2) Tag Mutations (Optimistic)
  const handleAddTag = async (tagName) => {
    if (!isOwner || !asset || !tagName.trim()) return;
    const cleanTag = tagName.trim();
    if (localTags.includes(cleanTag)) return;

    // 1. Optimistic UI update
    setLocalTags(prev => [...prev, cleanTag]);
    setSaveStatus("saving");

    try {
      await addAssetTag(asset.id, cleanTag);
      setSaveStatus("saved");
      queryClient.invalidateQueries(["assets"]);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[Tag Error]:", err);
      setSaveStatus("error");
      // Rollback
      setLocalTags(prev => prev.filter(t => t !== cleanTag));
    }
  };

  const handleRemoveTag = async (tagName) => {
    if (!isOwner || !asset) return;
    console.log("Removing tag triggered:", tagName);

    // 1. Optimistic UI update
    setLocalTags(prev => prev.filter(t => t !== tagName));
    setSaveStatus("saving");

    try {
      await removeAssetTag(asset.id, tagName);
      setSaveStatus("saved");
      queryClient.invalidateQueries(["assets"]);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[Tag Error]:", err);
      console.error("Tag rollback executed due to API fail");
      setSaveStatus("error");
      // Rollback
      setLocalTags(prev => [...prev, tagName]);
    }
  };

  const handleToggleFork = async (collectionId) => {
    if (!asset || !collectionId) return;
    const isMapped = asset.collection_ids?.includes(collectionId);
    
    setForkStatus("forking");

    try {
      if (isMapped) {
        // Unmap/Unfork
        await unforkAssetFromCollection(asset.id, collectionId);
      } else {
        // Map/Fork
        await forkAssetToCollection(asset.id, collectionId, user?.id);
      }
      
      setForkStatus("forked");
      queryClient.invalidateQueries(["assets"]);
      setTimeout(() => setForkStatus("idle"), 2000);
    } catch (err) {
      console.error("[Toggle Fork Error]:", err);
      setForkStatus("idle");
    }
  };

  const handleCreateAndFork = async () => {
    if (!asset || !newCollectionName.trim()) return;
    setForkStatus("forking");
    
    try {
      // 1. Create Collection
      const newCol = await createCollection(newCollectionName.trim(), user?.id);
      
      // 2. Fork Asset to New Collection
      await forkAssetToCollection(asset.id, newCol.id, user?.id);
      
      setForkStatus("forked");
      queryClient.invalidateQueries(["collections"]);
      queryClient.invalidateQueries(["assets"]);
      
      // Reset
      setIsCreatingCollection(false);
      setNewCollectionName("");
      setTimeout(() => setForkStatus("idle"), 3000);
    } catch (err) {
      console.error("[Create & Fork Error]:", err);
      setForkStatus("idle");
    }
  };

  // (2) Auto-save Mutation
  const mutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      // (Artificial Delay) Ensure 'Saving...' is visible for at least 500ms to prevent flickering
      const [result] = await Promise.all([
        updateAsset(id, payload),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      return result;
    },
    onMutate: () => {
      setSaveStatus("saving");
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries(["assets"]);
      // Revert to idle after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      setSaveStatus("error");
    }
  });

  const handleAutoSave = (field, value) => {
    if (!isOwner || !asset) return;
    
    // Only save if value actually changed
    const originalValue = field === "originalName" 
      ? (asset.metadata?.originalName || asset.file_key) 
      : (asset.metadata?.memo || "");
      
    if (value === originalValue) return;

    console.log(`[Auto-save] Persisting ${field}:`, value);
    mutation.mutate({
      id: asset.id,
      payload: { [field]: value }
    });
  };

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

  // (1) UI State Sync: Always reset drawer to 'Peek' when switching assets or opening
  React.useEffect(() => {
    setIsMobileExpanded(false);
  }, [selectedAssetId]);

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
          className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !p-0 !m-0 !bg-transparent border-none shadow-none flex md:flex-row overflow-hidden z-50"
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
                  <Badge variant="secondary" className="px-1.5 py-0 text-sm font-bold h-4">
                    {asset?.type?.split('/')?.[1] || 'bin'}
                  </Badge>
                  <p className="text-sm font-bold truncate text-foreground/80 flex-1">
                    {asset?.metadata?.originalName || "에셋 정보"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-6 w-full animate-in fade-in slide-in-from-bottom-1">
                  <p className="text-sm font-bold text-foreground/40 tracking-widest flex-1">에셋 상세 정보</p>
                  
                  {/* Inline Save Status (Mobile) */}
                  {saveStatus !== "idle" && (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-300">
                      {saveStatus === "editing" && <span className="text-sm text-muted-foreground animate-pulse font-bold">...</span>}
                      {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      {saveStatus === "saved" && <Check className="w-3 h-3 text-green-500" />}
                      {saveStatus === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className={`text-sm font-bold tracking-wider ${
                        saveStatus === "editing" || saveStatus === "saving" ? "text-muted-foreground" : 
                        saveStatus === "saved" ? "text-green-500" : "text-red-500"
                      }`}>
                        {saveStatus === "editing" ? "Editing" : saveStatus}
                      </span>
                    </div>
                  )}

                  {/* Fork Dropdown removed from mobile header */}
                </div>
              )}
            </div>

            {/* Desktop Close/Actions Bar */}
            <div className="hidden md:flex items-center justify-between px-8 pt-8 mb-6">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-muted px-2 py-0.5 text-sm font-medium transition-all">
                  {asset?.type?.split('/')?.[1] || 'Object'}
                </Badge>
                
                {/* Inline Save Status (Desktop) */}
                {saveStatus !== "idle" && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                    {saveStatus === "editing" && <span className="text-sm text-muted-foreground animate-pulse font-bold">...</span>}
                    {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    {saveStatus === "saved" && <Check className="w-3 h-3 text-green-500" />}
                    {saveStatus === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                    <span className={`text-sm font-bold tracking-widest ${
                      saveStatus === "editing" || saveStatus === "saving" ? "text-muted-foreground" : 
                      saveStatus === "saved" ? "text-green-500" : "text-red-500"
                    }`}>
                      {saveStatus === "editing" ? "Editing" : saveStatus}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Fork Dropdown removed from desktop header */}

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-muted"
                  onClick={() => setSelectedAssetId(null)}
                >
                  <Maximize2 className="w-4 h-4 rotate-45" />
                </Button>
              </div>
            </div>

            {/* Content Body: Scroll Protected Area */}
            <div className={`
              flex-1 flex flex-col gap-8 p-6 md:p-8 md:pt-0
              ${(isMobileExpanded || typeof window !== 'undefined' && window.innerWidth >= 768) ? 'overflow-y-auto' : 'overflow-hidden'}
              scrollbar-hide
            `}>
              {/* A. Title & B. Memo Group */}
              <div className="flex flex-col gap-0">
                {/* Title (Pure Seamless) */}
                <div>
                  {isOwner ? (
                    <Textarea 
                      ref={titleRef}
                      value={localTitle}
                      onChange={(e) => {
                        setLocalTitle(e.target.value);
                        setSaveStatus("editing");
                      }}
                      className="text-3xl font-bold font-heading tracking-tight text-foreground !bg-transparent !border-transparent !shadow-none focus-visible:!ring-0 focus-visible:!border-border hover:!bg-secondary/50 !px-2 -ml-2 h-auto py-2 transition-colors duration-200 font-heading resize-none overflow-hidden !min-h-0"
                      placeholder="Enter reference name..."
                      onBlur={(e) => handleAutoSave("originalName", e.target.value)}
                      rows={1}
                    />
                  ) : (
                    <h2 className="text-3xl font-bold font-heading tracking-tight text-foreground px-2 -ml-2 py-2 whitespace-pre-wrap">
                      {localTitle || "Untitled Object"}
                    </h2>
                  )}
                </div>
                
                {/* Inspiration Notes (Pure Seamless) */}
                <div>
                  {isOwner ? (
                    <Textarea 
                      ref={memoRef}
                      value={localMemo}
                      onChange={(e) => {
                        setLocalMemo(e.target.value);
                        setSaveStatus("editing");
                      }}
                      placeholder="Record your inspirations or notes here..." 
                      className="resize-none text-base leading-relaxed text-muted-foreground !bg-transparent !border-transparent !shadow-none focus-visible:!ring-0 focus-visible:!border-border hover:!bg-secondary/50 !p-2 -ml-2 min-h-[40px] transition-colors duration-200 font-sans overflow-hidden h-auto"
                      onBlur={(e) => handleAutoSave("memo", e.target.value)}
                      rows={1}
                    />
                  ) : (
                    <p className="min-h-[40px] p-2 -ml-2 text-base leading-relaxed font-sans text-muted-foreground whitespace-pre-wrap">
                      {localMemo || "No notes recorded for this reference."}
                    </p>
                  )}
                </div>
              </div>

              {/* C. Collection / Folder (Pure Seamless) */}
              <div className="space-y-1 opacity-80">
 
                {isCreatingCollection ? (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <Input 
                      autoFocus
                      placeholder="Enter collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === "Enter") handleCreateAndFork();
                        if (e.key === "Escape") setIsCreatingCollection(false);
                      }}
                      className="w-full h-10 !bg-secondary/20 !border-border/30 focus-visible:!ring-1 focus-visible:!ring-blue-500/50 text-sm font-sans"
                    />
                    <p className="text-sm text-muted-foreground/40 mt-1.5 ml-1 italic">Press Enter to create and fork, Esc to cancel</p>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        disabled={forkStatus !== "idle" || !isOwner}
                        className={`w-full h-10 !px-2 -ml-2 !border-transparent !bg-transparent hover:!bg-secondary/50 font-semibold font-sans text-sm hover:text-foreground transition-all duration-200 shadow-none focus:ring-0 flex items-center justify-between group ${collections.length === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          <span className="truncate">
                            {collections.length === 0 ? "생성된 콜렉션이 없습니다" : 
                            forkStatus === "forking" ? "Processing..." : 
                            forkStatus === "forked" ? "✓ Updated" : 
                            (asset.collection_ids?.length > 0 ? `${asset.collection_ids.length} Collections` : "Add to collection...")}
                          </span>
                        </div>
                        <ChevronDown className="w-3 h-3 opacity-20" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px] font-sans border-border/10 bg-background/95 backdrop-blur-md">
                      <DropdownMenuItem 
                        onClick={() => setIsCreatingCollection(true)}
                        className="text-sm font-bold text-blue-500 hover:text-blue-600 focus:text-blue-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-2" /> 새 콜렉션 만들기
                      </DropdownMenuItem>
                      {collections.length > 0 && <div className="h-px bg-border/20 my-1" />}
                      {collections.map(c => {
                        const isMapped = asset.collection_ids?.includes(c.id);
                        return (
                          <DropdownMenuItem 
                            key={c.id} 
                            onClick={() => handleToggleFork(c.id)}
                            className="text-sm tracking-wider flex items-center justify-between cursor-pointer"
                          >
                            <span>{c.name}</span>
                            {isMapped && <Check className="w-3 h-3 text-blue-500" strokeWidth={3} />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Collection Badges (Hybrid UX) */}
                {asset.collection_ids?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 transition-all animate-in fade-in slide-in-from-top-1 duration-300">
                    {collections.filter(c => asset.collection_ids.includes(c.id)).map(col => (
                      <Badge 
                        key={col.id} 
                        variant="secondary" 
                        className="h-6 px-2 flex items-center gap-1.5 bg-secondary/30 hover:bg-secondary/50 border-transparent text-sm font-sans font-medium text-muted-foreground hover:text-foreground transition-all group/badge"
                      >
                        <Folder className="w-3 h-3 opacity-40 group-hover/badge:opacity-100" />
                        <span className="max-w-[80px] truncate">{col.name}</span>
                        {isOwner && (
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFork(col.id); }}
                            className="ml-0.5 p-0.5 rounded-sm hover:bg-destructive/10 hover:text-destructive opacity-40 group-hover/badge:opacity-100 transition-all cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* D. Taxonomy & Tags (Pure Seamless) */}
              <div className="space-y-2.5 mt-4">
                <label className="text-sm font-medium text-muted-foreground/20 ml-0.5 font-sans">Tags</label>
                <div className="space-y-3">
                  {isOwner && (
                    <Input 
                      placeholder="Add a tag..." 
                      className="h-10 !bg-transparent !border-transparent !shadow-none hover:!bg-secondary/50 focus-visible:!border-border focus-visible:!ring-0 font-sans text-sm !px-2 transition-all duration-200 focus:placeholder:text-transparent" 
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === "Enter") {
                          handleAddTag(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                  )}
                  <div className="flex flex-wrap gap-1.5 px-0.5">
                    {localTags.length > 0 ? localTags.map(t => (
                      <Badge key={t} variant="outline" className="group rounded-none px-2 py-0.5 text-sm font-medium border-border/30 bg-muted/10 text-muted-foreground/60 font-sans flex items-center gap-1.5">
                        {t}
                        {isOwner && (
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveTag(t);
                            }}
                            className="ml-1 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/20 hover:text-destructive pointer-events-auto cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    )) : (
                      <span className="text-sm text-muted-foreground/20 italic">No tags associated.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-4" /> {/* Spacer */}

              {/* E. Color Palette (Imagery Only) */}
              {asset?.type?.startsWith('image/') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground/20 tracking-[0.2em] ml-0.5 font-sans">Visual Palette</label>
                    <Palette className="w-3.5 h-3.5 text-muted-foreground/20" />
                  </div>
                  <div className="flex gap-1.5 p-3 rounded-lg border border-border/10 bg-muted/5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex-1 aspect-[4/3] rounded-sm bg-foreground/5 animate-pulse" />
                    ))}
                  </div>
                </div>
              )}


              {/* Action: Download Master */}
              <div className="mt-auto pt-6 border-t border-border/10">
                <Button asChild className="w-full font-bold h-14 shadow-2xl rounded-2xl" size="lg">
                  <a href={asset?.original_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-5 h-5 mr-3" strokeWidth={2.5} />
                    Download Master Reference
                  </a>
                </Button>
              </div>
            </div>
            
            {/* Mobile Close (Extra redundancy for UX) */}
            <div className="md:hidden p-4 pt-0">
               <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => setSelectedAssetId(null)}>
                  Close Viewer
               </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
