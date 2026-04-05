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
    const { id, userId, fileKey, tags, metadata, type } = data;
    const finalType = type || (metadata && metadata.type) || "application/octet-stream";
    
    const cdnUrl = env.CDN_URL || `https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev`;
    const imageUrl = `${cdnUrl}/${fileKey}`;

    const batchOps = [];

    // 1. Insert Core Asset
    batchOps.push(
      env.DB.prepare(
        "INSERT INTO assets (id, user_id, file_key, type, original_url, metadata) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, userId, fileKey, finalType, imageUrl, JSON.stringify(metadata || {}))
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

      // 5. GET /assets (List Assets)
      if (method === "GET" && url.pathname === "/assets") {
        const { results } = await env.DB.prepare(`
          SELECT a.*, 
          (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN asset_tags at ON t.id = at.tag_id WHERE at.asset_id = a.id) as tags 
          FROM assets a ORDER BY a.created_at DESC LIMIT 100
        `).all();
        
        console.log(`[GET /assets] D1 결과 수: ${results?.length || 0}`);

        const formatted = (results || []).map(r => ({
          ...r,
          tags: r.tags ? r.tags.split(",") : [],
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
        const { results } = await env.DB.prepare(
          "SELECT a.* FROM assets a JOIN collection_assets ca ON a.id = ca.asset_id WHERE ca.collection_id = ? ORDER BY ca.added_at DESC"
        ).bind(colId).all();
        return new Response(JSON.stringify(results), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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