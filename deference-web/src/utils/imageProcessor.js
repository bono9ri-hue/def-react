/**
 * imageProcessor.js
 * Client-side utility for 3-stage multi-resolution processing.
 * Generates Optimized Thumbnails and Display versions before R2 upload.
 */

const THUMB_SIZE = 800; // px (Retina-ready)
const DISPLAY_SIZE = 1920; // px (FHD display)

/**
 * Resizes an image file to a specific max dimension while preserving aspect ratio.
 * Always outputs as image/webp.
 */
async function resizeImage(file, maxSize, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;

      // Only resize if the image is larger than the target
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      // Use high-quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/webp", // Force webp
        quality
      );
    };
    img.onerror = () => reject(new Error("Image loading failed"));
  });
}

/**
 * Main processor: Returns { thumb, display, original }
 */
export async function processImage(file) {
  // If not an image, just return the original
  if (!file.type.startsWith("image/")) {
    return { thumb: file, display: file, original: file };
  }

  try {
    const [thumb, display] = await Promise.all([
      resizeImage(file, THUMB_SIZE, 0.80), // High quality thumb for Retina
      resizeImage(file, DISPLAY_SIZE, 0.85) // Studio quality display
    ]);

    return {
      thumb,
      display,
      original: file
    };
  } catch (error) {
    console.error("[imageProcessor Error]:", error);
    // Fallback to original if processing fails
    return { thumb: file, display: file, original: file };
  }
}
