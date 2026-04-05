const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch all collections with preview assets.
 */
export async function fetchCollections() {
  const res = await fetch(`${API_BASE}/collections`);
  if (!res.ok) {
    throw new Error("Failed to fetch collections");
  }
  return res.json();
}

/**
 * Fetch assets for a specific collection.
 */
export async function fetchCollectionAssets(collectionId) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/assets`);
  if (!res.ok) {
    throw new Error("Failed to fetch collection assets");
  }
  return res.json();
}

/**
 * Delete a collection.
 */
export async function deleteCollectionApi(collectionId) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete collection");
  }
  return res.json();
}

/**
 * Get a presigned URL for direct R2 upload.
 */
export async function getUploadUrl(filename, contentType) {
  const res = await fetch(`${API_BASE}/api/upload/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Worker Error]:", res.status, errorText);
    throw new Error(`Failed to get upload URL: ${res.status} ${errorText}`);
  }
  return res.json();
}

/**
 * Commit asset metadata and tags to D1 (Batch).
 */
export async function saveAsset(payload) {
  const res = await fetch(`${API_BASE}/api/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error POST /api/assets]:`, res.status, errorText);
    throw new Error(`Failed to save asset metadata: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch all assets (Global Gallery).
 */
export async function fetchAssets() {
  const res = await fetch(`${API_BASE}/assets`);
  if (!res.ok) {
    throw new Error("Failed to fetch assets");
  }
  return res.json();
}
