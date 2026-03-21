import { useAuth } from '@clerk/nextjs';
import { useCallback, useMemo } from 'react';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://def-api.deference.workers.dev";

export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    try {
      const token = await getToken();
      if (!token) {
        console.warn("Dashboard API: No token found. Please ensure you are logged in.");
        throw new Error("Authentication token not found. Please log in.");
      }

      // Logging request details for CORS and debugging (as requested)
      const fullUrl = `${WORKER_URL}${endpoint}`;
      console.log(`Dashboard API Request: [${options.method || 'GET'}] ${fullUrl}`, {
        origin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
        headers: {
          "Authorization": `Bearer ${token.substring(0, 10)}...` // Security: log only prefix
        }
      });

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

      // [디버깅] 요청 직전 상세 정보 로그
      console.log("요청 주소:", fullUrl);
      console.log("전송 토큰:", token);

      const response = await fetch(fullUrl, config);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        // 에러 응답이 JSON일 경우에만 상세 에러 추출 시도
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
          } catch (e) {
            console.warn("에러 JSON 파싱 실패 (무시됨):", e);
          }
        } else {
          // HTML 에러 페이지일 경우 statusText만 사용
          console.warn(`Non-JSON Error Response (${response.status}):`, response.statusText);
        }
        
        console.error(`Dashboard API Error (${response.status}):`, errorMsg);
        throw new Error(errorMsg);
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(`Dashboard API Success: ${endpoint}`, { count: data?.length || 'N/A' });
        return data;
      }
      return null;
      
    } catch (error) {
      console.error("전체 에러 객체:", error); // [디버깅] 에러 객체 전체 출력
      console.error(`Dashboard API Request to ${endpoint} failed:`, error);
      throw error;
    }
  }, [getToken]);

  const saveAsset = useCallback(async (assetData) => {
    return fetchWithAuth('/assets', {
      method: "POST",
      body: JSON.stringify(assetData)
    });
  }, [fetchWithAuth]);

  const updateAsset = useCallback(async (id, data) => {
    return fetchWithAuth('/assets', {
      method: "PUT",
      body: JSON.stringify({ ...data, id })
    });
  }, [fetchWithAuth]);

  const deleteAsset = useCallback(async (id, fileName) => {
    let url = `/assets?id=${id}`;
    if (fileName) url += `&fileName=${fileName}`;
    return fetchWithAuth(url, {
      method: "DELETE"
    });
  }, [fetchWithAuth]);

  const updateStatus = useCallback(async (type, id, status) => {
    const endpoint = type === 'asset' ? '/assets' : '/collections';
    return fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify({ id: Number(id), status })
    });
  }, [fetchWithAuth]);

  const updateAssetStatus = useCallback(async (id, status) => {
    return updateStatus('asset', id, status);
  }, [updateStatus]);

  const getAssets = useCallback(async (status = 'active') => {
    return fetchWithAuth(`/assets?status=${status}`);
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

  const getCollections = useCallback(async (status = 'active') => {
    return fetchWithAuth(`/collections?status=${status}`);
  }, [fetchWithAuth]);

  const saveCollection = useCallback(async (name) => {
    return fetchWithAuth('/collections', {
      method: "POST",
      body: JSON.stringify({ name })
    });
  }, [fetchWithAuth]);
  
  const updateCollection = useCallback(async (id, name) => {
    return fetchWithAuth('/collections', {
      method: "PUT",
      body: JSON.stringify({ id, name })
    });
  }, [fetchWithAuth]);

  const deleteCollection = useCallback(async (id) => {
    return fetchWithAuth(`/collections?id=${id}`, {
      method: "DELETE"
    });
  }, [fetchWithAuth]);
  
  const updateCollectionStatus = useCallback(async (id, status) => {
    return updateStatus('collection', id, status);
  }, [updateStatus]);

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

  const updateBookmarkOrder = useCallback(async (bookmarksArray) => {
    return fetchWithAuth('/bookmarks', {
      method: "PUT",
      body: JSON.stringify(bookmarksArray)
    });
  }, [fetchWithAuth]);

  const updateCollectionOrder = useCallback(async (collectionsArray) => {
    return fetchWithAuth('/collections', {
      method: "PUT",
      body: JSON.stringify(collectionsArray)
    });
  }, [fetchWithAuth]);

  const updateCollectionsStatus = useCallback(async (ids, status) => {
    const payload = ids.map(id => ({ id: Number(id), status }));
    return fetchWithAuth('/collections', {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }, [fetchWithAuth]);

  const togglePinCollection = useCallback(async (id, isPinned) => {
    return fetchWithAuth('/collections', {
      method: "PUT",
      body: JSON.stringify({ id, is_pinned: isPinned })
    });
  }, [fetchWithAuth]);

  const deleteBookmark = useCallback(async (id) => {
    return fetchWithAuth(`/bookmarks?id=${id}`, {
      method: "DELETE"
    });
  }, [fetchWithAuth]);

  const getPreferences = useCallback(async () => {
    return fetchWithAuth('/preferences');
  }, [fetchWithAuth]);

  const updatePreferences = useCallback(async (preferences) => {
    return fetchWithAuth('/preferences', {
      method: "PUT",
      body: JSON.stringify(preferences)
    });
  }, [fetchWithAuth]);

  return useMemo(() => ({
    fetchWithAuth,
    saveAsset,
    updateAsset,
    deleteAsset,
    getAssets,
    saveBookmark,
    getBookmarks,
    updateBookmark,
    updateBookmarkOrder,
    updateCollectionOrder,
    togglePinCollection,
    deleteBookmark,
    getCollections,
    saveCollection,
    updateCollection,
    deleteCollection,
    uploadFile,
    getPreferences,
    updatePreferences,
    updatePreferences,
    updateStatus,
    updateCollectionsStatus,
    updateAssetStatus,
    updateCollectionStatus
  }), [
    fetchWithAuth,
    saveAsset,
    updateAsset,
    deleteAsset,
    getAssets,
    saveBookmark,
    getBookmarks,
    updateBookmark,
    updateBookmarkOrder,
    updateCollectionOrder,
    togglePinCollection,
    deleteBookmark,
    getCollections,
    saveCollection,
    updateCollection,
    deleteCollection,
    uploadFile,
    getPreferences,
    updatePreferences,
    updateStatus,
    updateCollectionsStatus,
    updateAssetStatus,
    updateCollectionStatus
  ]);
}
