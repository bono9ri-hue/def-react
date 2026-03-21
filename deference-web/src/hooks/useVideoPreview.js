import { useRef, useCallback } from 'react';

export const useVideoPreview = () => {
  const videoRef = useRef(null);

  const play = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Video preview playback failed:", error.message);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
  }, []);

  const reset = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, []);

  const handleMouseEnter = useCallback(() => {
    play();
  }, [play]);

  const handleMouseLeave = useCallback(() => {
    reset();
  }, [reset]);

  return {
    videoRef,
    play,
    pause,
    reset,
    handleMouseEnter,
    handleMouseLeave
  };
}; 
