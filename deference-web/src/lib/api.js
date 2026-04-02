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
