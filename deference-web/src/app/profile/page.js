"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCollections, deleteCollection } from '@/lib/api';
import { LayoutGrid, Lock, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Profile & Boards Index Page
 * Figma-style Decoupled Meta Layout for high-density collection management.
 */
export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const { 
    data: collections = [], 
    isLoading: isCollectionsLoading,
    isError 
  } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  const queryClient = useQueryClient();

  const handleCollectionDelete = async (collectionId) => {
    try {
      await deleteCollection(collectionId, user?.id);
      queryClient.invalidateQueries(['collections']);
    } catch (err) {
      console.error("[Delete Error]:", err);
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground gap-4">
        <p>Failed to load collections. Please try again later.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Loading State with Skeletons matching the new 1:1 + Meta structure
  if (!isUserLoaded || (isCollectionsLoading && !collections.length)) {
    return (
      <div className="min-h-screen bg-background layout-padding pt-[var(--layout-v-gap)]">
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48 opacity-50" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[5/4] w-full rounded-none" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-[var(--layout-v-gap)] pb-20 selection:bg-primary/10 w-full">
      {/* Header Container */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="relative group/avatar transition-transform hover:scale-105 duration-300">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12 shadow-sm" } }} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-tight">{user?.fullName || 'User Profile'}</h1>
            {user?.username && (
              <p className="text-sm text-muted-foreground font-medium transition-colors hover:text-foreground cursor-default">
                @{user.username}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5 opacity-50">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

      </header>

      {/* Collections Section */}
      <section className="space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">My Collections</h2>
            <p className="text-xs text-muted-foreground font-medium">Manage your personal moodboards and references</p>
          </div>
          <div className="px-3 py-1 bg-secondary rounded-full border border-border shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              {collections.length} Total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            {collections.map((col) => {
              const previewAsset = col.preview_assets?.[0];
              return (
                <div key={col.id} className="flex flex-col gap-3 group cursor-pointer">
                  {/* Thumbnail Area - Pure 1:1 with Hover Scale */}
                  <Link
                    href={`/collections/${col.id}`}
                    className="block relative aspect-[5/4] w-full overflow-hidden rounded-none bg-muted transition-all duration-300 shadow-sm"
                  >
                    {previewAsset?.thumb_url ? (
                      <img 
                        src={previewAsset.thumb_url} 
                        alt={col.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <Icon name={LayoutGrid} size="lg" className="text-muted/20" />
                      </div>
                    )}
                  </Link>
                  
                  {/* Decoupled Metadata Area - Figma style */}
                  <div className="flex flex-col gap-1.5 px-0.5">
                    <div className="flex justify-between items-start gap-2">
                       <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {col.name}
                       </h3>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         {col.visibility === 'private' && (
                           <Icon name={Lock} size="xs" className="text-muted-foreground shrink-0 mt-0.5" />
                         )}
                         
                         <Dialog>
                           <DialogTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="icon-xs" 
                               className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="font-sans">
                             <DialogHeader>
                               <DialogTitle>Delete Collection?</DialogTitle>
                               <DialogDescription>
                                 Are you sure you want to delete <span className="font-bold text-foreground">"{col.name}"</span>? 
                                 <br /><br />
                                 <span className="text-destructive/80 font-medium italic">Original assets will remain safe in your gallery.</span> This only removes the collection organization.
                               </DialogDescription>
                             </DialogHeader>
                             <DialogFooter className="mt-4">
                               <Button variant="outline" size="sm" onClick={() => {}}>Cancel</Button>
                               <Button 
                                 variant="destructive" 
                                 size="sm"
                                 onClick={() => handleCollectionDelete(col.id)}
                               >
                                 Delete Collection
                               </Button>
                             </DialogFooter>
                           </DialogContent>
                         </Dialog>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium tracking-tight">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span>{col.asset_count || 0} Items</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span>2h ago</span>
                      </div>
                      <AvatarGroup>
                        <Avatar size="sm" className="size-5">
                          <AvatarImage src={user?.imageUrl} />
                          <AvatarFallback className="text-[8px] bg-secondary">{user?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                      </AvatarGroup>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {collections.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-muted/10 space-y-3">
              <Icon name={LayoutGrid} size="lg" className="text-muted/30" />
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold">No collections found</p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                 <Link href="/">Browse Gallery</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
