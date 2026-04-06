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

/**
 * [NEW] updateAsset - PATCH /api/assets/:id
 * Merges and updates asset metadata.
 */
export async function updateAsset(id, payload) {
  const res = await fetch(`${API_BASE}/api/assets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error PATCH /api/assets/${id}]:`, res.status, errorText);
    throw new Error(`Failed to update asset: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] addAssetTag - POST /api/assets/:id/tags
 */
export async function addAssetTag(assetId, tagName) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagName }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error POST /api/assets/${assetId}/tags]:`, res.status, errorText);
    throw new Error(`Failed to add tag: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] removeAssetTag - DELETE /api/assets/:id/tags/:tagName
 */
export async function removeAssetTag(assetId, tagName) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/tags/${encodeURIComponent(tagName)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error DELETE /api/assets/${assetId}/tags/${tagName}]:`, res.status, errorText);
    throw new Error(`Failed to remove tag: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] forkAssetToCollection - POST /api/assets/:id/fork
 */
export async function forkAssetToCollection(assetId, collectionId, userId) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/fork`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collectionId, userId }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error POST /api/assets/${assetId}/fork]:`, res.status, errorText);
    throw new Error(`Failed to fork asset: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] unforkAssetFromCollection - DELETE /api/assets/:id/fork/:collectionId
 */
export async function unforkAssetFromCollection(assetId, collectionId) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/fork/${collectionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error DELETE /api/assets/${assetId}/fork/${collectionId}]:`, res.status, errorText);
    throw new Error(`Failed to unfork asset: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] createCollection - POST /api/collections
 */
export async function createCollection(name, userId) {
  const res = await fetch(`${API_BASE}/api/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, user_id: userId }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error POST /api/collections]:`, res.status, errorText);
    throw new Error(`Failed to create collection: ${res.status}`);
  }
  return res.json();
}

/**
 * [NEW] deleteCollection - DELETE /api/collections/:id
 */
export async function deleteCollection(collectionId, userId) {
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Worker Error DELETE /api/collections/${collectionId}]:`, res.status, errorText);
    throw new Error(`Failed to delete collection: ${res.status}`);
  }
  return res.json();
}
