import React, { useState } from 'react';
import { useVideoPreview } from '../hooks/useVideoPreview';

const VideoCard = React.memo(({ videoUrl, posterUrl, className, isMasonry }) => {
  const { videoRef, handleMouseEnter, handleMouseLeave } = useVideoPreview();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div 
      className={`relative w-full cursor-pointer overflow-hidden group ${isMasonry ? '' : 'h-full'} ${className}`}
      onMouseEnter={(e) => {
        if (handleMouseEnter) handleMouseEnter(e);
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }}
      onMouseLeave={(e) => {
        if (handleMouseLeave) handleMouseLeave(e);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      {/* 1. 바닥 썸네일 (메이슨리 뷰의 실제 높이를 결정하는 핵심 기둥) */}
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt="Video Thumbnail" 
          className={`w-full z-0 ${isMasonry ? 'relative h-auto block' : 'absolute inset-0 h-full object-cover'}`} 
          loading="lazy" 
        />
      ) : (
        <div className={`w-full bg-gray-200 dark:bg-white/5 z-0 ${isMasonry ? 'aspect-video relative' : 'absolute inset-0 h-full'}`} />
      )}

      {/* 2. 비디오 오버레이 (썸네일 위를 투명하게 덮음, 이벤트 방해 금지) */}
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setIsVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 pointer-events-none ${isVideoLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
      />

      {/* 3. VIDEO 뱃지 (이벤트 방해 금지) */}
      <div className="absolute top-3 left-3 z-[11] bg-black/60 text-white/90 text-[10px] font-bold px-2 py-1 rounded-md tracking-widest flex items-center gap-1.5 group-hover:opacity-0 transition-opacity pointer-events-none">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse pointer-events-none"></div>
        VIDEO
      </div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';
export default VideoCard;
