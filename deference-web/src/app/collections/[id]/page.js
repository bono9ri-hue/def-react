"use client";

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Icon } from "@/components/ui/icon";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCollections, fetchCollectionAssets, deleteCollectionApi } from '@/lib/api';
import AssetGrid from '@/components/dashboard/AssetGrid';
import { Button } from "@/components/ui/button";

/**
 * Dynamic Collection View (/collections/[id])
 * Displays a filtered gallery of assets belonging to a specific collection.
 */
export default function CollectionView() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch all collections to find the current board name/description
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  const board = collections.find(c => c.id === params.id);

  // 2. Fetch assets for this specific collection
  const { 
    data: boardAssets = [], 
    isLoading: isAssetsLoading 
  } = useQuery({
    queryKey: ['collection-assets', params.id],
    queryFn: () => fetchCollectionAssets(params.id),
    enabled: !!params.id,
  });

  // 3. Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCollectionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      router.push('/profile');
    },
    onError: (error) => {
      alert(`Failed to delete collection: ${error.message}`);
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      deleteMutation.mutate(params.id);
    }
  };

  return (
    <div className="w-full pb-20 selection:bg-primary/10">
      {/* Navigation Header */}
      <header className="flex items-center justify-between h-[52px] mb-4 mt-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()} 
            className="rounded-full"
          >
            <Icon name={ArrowLeft} size="default" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">{board?.name || 'Loading Collection...'}</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
              {boardAssets.length} Items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="hover:text-destructive transition-colors"
          >
            <Icon name={Trash2} size="default" />
          </Button>
          <Button variant="ghost" size="icon">
            <Icon name={Share2} size="default" />
          </Button>
          <Button variant="ghost" size="icon">
            <Icon name={MoreHorizontal} size="default" />
          </Button>
        </div>
      </header>

      {/* Reusable Asset Grid with Custom Data */}
      <div className="mt-8">
        <AssetGrid customAssets={boardAssets} collectionId={board?.id} />
      </div>

      {/* Collection Meta Info */}
      {board?.description && (
        <div className="mt-20 pt-8 border-t border-border/50 max-w-2xl">
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-4">Description</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{board.description}</p>
        </div>
      )}
    </div>
  );
}
