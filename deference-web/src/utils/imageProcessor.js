import imageCompression from 'browser-image-compression';

/**
 * 3-Tier Image Processing Pipeline
 * Compresses an original file into `thumb` (1200px) and `display` (1600px) webp formats.
 * Utilizes WebWorkers for parallel processing without blocking the UI thread.
 * 
 * @param {File} file 
 * @returns {Promise<{ thumb: File, display: File, original: File }>}
 */
export async function processImage(file) {
  if (!file.type.startsWith('image/')) {
    return { thumb: file, display: file, original: file };
  }

  // Thumb config (Max 1200px, quality 0.9, WebP)
  const thumbOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.9,
  };

  // Display config (Max 1600px, quality 0.8, WebP)
  const displayOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  };

  try {
    const [thumbBlob, displayBlob] = await Promise.all([
      imageCompression(file, thumbOptions),
      imageCompression(file, displayOptions)
    ]);

    // Convert blobs back to File objects
    const thumb = new File([thumbBlob], `${file.name.split('.')[0]}-thumb.webp`, { type: 'image/webp' });
    const display = new File([displayBlob], `${file.name.split('.')[0]}-display.webp`, { type: 'image/webp' });

    return {
      thumb,
      display,
      original: file
    };
  } catch (error) {
    console.error('[ImageProcessor] Compression failed:', error);
    throw error;
  }
}
