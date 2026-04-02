import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import crypto from "crypto";

// 1. R2 Client Initialization
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * POST /api/upload
 * Generates 3-tier Pre-signed URLs for Thumbnail, Display, and Original assets.
 */
export async function POST(request) {
  try {
    const { fileName, contentType } = await request.json();
    
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Prepare Unique Keys
    const fileKey = crypto.randomUUID();
    const extension = fileName.split('.').pop();
    
    // Tier-specific keys
    const keys = {
      thumb: `${fileKey}-thumb.webp`,
      display: `${fileKey}-display.webp`,
      original: `${fileKey}-original.${extension}`
    };

    // 3. Generate Signed URLs in Parallel
    const generateUrl = async (key, type) => {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: type,
      });
      return getSignedUrl(r2, command, { expiresIn: 60 });
    };

    const [thumbUrl, displayUrl, originalUrl] = await Promise.all([
      generateUrl(keys.thumb, 'image/webp'),
      generateUrl(keys.display, 'image/webp'),
      generateUrl(keys.original, contentType)
    ]);

    return NextResponse.json({
      fileKey,
      urls: {
        thumb: thumbUrl,
        display: displayUrl,
        original: originalUrl
      }
    });

  } catch (error) {
    console.error("[Pre-signed URL Error]:", error);
    return NextResponse.json({ error: "Failed to generate signed URLs" }, { status: 500 });
  }
}
