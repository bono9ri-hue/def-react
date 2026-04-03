"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from '@tanstack/react-query';
import { fetchCollections } from '@/lib/api';
import { Settings, LayoutGrid, ArrowLeft, Lock } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";

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
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
          <Separator className="opacity-50" />
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
          <div>
            <h1 className="text-xl font-bold tracking-tight">{user?.fullName || 'User Profile'}</h1>
            <p className="text-muted-foreground text-xs font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/">
              <Icon name={ArrowLeft} size="sm" className="mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="icon-sm">
            <Icon name={Settings} size="sm" />
          </Button>
        </div>
      </header>

      {/* Collections Section */}
      <section className="space-y-8">
        <Separator className="opacity-50" />
        
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
                    className="block relative aspect-[5/4] w-full overflow-hidden rounded-none bg-muted border border-border/50 group-hover:border-foreground/20 transition-all duration-300 shadow-sm"
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
                       {col.visibility === 'private' && (
                         <Icon name={Lock} size="xs" className="text-muted-foreground shrink-0 mt-0.5" />
                       )}
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
            <div className="col-span-full py-32 flex flex-col items-center justify-center border border-dashed border-border rounded-[32px] bg-muted/10 space-y-3">
              <Icon name={LayoutGrid} size="lg" className="text-muted/30" />
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold">No collections found</p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                 <Link href="/">Browse Gallery</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer Meta */}
      <footer className="mt-24 pt-8 border-t border-border/50 flex justify-between items-center text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-4">
          <span>ID: {user?.id.slice(0, 12)}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Standard View</span>
        </div>
        <span>v1.2.0</span>
      </footer>
    </div>
  );
}
