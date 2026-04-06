import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Deference Backend Worker (Cloudflare D1 + R2)
 * Modularized for Zero-Friction Background Ingestion.
 */

/**
 * Helper to get S3 Client with environment-aware credentials
 */
const getS3Client = (env) => {
  const accountId = env.R2_ACCOUNT_ID || env.CF_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Worker Configuration Error: R2/S3 Credentials (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY) missing.");
  }
  
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

/**
 * [NEW] handleUploadUrl - POST /api/upload/url
 * Generates R2 Presigned URL for direct binary streaming from browser.
 */
async function handleUploadUrl(request, env, corsHeaders) {
  try {
    console.log("[handleUploadUrl] 로드된 ENV 키:", Object.keys(env));
    const body = await request.json().catch(() => ({}));
    const { filename, contentType } = body;
    
    if (!filename) throw new Error("Missing filename in request body");

    const id = crypto.randomUUID();
    const extMatch = filename.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : "";
    const fileKey = `${crypto.randomUUID()}${ext}`;

    const client = getS3Client(env);
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME || "def-archive",
      Key: fileKey,
      ContentType: contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return new Response(JSON.stringify({ uploadUrl, fileKey, id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[handleUploadUrl Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * [NEW] handleAssets - POST /api/assets
 * Commits metadata to D1 after successful R2 streaming.
 */
async function handleAssets(request, env, corsHeaders) {
  try {
    console.log("[handleAssets] 로드된 ENV 키:", Object.keys(env));
    const data = await request.json();
    const { id, userId, fileKey, tags, metadata, type, thumb_url, display_url } = data;
    const finalType = type || (metadata && metadata.type) || "application/octet-stream";
    
    const cdnUrl = env.CDN_URL || `https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev`;
    const imageUrl = `${cdnUrl}/${fileKey}`; // Original pointer

    const batchOps = [];

    // 1. Insert Core Asset (Extended with multi-res support)
    batchOps.push(
      env.DB.prepare(
        "INSERT INTO assets (id, user_id, file_key, type, original_url, thumb_url, display_url, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, userId, fileKey, finalType, imageUrl, thumb_url || imageUrl, display_url || imageUrl, JSON.stringify(metadata || {}))
    );

    // 2. Process Tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const cleanName = tagName.trim();
        if (!cleanName) continue;
        const tagId = crypto.randomUUID();
        batchOps.push(env.DB.prepare("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)").bind(tagId, cleanName));
        batchOps.push(
          env.DB.prepare("INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) SELECT ?, id FROM tags WHERE name = ?")
            .bind(id, cleanName)
        );
      }
    }

    await env.DB.batch(batchOps);

    return new Response(JSON.stringify({ success: true, id, imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[handleAssets Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * [NEW] handleUpdateAsset - PATCH /api/assets/:id
 * Merges new metadata into existing D1 record for seamless auto-save.
 */
async function handleUpdateAsset(request, env, assetId, corsHeaders) {
  try {
    const newData = await request.json();
    
    // 1. Get current metadata
    const asset = await env.DB.prepare("SELECT metadata FROM assets WHERE id = ?")
      .bind(assetId)
      .first();
      
    if (!asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const oldMetadata = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : (asset.metadata || {});
    const mergedMetadata = { ...oldMetadata, ...newData };
    
    // 2. Update D1
    await env.DB.prepare("UPDATE assets SET metadata = ? WHERE id = ?")
      .bind(JSON.stringify(mergedMetadata), assetId)
      .run();
      
    return new Response(JSON.stringify({ success: true, metadata: mergedMetadata }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[handleUpdateAsset Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * [NEW] handleAssetTags - POST/DELETE /api/assets/:id/tags
 * Manages M:N tag relationships efficiently.
 */
async function handleAssetTags(request, env, assetId, corsHeaders, tagName = null) {
  const method = request.method;

  try {
    if (method === "POST") {
      const { tagName: postTagName } = await request.json();
      if (!postTagName) throw new Error("Missing tagName");
      
      const tagId = crypto.randomUUID();
      const batchOps = [
        env.DB.prepare("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)").bind(tagId, postTagName.trim()),
        env.DB.prepare("INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) SELECT ?, id FROM tags WHERE name = ?").bind(assetId, postTagName.trim())
      ];
      await env.DB.batch(batchOps);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "DELETE") {
      if (!tagName) throw new Error("Missing tagName for deletion");
      const decodedTagName = decodeURIComponent(tagName);
      
      await env.DB.prepare(
        "DELETE FROM asset_tags WHERE asset_id = ? AND tag_id = (SELECT id FROM tags WHERE name = ?)"
      ).bind(assetId, decodedTagName).run();
      
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error("[handleAssetTags Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

/**
 * [NEW] handleForkAsset - POST /api/assets/:id/fork
 * Logically clones an asset and its tags into a new collection.
 */
async function handleForkAsset(request, env, assetId, corsHeaders) {
  try {
    const { collectionId, userId } = await request.json();
    if (!collectionId || !userId) throw new Error("Missing collectionId or userId");

    // 1. Get original asset data
    const origin = await env.DB.prepare("SELECT * FROM assets WHERE id = ?").bind(assetId).first();
    if (!origin) throw new Error("Origin asset not found");

    // --- BRANCH: Mapping vs Cloning ---
    if (origin.user_id === userId) {
      // CASE: Same Owner -> Just link existing asset to new collection (Mapping)
      console.log(`[Fork/Mapping] Asset ${assetId} already owned by ${userId}. Mapping to collection ${collectionId}.`);
      await env.DB.prepare("INSERT OR IGNORE INTO collection_assets (collection_id, asset_id) VALUES (?, ?)")
        .bind(collectionId, assetId)
        .run();

      return new Response(JSON.stringify({ success: true, mode: "mapped", assetId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // CASE: Different Owner -> Snapshot Clone (Phase 2)
    const newAssetId = crypto.randomUUID();
    console.log(`[Fork/Cloning] Asset ${assetId} owned by ${origin.user_id}. Cloning to ${userId} as ${newAssetId}.`);

    const batchOps = [
      // A. Clone Asset Record
      env.DB.prepare(`
        INSERT INTO assets (id, user_id, file_key, type, original_url, thumb_url, display_url, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        newAssetId, 
        userId, 
        origin.file_key, 
        origin.type, 
        origin.original_url, 
        origin.thumb_url, 
        origin.display_url, 
        origin.metadata
      ),
      // B. Clone Tag Links (M:N)
      env.DB.prepare(`
        INSERT INTO asset_tags (asset_id, tag_id)
        SELECT ?, tag_id FROM asset_tags WHERE asset_id = ?
      `).bind(newAssetId, assetId),
      // C. Link to target Collection
      env.DB.prepare(`
        INSERT INTO collection_assets (collection_id, asset_id)
        VALUES (?, ?)
      `).bind(collectionId, newAssetId)
    ];

    await env.DB.batch(batchOps);

    return new Response(JSON.stringify({ success: true, mode: "cloned", newAssetId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[handleForkAsset Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

/**
 * [NEW] handleUnforkAsset - DELETE /api/assets/:id/fork/:collectionId
 */
async function handleUnforkAsset(request, env, assetId, collectionId, corsHeaders) {
  try {
    await env.DB.prepare("DELETE FROM collection_assets WHERE asset_id = ? AND collection_id = ?")
      .bind(assetId, collectionId)
      .run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[handleUnforkAsset Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

/**
 * [NEW] handleCreateCollection - POST /api/collections
 */
async function handleCreateCollection(request, env, corsHeaders) {
  try {
    const { name, user_id } = await request.json();
    if (!name || !user_id) throw new Error("Missing name or user_id");

    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
      .bind(id, user_id, name.trim())
      .run();

    return new Response(JSON.stringify({ id, name, user_id }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[handleCreateCollection Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

/**
 * [NEW] handleDeleteCollection - DELETE /api/collections/:id
 */
async function handleDeleteCollection(request, env, id, corsHeaders) {
  try {
    const { userId } = await request.json();
    if (!userId) throw new Error("Missing userId");

    // Atomic Batch: 1. Cleanup Mappings 2. Delete Collection (with ownership check)
    const batchOps = [
      env.DB.prepare("DELETE FROM collection_assets WHERE collection_id = ?").bind(id),
      env.DB.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").bind(id, userId)
    ];

    const results = await env.DB.batch(batchOps);
    
    // Check if collection was actually deleted
    if (results[1].meta.changes === 0) {
      return new Response(JSON.stringify({ error: "Collection not found or unauthorized" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[handleDeleteCollection Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // 1. [NEW] POST /api/upload/url
      const uploadUrlMatch = url.pathname.match(/^\/api\/upload\/url\/?$/);
      if (method === "POST" && uploadUrlMatch) {
         return await handleUploadUrl(request, env, corsHeaders);
      }

      // 2. [NEW] POST /api/assets
      const assetsMatch = url.pathname.match(/^\/api\/assets\/?$/);
      if (method === "POST" && assetsMatch) {
        return await handleAssets(request, env, corsHeaders);
      }

      // [NEW] POST /api/assets/:id/tags (Add Tag)
      const tagPostMatch = url.pathname.match(/^\/api\/assets\/([^\/]+)\/tags\/?$/);
      if (method === "POST" && tagPostMatch) {
        return await handleAssetTags(request, env, tagPostMatch[1], corsHeaders);
      }

      // [NEW] DELETE /api/assets/:id/tags/:tagName (Remove Tag)
      const tagDeleteMatch = url.pathname.match(/^\/api\/assets\/([^\/]+)\/tags\/([^\/]+)\/?$/);
      if (method === "DELETE" && tagDeleteMatch) {
        return await handleAssetTags(request, env, tagDeleteMatch[1], corsHeaders, tagDeleteMatch[2]);
      }

      // [NEW] PATCH /api/assets/:id (Auto-save Meta)
      const assetUpdateMatch = url.pathname.match(/^\/api\/assets\/([^\/]+)\/?$/);
      if (method === "PATCH" && assetUpdateMatch) {
        return await handleUpdateAsset(request, env, assetUpdateMatch[1], corsHeaders);
      }

      // [NEW] POST /api/assets/:id/fork (Snapshot Fork)
      const forkMatch = url.pathname.match(/^\/api\/assets\/([^\/]+)\/fork\/?$/);
      if (method === "POST" && forkMatch) {
        return await handleForkAsset(request, env, forkMatch[1], corsHeaders);
      }

      // [NEW] DELETE /api/assets/:id/fork/:collectionId (Unmap)
      const unforkMatch = url.pathname.match(/^\/api\/assets\/([^\/]+)\/fork\/([^\/]+)\/?$/);
      if (method === "DELETE" && unforkMatch) {
        return await handleUnforkAsset(request, env, unforkMatch[1], unforkMatch[2], corsHeaders);
      }

      // [NEW] POST /api/collections (Create Collection)
      if (method === "POST" && url.pathname === "/api/collections") {
        return await handleCreateCollection(request, env, corsHeaders);
      }

      // [NEW] DELETE /api/collections/:id (Delete Collection)
      const collectionDeleteMatch = url.pathname.match(/^\/api\/collections\/([^\/]+)\/?$/);
      if (method === "DELETE" && collectionDeleteMatch) {
        return await handleDeleteCollection(request, env, collectionDeleteMatch[1], corsHeaders);
      }

      // 3. Legacy POST /assets (Multipart Upload)
      if (method === "POST" && url.pathname === "/assets") {
        const formData = await request.formData();
        const userId = formData.get('userId') || 'anonymous';
        const originalFile = formData.get('original');
        if (!originalFile) throw new Error("Missing original file");

        const id = crypto.randomUUID();
        const fileKey = crypto.randomUUID();
        const ext = originalFile.name ? originalFile.name.match(/\.[^.]+$/)?.[0] || "" : "";
        const originalKey = `${fileKey}-original${ext}`;

        await env.MY_BUCKET.put(originalKey, originalFile, {
          httpMetadata: { contentType: originalFile.type, cacheControl: 'public, max-age=31536000' }
        });

        const cdnUrl = env.CDN_URL || "https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev";
        const finalUrl = `${cdnUrl}/${originalKey}`;

        await env.DB.prepare(
          "INSERT INTO assets (id, user_id, file_key, type, original_url) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, userId, originalKey, originalFile.type || "application/octet-stream", finalUrl).run();

        return new Response(JSON.stringify({ id, success: true, original_url: finalUrl }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 4. GET /assets/:id/download
      const downloadMatch = url.pathname.match(/^\/assets\/([^\/]+)\/download\/?$/);
      if (method === "GET" && downloadMatch) {
        const assetId = downloadMatch[1];
        const asset = await env.DB.prepare("SELECT * FROM assets WHERE id = ?").bind(assetId).first();
        if (!asset || !asset.file_key) return new Response("Not Found", { status: 404, headers: corsHeaders });
        const object = await env.MY_BUCKET.get(asset.file_key);
        if (!object) return new Response("Not Found in R2", { status: 404, headers: corsHeaders });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(asset.file_key)}"`);
        return new Response(object.body, { headers });
      }

      // 5. GET /assets (List Assets with M:N collections)
      if (method === "GET" && url.pathname === "/assets") {
        const { results } = await env.DB.prepare(`
          SELECT a.*, 
          (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN asset_tags at ON t.id = at.tag_id WHERE at.asset_id = a.id) as tags,
          (SELECT GROUP_CONCAT(ca.collection_id) FROM collection_assets ca WHERE ca.asset_id = a.id) as collection_ids
          FROM assets a ORDER BY a.created_at DESC LIMIT 100
        `).all();
        
        console.log(`[GET /assets] D1 결과 수: ${results?.length || 0}`);

        const formatted = (results || []).map(r => ({
          ...r,
          tags: r.tags ? r.tags.split(",") : [],
          collection_ids: r.collection_ids ? r.collection_ids.split(",") : [],
          metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {}
        }));
        return new Response(JSON.stringify(formatted), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // --- Collection Routes ---
      if (method === "GET" && url.pathname === "/collections") {
        const { results } = await env.DB.prepare("SELECT * FROM collections ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const colMatch = url.pathname.match(/^\/collections\/([^\/]+)\/assets\/?$/);
      if (method === "GET" && colMatch) {
        const colId = colMatch[1];
        const { results } = await env.DB.prepare(`
          SELECT a.*,
          (SELECT GROUP_CONCAT(ca_other.collection_id) FROM collection_assets ca_other WHERE ca_other.asset_id = a.id) as collection_ids
          FROM assets a 
          JOIN collection_assets ca ON a.id = ca.asset_id 
          WHERE ca.collection_id = ? 
          ORDER BY ca.added_at DESC
        `).bind(colId).all();

        const formatted = (results || []).map(r => ({
          ...r,
          collection_ids: r.collection_ids ? r.collection_ids.split(",") : [],
          metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {}
        }));
        return new Response(JSON.stringify(formatted), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // --- Bookmark Routes ---
      if (method === "GET" && url.pathname === "/bookmarks") {
        const { results } = await env.DB.prepare("SELECT * FROM bookmarks ORDER BY order_index ASC").all();
        return new Response(JSON.stringify(results), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response("Not Found: " + url.pathname, { status: 404, headers: corsHeaders });

    } catch (err) {
      console.error("[Fatal Worker Error]:", err);
      return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};