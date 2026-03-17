import { useAuth } from '@clerk/chrome-extension';
import { useCallback } from 'react';

const WORKER_URL = "https://def-api.deference.workers.dev";

export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
      };

      if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const config = {
        ...options,
        headers
      };

      const response = await fetch(`${WORKER_URL}${endpoint}`, config);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return null;
      
    } catch (error) {
      console.error(`API Request to ${endpoint} failed:`, error);
      throw error;
    }
  }, [getToken]);

  const saveAsset = useCallback(async (assetData) => {
    return fetchWithAuth('/assets', {
      method: "POST",
      body: JSON.stringify(assetData)
    });
  }, [fetchWithAuth]);

  const getAssets = useCallback(async () => {
    return fetchWithAuth('/assets');
  }, [fetchWithAuth]);

  const saveBookmark = useCallback(async (bookmarkData) => {
    return fetchWithAuth('/bookmarks', {
      method: "POST",
      body: JSON.stringify(bookmarkData)
    });
  }, [fetchWithAuth]);

  const getBookmarks = useCallback(async () => {
    return fetchWithAuth('/bookmarks');
  }, [fetchWithAuth]);

  const getCollections = useCallback(async () => {
    return fetchWithAuth('/collections');
  }, [fetchWithAuth]);

  const saveCollection = useCallback(async (name) => {
    return fetchWithAuth('/collections', {
      method: "POST",
      body: JSON.stringify({ name })
    });
  }, [fetchWithAuth]);
  
  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchWithAuth('/upload', {
      method: "POST",
      body: formData
    });
  }, [fetchWithAuth]);

  const updateBookmark = useCallback(async (id, data) => {
    return fetchWithAuth('/bookmarks', {
      method: "PUT",
      body: JSON.stringify({ ...data, id })
    });
  }, [fetchWithAuth]);

  const deleteBookmark = useCallback(async (id) => {
    return fetchWithAuth(`/bookmarks?id=${id}`, {
      method: "DELETE"
    });
  }, [fetchWithAuth]);

  return {
    fetchWithAuth,
    saveAsset,
    getAssets,
    saveBookmark,
    getBookmarks,
    updateBookmark,
    deleteBookmark,
    getCollections,
    saveCollection,
    uploadFile
  };
}
