/**
 * Deference Backend Worker (Cloudflare D1)
 * RESTful API for asset and tag management with CORS.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // 1. Global CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 2. Immediate OPTIONS Preflight Handling
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // 3. POST /assets (Create Asset with 3-Tier Image Upload)
      if (method === "POST" && url.pathname === "/assets") {
        try {
          // 1. Safe Multipart/Form-Data Parsing
          const formData = await request.formData();
          const userId = formData.get('userId') || 'anonymous';
          const type = formData.get('type') || 'image';
          const metadataStr = formData.get('metadata') || '{}';
          let metadata = {};
          try {
            metadata = JSON.parse(metadataStr);
          } catch(e) { /* ignore parse error */ }

          const thumbFile = formData.get('thumb');
          const displayFile = formData.get('display');
          const originalFile = formData.get('original');

          if (!originalFile) {
            return new Response(JSON.stringify({ error: "Missing original file in payload" }), {
              status: 400, headers: corsHeaders
            });
          }

          // 2. Prepare R2 Parallel Upload
          const id = crypto.randomUUID();
          const fileKey = crypto.randomUUID();
          
          const thumbKey = `${fileKey}-thumb.webp`;
          const displayKey = `${fileKey}-display.webp`;
          
          // Preserve extension for original
          const extMatch = originalFile.name ? originalFile.name.match(/\.[^.]+$/) : null;
          const ext = extMatch ? extMatch[0] : '';
          const originalKey = `${fileKey}-original${ext}`;

          const uploadTasks = [];
          if (thumbFile) {
            uploadTasks.push(env.MY_BUCKET.put(thumbKey, thumbFile, {
              httpMetadata: { contentType: thumbFile.type || 'image/webp', cacheControl: 'public, max-age=31536000' }
            }));
          }
          if (displayFile) {
            uploadTasks.push(env.MY_BUCKET.put(displayKey, displayFile, {
              httpMetadata: { contentType: displayFile.type || 'image/webp', cacheControl: 'public, max-age=31536000' }
            }));
          }
          uploadTasks.push(env.MY_BUCKET.put(originalKey, originalFile, {
            httpMetadata: { contentType: originalFile.type, cacheControl: 'public, max-age=31536000' }
          }));

          // Execute parallel upload to R2
          await Promise.all(uploadTasks);

          // 3. D1 Database Insertion with accurate 3-Tier keys
          const cdnUrl = env.CDN_URL || "https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev";
          
          const finalThumbUrl = thumbFile ? `${cdnUrl}/${thumbKey}` : null;
          const finalDisplayUrl = displayFile ? `${cdnUrl}/${displayKey}` : null;
          const finalOriginalUrl = `${cdnUrl}/${originalKey}`;

          await env.DB.prepare(
            `INSERT INTO assets (id, user_id, file_key, type, metadata, thumb_url, display_url, original_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id, 
            userId, 
            originalKey, 
            type, 
            JSON.stringify(metadata),
            finalThumbUrl,
            finalDisplayUrl,
            finalOriginalUrl
          ).run();

          const newAsset = {
            id,
            user_id: userId,
            file_key: originalKey,
            type,
            metadata,
            thumb_url: finalThumbUrl,
            display_url: finalDisplayUrl,
            original_url: finalOriginalUrl,
            created_at: new Date().toISOString()
          };

          return new Response(JSON.stringify(newAsset), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error('[Worker POST /assets Error]:', e);
          return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // 4. GET /assets/:id/download (Proxy Download with Original Filename)
      const downloadMatch = url.pathname.match(/^\/assets\/([^\/]+)\/download\/?$/);
      if (method === "GET" && downloadMatch) {
        try {
          const assetId = downloadMatch[1];
          const asset = await env.DB.prepare("SELECT * FROM assets WHERE id = ?").bind(assetId).first();
          
          if (!asset || !asset.file_key) {
            return new Response("Asset not found", { status: 404, headers: corsHeaders });
          }

          const object = await env.MY_BUCKET.get(asset.file_key);
          if (!object) {
            return new Response("File not found in storage", { status: 404, headers: corsHeaders });
          }

          // Generate safe filename from metadata or fallback
          let filename = asset.file_key;
          try {
            const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : (asset.metadata || {});
            if (meta.originalName) filename = meta.originalName;
          } catch(e) {}

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
          headers.set("Content-Type", object.httpMetadata.contentType || "application/octet-stream");

          return new Response(object.body, { headers });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
        }
      }

      // 5. GET /assets (List Assets with Tags)
      if (method === "GET" && url.pathname === "/assets") {
        const { results } = await env.DB.prepare(`
          SELECT a.*, 
          (SELECT GROUP_CONCAT(t.name) FROM tags t 
           JOIN asset_tags at ON t.id = at.tag_id 
           WHERE at.asset_id = a.id) as tags 
          FROM assets a 
          ORDER BY a.created_at DESC LIMIT 50
        `).all();

        const formattedResults = results.map((row) => ({
          ...row,
          tags: row.tags ? row.tags.split(",") : [],
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
        }));

        return new Response(JSON.stringify(formattedResults), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 5. POST /assets/:id/tags (Refined Integrity Pipeline)
      const tagMatch = url.pathname.match(/^\/assets\/([^\/]+)\/tags\/?$/);
      if (method === "POST" && tagMatch) {
        const assetId = tagMatch[1];
        const { name: tagName } = await request.json();

        // 1. Defense: Asset Existence Check
        const assetExists = await env.DB.prepare("SELECT id FROM assets WHERE id = ?").bind(assetId).first();
        if (!assetExists) {
          return new Response(JSON.stringify({ error: "Asset not found in database. Upload may have failed or was deleted." }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // 2. Tag Core Insertion (INSERT OR IGNORE)
        const tagId = crypto.randomUUID();
        await env.DB.prepare("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)").bind(tagId, tagName).run();

        // 3. Fetch Actual Tag ID (Ensures mapping to existing tag if name matched)
        const tagRecord = await env.DB.prepare("SELECT * FROM tags WHERE name = ?").bind(tagName).first();
        if (!tagRecord) throw new Error("Tag retrieval failed after insert attempt.");

        // 4. M:N Join Mapping (Link Asset to Tag)
        await env.DB.prepare("INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)").bind(assetId, tagRecord.id).run();

        // Note: No hybrid caching needed as Asset List query uses subqueries for tags.
        return new Response(JSON.stringify({ success: true, tag: tagRecord }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // --- New Collection Routes ---

      // GET /collections (List Collections + Thumbnail Preview 4 Join)
      // GET /collections (List Collections + Thumbnail Preview 4 Join)
      if (method === "GET" && url.pathname === "/collections") {
        const { results } = await env.DB.prepare(`
          SELECT c.*, 
          (SELECT json_group_array(json_object('id', id, 'thumb_url', thumb_url)) FROM (
            SELECT a.id, a.thumb_url FROM assets a 
            JOIN collection_assets ca ON a.id = ca.asset_id 
            WHERE ca.collection_id = c.id 
            ORDER BY ca.added_at DESC LIMIT 4
          )) as preview_assets 
          FROM collections c ORDER BY c.created_at DESC
        `).all();

        const formattedResults = results.map(col => ({
          ...col,
          preview_assets: typeof col.preview_assets === 'string' ? JSON.parse(col.preview_assets) : (col.preview_assets || [])
        }));

        return new Response(JSON.stringify(formattedResults), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // POST /collections (Create Collection - Refined with Payload Binding)
      if (method === "POST" && url.pathname === "/collections") {
        try {
          const body = await request.json();
          const id = crypto.randomUUID();
          
          // NOT NULL Defense (Strict Fallback)
          const userId = body.userId || "anonymous";
          const name = body.name || "Untitled";
          const description = body.description || "";
          const isPublic = body.isPublic ? 1 : 0;

          await env.DB.prepare(
            "INSERT INTO collections (id, user_id, name, description, is_public) VALUES (?, ?, ?, ?, ?)"
          ).bind(id, userId, name, description, isPublic).run();

          return new Response(JSON.stringify({ id, name, success: true }), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        } catch (error) {
          console.error("[Worker POST /collections Error]:", error);
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
      }

      // GET /collections/:id/assets (List Assets in a Collection)
      const colAssetsMatch = url.pathname.match(/^\/collections\/([^\/]+)\/assets\/?$/);
      if (method === "GET" && colAssetsMatch) {
        try {
          const collectionId = colAssetsMatch[1];
          const { results } = await env.DB.prepare(
            "SELECT a.* FROM assets a JOIN collection_assets ca ON a.id = ca.asset_id WHERE ca.collection_id = ? ORDER BY ca.added_at DESC"
          ).bind(collectionId).all();

          const cdnUrl = env.CDN_URL || "https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev";
          const formattedResults = results.map((row) => ({
            ...row,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
            image_url: row.image_url || (row.file_key ? `${cdnUrl}/${row.file_key}` : null),
            thumbnail_url: row.thumbnail_url || (row.thumbnail_key ? `${cdnUrl}/${row.thumbnail_key}` : (row.file_key ? `${cdnUrl}/${row.file_key}-thumb.webp` : null)),
            display_url: row.display_url || (row.display_key ? `${cdnUrl}/${row.display_key}` : (row.file_key ? `${cdnUrl}/${row.file_key}-display.webp` : null)),
          }));

          return new Response(JSON.stringify(formattedResults), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        } catch (e) { 
          return new Response(JSON.stringify({ error: e.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }); 
        }
      }

      // POST /collections/:id/assets (Add Asset to Collection)
      const colAssetMatch = url.pathname.match(/^\/collections\/([^\/]+)\/assets\/?$/);
      if (method === "POST" && colAssetMatch) {
        const collectionId = colAssetMatch[1];
        const { assetId } = await request.json();
        await env.DB.prepare("INSERT OR IGNORE INTO collection_assets (collection_id, asset_id) VALUES (?, ?)")
          .bind(collectionId, assetId).run();
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // DELETE /collections/:id (Collection Batch Delete)
      const colDeleteMatch = url.pathname.match(/^\/collections\/([^\/]+)\/?$/);
      if (method === "DELETE" && colDeleteMatch) {
        const collectionId = colDeleteMatch[1];
        await env.DB.batch([
          env.DB.prepare("DELETE FROM collection_assets WHERE collection_id = ?").bind(collectionId),
          env.DB.prepare("DELETE FROM collections WHERE id = ?").bind(collectionId)
        ]);
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // DELETE /collections/:id/assets/:assetId (Remove Asset from Collection)
      const colAssetDelMatch = url.pathname.match(/^\/collections\/([^\/]+)\/assets\/([^\/]+)\/?$/);
      if (method === "DELETE" && colAssetDelMatch) {
        const collectionId = colAssetDelMatch[1];
        const assetId = colAssetDelMatch[2];
        await env.DB.prepare("DELETE FROM collection_assets WHERE collection_id = ? AND asset_id = ?")
          .bind(collectionId, assetId).run();
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // GET /assets/:id/collections (List Collections for a Specific Asset)
      const assetColMatch = url.pathname.match(/^\/assets\/([^\/]+)\/collections\/?$/);
      if (method === "GET" && assetColMatch) {
        try {
          const assetId = assetColMatch[1];
          const { results } = await env.DB.prepare(
            "SELECT c.* FROM collections c JOIN collection_assets ca ON c.id = ca.collection_id WHERE ca.asset_id = ? ORDER BY ca.added_at DESC"
          ).bind(assetId).all();
          return new Response(JSON.stringify(results), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        } catch (e) { 
          return new Response(JSON.stringify({ error: e.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }); 
        }
      }

      // --- Bookmark Routes ---
      
      // 1. GET /bookmarks (List Bookmarks)
      if (method === "GET" && url.pathname === "/bookmarks") {
        const { results } = await env.DB.prepare("SELECT * FROM bookmarks ORDER BY order_index ASC, created_at ASC").all();
        // Return raw results, visibility is handled globally on client
        return new Response(JSON.stringify(results), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 2. POST /bookmarks (Create Bookmark with fallback logic)
      if (method === "POST" && url.pathname === "/bookmarks") {
        try {
          const data = await request.json();
          let bookmarkUrl = data.url ? data.url.trim() : "";
          if (bookmarkUrl && !/^https?:\/\//i.test(bookmarkUrl)) bookmarkUrl = `https://${bookmarkUrl}`;

          const id = crypto.randomUUID();
          const host = new URL(bookmarkUrl).hostname;
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
          
          // Logic: User custom title > Hostname parsing
          const finalTitle = data.title && data.title.trim() 
            ? data.title.trim() 
            : host.replace("www.", "").split('.')[0].toUpperCase();

          await env.DB.prepare("INSERT INTO bookmarks (id, url, title, favicon_url) VALUES (?, ?, ?, ?)")
            .bind(id, bookmarkUrl, finalTitle, faviconUrl).run();
          
          return new Response(JSON.stringify({ id, url: bookmarkUrl, title: finalTitle, favicon_url: faviconUrl }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
        }
      }

      // 3. DELETE /bookmarks/:id
      const bookmarkMatch = url.pathname.match(/^\/bookmarks\/([^\/]+)\/?$/);
      if (method === "DELETE" && bookmarkMatch) {
        const targetId = bookmarkMatch[1];
        await env.DB.prepare("DELETE FROM bookmarks WHERE id = ?").bind(targetId).run();
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 6. 404 Not Found
      return new Response("Not Found Route: " + method + " " + url.pathname, {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error("[Worker Error]:", error);
      return new Response(JSON.stringify({ 
        error: "Internal Server Error",
        message: error.message, 
        stack: error.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};